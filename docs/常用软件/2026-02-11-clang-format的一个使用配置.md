---
layout: post
title: clang-format的一个使用配置
date: 2026-02-11 22:48 +0800
tags: [software]
---

一个较为缩进的，基于`llvm`的配置文件设置。

```yaml
BasedOnStyle: LLVM

# 语言标准设置
Language: Cpp
Standard: c++17

# 列宽限制
ColumnLimit: 130

# 大括号初始化样式
Cpp11BracedListStyle: false
SpaceBeforeCpp11BracedList: true
BracedInitializerIndentWidth: 2

# 缩进设置
ContinuationIndentWidth: 2
IndentWidth: 2

# 函数和代码块设置
AllowShortFunctionsOnASingleLine: InlineOnly
AllowShortBlocksOnASingleLine: false
AllowShortIfStatementsOnASingleLine: OnlyFirstIf
AllowShortEnumsOnASingleLine: false

LambdaBodyIndentation: Signature

# 换行设置
AlwaysBreakTemplateDeclarations: Yes
AlignAfterOpenBracket: false
BinPackArguments: true

# 换行惩罚（避免不必要的换行）
PenaltyBreakAssignment: 100
PenaltyBreakBeforeFirstCallParameter: 150
PenaltyBreakComment: 300
PenaltyBreakString: 1000
PenaltyBreakFirstLessLess: 120
PenaltyExcessCharacter: 1000000
PenaltyReturnTypeOnItsOwnLine: 200

# 头文件分组排序
IncludeCategories:
  - Regex: '^<.*>'
    Priority: 1
  - Regex: '^"'             
    Priority: 2
  - Regex: '.*'    
    Priority: 3
IncludeBlocks: Regroup
```

