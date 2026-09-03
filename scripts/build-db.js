/**
 * build-db.js
 * 扫描 posts/ 与 wiki/ 目录，将 Markdown 与 Frontmatter 编译为标准 SQLite 数据库
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import fm from 'front-matter'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const postsDir = path.join(rootDir, 'posts')
const wikiDir = path.join(rootDir, 'wiki')
const distDir = path.join(rootDir, 'dist')

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

const dbPath = path.join(distDir, 'blog.sqlite')
try {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath)
  }
} catch (e) {
  // 如果文件被占用无法删除，稍后在数据库层面清理表
}

const db = new DatabaseSync(dbPath)

// 初始化 Schema（如果表已存在先清空，实现完全干净的编译）
db.exec(`
  DROP TABLE IF EXISTS posts;
  DROP TABLE IF EXISTS wiki_topics;
  DROP TABLE IF EXISTS wiki_articles;
`)

// 初始化 Schema
db.exec(`
  -- 1. 单篇博客文章流（时间线）
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT,
    date TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'dev',
    tags TEXT NOT NULL DEFAULT '[]',
    content TEXT NOT NULL,
    is_featured INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);
  CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

  -- 2. 知识库专题专栏
  CREATE TABLE IF NOT EXISTS wiki_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'dev',
    icon TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 3. 知识库具体章节条目
  CREATE TABLE IF NOT EXISTS wiki_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_slug TEXT NOT NULL,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(topic_slug, slug)
  );
  CREATE INDEX IF NOT EXISTS idx_wiki_articles_topic ON wiki_articles(topic_slug, order_index ASC);
`)

console.log('[build-db] Schema 初始化完成。')

// 1. 扫描 posts
if (fs.existsSync(postsDir)) {
  const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'))
  console.log(`[build-db] 正在解析 ${postFiles.length} 篇单篇文章...`)
  
  const insertPost = db.prepare(`
    INSERT INTO posts (slug, title, excerpt, date, category, tags, content, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const file of postFiles) {
    const raw = fs.readFileSync(path.join(postsDir, file), 'utf-8')
    const { attributes, body } = fm(raw)
    const baseName = path.basename(file, '.md')
    const slug = attributes.slug || baseName
    const title = attributes.title || baseName
    const excerpt = attributes.excerpt || ''
    
    let date = attributes.date || new Date().toISOString().slice(0, 10)
    if (date instanceof Date) {
      date = date.toISOString().slice(0, 10)
    } else {
      date = String(date)
    }

    const category = (attributes.category || 'dev').toLowerCase()
    const tags = JSON.stringify(Array.isArray(attributes.tags) ? attributes.tags : [])
    const isFeatured = attributes.isFeatured ? 1 : 0

    insertPost.run(slug, title, excerpt, date, category, tags, body, isFeatured)
    console.log(`  ✓ 已编译文章: [${date}] [${category}] ${title} (${slug})`)
  }
}

// 2. 扫描 wiki
if (fs.existsSync(wikiDir)) {
  const topicDirs = fs.readdirSync(wikiDir, { withFileTypes: true }).filter(d => d.isDirectory())
  console.log(`\n[build-db] 正在解析 ${topicDirs.length} 个知识库专题...`)

  const insertTopic = db.prepare(`
    INSERT INTO wiki_topics (slug, title, description, category, icon, order_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertArticle = db.prepare(`
    INSERT INTO wiki_articles (topic_slug, slug, title, order_index, content)
    VALUES (?, ?, ?, ?, ?)
  `)

  for (const d of topicDirs) {
    const topicSlug = d.name
    const dirPath = path.join(wikiDir, topicSlug)
    const metaPath = path.join(dirPath, 'meta.json')
    
    let meta = { title: topicSlug, description: '', category: 'dev', icon: '', order: 0 }
    if (fs.existsSync(metaPath)) {
      try {
        meta = { ...meta, ...JSON.parse(fs.readFileSync(metaPath, 'utf-8')) }
      } catch (e) {
        console.warn(`  ⚠️ 解析 ${metaPath} 失败:`, e.message)
      }
    }

    insertTopic.run(topicSlug, meta.title, meta.description, meta.category, meta.icon || '', meta.order || 0)
    console.log(`  📁 已载入专题: [${meta.category}] ${meta.title} (${topicSlug})`)

    // 扫描该专题下的所有章节 .md
    const articleFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'))
    for (const af of articleFiles) {
      const raw = fs.readFileSync(path.join(dirPath, af), 'utf-8')
      const { attributes, body } = fm(raw)
      const baseName = path.basename(af, '.md')
      const articleSlug = attributes.slug || baseName
      const articleTitle = attributes.title || baseName
      const orderIndex = attributes.order || 0

      insertArticle.run(topicSlug, articleSlug, articleTitle, orderIndex, body)
      console.log(`    ↳ 章节: [${orderIndex}] ${articleTitle} (${articleSlug})`)
    }
  }
}

console.log(`\n[build-db] ✅ 全部编译完成！输出: ${dbPath}`)
