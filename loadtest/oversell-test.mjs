/**
 * 超卖治理对比压测：N 个并发同时抢同一件商品的库存，统计成功订单数、超卖件数与响应时间。
 *
 * 前置准备（压测前把库存重置为固定值，例如 10）：
 *   UPDATE products SET stock = 10, sales_count = 0 WHERE id = <商品ID>;
 *
 * 用法（服务端扣减策略由环境变量 STOCK_STRATEGY 控制，改完需重启后端）：
 *   node loadtest/oversell-test.mjs --token=<登录token> --store=1 --product=12 --concurrency=100 --group=悲观锁
 *
 * 参数（也可用同名环境变量）：
 *   --token       必填，登录 token（POST /api/auth/login 返回的 data.token）
 *   --store       必填，店铺 ID
 *   --product     必填，商品 ID
 *   --base        服务地址，默认 http://localhost:49996
 *   --concurrency 并发请求数，默认 100
 *   --quantity    每单购买件数，默认 1
 *   --group       本次实验分组名，仅用于打印
 */

import { randomUUID } from 'node:crypto';

const args = parseArgs(process.argv.slice(2));
const BASE_URL = (args.base || process.env.BASE_URL || 'http://localhost:49996').replace(/\/+$/, '');
const TOKEN = args.token || process.env.TOKEN || '';
const STORE_ID = Number(args.store || process.env.STORE_ID || 0);
const PRODUCT_ID = Number(args.product || process.env.PRODUCT_ID || 0);
const CONCURRENCY = Number(args.concurrency || process.env.CONCURRENCY || 100);
const QUANTITY = Number(args.quantity || process.env.QUANTITY || 1);
const GROUP = args.group || process.env.GROUP || '未命名分组';

if (!TOKEN || !STORE_ID || !PRODUCT_ID) {
  console.error('缺少参数：需要 --token / --store / --product（或环境变量 TOKEN / STORE_ID / PRODUCT_ID）');
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {};
  for (const item of argv) {
    const match = /^--([^=]+)(?:=(.*))?$/.exec(item);
    if (match) {
      parsed[match[1]] = match[2] === undefined ? 'true' : match[2];
    }
  }
  return parsed;
}

async function fetchStock() {
  const response = await fetch(`${BASE_URL}/api/products/${PRODUCT_ID}`);
  const body = await response.json();
  if (!body.ok) {
    throw new Error(body.message || `商品查询失败（HTTP ${response.status}）`);
  }
  return Number(body.data.stock);
}

async function placeOrder() {
  const startedAt = performance.now();
  try {
    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        storeId: STORE_ID,
        receiverName: '压测收货人',
        receiverPhone: '13800000000',
        receiverAddress: '压测地址',
        source: 'market',
        clientToken: randomUUID(),
        items: [{ productId: PRODUCT_ID, quantity: QUANTITY }],
      }),
      signal: AbortSignal.timeout(20000),
    });
    const body = await response.json().catch(() => ({}));
    return {
      milliseconds: performance.now() - startedAt,
      ok: response.ok && body.ok === true,
      duplicated: body.data?.duplicated === true,
      message: body.message || (response.ok ? '' : `HTTP ${response.status}`),
    };
  } catch (error) {
    return {
      milliseconds: performance.now() - startedAt,
      ok: false,
      duplicated: false,
      message: error.name === 'TimeoutError' ? '请求超时' : error.message,
    };
  }
}

function percentile(sortedDurations, ratio) {
  if (sortedDurations.length === 0) {
    return 0;
  }
  const index = Math.min(sortedDurations.length - 1, Math.ceil(sortedDurations.length * ratio) - 1);
  return sortedDurations[index];
}

async function main() {
  console.log(`\n=== 超卖治理压测｜分组：${GROUP} ===`);
  console.log(`服务地址 : ${BASE_URL}`);
  console.log(`商品     : #${PRODUCT_ID}   并发数：${CONCURRENCY}   每单件数：${QUANTITY}`);

  const initialStock = await fetchStock();
  console.log(`初始库存 : ${initialStock}`);

  if (initialStock <= 0) {
    console.error('\n初始库存为 0，请先重置库存后再压测：');
    console.error(`  UPDATE products SET stock = 10, sales_count = 0 WHERE id = ${PRODUCT_ID};`);
    process.exit(1);
  }

  const startedAt = performance.now();
  const results = await Promise.all(Array.from({ length: CONCURRENCY }, () => placeOrder()));
  const wallMillis = performance.now() - startedAt;

  const finalStock = await fetchStock();
  const succeeded = results.filter((item) => item.ok && !item.duplicated);
  const duplicated = results.filter((item) => item.duplicated);
  const failed = results.filter((item) => !item.ok);

  const soldQuantity = succeeded.length * QUANTITY;
  const oversell = Math.max(0, soldQuantity - initialStock);
  const durations = results.map((item) => item.milliseconds).sort((a, b) => a - b);

  const reasons = new Map();
  for (const item of failed) {
    reasons.set(item.message, (reasons.get(item.message) || 0) + 1);
  }

  console.log('');
  console.log(`下单成功 : ${succeeded.length}`);
  console.log(`下单失败 : ${failed.length}`);
  for (const [reason, count] of [...reasons.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  · ${reason}：${count}`);
  }
  if (duplicated.length > 0) {
    console.log(`重复提交 : ${duplicated.length}（幂等命中，未产生新订单）`);
  }

  console.log('');
  console.log(`售出件数 : ${soldQuantity}`);
  console.log(`结束库存 : ${finalStock}`);
  console.log(`超卖件数 : ${oversell}${oversell === 0 ? '  ✅' : '  ❌'}`);
  console.log('');
  console.log(`QPS      : ${(CONCURRENCY / (wallMillis / 1000)).toFixed(1)}`);
  console.log(
    `耗时(ms) : P50 ${percentile(durations, 0.5).toFixed(0)} | P95 ${percentile(durations, 0.95).toFixed(0)}`
      + ` | P99 ${percentile(durations, 0.99).toFixed(0)} | 最大 ${durations[durations.length - 1].toFixed(0)}`,
  );
  console.log('');
  console.log(
    `对比表数据行 → ${GROUP} | QPS ${(CONCURRENCY / (wallMillis / 1000)).toFixed(1)}`
      + ` | 成功 ${succeeded.length} | 失败 ${failed.length} | 超卖 ${oversell}`
      + ` | P99 ${percentile(durations, 0.99).toFixed(0)}ms`,
  );
}

main().catch((error) => {
  console.error('\n压测中断：' + error.message);
  process.exit(1);
});
