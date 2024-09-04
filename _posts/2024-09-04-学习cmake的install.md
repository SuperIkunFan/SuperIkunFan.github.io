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
1、 如何构建一个目标  
2、 告诉cmake，应该安装目标的哪些内容  
3、 以及他人使用这个目标时，我们能够提供给他们哪些内容  

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

### 如何构建一个目标  
首先是每一个cmakelists都需要声明的内容，即：  
版本最低要求以及项目名称  

```cmake 
cmake_minimum_required(VERSION xxx)

project(mytestlib)

```
由于现代cmake中推荐以目标对象(target)的方式来管理，然后再使用target_xx 类的cmake命令进行目标对象的  
其他的属性设置。而生成target的有许多：
1、add_executable - 用于创建可执行文件。

2、add_library - 用于创建静态库或共享库。

3、add_custom_target - 用于创建一个自定义的目标，这个目标不生成输出文件，而是执行一组自定义命令。

4、add_custom_command - 用于添加生成文件所需的自定义命令。

本文主要聚焦于前两个命令  
