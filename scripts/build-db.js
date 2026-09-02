import fs from 'node:fs'
import path from 'node:path'
import fm from 'front-matter'
import { DatabaseSync } from 'node:sqlite'

const POSTS_DIR = path.resolve(process.cwd(), 'posts')
const DIST_DIR = path.resolve(process.cwd(), 'dist')
const DB_PATH = path.join(DIST_DIR, 'blog.sqlite')

if (!fs.existsSync(POSTS_DIR)) {
  fs.mkdirSync(POSTS_DIR, { recursive: true })
}
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true })
}

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH)
}

const db = new DatabaseSync(DB_PATH)

// 初始化文章表结构（与 my-site server 保持 100% 一致）
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    date TEXT NOT NULL,
    category TEXT DEFAULT 'uncategorized',
    tags TEXT, -- JSON array
    content TEXT,
    is_featured INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);
  CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
`)

const insertStmt = db.prepare(`
  INSERT INTO posts (slug, title, excerpt, date, category, tags, content, is_featured, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`)

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))
console.log(`[build-db] 正在解析 ${files.length} 篇 Markdown 文章...`)

let count = 0
for (const file of files) {
  const fullPath = path.join(POSTS_DIR, file)
  const raw = fs.readFileSync(fullPath, 'utf8')
  const { attributes, body } = fm(raw)

  const slug = attributes.slug || path.basename(file, '.md')
  const title = attributes.title || slug
  const excerpt = attributes.excerpt || body.slice(0, 150).replace(/[#*`\n]/g, ' ').trim()
  let date = attributes.date || new Date().toISOString().slice(0, 10)
  if (date instanceof Date) {
    date = date.toISOString().slice(0, 10)
  } else {
    date = String(date)
  }
  const category = attributes.category || 'engineering'
  const tags = JSON.stringify(Array.isArray(attributes.tags) ? attributes.tags : [])
  const isFeatured = attributes.isFeatured ? 1 : 0

  insertStmt.run(slug, title, excerpt, date, category, tags, body, isFeatured)
  console.log(`  ✓ 已编译: [${date}] ${title} (${slug})`)
  count++
}

console.log(`[build-db] ✅ 编译完成！共写入 ${count} 篇文章 -> ${DB_PATH}`)
