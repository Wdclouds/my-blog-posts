# 🌿 My Blog Posts (个人数字花园文章库)

这是个人博客的文章数据源仓库。采用 **Markdown 存储 + GitHub Actions 自动编译 + 阿里云 ECS 自动部署** 架构。

## ✍️ 如何写新文章

在 `posts/` 目录下新建一个 `.md` 文件（如 `my-new-post.md`），头部带上 YAML Frontmatter：

```markdown
---
slug: my-new-post
title: 我的新文章标题
date: 2026-09-02
category: engineering
tags: ["Vue", "Node"]
excerpt: 这是文章的简短摘要，展示在列表页和卡片中。
isFeatured: true
---

# 这里是一级标题

正文 Markdown 内容...
```

## 🚀 自动化流程

1. 本地写完文章或修改后，执行 `git push origin main`。
2. **GitHub Actions** 自动触发：
   - 读取 `posts/*.md`。
   - 解析元数据并编译为高效的 `blog.sqlite` 数据库。
   - 通过 SSH 安全推送到阿里云 ECS 服务器目录 `/opt/netcatty-apps/my-site-data/blog/blog.sqlite`。
3. 线上博客网站即刻完成无缝热更新！
