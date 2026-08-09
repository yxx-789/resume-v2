#!/usr/bin/env node
// scripts/verify.mjs — 无头 Chrome CDP 验证运行器
// 用法: node scripts/verify.mjs <check-file.js> [--reduced-motion]
// check-file.js 在浏览器上下文运行，逐条调用 globalThis.__result(pass, msg)。
// 全部通过退出 0，否则 1。
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const URL = 'file:///Users/yxx/resume-v2/index.html';
const checkFile = process.argv[2];
const reducedMotion = process.argv.includes('--reduced-motion');
if (!checkFile) { console.error('usage: node scripts/verify.mjs <check.js> [--reduced-motion]'); process.exit(2); }
const checkCode = readFileSync(checkFile, 'utf8');

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--disable-gpu',
  '--no-first-run', '--no-default-browser-check', '--window-size=1280,900',
  ...(reducedMotion ? ['--force-prefers-reduced-motion'] : []),
  URL,
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let page;
for (let i = 0; i < 20; i++) {           // 等待 Chrome 就绪
  try {
    const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    page = targets.find((t) => t.type === 'page');
    if (page) break;
  } catch (_) {}
  await sleep(250);
}
if (!page) { console.error('FAIL  chrome did not become ready'); chrome.kill(); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const d = JSON.parse(e.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
};
await new Promise((r) => (ws.onopen = r));
function send(method, params = {}) {
  return new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

// 等待页面加载完成，避免在解析中途 evaluate（readyState 'loading' 时 DOM/内联脚本未就绪）
for (let i = 0; i < 40; i++) {
  const rs = await send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
  if (rs.result && rs.result.result && rs.result.result.value === 'complete') break;
  await sleep(100);
}

await send('Runtime.evaluate', { expression:
  `globalThis.__results = [];
   globalThis.__result = (pass, msg) => globalThis.__results.push({ pass: pass, msg: msg });`
});
try {
  await send('Runtime.evaluate', { expression: `(async () => { ${checkCode} })()`, awaitPromise: true, returnByValue: true });
} catch (err) {
  console.error('FAIL  check script threw:', err.message);
}
await sleep(200);
const out = await send('Runtime.evaluate', { expression: 'JSON.stringify(globalThis.__results)', returnByValue: true });
const results = JSON.parse(out.result.result.value) || [];
let failed = 0;
for (const r of results) { console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.msg}`); if (!r.pass) failed++; }
console.log(`\n${results.length} checks, ${failed} failed`);
ws.close(); chrome.kill();
process.exit(failed ? 1 : 0);
