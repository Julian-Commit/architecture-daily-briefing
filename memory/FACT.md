# 建筑日报 FACT

## 发布频率
- 每天发布（含周末），不再限于周一至周五
- Cron: `0 13 * * *`（北京时间每晚 21:00）
- Job name: `arch-daily`

## 发布渠道
- Discord 频道 "Lu's Auto Newspaper" (channel_id: 1528382403633090731)
- GitHub Pages: Julian-Commit 的独立仓库

## 技术要点
- HTML 模板: template-cn.html / template-en.html，Bauhaus 极简风格
- 图片抓取: node scripts/extract-images.js（优先），curl og:image（备选）
- 每板块: 1 深度解读 + 3-4 快讯
- 信源核验: 每条至少两个独立来源
