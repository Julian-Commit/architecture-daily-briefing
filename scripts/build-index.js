#!/usr/bin/env node
/**
 * build-index.js — 扫描 news/ 下的中英双版日报，生成站点首页与往期目录。
 *
 * 用法:
 *   node scripts/build-index.js
 *
 * 产出（会覆盖，不要手改这两个文件）:
 *   index.html        站点首页：最新一期（中/EN）+ 最近往期
 *   news/index.html   往期目录，最新在最前
 *
 * 只认 news/YYYY-MM-DD-cn.html 与 news/YYYY-MM-DD-en.html 这两种命名。
 * 早期未拆分语言的 news/YYYY-MM-DD.html 会被忽略（同日已有 cn/en 版）。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NEWS_DIR = path.join(ROOT, 'news');
const WEEKDAYS_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEKDAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const stripTags = s => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function headlines(html, limit = 3) {
  return [...new Set(
    [...html.matchAll(/class="[^"]*\bhl-title\b[^"]*"[^>]*>([\s\S]*?)<\//g)]
      .map(m => stripTags(m[1]))
      .filter(Boolean)
  )].slice(0, limit);
}

function collect() {
  if (!fs.existsSync(NEWS_DIR)) return [];
  const byDate = new Map();

  for (const file of fs.readdirSync(NEWS_DIR)) {
    const m = file.match(/^(\d{4}-\d{2}-\d{2})-(cn|en)\.html$/);
    if (!m) continue;
    const [, date, lang] = m;
    const html = fs.readFileSync(path.join(NEWS_DIR, file), 'utf8');
    const entry = byDate.get(date) || { date, cn: null, en: null, issue: null, titlesCn: [], titlesEn: [] };
    entry[lang] = file;
    // 只从页眉的 .no 元素里取，避免撞上 CSS 里的 #2d2d2d 之类
    // 历史上出现过两种写法：早期 "#001"，后来 "No. 005"，都认
    const issue = (html.match(/class="no"[^>]*>\s*(?:No\.\s*|#)?(\d+)/i) || [])[1];
    if (issue && !entry.issue) entry.issue = 'No. ' + String(issue).padStart(3, '0');
    if (lang === 'cn') entry.titlesCn = headlines(html);
    else entry.titlesEn = headlines(html);
    byDate.set(date, entry);
  }

  return [...byDate.values()]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(e => {
      const d = new Date(e.date + 'T00:00:00Z');
      return {
        ...e,
        issue: e.issue || '—',
        weekdayCn: WEEKDAYS_CN[d.getUTCDay()],
        weekdayEn: WEEKDAYS_EN[d.getUTCDay()],
        dateCn: e.date.replace(/-/g, '.'),
      };
    });
}

const CSS = `
:root{
  --bg:#e8e4df; --paper:#fff; --ink:#2d2d2d; --ink-solid:#2d2d2d;
  --muted:#999; --soft:#555; --line:#ece8e2; --line-strong:#d5d0c8; --accent:#c41230;
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#17161a; --paper:#1f1e23; --ink:#e4e1dc; --ink-solid:#3a3941;
    --muted:#8b8791; --soft:#b3afa9; --line:#2e2c34; --line-strong:#3c3944; --accent:#e8574f;
  }
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","Helvetica Neue",Helvetica,Arial,sans-serif;color:var(--ink);line-height:1.8;-webkit-font-smoothing:antialiased}
.wrap{max-width:600px;margin:0 auto;background:var(--paper);min-height:100vh}
@media(min-width:768px){.wrap{max-width:760px}}
@media(min-width:1024px){.wrap{max-width:960px}}
.hd{background:var(--paper);padding:24px;display:flex;align-items:baseline;justify-content:space-between;border-bottom:4px solid var(--ink);flex-wrap:wrap;gap:8px}
.hd-accent{display:inline-block;width:10px;height:10px;background:var(--accent);margin-right:10px;vertical-align:middle}
.hd-brand{font-size:20px;font-weight:900;letter-spacing:2px}
.hd-sub{font-size:10px;opacity:.35;letter-spacing:3px;margin-left:10px;font-weight:700;text-transform:uppercase}
.hd-meta{text-align:right;font-size:11px;opacity:.5;line-height:1.6}
.hd-meta .no{font-size:13px;color:var(--accent);font-weight:800;opacity:1}
@media(min-width:768px){.hd{padding:28px 40px 24px}.hd-brand{font-size:24px}}
.strip{background:var(--ink-solid);color:#fff;font-size:11px;letter-spacing:3px;padding:9px 24px;text-transform:uppercase;font-weight:700}
.body{padding:28px 24px 44px}
@media(min-width:768px){.body{padding:32px 40px 52px}}
.label{font-size:10px;font-weight:800;letter-spacing:3px;color:var(--muted);text-transform:uppercase;margin-bottom:12px}
.latest{border:1px solid var(--line-strong);border-top:4px solid var(--accent);padding:22px;margin-bottom:38px}
.latest .no{font-size:12px;font-weight:800;color:var(--accent);letter-spacing:1px}
.latest .dt{font-size:22px;font-weight:900;letter-spacing:1px;margin:2px 0 14px}
.latest ul{list-style:none;margin:0 0 18px}
.latest li{font-size:14px;color:var(--soft);padding-left:16px;position:relative;margin-bottom:6px;line-height:1.7}
.latest li::before{content:"";position:absolute;left:0;top:10px;width:6px;height:6px;background:var(--accent)}
.btns{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-block;font-size:12px;font-weight:800;letter-spacing:1px;padding:9px 20px;text-decoration:none;border:1px solid var(--ink);color:var(--ink);background:var(--paper);transition:all .15s}
.btn:hover{background:var(--ink);color:var(--paper)}
.btn.primary{background:var(--ink);color:var(--paper)}
.btn.primary:hover{background:var(--accent);border-color:var(--accent)}
.row{display:flex;gap:14px;align-items:baseline;padding:13px 0;border-bottom:1px solid var(--line);flex-wrap:wrap}
.row .r-no{font-size:12px;font-weight:800;color:var(--accent);width:60px;flex-shrink:0}
.row .r-dt{font-size:12px;color:var(--muted);width:108px;flex-shrink:0}
.row .r-t{font-size:13.5px;color:var(--soft);flex:1;min-width:180px;line-height:1.7}
.row .r-l{font-size:11px;font-weight:800;flex-shrink:0}
.row .r-l a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--line-strong);margin-left:8px}
.row .r-l a:hover{color:var(--accent);border-color:var(--accent)}
.empty{font-size:13px;color:var(--muted);padding:18px 0}
.ftr{background:#2d2d2d;color:#fff;text-align:center;font-size:11px;padding:22px;line-height:2}
.ftr .brand{font-weight:800;letter-spacing:2px;font-size:12px}
.ftr .dim{opacity:.35}
.back{font-size:11px;font-weight:800;color:var(--accent);text-decoration:none;letter-spacing:1px}
a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`.trim();

function page({ title, metaRight, strip, body }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="中英双语建筑行业日报 · 项目与设计 / 城市与规划 / 材料与建造 / 学术与展览。">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="中英双语建筑行业日报 · 项目与设计 / 城市与规划 / 材料与建造 / 学术与展览。">
<meta name="theme-color" content="#e8e4df" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#17161a" media="(prefers-color-scheme: dark)">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23fff'/%3E%3Crect x='6' y='6' width='20' height='20' fill='none' stroke='%232d2d2d' stroke-width='2.5'/%3E%3Crect x='6' y='6' width='9' height='9' fill='%23c41230'/%3E%3C/svg%3E">
<style>
${CSS}
</style>
</head>
<body>
<div class="wrap">
<header class="hd">
  <div>
    <span class="hd-accent"></span>
    <span class="hd-brand">陆先生建筑日报</span>
    <span class="hd-sub">Architecture Daily</span>
  </div>
  <div class="hd-meta">${metaRight}</div>
</header>
<div class="strip">${strip}</div>
<div class="body">
${body}
</div>
<footer class="ftr">
  <div class="brand">陆先生建筑日报 · ARCHITECTURE DAILY</div>
  交叉核验 · 案例深度 · 视觉优先<br>
  <span class="dim">自动生成 · 内容仅供参考 / Auto-generated · For reference only</span>
</footer>
</div>
</body>
</html>
`;
}

function issueRow(i, prefix) {
  const links = [
    i.cn ? `<a href="${prefix}${i.cn}">中文</a>` : '',
    i.en ? `<a href="${prefix}${i.en}">EN</a>` : '',
  ].join('');
  return `<div class="row"><span class="r-no">${esc(i.issue)}</span><span class="r-dt">${i.dateCn} ${i.weekdayCn}</span><span class="r-t">${esc(i.titlesCn[0] || i.titlesEn[0] || '')}</span><span class="r-l">${links}</span></div>`;
}

function buildHome(issues) {
  const latest = issues[0];
  const latestBlock = latest
    ? `<div class="latest">
  <div class="no">${esc(latest.issue)}</div>
  <div class="dt">${latest.dateCn} <span style="font-size:13px;font-weight:700;opacity:.5">${latest.weekdayCn} / ${latest.weekdayEn}</span></div>
  <ul>${latest.titlesCn.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
  <div class="btns">
    ${latest.cn ? `<a class="btn primary" href="news/${latest.cn}">阅读中文版 →</a>` : ''}
    ${latest.en ? `<a class="btn" href="news/${latest.en}">Read in English →</a>` : ''}
  </div>
</div>`
    : '<p class="empty">还没有已发布的日报。</p>';

  const rest = issues.slice(1, 11);
  const restBlock = rest.length
    ? `<p class="label">往期 / Archive</p>\n${rest.map(i => issueRow(i, 'news/')).join('\n')}\n<p style="margin-top:20px"><a class="back" href="news/">查看全部 ${issues.length} 期 →</a></p>`
    : '';

  return page({
    title: '陆先生建筑日报 | Luxiansheng Architecture Daily',
    metaRight: `共 ${issues.length} 期<br>每日北京时间 21:00 更新`,
    strip: '项目与设计 · 城市与规划 · 材料与建造 · 学术与展览',
    body: `<p class="label">最新一期 / Latest</p>\n${latestBlock}\n${restBlock}`,
  });
}

function buildArchive(issues) {
  const body = issues.length
    ? issues.map(i => issueRow(i, '')).join('\n')
    : '<p class="empty">还没有已发布的日报。</p>';

  return page({
    title: '往期目录 | 陆先生建筑日报',
    metaRight: `往期目录<br>共 ${issues.length} 期`,
    strip: '往期目录 · Archive',
    body: `<p style="margin-bottom:16px"><a class="back" href="../">← 返回首页 / Home</a></p>\n${body}`,
  });
}

const issues = collect();
fs.writeFileSync(path.join(NEWS_DIR, 'index.html'), buildArchive(issues), 'utf8');
fs.writeFileSync(path.join(ROOT, 'index.html'), buildHome(issues), 'utf8');
console.log(`✓ 已生成 index.html 与 news/index.html（${issues.length} 期）`);
for (const i of issues) {
  const missing = [!i.cn ? '缺中文版' : '', !i.en ? '缺英文版' : ''].filter(Boolean).join(' ');
  console.log(`  ${i.issue}  ${i.date} ${i.weekdayCn}  ${i.titlesCn[0] || '(未解析到头条)'} ${missing ? '⚠ ' + missing : ''}`);
}
