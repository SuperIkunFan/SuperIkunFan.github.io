---
layout: post
title: cmake 的install
tags: mathjax
math: true
date: 2020-10-02 15:32 +0800
---

## install命令  
### 前言
当使用install命令进行安装时，主要分为了三个部分： 
1. 如何构建一个目标  
2. 告诉cmake，应该安装目标的哪些内容  
3. 以及他人使用这个目标时，我们能够提供给他们哪些内容  

### 一个简单的构建示例  
假设拥有一个如下示例的源代码结构  
```plaintext
.
├── CMakeLists.txt
├── include
│ └── mylib.h
└── mylib.c
```
然后我们想要生成一个类似于linux下的源代码管理方式，即头文件放在include下，动态库以及静态库放在lib下，二进制可执行文件放在bin目录下  
那么就如同如下结构：  
```plaintext
├── install
│ ├── include
│ │ └── mylib.h
│ └── lib
│ | ├── cmake
│ │   └── mylib
│ │     ├── mylib-config.cmake
│ │     └── mylib-config-noconfig.cmake
│ ├── libmylib.a
```
其中install就是安装的目录，在cmake下存在着关于这个库的详细信息  
cmake目录下存在着各个已经编译好的库目录，比如mylib就是我们编译好之后关于mylib的项目信息，主要由各类.cmake结尾的文件所组成，  
当使用find_package(mylib)，并且指定了CMAKE_PREFIX_PATH这个变量，它就会挨个查找cmake目录下的下面的各个库信息，当目录名称和  
find_package中的包名一致时，它便会进入到这个目录下读取各类.cmake结尾的文件内容，当然也存在着其他的方法，后续再写博客.

假设我们所要提供给别人的库中，需要先编译的是mylib.c  
```C
#include <stdio.h>
#include "mylib.h"
void hello()
{
    printf("hello");
}
```
给予他人的头文件mylib.h, 内容为  
```C
#ifndef MYLIB_H
#define MYLIB_H
#include <stdio.h>
void hello();
#endif
```
那么就需要解决前面所提到的三个问题  

### 问题一：如何构建一个目标  
首先是每一个cmakelists都需要声明的内容，即：  
版本最低要求以及项目名称  

```cmake 
cmake_minimum_required(VERSION xxx)

project(mytestlib)
```
由于现代cmake中推荐以目标对象(target)的方式来管理，然后再使用target_xx 类的cmake命令进行目标对象的  
其他的属性设置。而生成target的有许多：
1. add_executable - 用于创建可执行文件。

2. add_library - 用于创建静态库或共享库。

3. add_custom_target - 用于创建一个自定义的目标，这个目标不生成输出文件，而是执行一组自定义命令。

4. add_custom_command - 用于添加生成文件所需的自定义命令。

本文主要聚焦于前两个命令，当添加完一个目标之后，那么我们target_xx类的命令给库或者是可执行文件相应的属性了。  
```cmake 
add_library(mylib mylib.c include/mylib.h)
target_include_directories(mylib PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>)
```
这个中间涉及到了生成器的相关内容，它的主要目的是将目标构建阶段的头文件包含属性和目标的安装阶段的属性分开  

### 问题二：告诉cmake，应该安装哪些内容  
前面我们已经生成了一个静态库目标了。根据c/c++编译链接模型，别人使用我们所提供的库，最少需要两个部分：  
1. 头文件  
2. 静态库或者是动态库亦或者是可执行文件  

此时就需要使用install命令，首先告诉cmake，我们所提供的库的头文件是什么，第二个是需要安装哪些内容： 
```cmake 
set_target_properties(mylib PROPERTIES PUBLIC_HEADER "include/mylib.h") 

install(TARGETS mylib
    EXPORT mylib-targets
    PUBLIC_HEADER DESTINATION include
    ARCHIVE DESTINATION lib
    LIBRARY DESTINATION lib
    RUNTIME DESTINATION bin)
```
首先需要给一个特定的库绑定它所相关的头文件，这个与是否安装无关，如果所安装的目标没有绑定头文件的话，那么在安装时，其include下。 
就没有库使用者所需要的头文件。  

接下来解释一下install的一般格式  
```cmake 
install(<TYPE> files... DESTINATION <dir>
        [PERMISSIONS permissions...]
        [CONFIGURATIONS [Debug|Release|...]]
        [COMPONENT <component>]
        [OPTIONAL] [NAMELINK_ONLY|NAMELINK_SKIP])

```
可以看出这个命令是比较复杂的，其他的<TYPE>有以下几种：  

+ PROGRAMS：用于安装可执行文件。

+ LIBRARY：用于安装库文件。

+ ARCHIVE：用于安装静态库文件。

+ RUNTIME：用于安装运行时文件（主要用于 Windows）。

+ OBJECTS：用于安装对象文件。

+ DIRECTORY：用于安装整个目录。

+ FILES：用于安装单个或多个文件

这六种是为了不同的目的所解决的类型。  

此外有两个是为了补充TARGETS所提出来的，即PUBLIC_HEADER和EXPORT是为了帮助TARGERTS进行安装之后能够正常工作进行的操作
后面的DESTINATION内容就是指定安装的路径，这个是必须指定的。其余的参数都是可选的，根据实际需要进行设定。  
那么install中通常需要设定两个内容:
```
<type> xx DESTINATION <dir> [可选参数]  
```
此时当我们设置好这些内容之后，cmake就知道了我们安装哪些具体的内容  

### 问题三：以及他人使用这个目标时，我们能够提供给他们哪些内容  
这个内容主要是为了它人使用find_package命令所准备的，如果库制作方不打算提供这种方式的话，那么就没有必要写  
在问题二中，我们已经设置了安装属性，此时就需要利用信息生成一定的.cmake的信息，通过这些信息告诉库使用者这些相关信息  
在哪里。使用的仍然是install命令。

我所接触到的方式有两种范式。  
第一种如下所示：  
```cmake 
install(EXPORT mylib-targets
    NAMESPACE mylib::
    FILE mylib-config.cmake
    DESTINATION lib/cmake/mylib)
```
值得注意的有：
- 在前面install目标时，需要设置TARGETS一个EXPORT属性，然后根据这些属性使用install命令指导生成.cmake文件信息，其中EXPORT是和前面install的目标所导出的名称是一致的，均为示例中的mylib-targets。
- 第二个是NAMESPACE，这个主要是为了区分不同项目的相同名称库，例如ProjectA中有一个库，其名称为mylib，而ProjectB中也有一个库，其名称也为mylib，假设一个项目AppC需要同时使用ProjectA的mylib，以及ProjectB的mylib。如果没有命名空间的话，cmake就无法知道到底链接哪一个mylib，当有了命令空间之后，就可以知道是ProjectA或者是ProjectA的mylib了
- 使用FILE类型，这个声明了文件名称，第四个是DESTINATION，这个表示所生成的.cmake文件放到哪里去。

第二种方式是使用CMakePackageConfigHelpers对包进行一定的配置  
```cmake 
include(CMakePackageConfigHelpers)
write_basic_package_version_file(
  "${PROJECT_NAME}ConfigVersion.cmake"
  VERSION ${PROJECT_VERSION}
  COMPATIBILITY SameMajorVersion)
configure_package_config_file(
  "${PROJECT_SOURCE_DIR}/cmake/${PROJECT_NAME}Config.cmake.in"
  "${PROJECT_BINARY_DIR}/${PROJECT_NAME}Config.cmake"
  INSTALL_DESTINATION ${CMAKE_INSTALL_DATAROOTDIR}/cmake/${PROJECT_NAME})
```
