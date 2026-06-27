# 记账管理系统 v2.0 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从 V1.1.html 重构为 V2.0.html，实现双账户 + 小车库存的四模块单文件应用。

**Architecture:** 单 HTML 文件（V2.0.html），Tailwind CDN + 内联 CSS 玻璃拟态风格。数据层：`carAppData { version, accounts{pocket,invest}, cars[], transferPairs[] }`，full in-memory → localStorage。左侧 200px 侧边栏导航 + 右侧主内容区渲染 4 个模块。

**Tech Stack:** HTML5 + Tailwind CSS CDN + 内联 `<style>` + Vanilla JS（零依赖），browser-sync 热更新，localStorage + JSON 导入导出。

---

## 文件规划

| 文件 | 操作 | 职责 |
|------|------|------|
| `V2.0.html` | **Create** | 完整的 v2.0 应用（从 V1.1.html 复制 CSS，重写 HTML+JS） |
| `package.json` | **Modify** | dev 脚本指向 V2.0.html |
| `V1.1.html` | 保留 | 参考和回退 |

---

## 数据层设计（前置声明）

所有任务中共享以下数据结构定义（在 JS 顶层声明）：

```js
// === 默认空数据 ===
function getDefaultData() {
  return {
    version: '2.0.0',
    accounts: {
      pocket: {
        id: 'pocket', name: '零花钱账户', monthlyAllowance: 200, allowanceDay: 1,
        transactions: [], loans: []
      },
      invest: {
        id: 'invest', name: '投资账户', monthlyAllowance: null, allowanceDay: null,
        transactions: [], loans: []
      }
    },
    cars: [],
    transferPairs: []
  };
}

// === ID 生成 ===
function genId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}
function genUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// === 账户余额计算 ===
function calcBalance(account) {
  return account.transactions.reduce((sum, t) => {
    return sum + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);
}

// === 日期工具 ===
const getToday = () => new Date().toISOString().split('T')[0];
```

---

### Task 1: 创建 V2.0.html 骨架 — HTML head + CSS

**Files:**
- Create: `D:\Projects\car\V2.0.html`

- [ ] **Step 1: 创建 HTML 头部骨架**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>记账管理系统 v2.0.0</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
```

- [ ] **Step 2: 复制 V1.1 全部 CSS 并追加 V2 新样式**

从 `V1.1.html:11-217` 复制所有 `<style>` 内容。然后追加以下 V2 新增样式：

```css
/* ===== V2 Sidebar ===== */
.sidebar {
    width: 200px; min-height: 100vh;
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(20px) saturate(140%);
    -webkit-backdrop-filter: blur(20px) saturate(140%);
    border-right: 1px solid rgba(0,0,0,0.06);
    position: fixed; left: 0; top: 0; z-index: 30;
    display: flex; flex-direction: column;
}
.sidebar-nav { flex: 1; padding: 20px 12px; }
.sidebar-nav-item {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px; margin-bottom: 4px;
    border-radius: 12px; font-size: 14px; font-weight: 500;
    color: #636366; cursor: pointer;
    transition: all 0.15s ease;
}
.sidebar-nav-item:hover { background: rgba(0,0,0,0.04); color: #1d1d1f; }
.sidebar-nav-item.active {
    background: rgba(0,113,227,0.1); color: #0071e3;
    font-weight: 600;
}
.sidebar-footer { padding: 12px; border-top: 1px solid rgba(0,0,0,0.05); }
.main-content { margin-left: 200px; min-height: 100vh; }
.module-panel { display: none; }
.module-panel.active { display: block; }

/* ===== Dashboard Cards ===== */
.stat-card {
    background: rgba(255,255,255,0.62);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.5);
    border-radius: 18px; padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05);
}
.stat-card .stat-label { font-size: 12px; color: #8e8e93; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-card .stat-value { font-size: 24px; font-weight: 700; margin-top: 4px; }
.stat-card .stat-sub { font-size: 12px; color: #8e8e93; margin-top: 2px; }

/* ===== Loan Card ===== */
.loan-card {
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(0,0,0,0.06); border-radius: 14px;
    padding: 14px; transition: all 0.2s ease;
}
.loan-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.loan-card.overdue { border-left: 3px solid #ef4444; }
.loan-card.due-soon { border-left: 3px solid #f59e0b; }

/* ===== Car Card ===== */
.car-card {
    background: rgba(255,255,255,0.55);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(0,0,0,0.06); border-radius: 14px;
    padding: 14px; transition: all 0.2s ease;
}
.car-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.car-card.sold { opacity: 0.6; }

/* ===== Bar Chart (Pure CSS) ===== */
.bar-chart { display: flex; align-items: flex-end; gap: 12px; height: 120px; padding: 8px 0; }
.bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.bar-fill {
    width: 100%; max-width: 48px; border-radius: 8px 8px 0 0;
    transition: height 0.4s ease;
}
.bar-fill.income { background: rgba(5,150,105,0.6); }
.bar-fill.expense { background: rgba(220,38,38,0.5); }
.bar-label { font-size: 11px; color: #8e8e93; }

/* ===== Accordion ===== */
.accordion-toggle { cursor: pointer; user-select: none; }
.accordion-body { overflow: hidden; transition: max-height 0.3s ease; }
.accordion-body.collapsed { max-height: 0; }
.accordion-body.expanded { max-height: 2000px; }

/* ===== Transaction type badges ===== */
.badge-income { background: rgba(209,250,229,0.7); color: #059669; border-radius: 8px; padding: 2px 8px; font-size: 11px; }
.badge-expense { background: rgba(254,226,226,0.7); color: #dc2626; border-radius: 8px; padding: 2px 8px; font-size: 11px; }

/* ===== Modal ===== */
.modal-backdrop {
    background: rgba(0,0,0,0.25);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
}
```

- [ ] **Step 3: 关闭 head 并创建 body 壳**

```html
</head>
<body class="text-gray-800 antialiased min-h-screen relative z-10">
    <!-- 侧边栏 -->
    <aside class="sidebar">
        <div class="px-4 py-5 border-b border-black/5">
            <h1 class="text-lg font-bold flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                记账管理
            </h1>
        </div>
        <nav class="sidebar-nav">
            <div class="sidebar-nav-item active" data-module="dashboard" onclick="switchModule('dashboard')">
                <span>📊</span> Payton's 数据
            </div>
            <div class="sidebar-nav-item" data-module="daily" onclick="switchModule('daily')">
                <span>💰</span> 日常消费
            </div>
            <div class="sidebar-nav-item" data-module="invest" onclick="switchModule('invest')">
                <span>📈</span> 投资小车
            </div>
            <div class="sidebar-nav-item" data-module="inventory" onclick="switchModule('inventory')">
                <span>🏪</span> 小车库存
            </div>
        </nav>
        <div class="sidebar-footer space-y-2">
            <button onclick="exportData()" class="w-full text-sm px-3 py-2 glass-light rounded-xl-apple hover:bg-white/60 btn-glass text-left">📤 导出JSON</button>
            <label class="w-full text-sm px-3 py-2 glass-light rounded-xl-apple hover:bg-white/60 cursor-pointer btn-glass text-left block">
                📥 导入JSON <input type="file" class="hidden" accept=".json" onchange="importData(event)">
            </label>
            <div class="text-xs text-gray-400 text-center pt-2" id="appVersion">v2.0.0</div>
        </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content p-6">
        <div id="moduleDashboard" class="module-panel active"></div>
        <div id="moduleDaily" class="module-panel"></div>
        <div id="moduleInvest" class="module-panel"></div>
        <div id="moduleInventory" class="module-panel"></div>
    </main>

    <!-- 弹窗容器（按需动态渲染） -->
    <div id="modalContainer"></div>

    <script>
    // === 脚本将在后续 task 中逐步添加 ===
    </script>
</body>
</html>
```

- [ ] **Step 4: 验证文件可打开**

运行 `npm run dev`，确认浏览器打开 `http://localhost:3000` 显示侧边栏 + 空白主内容区，无 JS 报错。

- [ ] **Step 5: Commit**

```bash
git add V2.0.html
git commit -m "feat: create V2.0.html skeleton with sidebar layout"
```

---

### Task 2: 数据层 — 核心变量、CRUD 与持久化

**Files:**
- Modify: `D:\Projects\car\V2.0.html` — 在 `<script>` 内添加数据层代码

- [ ] **Step 1: 添加全局数据变量和初始化函数**

在 `<script>` 标签内添加：

```js
// ==================== 数据层 ====================
let carAppData = getDefaultData();

// 默认空数据结构
function getDefaultData() {
  return {
    version: '2.0.0',
    accounts: {
      pocket: {
        id: 'pocket', name: '零花钱账户', monthlyAllowance: 200, allowanceDay: 1,
        transactions: [], loans: []
      },
      invest: {
        id: 'invest', name: '投资账户', monthlyAllowance: null, allowanceDay: null,
        transactions: [], loans: []
      }
    },
    cars: [],
    transferPairs: []
  };
}

// ID 生成
function genId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// UUID 生成 (v4)
function genUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// 日期工具
const getToday = () => new Date().toISOString().split('T')[0];

// 账户余额计算
function calcBalance(account) {
  return account.transactions.reduce((sum, t) => {
    return sum + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);
}
```

- [ ] **Step 2: 添加数据持久化函数**

```js
// 加载数据（含迁移检测）
function loadData() {
  const raw = localStorage.getItem('carAppData');
  if (raw) {
    try {
      carAppData = JSON.parse(raw);
      if (!carAppData.version) carAppData.version = '2.0.0';
      return true;
    } catch (e) {
      console.error('数据解析失败，使用默认数据', e);
    }
  }
  // 检查旧格式
  const oldData = localStorage.getItem('accountingData');
  if (oldData) {
    try {
      const parsed = JSON.parse(oldData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        carAppData = migrateV1toV2(parsed);
        saveData();
        return true;
      }
    } catch (e) { console.error('旧数据迁移失败', e); }
  }
  carAppData = getDefaultData();
  return false;
}

function saveData() {
  localStorage.setItem('carAppData', JSON.stringify(carAppData));
  renderCurrentModule();
}
```

- [ ] **Step 3: 添加 V1→V2 数据迁移函数**

```js
// V1 → V2 数据迁移
function migrateV1toV2(oldAppData) {
  const data = getDefaultData();

  oldAppData.forEach(group => {
    group.bills.forEach(bill => {
      // 解析 bill name: [收入/支出][类别] 描述
      const nameMatch = bill.name.match(/^\[(收入|支出)\]\[(.+?)\]\s*(.+)/);
      const direction = nameMatch ? nameMatch[1] : null;
      const categoryRaw = nameMatch ? nameMatch[2] : '';
      const carName = nameMatch ? nameMatch[3] : bill.name;

      let targetAccount = data.accounts.pocket;
      let txnType = 'expense';
      let txnCategory = 'other';
      let carCategory = 'keep';

      if (direction === '收入') {
        txnType = 'income';
      }

      // 分类映射
      if (categoryRaw.includes('零花钱')) {
        txnCategory = 'allowance';
      } else if (categoryRaw.includes('卖小车')) {
        txnCategory = 'car_sell';
      } else if (categoryRaw.includes('买小车')) {
        txnCategory = 'car_buy';
      } else {
        txnCategory = 'other';
      }

      // 提取品牌（从旧 brand 字段）
      const brand = bill.brand || '';

      // 投资/自留判断
      if (bill.type === '投资') {
        carCategory = 'invest';
        targetAccount = data.accounts.invest;
      } else if (bill.type === '自留') {
        carCategory = 'keep';
        targetAccount = data.accounts.pocket;
      } else if (bill.type === '转账') {
        // V1 转账 → V2 在 pocket 中作为 other 交易
        targetAccount = data.accounts.pocket;
      }

      // 小车买入 → 创建 Car + Transaction
      if (txnCategory === 'car_buy') {
        const sid = genUUID();
        const car = {
          sid: sid,
          brand: brand,
          name: carName,
          buyDate: bill.date,
          buyPrice: bill.price || bill.amount || 0,
          expectedValue: bill.expectedValue || bill.price || 0,
          category: carCategory,
          sellPrice: null,
          soldDate: null,
          isSold: bill.isSold || false,
          note: ''
        };
        data.cars.push(car);

        const txn = {
          id: genId('txn'),
          type: 'expense',
          category: 'car_buy',
          amount: bill.price || bill.amount || 0,
          date: bill.date,
          carSid: sid,
          loanId: null,
          transferPairId: null,
          note: carName
        };
        targetAccount.transactions.push(txn);
      }

      // 小车卖出
      else if (txnCategory === 'car_sell') {
        // 尝试匹配已有小车（按名称）
        const existingCar = data.cars.find(c =>
          c.name === carName.replace(/^卖/, '').replace(/ x\d+$/, '') && !c.isSold
        );
        if (existingCar) {
          existingCar.isSold = true;
          existingCar.sellPrice = bill.amount || bill.sellPrice || 0;
          existingCar.soldDate = bill.date;
        }

        const txn = {
          id: genId('txn'),
          type: 'income',
          category: 'car_sell',
          amount: bill.amount || bill.sellPrice || 0,
          date: bill.date,
          carSid: existingCar ? existingCar.sid : null,
          loanId: null,
          transferPairId: null,
          note: carName
        };
        // 按小车类别决定账户
        const targetAcct = existingCar && existingCar.category === 'invest'
          ? data.accounts.invest : data.accounts.pocket;
        targetAcct.transactions.push(txn);
      }

      // 零花钱
      else if (txnCategory === 'allowance') {
        const txn = {
          id: genId('txn'),
          type: 'income',
          category: 'allowance',
          amount: bill.amount || 0,
          date: bill.date,
          carSid: null, loanId: null, transferPairId: null,
          note: carName
        };
        data.accounts.pocket.transactions.push(txn);
      }

      // 其他（生活消费等）
      else {
        const txn = {
          id: genId('txn'),
          type: txnType,
          category: 'other',
          amount: bill.amount || 0,
          date: bill.date,
          carSid: null, loanId: null, transferPairId: null,
          note: carName
        };
        targetAccount.transactions.push(txn);
      }
    });
  });

  return data;
}
```

- [ ] **Step 4: 添加导入导出函数**

```js
function exportData() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(carAppData, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', `car_backup_${getToday()}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (parsed.version && parsed.accounts && parsed.cars && confirm('导入将覆盖当前所有数据，确认继续？')) {
        carAppData = parsed;
        saveData();
        alert('导入成功！');
      } else {
        alert('无效的 v2.0 数据格式');
      }
    } catch (err) { alert('JSON 解析失败: ' + err.message); }
  };
  reader.readAsText(file);
  e.target.value = '';
}
```

- [ ] **Step 5: Commit**

```bash
git add V2.0.html
git commit -m "feat: add data layer with CRUD, persistence, and v1→v2 migration"
```

---

### Task 3: 模块路由 + 渲染调度框架

**Files:**
- Modify: `D:\Projects\car\V2.0.html` — `<script>` 内添加模块切换逻辑

- [ ] **Step 1: 添加 `switchModule` 和 `renderCurrentModule` 函数**

```js
// ==================== 模块路由 ====================
let currentModule = 'dashboard';

function switchModule(moduleName) {
  currentModule = moduleName;

  // 更新侧边栏 active 状态
  document.querySelectorAll('.sidebar-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.module === moduleName);
  });

  // 切换主内容区
  document.querySelectorAll('.module-panel').forEach(el => {
    el.classList.toggle('active', el.id === 'module' + moduleName.charAt(0).toUpperCase() + moduleName.slice(1));
  });

  renderCurrentModule();
}

function renderCurrentModule() {
  switch (currentModule) {
    case 'dashboard': renderDashboard(); break;
    case 'daily': renderDaily(); break;
    case 'invest': renderInvest(); break;
    case 'inventory': renderInventory(); break;
  }
}
```

- [ ] **Step 2: 添加 `window.onload` 入口**

```js
window.onload = () => {
  loadData();
  renderCurrentModule();
};
```

- [ ] **Step 3: 添加工具函数**

```js
// HTML 转义
function esc(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

// 金额格式化
function fmt(amount) {
  const n = parseFloat(amount) || 0;
  const sign = n >= 0 ? '' : '-';
  return sign + '¥' + Math.abs(n).toFixed(2);
}

// 关闭弹窗
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}
```

- [ ] **Step 4: 添加弹窗容器渲染函数**

```js
// 动态渲染弹窗到 #modalContainer
function showModal(html) {
  document.getElementById('modalContainer').innerHTML = html;
}

function hideModal() {
  document.getElementById('modalContainer').innerHTML = '';
}
```

- [ ] **Step 5: Commit**

```bash
git add V2.0.html
git commit -m "feat: add module routing and render dispatch framework"
```

---

### Task 4: 模块 1 — Dashboard (Payton's 数据)

**Files:**
- Modify: `D:\Projects\car\V2.0.html` — 添加 `renderDashboard()` 及辅助函数

- [ ] **Step 1: 添加 Dashboard 辅助计算函数**

```js
// ==================== Dashboard ====================
function getDashboardStats() {
  const pocket = carAppData.accounts.pocket;
  const invest = carAppData.accounts.invest;
  const allCars = carAppData.cars;

  const pocketBalance = calcBalance(pocket);
  const investBalance = calcBalance(invest);

  // 投资小车总额 + 个数（未售出的 invest 类别）
  const investCars = allCars.filter(c => c.category === 'invest' && !c.isSold);
  const investTotal = investCars.reduce((s, c) => s + c.buyPrice, 0);
  const investCount = investCars.length;

  // 库存预期价值（所有未售出小车）
  const unsoldCars = allCars.filter(c => !c.isSold);
  const expectedTotal = unsoldCars.reduce((s, c) => s + (c.expectedValue || c.buyPrice), 0);

  return { pocketBalance, investBalance, investTotal, investCount, expectedTotal, unsoldCount: unsoldCars.length };
}

function getActiveLoans() {
  return carAppData.accounts.invest.loans
    .filter(l => l.status === 'active' || l.status === 'overdue')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function getMonthlySpending() {
  const now = new Date();
  const months = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: (d.getMonth() + 1) + '月',
      key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    });
  }

  return months.map(m => {
    const txns = carAppData.accounts.pocket.transactions.filter(t => {
      return t.date.startsWith(m.key + '-') || t.date.startsWith(m.key);
    });
    const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { label: m.label, key: m.key, income, expense };
  });
}
```

- [ ] **Step 2: 添加 `renderDashboard()` 主函数**

```js
function renderDashboard() {
  const stats = getDashboardStats();
  const loans = getActiveLoans();
  const monthly = getMonthlySpending();
  const maxBarVal = Math.max(...monthly.flatMap(m => [m.income, m.expense]), 1);

  const html = `
    <div class="max-w-6xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">📊 Payton's 数据</h2>
        <span class="text-xs text-gray-400">v${esc(carAppData.version)}</span>
      </div>

      <!-- 指标卡片 2x2 -->
      <div class="grid grid-cols-2 gap-4">
        <div class="stat-card">
          <div class="stat-label">💰 零花钱余量</div>
          <div class="stat-value text-positive">${fmt(stats.pocketBalance)}</div>
          <div class="stat-sub">月额 ¥${carAppData.accounts.pocket.monthlyAllowance || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">📈 投资款余额</div>
          <div class="stat-value text-negative">${fmt(stats.investBalance)}</div>
          <div class="stat-sub">含贷款融资</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">🚗 已投资小车</div>
          <div class="stat-value text-gray-800">${fmt(stats.investTotal)}</div>
          <div class="stat-sub">共 ${stats.investCount} 辆</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">💎 库存预期价值</div>
          <div class="stat-value text-gray-800">${fmt(stats.expectedTotal)}</div>
          <div class="stat-sub">共 ${stats.unsoldCount} 辆未售</div>
        </div>
      </div>

      <!-- 贷款倒计时 -->
      <div class="glass rounded-2xl-apple p-5">
        <h3 class="font-bold text-base mb-3">⏳ 贷款倒计时</h3>
        ${loans.length === 0 ? '<p class="text-gray-400 text-sm">无进行中的贷款</p>' : loans.map(loan => {
          const daysLeft = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysLeft < 0;
          const isSoon = daysLeft >= 0 && daysLeft <= 7;
          return `
            <div class="loan-card ${isOverdue ? 'overdue' : ''} ${isSoon ? 'due-soon' : ''} mb-2 flex justify-between items-center">
              <div>
                <div class="font-semibold text-sm">${esc(loan.name)}</div>
                <div class="text-xs text-gray-500">剩余 ${fmt(loan.remaining)} / 总额 ${fmt(loan.amount)}</div>
                <div class="text-xs ${isOverdue ? 'text-red-600 font-bold' : isSoon ? 'text-yellow-600 font-semibold' : 'text-gray-400'}">
                  ${isOverdue ? '⚠ 已逾期 ' + Math.abs(daysLeft) + ' 天' : '到期: ' + loan.dueDate + ' (' + daysLeft + ' 天)'}
                </div>
              </div>
              <button onclick="openRepayLoanModal('${loan.id}')" class="btn-glass text-xs px-3 py-1.5 bg-yellow-100/80 text-yellow-700 hover:bg-yellow-200/80">归还</button>
            </div>`;
        }).join('')}
      </div>

      <!-- 近三月柱状图 -->
      <div class="glass rounded-2xl-apple p-5">
        <h3 class="font-bold text-base mb-3">📊 近三月零花钱消费</h3>
        <div class="bar-chart">
          ${monthly.map(m => `
            <div class="bar-item">
              <div class="text-xs text-gray-500">${fmt(m.expense)}</div>
              <div class="bar-fill expense" style="height: ${(m.expense / maxBarVal) * 100}%"></div>
              <div class="bar-label">${m.label} 支出</div>
            </div>
            <div class="bar-item">
              <div class="text-xs text-gray-500">${fmt(m.income)}</div>
              <div class="bar-fill income" style="height: ${(m.income / maxBarVal) * 100}%"></div>
              <div class="bar-label">${m.label} 收入</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-3 flex-wrap">
        <button onclick="openNewLoanModal()" class="btn-glass bg-blue-600/10 text-blue-700 px-4 py-2 rounded-xl-apple text-sm hover:bg-blue-600/20 font-medium">
          ➕ 新增贷款
        </button>
        <button onclick="openRepayLoanModal()" class="btn-glass bg-yellow-100/80 text-yellow-700 px-4 py-2 rounded-xl-apple text-sm hover:bg-yellow-200/80 font-medium">
          💸 归还贷款
        </button>
        <button onclick="depositAllowance()" class="btn-glass bg-green-100/80 text-green-700 px-4 py-2 rounded-xl-apple text-sm hover:bg-green-200/80 font-medium">
          💰 存入本月零花钱
        </button>
      </div>
    </div>`;

  document.getElementById('moduleDashboard').innerHTML = html;
}
```

- [ ] **Step 3: Commit**

```bash
git add V2.0.html
git commit -m "feat: implement Dashboard module with stats, loan timeline, and bar chart"
```

---

### Task 5: 模块 1 Dashboard — 操作功能

**Files:**
- Modify: `D:\Projects\car\V2.0.html` — 添加贷款弹窗和零花钱存入逻辑

- [ ] **Step 1: 新增贷款弹窗**

```js
function openNewLoanModal(loanId) {
  let loan = null;
  if (loanId) {
    loan = carAppData.accounts.invest.loans.find(l => l.id === loanId);
  }

  const html = `
    <div id="loanModal" class="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50">
      <div class="glass-strong rounded-2xl-apple w-full max-w-sm p-6">
        <h3 class="font-bold text-lg mb-4">${loan ? '编辑贷款' : '新增贷款'}</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">贷款名称</label>
            <input type="text" id="loanName" value="${esc(loan ? loan.name : '')}" placeholder="如：老爸借款" class="w-full glass-input p-2.5 text-sm">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">贷款总额</label>
            <input type="number" id="loanAmount" value="${loan ? loan.amount : ''}" step="0.01" class="w-full glass-input p-2.5 text-sm">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-gray-600 mb-1">借款日期</label>
              <input type="date" id="loanStartDate" value="${loan ? loan.startDate : getToday()}" class="w-full glass-input p-2.5 text-sm">
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">到期日期</label>
              <input type="date" id="loanDueDate" value="${loan ? loan.dueDate : ''}" class="w-full glass-input p-2.5 text-sm">
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">备注</label>
            <input type="text" id="loanNote" value="${esc(loan ? loan.note : '')}" class="w-full glass-input p-2.5 text-sm">
          </div>
          <input type="hidden" id="loanId" value="${loan ? loan.id : ''}">
        </div>
        <div class="mt-6 flex justify-end space-x-2">
          <button onclick="hideModal()" class="px-4 py-2 glass-light rounded-xl-apple hover:bg-white/60 text-sm btn-glass">取消</button>
          <button onclick="saveLoan()" class="px-4 py-2 bg-blue-600/90 backdrop-blur text-white rounded-xl-apple hover:bg-blue-700 text-sm btn-glass">保存</button>
        </div>
      </div>
    </div>`;
  showModal(html);
}

function saveLoan() {
  const id = document.getElementById('loanId').value;
  const name = document.getElementById('loanName').value.trim();
  const amount = parseFloat(document.getElementById('loanAmount').value) || 0;
  const startDate = document.getElementById('loanStartDate').value;
  const dueDate = document.getElementById('loanDueDate').value;
  const note = document.getElementById('loanNote').value.trim();

  if (!name) return alert('请输入贷款名称');
  if (!amount) return alert('请输入贷款金额');

  const invest = carAppData.accounts.invest;

  if (id) {
    // 编辑
    const loan = invest.loans.find(l => l.id === id);
    loan.name = name; loan.amount = amount; loan.startDate = startDate;
    loan.dueDate = dueDate; loan.note = note;
  } else {
    // 新增
    const newLoan = {
      id: genId('loan'),
      name, amount, remaining: amount,
      startDate, dueDate,
      status: 'active',
      note
    };
    invest.loans.push(newLoan);
    // 生成交易记录
    invest.transactions.push({
      id: genId('txn'),
      type: 'income',
      category: 'loan_new',
      amount: amount,
      date: startDate,
      carSid: null,
      loanId: newLoan.id,
      transferPairId: null,
      note: '新增贷款: ' + name
    });
  }

  hideModal();
  saveData();
}
```

- [ ] **Step 2: 归还贷款弹窗**

```js
function openRepayLoanModal(loanId) {
  const activeLoans = getActiveLoans();
  if (activeLoans.length === 0) {
    alert('无进行中的贷款');
    return;
  }

  const options = activeLoans.map(l => `
    <option value="${l.id}" ${loanId === l.id ? 'selected' : ''}>
      ${esc(l.name)} — 剩余 ${fmt(l.remaining)}
    </option>`).join('');

  const selectedLoan = loanId ? activeLoans.find(l => l.id === loanId) : activeLoans[0];

  const html = `
    <div id="repayModal" class="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50">
      <div class="glass-strong rounded-2xl-apple w-full max-w-sm p-6">
        <h3 class="font-bold text-lg mb-4">归还贷款</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">选择贷款</label>
            <select id="repayLoanId" class="w-full glass-input p-2.5 text-sm">${options}</select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">归还金额 (剩余: ${fmt(selectedLoan ? selectedLoan.remaining : 0)})</label>
            <input type="number" id="repayAmount" value="${selectedLoan ? selectedLoan.remaining : ''}" step="0.01" class="w-full glass-input p-2.5 text-sm">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">归还日期</label>
            <input type="date" id="repayDate" value="${getToday()}" class="w-full glass-input p-2.5 text-sm">
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-2">
          <button onclick="hideModal()" class="px-4 py-2 glass-light rounded-xl-apple hover:bg-white/60 text-sm btn-glass">取消</button>
          <button onclick="confirmRepay()" class="px-4 py-2 bg-yellow-500/90 backdrop-blur text-white rounded-xl-apple hover:bg-yellow-600 text-sm font-bold btn-glass">确认归还</button>
        </div>
      </div>
    </div>`;
  showModal(html);
}

function confirmRepay() {
  const loanId = document.getElementById('repayLoanId').value;
  const amount = parseFloat(document.getElementById('repayAmount').value) || 0;
  const date = document.getElementById('repayDate').value;

  if (!amount) return alert('请输入归还金额');

  const invest = carAppData.accounts.invest;
  const loan = invest.loans.find(l => l.id === loanId);
  if (!loan) return;

  loan.remaining -= amount;
  if (loan.remaining <= 0) {
    loan.remaining = 0;
    loan.status = 'repaid';
  }

  invest.transactions.push({
    id: genId('txn'),
    type: 'expense',
    category: 'loan_repay',
    amount: amount,
    date: date,
    carSid: null,
    loanId: loan.id,
    transferPairId: null,
    note: '归还贷款: ' + loan.name
  });

  hideModal();
  saveData();
}
```

- [ ] **Step 3: 存入零花钱**

```js
function depositAllowance() {
  const pocket = carAppData.accounts.pocket;
  if (!pocket.monthlyAllowance) return alert('请先设置每月零花钱额度');

  // 检查当月是否已存入
  const now = new Date();
  const monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const alreadyDeposited = pocket.transactions.some(t =>
    t.category === 'allowance' && t.date.startsWith(monthKey)
  );
  if (alreadyDeposited) return alert('本月零花钱已存入');

  pocket.transactions.push({
    id: genId('txn'),
    type: 'income',
    category: 'allowance',
    amount: pocket.monthlyAllowance,
    date: getToday(),
    carSid: null, loanId: null, transferPairId: null,
    note: monthKey + ' 零花钱'
  });

  saveData();
}
```

- [ ] **Step 4: Commit**

```bash
git add V2.0.html
git commit -m "feat: implement dashboard operations - new loan, repay loan, deposit allowance"
```

---

### Task 6: 模块 2 — 日常消费 (Daily)

**Files:**
- Modify: `D:\Projects\car\V2.0.html` — 添加 `renderDaily()` 及辅助函数

- [ ] **Step 1: 添加交易记录表格渲染函数**

```js
// ==================== 日常消费 ====================
function renderTransactionTable(transactions, accountId) {
  if (transactions.length === 0) {
    return '<div class="text-center py-6 text-gray-400">暂无交易记录</div>';
  }

  const categoryLabels = {
    car_buy: '买车', car_sell: '卖车', allowance: '零花钱',
    loan_new: '新贷款', loan_repay: '还贷',
    transfer_in: '转入', transfer_out: '转出', other: '其他'
  };

  return `
    <table class="w-full text-left text-sm whitespace-nowrap">
      <thead class="bg-black/[0.015] text-gray-500 border-b border-black/5">
        <tr>
          <th class="px-3 py-2 w-24">日期</th>
          <th class="px-3 py-2">类别</th>
          <th class="px-3 py-2">金额</th>
          <th class="px-3 py-2">备注</th>
          <th class="px-3 py-2 text-right w-20">操作</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        ${transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).map(t => `
          <tr class="hover:bg-white/50">
            <td class="px-3 py-2 text-gray-500 text-xs">${t.date}</td>
            <td class="px-3 py-2">
              <span class="${t.type === 'income' ? 'badge-income' : 'badge-expense'}">${categoryLabels[t.category] || t.category}</span>
            </td>
            <td class="px-3 py-2 font-semibold ${t.type === 'income' ? 'text-negative' : 'text-positive'}">${fmt(t.amount)}</td>
            <td class="px-3 py-2 text-xs text-gray-600 max-w-[200px] truncate">${esc(t.note || '')}</td>
            <td class="px-3 py-2 text-right">
              <button onclick="editTransaction('${accountId}', '${t.id}')" class="text-blue-500 hover:underline text-xs mr-1">✏️</button>
              <button onclick="deleteTransaction('${accountId}', '${t.id}')" class="text-red-500 hover:underline text-xs">🗑</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}
```

- [ ] **Step 2: 添加小车卡片渲染函数**

```js
function renderCarCards(cars, accountType) {
  const filtered = cars.filter(c => c.category === accountType && !c.isSold);
  if (filtered.length === 0) {
    return '<div class="text-center py-6 text-gray-400 text-sm">暂无小车</div>';
  }

  return filtered.map(car => `
    <div class="car-card mb-2">
      <div class="flex justify-between items-start">
        <div>
          <div class="font-semibold text-sm">${esc(car.brand ? car.brand + ' ' : '')}${esc(car.name)}</div>
          <div class="text-xs text-gray-500 mt-1">
            买入: ${fmt(car.buyPrice)} · ${car.buyDate}
          </div>
          <div class="text-xs text-gray-500">
            预期: ${fmt(car.expectedValue || car.buyPrice)}
          </div>
          <div class="text-xs text-gray-400 font-mono mt-0.5">SID: ${car.sid.slice(0, 8)}...</div>
        </div>
        <div class="flex gap-1 flex-shrink-0">
          <button onclick="sellCar('${car.sid}')" class="btn-sell">售出</button>
          <button onclick="convertCar('${car.sid}')" class="btn-convert ${accountType === 'invest' ? 'btn-to-keep' : 'btn-to-invest'}">
            → ${accountType === 'invest' ? '自留' : '投资'}
          </button>
        </div>
      </div>
    </div>`).join('');
}
```

- [ ] **Step 3: 添加 `renderDaily()` 主函数**

```js
function renderDaily() {
  const pocket = carAppData.accounts.pocket;
  const balance = calcBalance(pocket);

  const html = `
    <div class="max-w-6xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">💰 日常消费</h2>
        <button onclick="openTransactionModal('pocket')" class="bg-blue-600/90 backdrop-blur text-white px-4 py-2 rounded-xl-apple text-sm hover:bg-blue-700 btn-glass">+ 新增记录</button>
      </div>

      <!-- 账户摘要 -->
      <div class="glass rounded-2xl-apple p-4 flex gap-6 text-sm">
        <div>账户: <span class="font-bold">${esc(pocket.name)}</span></div>
        <div>余额: <span class="font-bold ${balance >= 0 ? 'text-negative' : 'text-positive'}">${fmt(balance)}</span></div>
        <div>月额: ¥${pocket.monthlyAllowance || 0}</div>
      </div>

      <!-- 左右布局 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- 左：收支明细表 -->
        <div class="glass rounded-2xl-apple overflow-hidden">
          <div class="glass-light p-3 border-b border-black/5 font-semibold text-sm">📋 收支明细</div>
          ${renderTransactionTable(pocket.transactions, 'pocket')}
        </div>

        <!-- 右：自留车库 -->
        <div class="glass rounded-2xl-apple overflow-hidden">
          <div class="glass-light p-3 border-b border-black/5 font-semibold text-sm">🚗 自留车库</div>
          <div class="p-3">
            ${renderCarCards(carAppData.cars, 'keep')}
          </div>
        </div>
      </div>
    </div>`;
  document.getElementById('moduleDaily').innerHTML = html;
}
```

- [ ] **Step 4: Commit**

```bash
git add V2.0.html
git commit -m "feat: implement Daily module with transaction table and keep car cards"
```

---

### Task 7: 模块 3 — 投资小车 (Invest)

**Files:**
- Modify: `D:\Projects\car\V2.0.html` — 添加 `renderInvest()` 及辅助函数

- [ ] **Step 1: 添加贷款卡片渲染**

```js
// ==================== 投资小车 ====================
function renderLoanCards() {
  const loans = carAppData.accounts.invest.loans.filter(l => l.status === 'active');
  if (loans.length === 0) {
    return '<div class="text-center py-4 text-gray-400 text-sm">无进行中的贷款</div>';
  }

  return loans.map(loan => {
    const daysLeft = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysLeft < 0;
    const isSoon = daysLeft >= 0 && daysLeft <= 7;
    return `
      <div class="loan-card ${isOverdue ? 'overdue' : ''} ${isSoon ? 'due-soon' : ''} mb-2">
        <div class="flex justify-between items-center">
          <div>
            <div class="font-semibold text-sm">${esc(loan.name)}</div>
            <div class="text-xs text-gray-500">剩余 ${fmt(loan.remaining)} / 总额 ${fmt(loan.amount)}</div>
            <div class="text-xs ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-400'}">
              ${isOverdue ? '⚠ 已逾期 ' + Math.abs(daysLeft) + ' 天' : '到期: ' + loan.dueDate}
            </div>
          </div>
          <button onclick="openRepayLoanModal('${loan.id}')" class="btn-glass text-xs px-3 py-1.5 bg-yellow-100/80 text-yellow-700">归还</button>
        </div>
      </div>`;
  }).join('');
}
```

- [ ] **Step 2: 添加 `renderInvest()` 主函数**

```js
function renderInvest() {
  const invest = carAppData.accounts.invest;
  const balance = calcBalance(invest);

  const html = `
    <div class="max-w-6xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">📈 投资小车</h2>
        <div class="flex gap-2">
          <button onclick="openTransactionModal('invest')" class="bg-blue-600/90 backdrop-blur text-white px-4 py-2 rounded-xl-apple text-sm hover:bg-blue-700 btn-glass">+ 新增记录</button>
          <button onclick="openNewLoanModal()" class="bg-red-100/80 text-red-700 px-4 py-2 rounded-xl-apple text-sm hover:bg-red-200/80 btn-glass">+ 新增贷款</button>
        </div>
      </div>

      <!-- 账户摘要 -->
      <div class="glass rounded-2xl-apple p-4 flex gap-6 text-sm">
        <div>账户: <span class="font-bold">${esc(invest.name)}</span></div>
        <div>余额: <span class="font-bold ${balance >= 0 ? 'text-negative' : 'text-positive'}">${fmt(balance)}</span></div>
        <div>贷款数: ${invest.loans.filter(l => l.status === 'active').length} 笔</div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- 左上：投资账户明细 -->
        <div class="glass rounded-2xl-apple overflow-hidden">
          <div class="glass-light p-3 border-b border-black/5 font-semibold text-sm">📋 投资明细</div>
          ${renderTransactionTable(invest.transactions, 'invest')}
        </div>

        <!-- 右上：投资车库 -->
        <div class="glass rounded-2xl-apple overflow-hidden">
          <div class="glass-light p-3 border-b border-black/5 font-semibold text-sm">🚗 投资车库</div>
          <div class="p-3">
            ${renderCarCards(carAppData.cars, 'invest')}
          </div>
        </div>

        <!-- 左下：贷款区 (跨两列) -->
        <div class="lg:col-span-2 glass rounded-2xl-apple overflow-hidden">
          <div class="glass-light p-3 border-b border-black/5 font-semibold text-sm">💳 贷款管理</div>
          <div class="p-3">
            ${renderLoanCards()}
          </div>
        </div>
      </div>
    </div>`;
  document.getElementById('moduleInvest').innerHTML = html;
}
```

- [ ] **Step 3: Commit**

```bash
git add V2.0.html
git commit -m "feat: implement Invest module with transaction table, invest cars, and loans"
```

---

### Task 8: 通用弹窗 — 交易编辑、小车售出、小车转换

**Files:**
- Modify: `D:\Projects\car\V2.0.html` — 添加弹窗函数

- [ ] **Step 1: 交易新增/编辑弹窗**

```js
// ==================== 通用弹窗 ====================
function openTransactionModal(accountId, txnId) {
  const account = carAppData.accounts[accountId];
  let txn = null;
  if (txnId) {
    txn = account.transactions.find(t => t.id === txnId);
  }

  const html = `
    <div id="txnModal" class="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50">
      <div class="glass-strong rounded-2xl-apple w-full max-w-md p-6">
        <h3 class="font-bold text-lg mb-4">${txn ? '编辑' : '新增'}交易记录</h3>
        <input type="hidden" id="txnAccountId" value="${accountId}">
        <input type="hidden" id="txnId" value="${txn ? txn.id : ''}">
        <div class="space-y-3">
          <div class="flex gap-2">
            <button onclick="setTxnType('income')" id="btnIncome" class="flex-1 py-2 rounded-xl text-sm font-bold ${txn && txn.type === 'income' ? 'bg-green-100 text-green-700' : 'glass-light text-gray-500'}">收入</button>
            <button onclick="setTxnType('expense')" id="btnExpense" class="flex-1 py-2 rounded-xl text-sm font-bold ${txn && txn.type === 'expense' ? 'bg-red-100 text-red-700' : 'glass-light text-gray-500'}">支出</button>
          </div>
          <input type="hidden" id="txnType" value="${txn ? txn.type : 'expense'}">
          <div>
            <label class="block text-sm text-gray-600 mb-1">类别</label>
            <select id="txnCategory" class="w-full glass-input p-2.5 text-sm">
              <option value="other" ${txn && txn.category === 'other' ? 'selected' : ''}>其他</option>
              <option value="car_buy" ${txn && txn.category === 'car_buy' ? 'selected' : ''}>买车</option>
              <option value="car_sell" ${txn && txn.category === 'car_sell' ? 'selected' : ''}>卖车</option>
              <option value="allowance" ${txn && txn.category === 'allowance' ? 'selected' : ''}>零花钱</option>
              <option value="loan_new" ${txn && txn.category === 'loan_new' ? 'selected' : ''}>新贷款</option>
              <option value="loan_repay" ${txn && txn.category === 'loan_repay' ? 'selected' : ''}>还贷</option>
              <option value="transfer_in" ${txn && txn.category === 'transfer_in' ? 'selected' : ''}>转入</option>
              <option value="transfer_out" ${txn && txn.category === 'transfer_out' ? 'selected' : ''}>转出</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">金额</label>
            <input type="number" id="txnAmount" value="${txn ? txn.amount : ''}" step="0.01" class="w-full glass-input p-2.5 text-sm">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">日期</label>
            <input type="date" id="txnDate" value="${txn ? txn.date : getToday()}" class="w-full glass-input p-2.5 text-sm">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">备注</label>
            <input type="text" id="txnNote" value="${esc(txn ? txn.note : '')}" class="w-full glass-input p-2.5 text-sm">
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-2">
          <button onclick="hideModal()" class="px-4 py-2 glass-light rounded-xl-apple hover:bg-white/60 text-sm btn-glass">取消</button>
          <button onclick="saveTransaction()" class="px-4 py-2 bg-blue-600/90 text-white rounded-xl-apple hover:bg-blue-700 text-sm btn-glass">保存</button>
        </div>
      </div>
    </div>`;
  showModal(html);
}

function setTxnType(type) {
  document.getElementById('txnType').value = type;
  document.getElementById('btnIncome').className = type === 'income'
    ? 'flex-1 py-2 rounded-xl text-sm font-bold bg-green-100 text-green-700'
    : 'flex-1 py-2 rounded-xl text-sm font-bold glass-light text-gray-500';
  document.getElementById('btnExpense').className = type === 'expense'
    ? 'flex-1 py-2 rounded-xl text-sm font-bold bg-red-100 text-red-700'
    : 'flex-1 py-2 rounded-xl text-sm font-bold glass-light text-gray-500';
}

function saveTransaction() {
  const accountId = document.getElementById('txnAccountId').value;
  const txnId = document.getElementById('txnId').value;
  const type = document.getElementById('txnType').value;
  const category = document.getElementById('txnCategory').value;
  const amount = parseFloat(document.getElementById('txnAmount').value) || 0;
  const date = document.getElementById('txnDate').value;
  const note = document.getElementById('txnNote').value.trim();

  if (!amount) return alert('请输入金额');

  const txn = {
    id: txnId || genId('txn'),
    type, category, amount, date,
    carSid: null, loanId: null, transferPairId: null, note
  };

  const account = carAppData.accounts[accountId];
  if (txnId) {
    account.transactions = account.transactions.map(t => t.id === txnId ? txn : t);
  } else {
    account.transactions.push(txn);
  }

  hideModal();
  saveData();
}

function editTransaction(accountId, txnId) {
  openTransactionModal(accountId, txnId);
}

function deleteTransaction(accountId, txnId) {
  if (!confirm('确定删除此交易记录吗？')) return;
  const account = carAppData.accounts[accountId];
  account.transactions = account.transactions.filter(t => t.id !== txnId);
  saveData();
}
```

- [ ] **Step 2: 小车售出弹窗**

```js
function sellCar(sid) {
  const car = carAppData.cars.find(c => c.sid === sid);
  if (!car) return;

  const html = `
    <div id="sellCarModal" class="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50">
      <div class="glass-strong rounded-2xl-apple w-full max-w-sm p-6 border-t-4 border-yellow-400/60">
        <h3 class="font-bold text-lg mb-4">登记卖出</h3>
        <p class="text-sm text-gray-500 mb-3">${esc(car.brand)} ${esc(car.name)} · 买入价 ${fmt(car.buyPrice)}</p>
        <input type="hidden" id="sellCarSid" value="${car.sid}">
        <div class="space-y-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">卖出净价</label>
            <input type="number" id="sellCarPrice" value="${car.expectedValue || car.buyPrice}" step="0.01" class="w-full glass-input p-2.5 text-sm">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">售出日期</label>
            <input type="date" id="sellCarDate" value="${getToday()}" class="w-full glass-input p-2.5 text-sm">
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-2">
          <button onclick="hideModal()" class="px-4 py-2 glass-light rounded-xl-apple hover:bg-white/60 text-sm btn-glass">取消</button>
          <button onclick="confirmSellCar()" class="px-4 py-2 bg-yellow-500/90 text-white rounded-xl-apple hover:bg-yellow-600 text-sm font-bold btn-glass">确认卖出</button>
        </div>
      </div>
    </div>`;
  showModal(html);
}

function confirmSellCar() {
  const sid = document.getElementById('sellCarSid').value;
  const sellPrice = parseFloat(document.getElementById('sellCarPrice').value) || 0;
  const sellDate = document.getElementById('sellCarDate').value;

  const car = carAppData.cars.find(c => c.sid === sid);
  if (!car) return;

  car.isSold = true;
  car.sellPrice = sellPrice;
  car.soldDate = sellDate;

  // 根据 category 在对应账户生成卖车收入
  const account = car.category === 'invest' ? carAppData.accounts.invest : carAppData.accounts.pocket;
  account.transactions.push({
    id: genId('txn'),
    type: 'income',
    category: 'car_sell',
    amount: sellPrice,
    date: sellDate,
    carSid: car.sid,
    loanId: null, transferPairId: null,
    note: '卖出: ' + (car.brand ? car.brand + ' ' : '') + car.name
  });

  hideModal();
  saveData();
}
```

- [ ] **Step 3: 小车投资↔自留转换**

```js
function convertCar(sid) {
  const car = carAppData.cars.find(c => c.sid === sid);
  if (!car) return;

  const oldCategory = car.category;
  const newCategory = oldCategory === 'invest' ? 'keep' : 'invest';

  if (!confirm(`确定将 "${car.name}" 从${oldCategory === 'invest' ? '投资' : '自留'}转为${newCategory === 'invest' ? '投资' : '自留'}？\n将按买入价 ${fmt(car.buyPrice)} 生成转账记录。`)) return;

  car.category = newCategory;

  // 生成账户间转账
  const fromAccount = oldCategory === 'invest' ? 'invest' : 'pocket';
  const toAccount = newCategory === 'invest' ? 'invest' : 'pocket';

  const transferPairId = genId('tp');
  const date = getToday();

  // 转出
  carAppData.accounts[fromAccount].transactions.push({
    id: genId('txn'),
    type: 'expense',
    category: 'transfer_out',
    amount: car.buyPrice,
    date: date,
    carSid: car.sid,
    loanId: null,
    transferPairId: transferPairId,
    note: '转出: ' + car.name
  });

  // 转入
  carAppData.accounts[toAccount].transactions.push({
    id: genId('txn'),
    type: 'income',
    category: 'transfer_in',
    amount: car.buyPrice,
    date: date,
    carSid: car.sid,
    loanId: null,
    transferPairId: transferPairId,
    note: '转入: ' + car.name
  });

  // TransferPair 记录
  carAppData.transferPairs.push({
    id: transferPairId,
    fromAccount: fromAccount,
    toAccount: toAccount,
    amount: car.buyPrice,
    date: date,
    note: '转换: ' + car.name + ' (' + oldCategory + '→' + newCategory + ')'
  });

  saveData();
}
```

- [ ] **Step 4: Commit**

```bash
git add V2.0.html
git commit -m "feat: add transaction editor, car sell, and car convert modals"
```

---

### Task 9: 模块 4 — 小车库存 (Inventory)

**Files:**
- Modify: `D:\Projects\car\V2.0.html` — 添加 `renderInventory()` 及分组逻辑

- [ ] **Step 1: 添加 `renderInventory()` 及分组聚合逻辑**

```js
// ==================== 小车库存 ====================
let invSortMode = 'brand'; // 'brand' | 'month'
let invSearchText = '';

function renderInventory() {
  const unsoldCars = carAppData.cars.filter(c => !c.isSold);

  // 搜索过滤
  let filtered = unsoldCars;
  if (invSearchText) {
    const q = invSearchText.toLowerCase();
    filtered = unsoldCars.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.brand.toLowerCase().includes(q) ||
      c.sid.toLowerCase().includes(q)
    );
  }

  // 分组
  let groups;
  if (invSortMode === 'brand') {
    groups = groupBy(filtered, c => (c.brand || '未知品牌') + '|' + c.name);
  } else {
    groups = groupBy(filtered, c => c.buyDate.slice(0, 7)); // YYYY-MM
  }

  const investCount = unsoldCars.filter(c => c.category === 'invest').length;
  const keepCount = unsoldCars.filter(c => c.category === 'keep').length;

  const html = `
    <div class="max-w-6xl mx-auto space-y-4">
      <h2 class="text-xl font-bold">🏪 小车库存</h2>

      <!-- 工具栏 -->
      <div class="glass rounded-2xl-apple p-3 flex flex-wrap gap-3 items-center">
        <div class="flex gap-1">
          <button onclick="setInvSort('brand')" class="px-3 py-1.5 rounded-lg text-xs font-medium ${invSortMode === 'brand' ? 'bg-blue-100 text-blue-700' : 'glass-light'} btn-glass">按品牌</button>
          <button onclick="setInvSort('month')" class="px-3 py-1.5 rounded-lg text-xs font-medium ${invSortMode === 'month' ? 'bg-blue-100 text-blue-700' : 'glass-light'} btn-glass">按月</button>
        </div>
        <input type="text" id="invSearch" placeholder="搜索品牌/名称/SID..." value="${esc(invSearchText)}"
               oninput="onInvSearch()" class="flex-1 glass-input p-2 text-sm max-w-xs">
        <div class="text-xs text-gray-500 ml-auto">
          总投资 ${investCount} + 自留 ${keepCount} = 共 ${unsoldCars.length} 辆
        </div>
      </div>

      <!-- 分组视图 -->
      <div class="space-y-4">
        ${Object.entries(groups).map(([key, cars]) => {
          const label = invSortMode === 'brand'
            ? (cars[0].brand || '未知品牌') + ' ' + cars[0].name
            : key;
          const avgPrice = cars.reduce((s, c) => s + c.buyPrice, 0) / cars.length;
          const expanded = false; // 默认折叠
          const groupId = 'group_' + key.replace(/[^a-zA-Z0-9一-鿿]/g, '_');

          return `
            <div class="glass rounded-2xl-apple overflow-hidden">
              <div class="glass-light p-4 flex justify-between items-center accordion-toggle" onclick="toggleAccordion('${groupId}')">
                <div>
                  <span class="font-bold">${esc(label)}</span>
                  <span class="text-sm text-gray-500 ml-2">${cars.length} 辆 · 均价 ${fmt(avgPrice)}</span>
                  <span class="text-xs ml-2 ${cars[0].category === 'invest' ? 'text-invest' : 'text-keep'}">
                    ${cars[0].category === 'invest' ? '投资' : '自留'}
                  </span>
                </div>
                <span class="text-gray-400 text-sm" id="${groupId}_icon">▶</span>
              </div>
              <div id="${groupId}_body" class="accordion-body collapsed">
                <div class="p-3 space-y-2 border-t border-black/5">
                  ${cars.map(c => `
                    <div class="flex justify-between items-center p-2 glass-light rounded-xl">
                      <div class="text-xs">
                        <span class="font-mono text-gray-400 mr-2">${c.sid.slice(0, 8)}</span>
                        <span>${c.buyDate}</span>
                        <span class="ml-2 font-semibold">${fmt(c.buyPrice)}</span>
                        <span class="text-gray-400 ml-1">预期 ${fmt(c.expectedValue || c.buyPrice)}</span>
                      </div>
                      <div class="flex gap-1">
                        <button onclick="sellCar('${c.sid}')" class="btn-sell text-xs">售出</button>
                        <button onclick="convertCar('${c.sid}')" class="btn-convert ${c.category === 'invest' ? 'btn-to-keep' : 'btn-to-invest'} text-xs">
                          → ${c.category === 'invest' ? '自留' : '投资'}
                        </button>
                      </div>
                    </div>`).join('')}
                </div>
              </div>
            </div>`;
        }).join('')}
        ${Object.keys(groups).length === 0 ? '<div class="text-center py-10 text-gray-400">无匹配的小车</div>' : ''}
      </div>
    </div>`;
  document.getElementById('moduleInventory').innerHTML = html;
}

function groupBy(arr, fn) {
  const map = {};
  arr.forEach(item => {
    const key = typeof fn === 'function' ? fn(item) : item[fn];
    if (!map[key]) map[key] = [];
    map[key].push(item);
  });
  return map;
}

function toggleAccordion(groupId) {
  const body = document.getElementById(groupId + '_body');
  const icon = document.getElementById(groupId + '_icon');
  if (!body || !icon) return;
  const isCollapsed = body.classList.contains('collapsed');
  body.classList.toggle('collapsed', !isCollapsed);
  body.classList.toggle('expanded', isCollapsed);
  icon.textContent = isCollapsed ? '▼' : '▶';
}

function setInvSort(mode) {
  invSortMode = mode;
  renderCurrentModule();
}

function onInvSearch() {
  invSearchText = document.getElementById('invSearch') ? document.getElementById('invSearch').value.trim().toLowerCase() : '';
  renderCurrentModule();
}
```

- [ ] **Step 2: Commit**

```bash
git add V2.0.html
git commit -m "feat: implement Inventory module with grouped car list, search, and sort"
```

---

### Task 10: 默认数据填充与页面初始化

**Files:**
- Modify: `D:\Projects\car\V2.0.html` — 更新 `window.onload` 入口

- [ ] **Step 1: 更新初始化逻辑**

```js
// ==================== 初始化 ====================
window.onload = () => {
  loadData();

  // 如果无数据，注入默认示例数据
  if (carAppData.cars.length === 0 &&
      carAppData.accounts.pocket.transactions.length === 0 &&
      carAppData.accounts.invest.transactions.length === 0) {
    seedDemoData();
  }

  renderCurrentModule();
};
```

- [ ] **Step 2: 添加示例数据种子函数**

```js
function seedDemoData() {
  const pocket = carAppData.accounts.pocket;
  const invest = carAppData.accounts.invest;

  // 示例零花钱交易
  pocket.transactions.push(
    { id: genId('txn'), type: 'income', category: 'allowance', amount: 200, date: '2026-06-01', carSid: null, loanId: null, transferPairId: null, note: '6月零花钱' },
    { id: genId('txn'), type: 'expense', category: 'other', amount: 35, date: '2026-06-05', carSid: null, loanId: null, transferPairId: null, note: '午餐外卖' },
    { id: genId('txn'), type: 'expense', category: 'other', amount: 18.5, date: '2026-06-10', carSid: null, loanId: null, transferPairId: null, note: '奶茶' },
  );

  // 示例投资账户交易
  invest.transactions.push(
    { id: genId('txn'), type: 'expense', category: 'car_buy', amount: 19.9, date: '2026-06-08', carSid: null, loanId: null, transferPairId: null, note: '示例: 普卡F1' },
  );

  // 示例小车
  const demoCar1 = {
    sid: genUUID(),
    brand: 'Hotwheels', name: '普卡F1迈凯伦',
    buyDate: '2026-06-08', buyPrice: 19.9, expectedValue: 39,
    category: 'invest', sellPrice: null, soldDate: null, isSold: false, note: ''
  };
  // 关联交易
  invest.transactions[invest.transactions.length - 1].carSid = demoCar1.sid;

  const demoCar2 = {
    sid: genUUID(),
    brand: 'MINI GT', name: '保时捷911GT3',
    buyDate: '2026-06-15', buyPrice: 69, expectedValue: 120,
    category: 'keep', sellPrice: null, soldDate: null, isSold: false, note: ''
  };
  pocket.transactions.push({
    id: genId('txn'),
    type: 'expense', category: 'car_buy', amount: 69, date: '2026-06-15',
    carSid: demoCar2.sid, loanId: null, transferPairId: null, note: 'MINI GT 保时捷911GT3'
  });

  carAppData.cars.push(demoCar1, demoCar2);

  saveData();
}
```

- [ ] **Step 3: Commit**

```bash
git add V2.0.html
git commit -m "feat: add demo data seeding and init flow"
```

---

### Task 11: 更新 package.json 并端到端验证

**Files:**
- Modify: `D:\Projects\car\package.json`

- [ ] **Step 1: 更新 dev 脚本指向 V2.0.html**

将 `package.json` 的 dev 脚本从 `V1.1.html` 改为 `V2.0.html`：

```json
{
  "name": "car-accounting",
  "version": "2.0.0",
  "private": true,
  "description": "记账管理系统 - v2.0 双账户+小车库存",
  "scripts": {
    "dev": "browser-sync start --server . --index V2.0.html --files \"*.html,*.json,*.css,*.js\" --no-notify --no-ghost-mode --port 3000",
    "dev:reload": "browser-sync start --server . --index V2.0.html --files \"*.html,*.json\" --no-notify --port 3000",
    "dev:v1": "browser-sync start --server . --index V1.1.html --files \"*.html,*.json\" --no-notify --port 3000"
  },
  "devDependencies": {
    "browser-sync": "^3.0.3"
  }
}
```

- [ ] **Step 2: 启动开发服务器验证**

```bash
npm run dev
```

打开 `http://localhost:3000`，逐模块验证：

| 模块 | 验证点 |
|------|--------|
| Dashboard | 4 张卡片有数据、贷款区显示、柱状图渲染、3 个操作按钮可点击 |
| 日常消费 | 收支明细表可查看、自留车库卡片列表、新增记录弹窗可打开 |
| 投资小车 | 投资明细表、投资车库、贷款管理三区正常 |
| 小车库存 | 分组视图、排列切换、搜索过滤、折叠/展开 |
| 全局 | 导出 JSON 正确、导入 JSON 恢复、刷新页面数据不丢失 |

- [ ] **Step 3: 修复验证中发现的问题并提交**

```bash
git add V2.0.html package.json
git commit -m "fix: address issues found during end-to-end validation"
```

---

## 实施顺序依赖

```
Task 1 (HTML/CSS 骨架)
  └→ Task 2 (数据层)
       └→ Task 3 (路由框架)
            ├→ Task 4 (Dashboard 渲染)
            │    └→ Task 5 (Dashboard 操作)
            ├→ Task 6 (日常消费)
            ├→ Task 7 (投资小车)
            ├→ Task 8 (通用弹窗 — 被 6/7/9 依赖)
            └→ Task 9 (小车库存)
                 └→ Task 10 (初始化 + 种子数据)
                      └→ Task 11 (验证 + package.json)
```

Task 1-3 必须串行，Task 4-9 可在 Task 3 后**并行**开发（它们修改同一文件 `<script>` 的不同区块），但为确保无冲突，建议 Task 4→9 顺序执行。

---

## 自查清单

| 检查项 | 状态 |
|--------|------|
| Spec 覆盖 — 数据模型（5 实体） | ✅ Task 2 |
| Spec 覆盖 — Dashboard 4 卡片 + 贷款 + 柱状图 | ✅ Task 4 |
| Spec 覆盖 — Dashboard 3 操作按钮 | ✅ Task 5 |
| Spec 覆盖 — 日常消费（表 + 车库） | ✅ Task 6 |
| Spec 覆盖 — 投资小车（表 + 贷款 + 车库） | ✅ Task 7 |
| Spec 覆盖 — 交易编辑弹窗 | ✅ Task 8 |
| Spec 覆盖 — 小车售出 + 转换 | ✅ Task 8 |
| Spec 覆盖 — 库存分组/折叠/搜索 | ✅ Task 9 |
| Spec 覆盖 — V1→V2 迁移 | ✅ Task 2 |
| Spec 覆盖 — JSON 导入导出 | ✅ Task 2 |
| Spec 覆盖 — localStorage 持久化 | ✅ Task 2 |
| 无占位符 | ✅ 所有步骤均有实际代码 |
| 类型一致性 | ✅ 数据字段名与 spec 一致 |
| 包更新 | ✅ Task 11 |
