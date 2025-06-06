---
layout: post
title: cmake的add_custom_command命令详解
date: 2024-09-06 14:32 +0800
tags: [cmake]
toc: true
---

## 前言  
cmake想要做c++的统一跨平台构建工具，那么它就需要支持很多特性。而c++是出了名的复杂，一种功能它可以使用很多种方式实现出来。在这种情况下，cmake也就必须支持很多功能，来满足c++各种个性化的构建流程。既然是个性化，那么就必然存在着cmake官方本身不提供的功能，而这个时候又如何将这些划入到cmake构建过程中呢？cmake就提出一种接口命令的形式，由用户自行定义其实现内容，然后cmake将这些实现内容翻译成makefile或者直接执行。在很多地方也有类似的功能，例如linux认为大部分被操作的对象都可以类比于文件，那么除了open，read，writte这种常规的操作，其他的操作又应当如何解决呢，这个时候就提出使用ioctl，在一定的范围内，由用户自行设定其功能实现。今天要提到的内容就是add_custom_command命令。  

### 感性认知  
在介绍具体的参数等详细内容之前，先想想add_custom_command命令主要想解决什么问题。在很多时候，我们想要把一些操作在某些文件或者是某些目标之前执行，以确定是否满足条件。而add_custom_command的设计哲学是，当别人需要我的时候，那么就执行相应的动作。仅仅从别人需要我，那我就执行，仿佛我们可以自定义一个函数，然后我们主动地在我们认为的地方调用这个函数，这仿佛也就能够解决我们的需求。但是，就像是前言中说的一样，有一些用户觉得，我主动调用容易漏，有没有一些方式能够让cmake帮助我安排一下这些函数的执行位置，让它们在合适的地方执行。这样看起来，也只是为了帮助程序员偷懒。但就如同某个计算机科学家所说，任何一个问题都可以被一个新的方式解决，但是又会引出一堆新的问题。当提出新命令解决一个需求的时候，那么与之带来的就是更多的学习成本和使用风险。另一个场景就是，我并不明确什么时候需要执行，只是要求在我的目标或者是条件之前执行就可以了。  

为了解决上述问题，cmake提出了add_custom_command命令。  

## 命令详解  
### 与文件绑定的触发方式
根据cmake官方参考文档，该命令有两种形式，第一个是将命令的输出作为连接口，当其他的流程需要这个文件时，那么这个命令就会被执行，语法如下：
```cmake
add_custom_command(OUTPUT output1 [output2 ...]
                   COMMAND command1 [ARGS] [args1...]
                   [COMMAND command2 [ARGS] [args2...] ...]
                   [MAIN_DEPENDENCY depend]
                   [DEPENDS [depends...]]
                   [BYPRODUCTS [files...]]
                   [IMPLICIT_DEPENDS <lang1> depend1
                                    [<lang2> depend2] ...]
                   [WORKING_DIRECTORY dir]
                   [COMMENT comment]
                   [DEPFILE depfile]
                   [JOB_POOL job_pool]
                   [JOB_SERVER_AWARE <bool>]
                   [VERBATIM] [APPEND] [USES_TERMINAL]
                   [COMMAND_EXPAND_LISTS]
                   [DEPENDS_EXPLICIT_ONLY])
```
可以看出，cmake官方提供的这个命令是相当的复杂。但可以看到，除了OUTPUT和COMMAND之后，其他的都是可选参数，也就意味着，如果你没有这方面的需求，那么就没有必要深入了解，当你需要使用到高阶的定制化内容时，那么再进行了解，在使用中学习，这才是最好的方式。

> ***
> 引用自泡沫o0 [CMake深度解析：掌握add_custom_command，精通Makefile生成规则（一）](https://developer.aliyun.com/article/1465043)
> 这个命令的主要作用是定义一条自定义的构建规则，这条规则可以在构建过程中执行一系列的命令。下面我们来详细解析这个命令的各个参数。
> + OUTPUT output1 [output2 ...]：这个参数用于指定自定义命令的输出文件。这些文件在构建过程中会被生成，如果这些文件不存在，那么CMake就会执行这条自定义命令。
> + COMMAND command1 [ARGS] [args1...]：这个参数用于指定要执行的命令。你可以提供任何有效的命令，包括系统命令、脚本，或者其他的构建工具。ARGS关键字后面可以跟随一系列的参数，这些参数会被传递给命令。
> + MAIN_DEPENDENCY depend：这个参数用于指定自定义命令的主要依赖。如果这个依赖的文件被修改，那么自定义命令就会被执行。
> + DEPENDS [depends...]：这个参数用于指定自定义命令的其他依赖。如果这些依赖的文件被修改，那么自定义命令也会被执行。
> + BYPRODUCTS [files...]：这个参数用于指定自定义命令的副产品。如果你指定了一个或多个文件作为副产品，那么这些文件将会被添加到构建系统的清理列表中。
> + WORKING_DIRECTORY dir：这个参数用于指定自定义命令的工作目录。如果你没有指定这个参数，那么自定义命令将会在当前的源码目录中执行。
> + COMMENT comment：这个参数用于指定一个注释，这个注释将会在执行自定义命令时被打印出来。
> + VERBATIM：这个参数用于控制命令参数的处理方式。如果你指定了VERBATIM，那么命令参数将会被按照字面意义处理，而不会被解析为变量或表达式
> ***

针对这个命令，我们需要搞清楚三个问题，什么时候被执行，执行什么操作，执行时还需要哪些条件限定以及结果。

#### 什么时候执行  
它是由OUTPUT决定的，它的后面紧接着的一堆文件，当这些文件被需要时，这条命令就会被执行。
+ 当这个OUTPUT输出的文件被当做其他的TARGET直接或者是间接的被使用时，它就像是makefile中的依赖一样，就会被执行。  
+ 待续...  

#### 执行什么操作  
`COMMAND command1 [ARGS] [args1...]` 决定了执行什么操作。

* 当执行一些常规的命令时，例如拷贝，打印这些时，可以使用cmake提供的命令，达到跨平台的目的，COMMAND ${CMAKE_COMMAND} -E 命令 参数...，在命令行终端中使用cmake -E 查看当前支持哪些操作。
* 执行python的命令  
* 执行与平台相关的命令  
#### 有哪些条件或者是输出结果    
其他的在上面已经说明了，值得一提的是BYPRODUCTS选项，这个表示命令的执行完毕之后的副产品，它并不会直接触发整个命令是否被执行。因此可以利用它表征命令执行的情况，包括什么时候执行，执行的结果是怎样等等。 

### 与目标绑定的触发方式  
语法格式  
```cmake
add_custom_command(TARGET <target>
                   PRE_BUILD | PRE_LINK | POST_BUILD
                   COMMAND command1 [ARGS] [args1...]
                   [COMMAND command2 [ARGS] [args2...] ...]
                   [BYPRODUCTS [files...]]
                   [WORKING_DIRECTORY dir]
                   [COMMENT comment]
                   [VERBATIM]
                   [COMMAND_EXPAND_LISTS])
```
可以看到，它是和TARGET进行绑定，从而触发相应的事件发生的  
与前一种方式不同的是，他是主动绑定到一个TARGET上，并且它还有一个概念是构建的执行时间点：
* PRE_BUILD 预构建：在构建这个目标之前
* PRE_LINK 链接前：执行需要在编译完成但链接未开始之前的任务，如生成或更新一些需要链接的库文件
* POST_BUILD 构建后：执行后处理任务，如复制生成的文件到指定的目录，执行一些测试和验证任务 
因此，为什么需要指定这个呢，一个TARGET在构建的时候分多个部分，cmake搞不清在什么时候执行，因此需要用户进行指定。  
与其他内容相似的，它也可以使用其他的参数内容。  

那么，这也就解释了什么时候执行的问题。  

注意点如下：  
1. Target是单个，不能绑定TARGETS，即单个目标绑定  
2. Target是由add_library,add_excutable等命令创建的。
3. Target需要在定义该命令创建过。

## 参考文献  
1. [CMake深度解析：掌握add_custom_command，精通Makefile生成规则（一）](https://developer.aliyun.com/article/1465043)  
2. [CMAKE官方](https://cmake.org/cmake/help/latest/command/add_custom_command.html)  
