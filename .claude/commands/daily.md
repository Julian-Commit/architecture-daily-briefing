---
description: 生成并发布今天的陆先生建筑日报（中英双版 + Discord 双语通知）
---

出一期今天的《陆先生建筑日报》。严格遵守 SOUL.md 的人格与禁区，尤其是：
视觉优先（每条尽量配图）、案例深度大于新闻广度、每条 ≥2 个独立信源、
术语中英对照、绝不编造项目信息或数据。

参数（可选）：$ARGUMENTS
- 传入日期（如 `2026-09-06`）则补做那一天，否则用今天（北京时间）。
- 传入 `全自动` 则跳过发布前确认，一路推送到 GitHub 并发 Discord。

## 步骤

**1. 确定期号与日期**

日期一律按北京时间算。**不要用 `date`**：本机是欧洲中部时间，且 Git Bash 的 `TZ=` 会静默退回 UTC。
`today.js` 直接输出模板要的所有日期格式：

```bash
node scripts/today.js
ls news/ | tail -6
```

期号用 `No. NNN` 格式，在现有最大号基础上 +1（历史遗留：最大是 `No. 005`，
所以下一期是 `No. 006`，详见 CLAUDE.md「期号」一节）。
先确认 `news/YYYY-MM-DD-cn.html` 不存在——存在说明当天已出刊，问我要不要重做。

**2. 搜集与核验**

`WebSearch` 搜四个板块，中英文源并行搜（英文源 ArchDaily / Dezeen / Archinect /
Designboom / Architectural Record，中文源 ArchDaily 中文版 / gooood / 有方 / 建筑学院），
`WebFetch` 读原文核对细节。每条重要新闻 ≥2 个独立信源，深度解读要综合 5-6 个。

**3. 抓图**

```bash
node scripts/extract-images.js <url1> <url2> <url3> ...
```

输出 JSON（stdout），进度日志走 stderr。`status` 不是 `ok` 的换备选源，
或者 `curl -sL <url> | grep -o 'og:image[^>]*'` 试一下。报找不到 puppeteer 就先 `npm install`。
图片 alt 写中英双语。

**4. 写稿**

- 编者按 150-250 字，概述当日建筑界最重要动态
- 5 条头条，四个板块至少各一条
- 每板块：1 篇深度解读（设计概念 / 空间策略 / 结构或材料创新 / 项目背景与影响）+ 3-4 条快讯
- 视觉描述要具象（"清水混凝土与玻璃幕墙的虚实对比"，不是"很漂亮"）
- 中英两版都要完整写，英文版不是机翻，专有名词用原名

**5. 渲染两份**

中英各准备一个 JSON（放临时目录，不要留在仓库），键名见 CLAUDE.md 占位符表：

```bash
node scripts/render.js template-cn.html <cn.json> news/YYYY-MM-DD-cn.html
node scripts/render.js template-en.html <en.json> news/YYYY-MM-DD-en.html
```

互链别写错：中文版 `EN_URL` = `YYYY-MM-DD-en.html`，英文版 `CN_URL` = `YYYY-MM-DD-cn.html`。
`render.js` 报错必须修好再继续，不要用 `--allow-missing` 绕过。

**6. 重建索引**

```bash
node scripts/build-index.js
```

输出里如果提示某期"缺中文版/缺英文版"，说明有一版没生成成功，回去补。

**7. 自检后向我汇报**

确认：期号/日期/星期正确、四个板块都有内容、中英互跳链接可用、每条都有图。
然后给我摘要：期号、5 条头条（中文）、每条信源、配图抓取成功率。

**8. 发布（除非我说了"全自动"，先等我确认）**

```bash
git add -A && git commit -m "建筑日报 YYYY-MM-DD（周X）" && git push
```

**9. Discord 通知（发卡片，中英同一张）**

以前是中英分两条纯文本发。现在改成**一张卡片、两个按钮**，中英各一个入口，
既不刷屏也不会出现裸链接。写一个 `card.json`（字段见 `scripts/notify-discord.js` 顶部注释）：

```json
{
  "author": "陆先生建筑日报 · ARCHITECTURE DAILY",
  "title": "No. 006 · 2026年9月6日 星期日",
  "url": "https://julian-commit.github.io/architecture-daily-briefing/news/2026-09-06-cn.html",
  "description": "编者按压缩成两三句 / One or two lines in English",
  "headlines": ["头条一", "头条二", "头条三", "头条四", "头条五"],
  "image": "https://…（头条项目配图，必须 https）",
  "color": "#c41230",
  "footer": "交叉核验 · 案例深度 · 视觉优先",
  "buttons": [
    { "label": "阅读中文版", "url": "https://…/news/2026-09-06-cn.html" },
    { "label": "English", "url": "https://…/news/2026-09-06-en.html" },
    { "label": "往期目录", "url": "https://julian-commit.github.io/architecture-daily-briefing/news/" }
  ]
}
```

```bash
node scripts/notify-discord.js --card <card.json> --dry-run
node scripts/notify-discord.js --card <card.json>
```

**10. 记账**

```bash
node scripts/journal.js --tags arch-daily,YYYY-MM-DD --text "本期头条…；发布与推送结果…"
```

## 出问题时

- `extract-images.js` 大面积 timeout → 站点在拦爬虫，换信源或退回 og:image curl 方案
- Discord 403 / code 50013 → 频道权限里给 bot 单独加 Send Messages = ALLOW
- 建筑新闻淡季实在凑不满 → 在编者按里如实说明，不强行编造（SOUL.md 禁区）
- 频道里有人闲聊 → 两句话内引导私信，不在频道展开对话
