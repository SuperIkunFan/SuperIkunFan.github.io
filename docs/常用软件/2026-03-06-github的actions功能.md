---
layout: post
title: github的actions功能
date: 2026-03-05 23:48 +0800
tags: [software]
---

## 一、前言：什么是 `GitHub Actions`？

如果你之前了解了 **GitHub Pages** 是如何自动发布静态网站的，那么你可能会好奇：GitHub 是怎么知道代码更新了？又是如何自动构建并部署的？

这背后的功臣就是 **`GitHub Actions`**。

很多初学者觉得 `CI/CD`（持续集成/持续部署）很复杂，但如果你用一个形象的模型去理解，它其实非常简单。你可以把 `GitHub Actions` 想象成一个**24 小时待命的自动化机器人** 🤖。

它的核心工作逻辑只有一句话：
> **当某个事件发生时，GitHub 会临时分配给你一台干净的“虚拟电脑”，让你在这台电脑上按顺序执行一系列命令。**

## 二、核心模型：三大要素

要理解 `GitHub Actions`，只需要掌握以下三个核心概念：

### 2.1 触发事件 (Event) 

这是自动化流程的**起点**。也就是机器人“什么时候”开始工作。  
常见的事件包括：

- **Push**：当你推送代码到仓库时。
- **Pull Request**：当有人发起或更新 PR 时。
- **Schedule**：定时任务（比如每天凌晨备份）。
- **Manual**：你在网页上手动点击按钮触发。

### 2.2 虚拟电脑 (Runner) 

这是自动化流程的**执行环境**。

- 当事件触发后，GitHub 会瞬间启动一台**临时虚拟机**（官方术语叫 **Runner**）。
- 这台电脑是**干净**的（每次都是全新的系统，用完即毁，不会残留文件）。
- 你可以选择操作系统：`ubuntu-latest` (Linux), `windows-latest`, 或 `macos-latest`。
- **重点**：你不需要自己买服务器，GitHub 免费提供这些虚拟机给你跑任务。

### 2.3 执行任务 (Steps) 

这是自动化流程的**具体操作**。
在虚拟电脑启动后，你需要告诉它做什么。每一步（Step）只有两种执行方式：

1. **`run:` —— 直接执行 Shell 命令**  
    就像你在自己的终端里敲命令一样。
    ```yaml
    - name: 打印问候语
      run: echo "Hello, World!"

    - name: 列出当前文件
      run: |
        ls -la
        pwd
    ```

2. **`uses:` —— 调用别人写好的“动作” (Action)**  
    这相当于使用现成的“应用程序”。别人已经把复杂的脚本封装好了，你只需要告诉它“做什么”，不用关心“怎么做”。
    ```yaml
    - name: 拉取代码
      uses: actions/checkout@v4  # 官方动作：把仓库代码下载到虚拟机

    - name: 设置 Node.js 环境
      uses: actions/setup-node@v4 # 官方动作：安装指定版本的 Node.js
      with:
        node-version: '18'        # 传递参数：我要 Node 18
    ```

## 三、实战案例：自动部署 MkDocs 网站

让我们把理论应用到实际场景中。假设你已经用 MkDocs 写好了博客，现在希望每次执行 `git push` 后，网站能自动更新上线，完全无需手动运行 `mkdocs build` 或配置 GitHub Pages 的 Source。

我们需要在仓库根目录创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy MkDocs Site  # 工作流名称

# 1. 定义触发事件：当推送到 main 分支时触发
on:
  push:
    branches:
      - main

# 2. 定义任务 (Jobs)
jobs:
  deploy:
    # 指定运行环境：最新版的 Ubuntu 虚拟机
    runs-on: ubuntu-latest

    # 3. 定义执行步骤 (Steps)
    steps:
      # 步骤 1: 拉取代码
      - name: Checkout code
        uses: actions/checkout@v4

      # 步骤 2: 设置 Python 环境 (MkDocs 基于 Python)
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.x'  # 安装最新版的 Python

      # 步骤 3: 安装 MkDocs 及相关插件
      # 建议：最好在项目根目录有个 requirements.txt 文件，里面写明 mkdocs 和主题版本
      - name: Install dependencies
        run: |
          pip install --upgrade pip
          pip install mkdocs mkdocs-material  # 这里以 material 主题为例，可按需修改

      # 步骤 4: 构建网站
      # 这步相当于你在本地运行 mkdocs build，生成 site/ 目录
      - name: Build site
        run: mkdocs build

      # 步骤 5: 部署到 GitHub Pages
      # 使用官方推荐的 gh-pages 动作，自动处理 git 推送逻辑
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./site  # 告诉动作：把生成的 site 文件夹发布出去
```

### 3.1 这个过程发生了什么？

1.  **触发**：你在本地写好文章，执行 `git push` 推送到 `main` 分支。
2.  **分配**：GitHub 检测到推送，立刻启动一台干净的 **Ubuntu 虚拟机**。
3.  **环境准备**：
    - 虚拟机先拉取你的代码。
    - 自动安装 Python 环境。
    - 通过 `pip` 安装 MkDocs 和你需要的主题（如 `mkdocs-material`）。
4.  **构建**：
    - 虚拟机执行 `mkdocs build` 命令。
    - 此时，你的 Markdown 文件被“翻译”成了 HTML，并全部存放在 `site/` 目录中。
5.  **部署**：
    - `peaceiris/actions-gh-pages` 这个动作会接管 `site/` 目录。
    - 它会自动创建一个临时的 Git 提交，把 `site/` 里的内容推送到你仓库的 **`gh-pages` 分支**（或者你指定的分支）。
6.  **上线**：
    - GitHub Pages 检测到 `gh-pages` 分支有更新，自动刷新网站内容。
    - 几分钟后，你的新文章就全球可见了！

7.  **结果**：如果 一个命令执行成功，GitHub 显示绿色对勾 ✅；如果测试失败，显示红色叉号 ❌ 并发送邮件通知你。
8.  **清理**：无论成功失败，虚拟机随即被销毁，资源释放。

## 四、总结

GitHub Actions 的本质并不复杂，记住这个核心公式：

> **GitHub Actions = 事件触发 + 临时虚拟机 + (run 命令 / uses 动作)**

- **不需要买服务器**：GitHub 免费提供 Runner。
- **不需要维护环境**：每次都是全新的系统，用完即焚，保证环境纯净。
- **高度复用**：复杂的操作（如部署到 AWS、构建 Docker 镜像）通常都有别人写好的 `uses` 动作，直接拿来用即可。

