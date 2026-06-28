# 操作日志功能 — 设计规格

> **日期**: 2026-06-28
> **状态**: 已确认

---

## 1. 概述

模仿 ysp-app 操作日志，记录所有数据变更操作。侧边栏底部入口，点击后右侧滑出抽屉面板，清晰展示每条操作的内容摘要，展开查看详情。

## 2. 数据模型

`carAppData.operationLogs[]`：

```json
{
  "id": 1719562800123,
  "time": "2026-06-28T14:30:00.000Z",
  "type": "car_buy",
  "message": "买小车 Hotwheels 普卡F1迈凯伦 ¥19.90",
  "detail": {
    "sid": "uuid-xxx",
    "name": "普卡F1迈凯伦",
    "brand": "Hotwheels",
    "amount": 19.90,
    "account": "pocket"
  }
}
```

- 最多 200 条，超出裁旧
- 随 `saveData()` 持久化到 localStorage
- 跟随 JSON 导入/导出

## 3. 操作类型

| type | 触发时机 | 颜色 |
|:---|:---|:---:|
| `car_buy` | 买小车 | 🟢 绿 |
| `car_sell` | 卖出小车 | 🟡 金 |
| `car_edit` | 编辑小车 | 🔵 蓝 |
| `car_delete` | 删除小车 | 🔴 红 |
| `car_convert` | 转库 | 🟣 紫 |
| `txn_add` | 新增收支 | 🟢 绿 |
| `txn_edit` | 编辑收支 | 🔵 蓝 |
| `txn_delete` | 删除收支 | 🔴 红 |
| `loan_new` | 新增贷款 | 🟠 橙 |
| `loan_repay` | 归还贷款 | 🟠 橙 |
| `loan_edit` | 编辑贷款 | 🔵 蓝 |
| `transfer` | 账户互转 | 🟣 紫 |
| `allowance` | 存入零花钱 | 💧 灰蓝 |
| `expected_update` | 预期价格更新 | 🔵 蓝 |
| `import` | 导入数据 | 灰 |
| `export` | 导出数据 | 灰 |

## 4. UI

- **入口**: 侧边栏底部，导入 JSON 下方 → `📋 操作日志`
- **面板**: 右侧滑出 `w-[380px]` 抽屉，`position:fixed` 不遮挡主内容
- **列表**: 最近 100 条，按时间倒序，每条显示类型标签 + 消息 + 时间
- **展开**: 点击展开 detail 字段（仅核心数据：名称/金额/账户/改动），不显示原始 JSON
- **操作**: 顶部「清空日志」按钮

## 5. 实现

- `addOperationLog(type, message, detail)` 函数
- 现有所有 `save`/`delete`/`update` 函数尾部追加日志调用
- 单文件，纯 JS，复用现有 CSS 系统
