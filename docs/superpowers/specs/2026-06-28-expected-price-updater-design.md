# 预期价格更新器 — 设计规格

> **日期**: 2026-06-28
> **状态**: 已确认

---

## 1. 概述

屏幕右侧悬浮按钮入口，点击后展开面板，支持多选小车后逐个填入当前预期价格，每次更新带时间戳存储。

## 2. 数据模型

Car 新增 `expectedHistory` 字段：

```json
{
  "expectedHistory": [
    { "date": "2026-06-28", "value": 39 },
    { "date": "2026-06-15", "value": 35 }
  ]
}
```

- 数组按时间倒序，`[0]` 为最新记录
- `car.expectedValue` 始终与 `expectedHistory[0].value` 同步
- 初始迁移：无 history 的旧车自动用当前 `expectedValue` 创建首条记录

## 3. UI 设计

### 3.1 悬浮按钮
- 位置：屏幕右侧，垂直居中偏下
- 样式：圆形 `stat-card` 玻璃风格，图标 `diamond`
- 固定定位 `position: fixed; right: 20px; top: 50%;`

### 3.2 弹出面板
- 玻璃面板，从右侧滑入
- 步骤 1 — 选择车辆：所有未售小车列表，带复选框，按投资/自留分组
- 步骤 2 — 逐个填写：一次显示一辆车，当前预期值 + 输入框 + 跳过/确认按钮
- 步骤 3 — 汇总确认：显示所有更新项，确认后写入

### 3.3 交互
- 点击悬浮按钮 → 展开面板
- 勾选小车 → 点击「开始更新」
- 逐车填写新价格 → 跳过或确认
- 全部完成 → 显示汇总 → 确认保存
- 点击面板外或关闭按钮 → 关闭

## 4. 实现要点

- 纯 JS 实现，复用现有 `showModal` / `hideModal` 模式
- `expectedHistory` 迁移：`loadData` 后检测旧格式 Car，无 history 时用当前 `expectedValue` 创建首条记录
- **所有写 `expectedValue` 的地方**（`saveTransaction`、`saveCarEdit`、价格更新器）统一推入 `expectedHistory`
- 保存后调用现有 `saveData()`，自动联动 Dashboard 预期价值卡片
