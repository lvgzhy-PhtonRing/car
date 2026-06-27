# 记账管理系统 v2.0 — 设计规格说明书

> **日期**: 2026-06-27
> **版本**: v2.0.0
> **状态**: 已确认

---

## 1. 概述

在 V1.1.html 基础上重构，将"账单组"模式升级为双账户 + 小车库存的四模块架构。

### 1.1 两大业务脉络

```
┌─────────────────────────────────────────────────┐
│                   记账管理系统                     │
│                                                   │
│   💰 钱的脉络              🚗 小车的脉络           │
│   ┌──────────────┐       ┌──────────────┐        │
│   │ 零花钱账户    │       │ 投资小车      │        │
│   │ (日常消费)    │◄─────►│              │        │
│   │              │ 互转   │              │        │
│   │ 自留小车买卖  │       │ 贷款融资      │        │
│   │ 日常收支     │       │              │        │
│   └──────────────┘       └──────────────┘        │
│           ▲                      ▲                │
│           │                      │                │
│   ┌───────┴──────┐      ┌───────┴──────┐         │
│   │ 自留车库      │      │ 投资车库      │         │
│   │ (keep)       │◄────►│ (invest)     │         │
│   └──────────────┘ 互转 └──────────────┘         │
└─────────────────────────────────────────────────┘
```

### 1.2 四大功能模块

| # | 模块 | 职责 |
|---|------|------|
| 1 | **Payton's 数据** | Dashboard 汇总看板 |
| 2 | **日常消费** | 零花钱账户明细 + 自留车库 |
| 3 | **投资小车** | 投资账户明细 + 贷款 + 投资车库 |
| 4 | **小车库存** | 售出操作 + 分组聚合统计 |

---

## 2. 数据模型

### 2.1 顶层结构

```json
{
  "version": "2.0.0",
  "accounts": {
    "pocket": { Account },
    "invest": { Account }
  },
  "cars": [ Car, ... ],
  "transferPairs": [ TransferPair, ... ]
}
```

全量存储在 `localStorage` 单键 `carAppData` 下，通过 JSON 导入导出实现持久化。

### 2.2 Account（账户）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | `"pocket"` 零花钱 \| `"invest"` 投资 |
| `name` | string | 账户显示名称 |
| `monthlyAllowance` | number\|null | 每月定额零花钱（仅 pocket） |
| `allowanceDay` | number\|null | 每月存入日期（仅 pocket） |
| `transactions` | Transaction[] | 该账户的所有交易记录 |
| `loans` | Loan[] | 贷款列表（仅 invest，pocket 为空数组） |

**余额 = `sum(income) - sum(expense)`**，实时计算，不持久化。

### 2.3 Transaction（交易记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识 `txn_<timestamp>_<random>` |
| `type` | enum | `"income"` 收入 \| `"expense"` 支出 |
| `category` | enum | `car_buy`\|`car_sell`\|`allowance`\|`loan_new`\|`loan_repay`\|`transfer_in`\|`transfer_out`\|`other` |
| `amount` | number | 金额（¥），绝对值 |
| `date` | string | 发生日期 `YYYY-MM-DD` |
| `carSid` | string\|null | 关联小车 SID |
| `loanId` | string\|null | 关联贷款 ID |
| `transferPairId` | string\|null | 转账配对 ID |
| `note` | string | 备注 |

### 2.4 Car（小车）

| 字段 | 类型 | 说明 |
|------|------|------|
| `sid` | string | UUID 自动生成，1 车 1 号 |
| `brand` | string | 品牌 |
| `name` | string | 车型名称 |
| `buyDate` | string | 购买日期 `YYYY-MM-DD` |
| `buyPrice` | number | 购买价格（¥） |
| `expectedValue` | number | 预期价值（¥），手动输入 |
| `category` | enum | `"invest"` 投资 \| `"keep"` 自留 |
| `sellPrice` | number\|null | 卖出净价格，售出时填写 |
| `soldDate` | string\|null | 售出日期 |
| `isSold` | boolean | 是否已售出，默认 false |
| `note` | string | 备注 |

**关键规则：**
- `category = "invest"` 的买卖 → 投资账户收支（`car_buy` / `car_sell`）
- `category = "keep"` 的买卖 → 零花钱账户收支
- `isSold = true` 的小车不在车库中显示，但保留在 `cars[]` 中供统计

### 2.5 Loan（贷款）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识 `loan_<random>` |
| `name` | string | 贷款名称 |
| `amount` | number | 贷款总额（¥） |
| `remaining` | number | 剩余未还金额 |
| `startDate` | string | 借款日期 `YYYY-MM-DD` |
| `dueDate` | string | 到期还款日期 `YYYY-MM-DD` |
| `status` | enum | `"active"` 进行中 \| `"repaid"` 已还清 \| `"overdue"` 逾期 |
| `note` | string | 备注 |

**规则：** 无利率，借款多少还多少。

### 2.6 TransferPair（转账配对）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识 |
| `fromAccount` | string | 转出账户 ID |
| `toAccount` | string | 转入账户 ID |
| `amount` | number | 转账金额 |
| `date` | string | 转账日期 |
| `note` | string | 转账说明 |

每次转账在双方账户各生成一条 Transaction（`transfer_out` / `transfer_in`），共享 `transferPairId`。

---

## 3. UI 架构

### 3.1 整体布局

```
┌──────────┬────────────────────────────────────┐
│ Sidebar  │                                    │
│ 200px    │        Main Content Area           │
│          │                                    │
│ 📊 看板  │  当前激活模块的完整内容              │
│ 💰 消费  │                                    │
│ 📈 投资  │                                    │
│ 🏪 库存  │                                    │
│          │                                    │
│ ───────  │                                    │
│ 导出/导入│                                    │
└──────────┴────────────────────────────────────┘
```

- 侧边栏固定 200px，main 区域自适应
- 使用现有玻璃拟态 CSS 变量
- Tailwind CDN 保持不变

### 3.2 模块 1: Payton's 数据（Dashboard）

**指标卡片（2×2 网格）：**
1. 零花钱余量
2. 投资款余额
3. 已投资小车总额 + 总个数
4. 库存小车预期价值

**贷款倒计时区：**
- 列出所有 active 贷款，按 dueDate 排序
- 最近到期贷款高亮显示天数倒计时

**近三月零花钱消费图：**
- 简易柱状图（纯 CSS），显示最近 3 个月的消费金额与月余额

**操作按钮：**
- `+ 新增贷款` — 打开贷款表单弹窗
- `归还贷款` — 选择贷款进行还款
- `存入本月零花钱` — 生成当月 allowance 收入记录

### 3.3 模块 2: 日常消费

**左右双区布局：**

| 左：收支明细表 | 右：自留车库 |
|---------------|-------------|
| 可编辑表格（每行可编辑所有属性） | 卡片列表 |
| 类型标签（买车/卖车/零花钱/其他） | 显示品牌/名称/价格/日期 |
| 金额颜色区分收入/支出 | 操作：转投资、售出 |
| + 新增记录 按钮 | |

**编辑方式：** 点击 ✏️ 图标打开编辑弹窗（复用 V1 弹窗组件），可编辑所有字段。

### 3.4 模块 3: 投资小车

**三区布局：**

| 左上方：投资账户明细表 | 右：投资车库 |
|-----------------------|-------------|
| 同模块 2 的表格 | 同模块 2 的车库卡片 |
| 类型增加：新贷款/还贷 | 类别标签为投资 |

| 左下方：贷款区 |
|---------------|
| 进行中的贷款卡片（名称/金额/剩余/倒计时） |
| 操作：归还贷款 |

### 3.5 模块 4: 小车库存

**工具栏：**
- 排列方式切换：按品牌 / 按月
- 搜索框
- 全局统计：总数（投资 N + 自留 M）

**分组视图：**
- 按品牌+名称合并同型号小车
- 每组显示：型号名称、数量、均价
- 折叠/展开切换
- 展开后显示每辆车的 SID、购买日期、购买价格
- 每辆车有「售出」按钮

**转换操作：**
- 投资车旁边显示「转自留」按钮
- 自留车旁边显示「转投资」按钮
- 转换时生成对应的账户转账记录（按购买价格）

---

## 4. 数据流

### 4.1 核心操作与数据联动

```
买入小车：
  1. 生成 Car（sid=UUID, isSold=false）
  2. 按 category 在对应账户生成 Transaction（type=expense, category=car_buy）
  3. cars[] 和 accounts 同时更新

卖出小车：
  1. 更新 Car（isSold=true, sellPrice=X, soldDate=now）
  2. 按 category 在对应账户生成 Transaction（type=income, category=car_sell）
  3. cars[] 和 accounts 同时更新

小车属性转换（投资↔自留）：
  1. 更新 Car.category
  2. 生成账户间转账：旧 category 账户 → 新 category 账户（金额=Car.buyPrice）
  3. 生成 TransferPair 记录

新增贷款：
  1. 创建 Loan（status=active）
  2. invest 账户生成 Transaction（type=income, category=loan_new）

归还贷款：
  1. 更新 Loan.remaining -= 还款额
  2. 若 remaining <= 0 → status=repaid
  3. invest 账户生成 Transaction（type=expense, category=loan_repay）

存入零花钱：
  1. pocket 账户生成 Transaction（type=income, category=allowance, amount=monthlyAllowance）
  2. 检查当月是否已存入，防止重复

账户互转：
  1. fromAccount 生成 Transaction（type=expense, category=transfer_out）
  2. toAccount 生成 Transaction（type=income, category=transfer_in）
  3. 两者共享 transferPairId
  4. 创建 TransferPair 记录
```

### 4.2 数据持久化

```
应用启动
  ├── localStorage.getItem("carAppData") 存在？
  │   ├── 是 → 加载并渲染
  │   └── 否 → 加载默认空数据结构
  │
导出：JSON.stringify(carAppData) → 下载 .json 文件
导入：读取 .json → 验证结构 → 写入 localStorage
```

---

## 5. 数据迁移（V1.1 → V2.0）

V1 数据结构为 `appData: [{ id, name, quota, createDate, bills: [...] }]`（账单组模式）。

迁移策略：
1. 在 V2 启动时检测 `localStorage` 中是否存在旧格式 `appData`
2. 若存在且 `carAppData` 不存在，执行自动迁移
3. 迁移规则：
   - 创建 pocket 和 invest 两个账户
   - 将旧 bills 按类型映射为 transactions
   - 从 bills 中提取小车信息创建 cars[]
   - 旧数据中以 `[投资]` `[自留]` 等前缀区分 category
4. 迁移完成后写入 `carAppData`，保留 `appData` 备份

---

## 6. 技术约束

| 项目 | 选择 |
|------|------|
| 文件 | 单 HTML 文件 `V2.0.html`（从 V1.1.html 重构） |
| CSS | Tailwind CDN + 内联 `<style>` |
| 存储 | localStorage + JSON 文件导入导出 |
| 运行 | browser-sync 热更新服务器 |
| 依赖 | 零外部 JS 库 |
| 兼容 | 现代浏览器（Chrome/Firefox/Edge/Safari） |

---

## 7. 设计决策记录

| 决策 | 选项 | 理由 |
|------|------|------|
| SID 格式 | UUID 自动生成 | 保证唯一，无需人工管理 |
| 预期价值 | 手动输入 | 市场行情波动，人工估值更灵活 |
| 零花钱存入 | 手动按钮 | 无后端服务，无法定时触发 |
| 贷款利率 | 无 | 简化管理，借款多少还多少 |
| 数据方案 | JSON + localStorage | 单文件零依赖，导入导出实现持久化 |
| 实施方式 | V1.1 进化重构 | 保留成熟 UI，降低重写成本 |
