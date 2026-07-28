---
name: deploy-github-pages
description: 将当前项目变更推送到 GitHub 并验证 GitHub Pages 部署状态。自动检测分支、暂存变更、提交、推送，然后轮询部署结果。
---

# GitHub Pages 部署与验证

将当前项目的变更推送到 GitHub 并验证 GitHub Pages 部署是否成功。

## 输入

`$ARGUMENTS` — 可选的提交消息。留空则自动生成。

## 执行流程

### 1. 前置检查
```bash
git status --short
git remote -v
git branch --show-current
```
- 确认在正确的分支上（通常是 `main` 或 `master`）
- 确认有 remote 配置
- 如果没有 git 仓库，提示用户先运行 `git init`

### 2. 暂存与提交
```bash
git add -A
git status --short  # 确认暂存内容
```
- 如果没有变更，报告"无变更可提交"并停止
- 使用用户提供的提交消息，或根据 `git diff --stat` 自动生成
- 提交格式: `feat: <描述>` / `fix: <描述>` / `update: <描述>`

### 3. 推送
```bash
git push origin <current-branch>
```
- 如果 push 失败（如 remote 未设置），尝试 `git push -u origin <branch>`
- 如果认证失败，提示运行 `gh auth login`

### 4. 验证部署（轮询）
- 等待 30 秒后开始检查
- 使用 WebFetch 访问 GitHub Pages URL（格式: `https://<username>.github.io/<repo>/`）
- 最多重试 3 次，间隔 30 秒
- 报告 HTTP 状态码和部署结果

### 5. 输出
- 提交 hash
- 推送状态
- 部署 URL 及验证结果
- 如有失败，给出具体修复建议

## 注意事项

- Windows PowerShell 环境，避免使用 `&&`，用 `;` 分隔或分步执行
- 如果项目有 `gh-pages` 分支，部署目标是该分支而非 main
- 如果 `package.json` 有 `build` 脚本，提醒用户是否需要先构建
