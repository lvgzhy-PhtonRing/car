/**
 * Payton基金收支明细 → car记账系统 导入脚本
 *
 * 用法:
 *   node import-payton.js
 *
 * 输出:
 *   payton-import.json — 可直接在 car 系统页面通过「导入JSON」按钮导入
 */

const fs = require('fs');
const path = require('path');

// ========================
// 配置
// ========================
const SOURCE_FILE = 'D:\\Projects\\ysp-app\\备份\\20260627.json';
const OUTPUT_FILE = path.join(__dirname, 'payton-import.json');
const GROUP_NAME = 'Payton基金';

// ========================
// 品牌映射
// ========================

/**
 * 从 payton.inventory + items[] 构建 name → brand 映射表
 * 同名多条时取出现次数最多的 brand
 */
function buildBrandMap(paytonInventory, items) {
  const allItems = [];

  if (Array.isArray(paytonInventory)) {
    for (const item of paytonInventory) {
      if (item.name) allItems.push({ name: item.name.trim(), brand: item.brand || '' });
    }
  }
  if (Array.isArray(items)) {
    for (const item of items) {
      if (item.name) allItems.push({ name: item.name.trim(), brand: item.brand || '' });
    }
  }

  const groups = new Map(); // name → { brand → count }
  for (const { name, brand } of allItems) {
    if (!name || !brand) continue;
    if (!groups.has(name)) groups.set(name, new Map());
    const brandCounts = groups.get(name);
    brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
  }

  // 取每个 name 下出现最多的 brand
  const map = new Map();
  for (const [name, brandCounts] of groups) {
    let bestBrand = '';
    let bestCount = 0;
    for (const [brand, count] of brandCounts) {
      if (count > bestCount) { bestBrand = brand; bestCount = count; }
    }
    map.set(name, bestBrand);
  }
  return map;
}

/**
 * 清理描述文本，提取可用于匹配的车名
 * "[买小车] 花园大道红奔驰AMG瓦罐"     → "花园大道红奔驰AMG瓦罐"
 * "[卖小车] 卖花园大道白奔驰AMG瓦罐 x1" → "花园大道白奔驰AMG瓦罐"
 * "[零花钱] 1月零花钱"                  → "1月零花钱"
 */
function cleanDescription(rawDesc) {
  let desc = rawDesc.trim();
  // 去掉 "卖" / "卖出" 前缀 (卖车记录) 和末尾 " xN" 数量后缀
  desc = desc.replace(/^卖出?\s*/, '').replace(/\s*x\d+\s*$/i, '').trim();
  return desc;
}

// ========================
// 映射逻辑
// ========================
function transformRecord(record, index, brandMap) {
  const isIncome = record.type === 'income';
  const direction = isIncome ? '[收入]' : '[支出]';

  // 解析 note: "[分类] 描述"
  const noteMatch = record.note.match(/^\[(.+?)\]\s*(.*)/);
  const category = noteMatch ? noteMatch[1] : '';
  const rawDesc = noteMatch ? noteMatch[2] : record.note;

  // 清理描述并查找品牌
  const cleanDesc = cleanDescription(rawDesc);
  const brand = brandMap.get(cleanDesc) || '';

  const name = `${direction}[${category}] ${rawDesc}`;

  return {
    id: 'b_payton_' + String(index).padStart(4, '0'),
    name: name,
    brand: brand,
    date: record.date,
    type: '转账',
    amount: Math.abs(record.amount),
    isSold: false,
  };
}

// ========================
// 主流程
// ========================
function main() {
  console.log('📖 读取源文件...');
  const raw = fs.readFileSync(SOURCE_FILE, 'utf-8');
  const data = JSON.parse(raw);

  if (!data.payton || !data.payton.records) {
    console.error('❌ 未找到 payton.records 数据');
    process.exit(1);
  }

  // 构建品牌映射
  const brandMap = buildBrandMap(data.payton.inventory, data.items);
  console.log(`🏷️  品牌映射库: ${brandMap.size} 个车型 (payton.inventory + items)`);

  const records = data.payton.records;
  console.log(`📋 找到 ${records.length} 条 payton 基金记录`);

  // 转换为 bills
  const bills = records.map((record, i) => transformRecord(record, i, brandMap));

  // 统计
  const incomeCount = records.filter(r => r.type === 'income').length;
  const expenseCount = records.filter(r => r.type === 'expense').length;
  const totalIncome = records.filter(r => r.type === 'income').reduce((s, r) => s + Math.abs(r.amount), 0);
  const totalExpense = records.filter(r => r.type === 'expense').reduce((s, r) => s + Math.abs(r.amount), 0);
  const withBrand = bills.filter(b => b.brand).length;
  const withoutBrand = bills.filter(b => !b.brand).length;

  console.log(`   💰 收入: ${incomeCount} 条, 合计 ¥${totalIncome.toFixed(2)}`);
  console.log(`   💸 支出: ${expenseCount} 条, 合计 ¥${totalExpense.toFixed(2)}`);
  console.log(`   📊 净额: ¥${(totalIncome - totalExpense).toFixed(2)}`);
  console.log(`   🏷️  品牌已匹配: ${withBrand} 条, 未匹配: ${withoutBrand} 条`);

  // 未匹配的记录
  if (withoutBrand > 0) {
    console.log(`\n⚠️  未匹配品牌的记录:`);
    bills.filter(b => !b.brand).forEach(b => {
      console.log(`   - ${b.name}  |  ¥${b.amount.toFixed(2)}`);
    });
  }

  // 取最早日期作为账单组创建日期
  const dates = records.map(r => r.date).filter(Boolean).sort();
  const createDate = dates[0] || new Date().toISOString().split('T')[0];

  // 构建 appData 格式
  const appData = [{
    id: 'g_payton_fund',
    name: GROUP_NAME,
    quota: 0,
    createDate: createDate,
    bills: bills,
  }];

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(appData, null, 2), 'utf-8');
  console.log(`\n✅ 已生成: ${OUTPUT_FILE}`);
  console.log(`📦 账单组: "${GROUP_NAME}" (${bills.length} 条账单)`);
  console.log(`\n🔜 下一步: 在 http://localhost:3002 页面中点击「导入JSON」选择此文件即可`);
}

main();
