import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { analyzerSeoTitle } from '../../.vitepress/seo'

const DOCS_DIR = path.resolve(__dirname, '../../docs')

/** Recursively collect all .md files under a directory. */
function collectMarkdownFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(full))
    } else if (entry.name.endsWith('.md')) {
      files.push(full)
    }
  }
  return files
}

const analyzerFiles = collectMarkdownFiles(DOCS_DIR)
  .map((f) => path.relative(DOCS_DIR, f))
  .filter((rel) => /^analyzers\/[^/]+\/[^/]+\.md$/.test(rel) && !rel.endsWith('index.md'))

const titleFor = (rel: string) =>
  analyzerSeoTitle(rel, matter(fs.readFileSync(path.join(DOCS_DIR, rel), 'utf-8')).data)

describe('analyzerSeoTitle', () => {
  it('puts Laravel in front of the topic and drops the "Analyzer" suffix', () => {
    expect(analyzerSeoTitle('analyzers/security/sql-injection.md', { title: 'SQL Injection Analyzer' }))
      .toBe('Laravel SQL Injection: Detect & Fix')
  })

  it('uses seoTopic in place of the derived topic', () => {
    expect(analyzerSeoTitle('analyzers/security/cookie.md', { title: 'Cookie Analyzer', seoTopic: 'Cookie Security' }))
      .toBe('Laravel Cookie Security: Detect & Fix')
  })

  it.each([
    'analyzers/index.md',
    'analyzers/security/index.md',
    'getting-started/installation.md',
    'index.md',
  ])('leaves %s alone', (rel) => {
    expect(analyzerSeoTitle(rel, { title: 'Security Analyzers' })).toBeNull()
  })

  it('returns null rather than a bare template when there is no title', () => {
    expect(analyzerSeoTitle('analyzers/security/sql-injection.md', {})).toBeNull()
  })
})

describe('analyzer page titles', () => {
  it('found the analyzer pages', () => {
    expect(analyzerFiles.length).toBeGreaterThan(100)
  })

  it.each(analyzerFiles)('%s gets a Laravel search title', (rel) => {
    const title = titleFor(rel)

    expect(title).toMatch(/^Laravel \S.*: Detect & Fix$/)
    expect(title).not.toMatch(/Analyzer/)
  })

  it('gives every analyzer page a distinct title', () => {
    const titles = analyzerFiles.map(titleFor)

    expect(new Set(titles).size).toBe(titles.length)
  })
})
