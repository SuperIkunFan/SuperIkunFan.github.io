---
date: 2025-05-28 12:32:00 +0800
title: 标题
---

好的！我将用清晰的结构和模块化文字整理协程的核心机制，方便你记录。以下内容可分段存储或打印：

C++协程机制全解析

1. 核心角色
角色	职责	对应代码
协程函数	含co_await/co_yield/co_return的函数	Generator foo() { co_yield 1; }
协程返回类型	用户定义的对外交互接口	struct Generator { ... };
Promise类型	内部状态管理器（必须名为promise_type）	Generator::promise_type { ... }
协程帧	隐式分配的堆内存，存储协程状态	编译器生成
协程句柄	操作协程的令牌（coroutine_handle）	std::coroutine_handle<promise_type>
2. 协程启动流程
构造Promise

编译器在堆上分配协程帧，内含promise_type对象。
生成控制器

// 由promise_type::get_return_object()生成
Generator gen = std::coroutine_handle<>::from_promise(promise);
初始挂起控制

调用promise.initial_suspend()：
返回std::suspend_always→协程挂起，需手动resume()
返回std::suspend_never→协程立即执行
3. 协程执行逻辑
关键字	触发的Promise方法	行为
co_await	无直接关联	等待Awaitable对象完成
co_yield	promise.yield_value()	返回值并挂起协程
co_return	promise.return_value()	结束协程并返回最终值
4. 协程销毁流程
结束挂起控制

调用promise.final_suspend()：
返回suspend_always→需手动destroy()
返回suspend_never→协程帧自动释放
清理资源

析构局部变量→析构promise_type→释放协程帧。
5. 关键设计图
协程函数 → 协程返回类型(promise_type) → 协程帧(handle)
   ∣                      ∣ 
   ∣                      ∟-- 控制内部逻辑(initial/final_suspend等)
   ∟-- 用户通过返回类型操作协程
6. 典型场景示例
场景1：生成器（隐藏句柄）

struct Generator {
    struct promise_type { /*...*/ };
    // 不暴露handle，提供有限接口
    int next() { /*内部调用handle.resume()*/ }
};
场景2：异步任务（暴露句柄）

struct Task {
    std::coroutine_handle<> handle; // 允许用户直接resume
    void resume() { handle.resume(); }
};
7. 记忆口诀
“三个角色”：函数、返回类型、Promise
“三个阶段”：启动、执行、销毁
“三个关键字”：await/yield/return