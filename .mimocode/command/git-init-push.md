---
name: git-init-push
description: 初始化 Git 仓库并推送到 GitHub（新建或已有 remote）。处理 gh 认证、remote 配置、首次推送。
---

# Git 初始化并推送到 GitHub

为当前项目初始化 Git 仓库并推送到 GitHub。

## 输入

`$ARGUMENTS` — 可选参数:
- 仓库名（默认使用当前目录名）
- `--private` 创建私有仓库（默认公开）
- `--existing <url>` 使用已有的 remote URL

## 执行流程

### 1. 检查当前状态
```bash
git status 2>&1
git remote -v 2>&1
```
- 如果已有 git 仓库且有 remote，报告状态并询问是否继续
- 如果已有仓库但无 remote，跳到步骤 3

### 2. 初始化仓库
```bash
git init
git add -A
git commit -m "feat: initial commit"
```

### 3. 配置 Remote
- 如果用户提供了 `--existing <url>`，直接使用
- 否则检查 `gh` CLI 是否可用:
  ```bash
  gh auth status 2>&1
  ```
- 如果未认证，提示 `gh auth login`
- 创建仓库:
  ```bash
  gh repo create <repo-name> --source=. --push [--private]
  ```
- 如果 `gh` 不可用，提示用户手动在 GitHub 创建仓库后提供 URL

### 4. 推送
```bash
git push -u origin main
```
- 如果当前分支不是 `main`，先检查默认分支名
- 如果 push 被拒绝（remote 有内容），询问是否 force push 或 pull --rebase

### 5. 验证
```bash
gh repo view --web  # 可选：打开浏览器
git remote -v
git log --oneline -3
```

## 注意事项

- Windows PowerShell 环境
- `gh` CLI 需要已安装且认证
- 如果目录下有 `.gitignore`，尊重其内容；否则建议创建基础 `.gitignore`
- 首次推送后如需 GitHub Pages，建议运行 `/deploy-github-pages`
