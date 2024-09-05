---
layout: post
title: cmake 的install
tags: mathjax
math: true
date: 2024-09-04 15:32 +0800
tags: cmake
toc: true
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
find_package中的包名一致时，它便会进入到这个目录下读取各类.cmake结尾的文件内容，当然也存在着其他的方法，后续再写博客.当我们用find_package(my_library ...)这条命令时，它去`{CMAKE_INSTALL_PREFIX}/lib`目录下一个名为`my_library*`的文件夹中自动去寻找一个类似`my_library-config.cmake`的文件，而我们的安装命名就是符合这个规则的，`lib/my_library-[major].[minor] - ${main_lib_dest}`。所以现在我们需要提供`my_library-config.cmake `文件.  

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

# 配置和生成包配置文件
configure_package_config_file(
  "${PROJECT_SOURCE_DIR}/cmake/${PROJECT_NAME}Config.cmake.in"
  "${PROJECT_BINARY_DIR}/${PROJECT_NAME}Config.cmake"
  INSTALL_DESTINATION ${CMAKE_INSTALL_DATAROOTDIR}/cmake/${PROJECT_NAME})

# 生成版本文件
write_basic_package_version_file(
  "${PROJECT_NAME}ConfigVersion.cmake"
  VERSION ${PROJECT_VERSION}
  COMPATIBILITY SameMajorVersion)

# 安装生成的配置文件和版本文件
install(FILES
    "${CMAKE_CURRENT_BINARY_DIR}/MyProjectConfig.cmake"
    "${CMAKE_CURRENT_BINARY_DIR}/MyProjectConfigVersion.cmake"
    DESTINATION lib/cmake/MyProject
)

# 安装导出的目标
install(EXPORT MyProjectTargets
    FILE MyProjectTargets.cmake
    NAMESPACE MyProject::
    DESTINATION lib/cmake/MyProject
)
```
其核心逻辑为：CMakePackageConfigHelpers根据Config.cmake.in模板文件生成相应的项目信息导出文件。这个模板文件定义了 CMake 在生成配置文件时应该包含和设置的内容  
而一般的Config.cmake.in文件可能包含了以下内容：  
```cmake
@PACKAGE_INIT@

include("${CMAKE_CURRENT_LIST_DIR}/ProjectTargets.cmake")
check_required_components("@PROJECT_NAME@")
```
接下来挨个解释内容
- `@PACKAGE_INIT@`是一个占位符，用于在使用 configure_package_config_file() 函数生成实际配置文件时替换成预定义的初始化代码。这个宏通常用于设置一些基础配置或做一些初始化操作，确保生成的配置文件可以正常工作。
- `include("${CMAKE_CURRENT_LIST_DIR}/ProjectTargets.cmake")` 这行代码的作用是包含一个名为`ProjectTargets.cmake`的文件，该文件定义了项目的安装目标。从路径 `${CMAKE_CURRENT_LIST_DIR}/MyProjectTargets.cmake` 来看，`ProjectTargets.cmake` 文件相对于生成的 `Config.cmake`文件所在目录被存储，这个路径是动态的，可以适应不同的安装环境。它的目的是设置一些与项目相关的环境变量。  
- `check_required_components` 辅助宏通过检查所有必需组件的 `<Package>_<Component>_FOUND` 变量确保找到所有请求的非可选组件。即使包没有任何组件，也应在包配置文件的末尾调用此宏。这样，CMake 可以确保下游项目没有指定任何不存在的组件。如果 `check_required_components` 失败，则 `<Package>_FOUND` 变量设置为 FALSE，并认为未找到包。`set_and_check()` 宏应该在配置文件中使用，而不是用于设置目录和文件位置的普通 set() 命令。如果引用的文件或目录不存在，宏将失败.  

由于CMakePackageConfigHelpers并不是Cmake的内置模块，而是一个独立的模块文件。因此在使用之前需要先包含它，从而将所需要的宏以及函数都能够正确地引入到cmake脚本中。
最常用的函数有两个，一个是`configure_package_config_file`, `write_basic_package_version_file`.

`configure_package_config_file`语法：  
```
configure_package_config_file(<INPUT> <OUTPUT> [OPTIONS])
<INPUT>: 输入模板文件的路径。
<OUTPUT>: 输出文件的路径。
[OPTIONS]: 可选项，主要包括目的地路径等

``` 
通常来说，使用模板文件作为输入，然后得到${PROJECT_NAME}Config.cmake文件，从而让cmake能够找到。

`write_basic_package_version_file`语法：  
```cmake
write_basic_package_version_file(<filename> [options])
<filename>: 生成的版本文件的路径。
[options]: 可选项，通常包括版本号和兼容性策略。
```
一般来说最后都是`${PROJECT_NAME}ConfigVersion.cmake`这样的文件命名方式
`VERSION ${PROJECT_VERSION}` 就是在project(mytestlib)的时候， 所设置的信息  
COMPATIBILITY SameMajorVersion:  
COMPATIBILITY 选项指定版本兼容性策略。常用的策略包括：  
AnyNewerVersion: 任何新版本都兼容。  
SameMajorVersion: 只有同一个大版本号的版本才兼容。  
ExactVersion: 只接受完全相同的版本。  
SameMajorVersion 表示要求相同的主版本号才能兼容。例如，如果版本是 1.2.3，那么 1.x.y 版本（如 1.4.0 或 1.2.5）都是兼容的，但 2.x.y 则不兼容。  

在这个过程中主要生成了三个配置文件  
+ 配置文件（MyProjectConfig.cmake）:
  它通常包含了查找依赖项、设置变量以及加载导出目标的逻辑。它负责告诉 CMake 接下来需要做什么，例如加载 MyProjectTargets.cmake 文件。所以它是必需的，因为它扮演了协调者的角色。

+ 版本文件（MyProjectConfigVersion.cmake）:
  它包含版本兼容性检查的逻辑，确保所需的版本满足要求。  

+ 导出的目标文件（MyProjectTargets.cmake）:
  它具体描述了如何使用该包内的目标，包括编译选项、链接库等信息  

当用户在他们的 CMake 项目中使用 find_package(MyProject 1.2 REQUIRED) 时：
+ CMake 首先找到并加载 MyProjectConfig.cmake：如果找到并加载成功，接下来会执行       MyProjectConfig.cmake 中的内容。
+ 通常，这个文件会包含类似 include("${CMAKE_CURRENT_LIST_DIR}/MyProjectTargets.cmake") 的语句，以引入导出的目标文件。
+ CMake 加载 MyProjectConfigVersion.cmake：
  用于检查版本兼容性。

+ CMake 从配置文件中找到导出的目标文件并加载：导入这些目标并将它们加入到用户的项目中  

install(FILES ...) 和 install(EXPORT ...) 是互补的。配置文件提供了高层次的逻辑和版本控制，而导出的目标文件则提供了详细的目标定义。两者结合使用确保了包的完整性和易用性  

## 参考文献  
1. [cmake 生成供find_package使用的自定义模块](https://blog.csdn.net/ktigerhero3/article/details/83863226)
2. [CMake库打包以及支持find_package](https://murphypei.github.io/blog/2018/11/cmake-install-find-package)