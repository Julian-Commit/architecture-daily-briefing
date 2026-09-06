# 陆先生建筑日报

> 交叉核验 · 案例深度 · 视觉优先

每天自动生成的建筑行业日报，面向雪城大学建筑学院中英文母语学生。

## 访问

🔗 **[https://julian-commit.github.io/architecture-daily-briefing/](https://julian-commit.github.io/architecture-daily-briefing/)**

## 板块

| 板块 | 内容 |
|---|---|
| 🏛 项目与设计 | 新落成建筑、国际竞赛、事务所动态、新锐设计师 |
| 🏙 城市与规划 | 城市政策、公共空间、地产动态、遗产保护 |
| 🧱 材料与建造 | 新材料、可持续技术、BIM/AI、3D 打印、数字建造 |
| 🎓 学术与展览 | 重要论文、双年展/三年展、workshop、留学资讯 |

## 特性

- 📐 Bauhaus 极简设计，响应式三档布局
- 🌐 中英文各一份独立页面，页眉一键互跳
- 🔍 交叉核验信源（ArchDaily、Dezeen、gooood 等）
- 📸 每条新闻配图，视觉优先
- 🏷 建筑术语中英对照
- ⏰ 每天（含周末）更新

## 怎么出一期

在 Claude Code 里打开本目录，输入 `/daily`。人格与流程定义在
[CLAUDE.md](CLAUDE.md) / [SOUL.md](SOUL.md) / [USER.md](USER.md)。

手动跑或排查时用得到的命令：

```bash
npm install                                                        # 只有 extract-images 需要 puppeteer
node scripts/today.js                                              # 北京时间日期（模板要的格式全给）
node scripts/extract-images.js <url1> <url2>                       # 抓 og:image（真浏览器）
node scripts/render.js template-cn.html cn.json news/2026-09-06-cn.html
node scripts/render.js template-en.html en.json news/2026-09-06-en.html
node scripts/build-index.js                                        # 重建首页与往期目录
node scripts/notify-discord.js --file notify.txt --dry-run         # 预览中英两段通知
node scripts/journal.js --tail 3                                   # 看最近几次运行记录
```

Discord 推送需要在仓库根目录建 `.env`（参考 `.env.example`）。

## 信源

**英文**：ArchDaily · Dezeen · Archinect · Designboom · Architectural Record · The Architect's Newspaper · World Architecture Community

**中文**：ArchDaily 中文版 · 谷德设计网 (gooood) · 有方空间 · 建筑学院

## 技术栈

- **生成**：Claude Code（原 CherryClaw + DeepSeek v4 Pro）
- **检索**：WebSearch / WebFetch（原 Exa）
- **抓图**：Puppeteer
- **发布**：GitHub Pages
- **通知**：Discord REST API

---

内容仅供参考
