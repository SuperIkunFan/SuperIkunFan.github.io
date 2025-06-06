---
layout: post
title: cmake的list命令详解
date: 2024-09-05 17:02 +0800
tags: [cmake]
toc: true
---

## 前言  
主要解决的如下需求：  
+ 管理多个元素：CMake 列表是一种在单个变量中存储多个元素的方式。这对于需要管理和操作一组相关项的场景非常有用，例如一组文件、目录、编译标志或者其他配置项
+ list 命令允许你动态地向列表中添加或移除元素。这使得在配置项目时更加灵活，可以根据不同的条件或者配置选项来修改列表的内容  
+ list 命令提供了查找和获取列表中特定元素的方法，使得可以对列表内容进行详细的操作和检查  
+ 列表的内容需要在配置过程中动态生成。  

## 命令格式  
```cmake
list(<command> <list> [<args>...])
```
该命令取决于参数`<command>`，其具有不同的效果；`<list>`就是被操作的列表名，其后为传入的参数。  

1.  APPEND 命令：向一个列表添加一个或多个元素  
  `list(APPEND <list> <element> [<element>...])`  
  举例：
  `list(APPEND myList A B C)`
  myList 现在是 "A;B;C"

2. INSERT 命令：在列表的指定位置插入一个或多个元素
  `list(INSERT <list> <index> <element> [<element>...])`
  举例：
  `list(INSERT myList 1 X Y)`
  myList 现在是 "A;X;Y;B;C"  
3. REMOVE_ITEM 命令：从列表中移除指定的元素。
  `list(REMOVE_ITEM <list> <element> [<element>...])`
  举例：
  `list(REMOVE_ITEM myList B)`
  myList 现在是 "A;X;Y;C"
4. REMOVE_AT 命令：删除列表中指定位置的元素。
  `list(REMOVE_AT <list> <index> [<index>...])`
  举例：
  `list(REMOVE_AT myList 2)`
  myList 现在是 "A;X;C"
5. REMOVE_DUPLICATES命令： 删除列表中的重复元素。
  `list(REMOVE_DUPLICATES <list>)`
  举例：
  `list(REMOVE_DUPLICATES myList)`
  假设 myList 是 "A;B;A;C;B"，现在是 "A;B;C"
6. LENGTH 命令： 获取列表的长度。
  `list(LENGTH <list> <output_variable>) `
  示例：
  `list(LENGTH myList myListLength)`  
  将列表长度存储在myListLength中  
7. GET 命令： 获取列表中指定位置的元素
  `list(GET <list> <index> <output_variable> [<index> <output_variable>...])`
  示例：
  `list(GET myList 1 myElement)`
  myElement 现在是 "X"
8. FIND 命令：查找指定元素在列表中的位置。
  `list(FIND <list> <value> <output_variable>)`
  示例：
  `list(FIND myList X myElementIndex)`
  myElementIndex 现在是 1
9. SUBLIST 命令：获取列表的子列表。
  `list(SUBLIST <list> <start> <length> <output_variable>)`
  示例：
  `list(SUBLIST myList 1 2 mySublist)`
  mySublist 现在是 "X;C"
10. REVERSE 命令：反转列表。
  `list(REVERSE <list>)`
  示例：
  `list(REVERSE myList)`
  myList 现在是 "C;X;A"
