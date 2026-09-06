# CLAUDE.md — 陆先生建筑日报（architecture-daily-briefing）

本项目原先运行在 Cherry Studio（CherryClaw）中，现已适配 Claude Code。
人格、用户档案与固定事实由下面三个文件定义，每次会话自动加载：

@SOUL.md
@USER.md
@memory/FACT.md

## 一句话说明

每天生成一期**中英文各一份独立 HTML** 的建筑行业日报，推送到 GitHub Pages，
并向 Discord 频道发中英两段通知。读者是雪城大学建筑学院的中英文母语学生。

- 仓库：`https://github.com/Julian-Commit/architecture-daily-briefing`
- 线上地址：`https://julian-commit.github.io/architecture-daily-briefing/`
- 四大板块：项目与设计 / 城市与规划 / 材料与建造 / 学术与展览

## 目录结构

```
index.html            站点首页（中英双入口，由脚本生成）
template-cn.html      中文版模板    ← 现役
template-en.html      英文版模板    ← 现役
template.html         拆分语言前的旧模板，已废弃，不要用
news/YYYY-MM-DD-cn.html / -en.html   每期中英双版
news/2026-07-19.html  拆分前的旧单页版，同日已有 cn/en 版，已废弃
news/index.html       往期目录（由脚本生成，不要手写）
scripts/              extract-images 需要 puppeteer，其余无依赖
memory/FACT.md        频道 ID、发布频率等固定事实
memory/JOURNAL.jsonl  运行日志
```

## 每天怎么跑

输入 `/daily`（定义在 `.claude/commands/daily.md`）。手动执行时的顺序：

1. **搜集** — `WebSearch` 搜四个板块，中英文源并行；`WebFetch` 读原文核验，每条 ≥2 个独立信源。
2. **抓图** — 建筑是视觉学科，每条尽量配图：
   ```
   node scripts/extract-images.js <url1> <url2> ...        # 输出 JSON 到 stdout
   curl -sL <url> | grep -o 'og:image[^>]*'                # 备选，服务端渲染站点够用
   ```
   `extract-images.js` 用 Puppeteer 跑真浏览器（ArchDaily/Dezeen 这类 JS 渲染站点必须这样）。
   首次或换机器后若报找不到 puppeteer，先 `npm install`。
3. **写稿** — 5 条头条（四板块至少各一）+ 每板块 1 篇深度解读（综合 5-6 信源）+ 3-4 条快讯 + 编者按（150-250 字）。
   深度解读必须覆盖：设计概念 / 空间策略 / 结构或材料创新 / 项目背景与影响。
   术语首次出现标英文原名，图片 alt 中英双语。
4. **渲染两份** — 中英各一个 JSON，分别渲染：
   ```
   node scripts/render.js template-cn.html <cn.json> news/2026-09-06-cn.html
   node scripts/render.js template-en.html <en.json> news/2026-09-06-en.html
   ```
   `render.js` 会强制校验占位符填齐、无残留 `{{...}}`、无空 `<img src>`。
   两份文件必须互链：中文版的 `EN_URL` = `2026-09-06-en.html`，英文版的 `CN_URL` = `2026-09-06-cn.html`（同目录相对路径）。
5. **重建索引** — `node scripts/build-index.js`
6. **发布** — `git add -A && git commit -m "建筑日报 2026-09-06（周六）" && git push`
7. **通知** — 中英两段，中文在前，各 ≤250 字，含两个链接 + 5 条头条摘要：
   ```
   node scripts/notify-discord.js --file <notify.txt> --dry-run
   node scripts/notify-discord.js --file <notify.txt>
   ```
   文件里用单独一行 `---SPLIT---` 分隔中英两段，脚本会分两条发。
8. **记账** — `node scripts/journal.js --tags arch-daily,2026-09-06 --text "…"`

## 模板占位符

两份模板的占位符除日期与互链外完全一致：

| 占位符 | 内容 |
|---|---|
| `{{DATE}}` | ISO 日期，`<title>` 用，如 `2026-09-06` |
| `{{DATE_CN}}`（cn） | `2026年9月6日` |
| `{{DATE_EN}}`（en） | `September 6, 2026` |
| `{{WEEKDAY}}` | cn 用 `星期六`，en 用 `Saturday` |
| `{{ISSUE}}` | 期号，`No. 006` 格式 |
| `{{EN_URL}}`（cn） / `{{CN_URL}}`（en） | 另一语言版的同目录文件名 |
| `{{PREFACE}}` | 编者按 |
| `{{HEADLINES}}` | 5 张头条卡片 HTML |
| `{{PROJECTS_FEATURE}}` `{{URBANISM_FEATURE}}` `{{MATERIALS_FEATURE}}` `{{ACADEMIA_FEATURE}}` | 四个板块的深度解读 |
| `{{PROJECTS_NEWS}}` `{{URBANISM_NEWS}}` `{{MATERIALS_NEWS}}` `{{ACADEMIA_NEWS}}` | 四个板块的快讯 |

板块标签类名与锚点：

| 板块 | 标签类 | 锚点 |
|---|---|---|
| 项目与设计 | `arc` | `#projects` |
| 城市与规划 | `urb` | `#urbanism` |
| 材料与建造 | `mat` | `#materials` |
| 学术与展览 | `aca` | `#academia` |

HTML 片段结构照抄 `news/2026-07-20-cn.html`（现役模板的正确样例）。
图片一律带 `loading="lazy" onerror="this.style.display='none'"`。

## 期号

历史遗留：`2026-07-19` 标的是 `#001`，`2026-07-20` 标的是 `No. 005`（把测试刊也算进去了），
两者格式和序号都不一致。**新刊统一用 `No. NNN` 格式，从 `No. 006` 续**。
要不要回头把历史两期改成连号，等陆先生定。

## Cherry Studio → Claude Code 工具对照

| 原来 | 现在 |
|---|---|
| Exa `web_search` / `web_fetch` | `WebSearch` / `WebFetch` |
| `mcp__claw__notify` | `node scripts/notify-discord.js`（频道 REST API） |
| Cherry Studio Cron `0 13 * * *`（job `arch-daily`） | Claude 计划任务，或 GitHub Actions |
| CherryClaw memory journal | `node scripts/journal.js` → `memory/JOURNAL.jsonl` |
| `.claude/skills/` 软链接 | 指向 Cherry Studio 安装目录，Claude Code 不需要，已 gitignore |

## Discord

频道 "Lu's Auto Newspaper"，channel id 见 `memory/FACT.md`。凭据放仓库根目录 `.env`（已 gitignore）：

```
DISCORD_BOT_TOKEN=...
DISCORD_CHANNEL_ID=1528382403633090731
```

- 频道是**推送专用**，不是聊天频道：频道里收到闲聊，两句话内引导对方私信（SOUL.md 有规范）。
- 通知只给链接 + 头条摘要，不展开全文。
- 403 / code 50013 → 频道权限里给 bot 单独加 Send Messages = ALLOW（`@everyone` 被 DENY 时 bot 会继承）。
- token 泄露会被 Discord 自动吊销，绝不写进 prompt 或提交进仓库。

## 定时

已配好 Windows 计划任务 `Luxiansheng-Daily-Arch`：每天本机 15:20 触发（= 北京时间 21:20），
执行 `scripts\run-daily.cmd` → `run-daily.ps1` → `claude -p "/daily 全自动"`。
用订阅额度跑，不需要 API key；日志写在 `logs/daily-<北京日期>.log`（已 gitignore）。

```powershell
schtasks /Query  /TN Luxiansheng-Daily-Arch /V /FO LIST   # 看状态与下次触发时间
schtasks /Run    /TN Luxiansheng-Daily-Arch               # 立刻手动跑一次
schtasks /Change /TN Luxiansheng-Daily-Arch /DISABLE      # 暂停
schtasks /Change /TN Luxiansheng-Daily-Arch /ENABLE       # 恢复
```

**两个前提，缺一就会在日志里失败：**

1. 这个目录必须被信任过——先交互式跑一次 `claude` 并接受信任对话框，
   否则 `.claude/settings.json` 里的权限白名单会被整个忽略，无头模式下工具调用会被拒。
2. CLI 登录态有效——OAuth 过期时 `claude -p` 直接退出，同样要交互式登录一次。

时区提醒：本机是欧洲中部时间。2026-10-25 欧洲夏令时结束后，本机 15:20 会变成北京 22:20，
仍是同一个北京日期，不影响刊号；想精确对齐就把触发时间往前挪一小时。

注意：上一期是 2026-07-20，中间停更近两个月。重新开跑时期号从 No. 006 续。

## 一个容易踩的坑：日期

本机时区是欧洲中部时间（既不是 UTC+8 也不是纽约），而且这台机器的 Git Bash 没有时区库，
`TZ=Asia/Shanghai date` 会**静默退回 UTC**——看着像成功，日期却是错的。
取日期只用下面这个脚本，它按北京时间算，并直接给出模板要的几种格式：

```bash
node scripts/today.js              # 今天
node scripts/today.js 2026-09-06   # 补做某一天
```

## 硬性约束

- 淡季/假日新闻不够就如实说明，**绝不编造项目信息或数据**（SOUL.md 禁区）。
- 不做设计咨询，不评价建筑师个人风格，不预测竞赛结果。
- 中英双版必须同时产出，缺一版就等于没发。
- `index.html`、`news/index.html` 由脚本生成，手改会被覆盖。
