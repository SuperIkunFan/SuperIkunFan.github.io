---
layout: post
title: cmake的cmake的target概念
date: 2025-01-15 15:48 +0800
tags: [cmake]
toc: true
---
## 前言  
在现代cmake中，核心概念包括目标（target）以及目标属性和依赖的传播机制。  

## 目标（Target）概念
目标是指工程中需要构建的独立项目组件，可以是库（静态或者动态）、可执行文件等。目标通常使用 add_library 或 add_executable 等命令创建。  
这个概念是将所需要编译或者是安装的资源生成一个统一体。将一些资源设置到这个target中，进行统一的管理。  

## PUBLIC、PRIVATE、INTERFACE的属性设置  
这些关键词用于目标的属性设置，控制属性在项目内部和外部的可见性和可用性，关键是依赖的传播。  
+ PUBLIC：属性对当前目标可见，同时也传播给使用该目标的依赖目标。例如，当设置 target_include_directories 为 PUBLIC 时，包含目录会同时加入到依赖于这个目标的其它目标中。
+ PRIVATE：属性仅对当前目标可见，不传播给依赖目标。
+ INTERFACE：属性本身不对当前目标生效，仅传播给依赖目标。这通常用于INTERFACE库，即不包含编译行为的库。

## 设置target属性的方法  
### set_target_properties  
用于设置目标的属性。多个属性可以一起设置，每个属性用键值对表示。
```CMAKE
set_target_properties(target
  PROPERTIES
    PROPERTY1 VALUE1
    PROPERTY2 VALUE2
)
```

### target_compile_definitions
用于为特定目标设置编译器定义，可以指定是PUBLIC、PRIVATE 还是 INTERFACE。

```CMAKE
target_compile_definitions(target
  PUBLIC
    MY_DEFINITION
  PRIVATE
    MY_PRIVATE_DEFINITION
)
```

### target_compile_features
用于设置目标所需的编译特性，例如指定 C++ 标准。特性会自动转换为编译器选项。

```CMAKE
target_compile_features(target
  PRIVATE
    cxx_std_17
)
```

### target_compile_options
用于为目标设置编译器选项。支持设置 PUBLIC、PRIVATE 和 INTERFACE。

```CMAKE
target_compile_options(target
  PRIVATE
    -Wall -Wextra
)
```

## target_include_directories
用于设置目标的包含目录。支持设置 PUBLIC、PRIVATE 和 INTERFACE。

```CMAKE
target_include_directories(target
  PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
  PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)
```

### target_link_directories
用于为目标添加链接目录。注意这不是非常常用，通常使用 target_link_libraries 处理依赖关系。

```CMAKE
target_link_directories(target
  PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/lib
)
```

### target_link_libraries
用于指定目标需要链接的库，同样支持 PUBLIC、PRIVATE 和 INTERFACE。通常推荐的使用方式。

```CMAKE
target_link_libraries(target
  PRIVATE
    libA
  PUBLIC
    libB
)
```

### target_link_options
用于为目标设置链接器选项。支持 PUBLIC、PRIVATE 和 INTERFACE。

```CMAKE
target_link_options(target
  PRIVATE
    -Wl,--start-group
  PUBLIC
    -L/path/to/library
)
```

### target_precompile_headers
用于为目标设置预编译头，能够显著加快编译速度。

```CMAKE
target_precompile_headers(target
  PRIVATE
    pch.hpp
)
```

### target_sources
用于明确指定目标的源文件。支持设置 PUBLIC、PRIVATE 和 INTERFACE。

```CMAKE
target_sources(target
  PRIVATE
    src/main.cpp
  PUBLIC
    include/header.hpp
)
```
一般来说，我们在创建目标时，就可以其后设置源文件，从而向这个target添加相应的文件。一般来说，使用target_sources命令往往看起来很麻烦，但是它主要解决当需要能够单独添加文件的情况，或者是手动管理每一个文件的具体情节。  
例如当我们想要根据条件判断是否将某一个文件添加到Target中进行编译；例如当我们控制某些头文件的的访问属性，比如说某些头文件是给别人用的，有些头文件是仅给自己使用的，有一些是给共同使用的。  
在CMAKE版本3.23之后，对target增加了一个HEADER_SET的属性，即头文件集合的概念。与此相关的还有HEADER_DIRS这个属性，该属性主要描述了头文件集的路径。cmake官方并不推荐我们直接对这些属性直接操作，而是使用target_sources命令进行直接操作。  

```cmake
target_sources(target
  PUBLIC
    FILE_SET HEADERS
    BASE_DIRS ${CMAKE_SOURCE_DIR}/lib/
    FILES ${CMAKE_SOURCE_DIR}/lib/internal/MyLibraryInternal.h
)
```
首先使用FILE_SET表示这是一个文件集合，后面紧跟HEADERS表示正在设置头文件集。在FILE_SET中紧跟随两个，一个是HEADERS表示头文件集合，另外一个是CXX_MODULES，这个描述的是c++的模块的源文件。  
值得注意的是,HEADERS目前只能够被一种作用域所修饰，不能设置多个作用域，否则cmake会迷惑。  
```cmake
target_sources(target
  PUBLIC
    FILE_SET HEADERS
    BASE_DIRS ${CMAKE_SOURCE_DIR}/lib/
    FILES ${CMAKE_SOURCE_DIR}/lib/internal/MyLibraryInternal.h
  INTERFACE
    FILE_SET HEADERS
    BASE_DIRS ${CMAKE_SOURCE_DIR}/include/
    FILES ${CMAKE_SOURCE_DIR}/include/MyLibrary.h
)
```
这样写就会报错。  
紧接着的是BASE_DIRS说明符，这个表示截取的路径。然后就是FILES表示某一个具体的文件。FILES文件中包含了整个完整的路径，那么此时已经能够告诉cmake这个文件在哪里了，但是为什么还要增加一个BASE_DIRS呢，实际上存在这样的功能。假设我要把FILE_SET中某一个文件安装到某一个位置，另外一个位置是另外一个位置。那么这个时候cmake通过BASE_DIRS截取掉FILES中的多余的路径。例如
```cmake
  BASE_DIRS ${CMAKE_SOURCE_DIR}/
  FILES ${CMAKE_SOURCE_DIR}/include/MyLibrary.h
```
假设我安装到dir目录下，那么它的效果就是
```
dir/include/MyLibrary.h
```
而
```cmake
  BASE_DIRS ${CMAKE_SOURCE_DIR}/include/
  FILES ${CMAKE_SOURCE_DIR}/include/MyLibrary.h
```
就会安装到
```
dir/MyLibrary.h
```
目前来看，这个主要就是能够控制每一个文件的安装位置。
当然，可以使用PUBLIC_HEADER属性，通过命令set_target_properties将头文件设置到target中，然后使用
```cmake
install( 
  Target_name
  EXPORT Target_name-export 
  PUBLIC_HEADER DESTINATION include
  ARCHIVE DESTINATION lib
  LIBRARY DESTINATION lib
  RUNTIME DESTINATION bin
)
```
将头文件安装到指定位置。  

