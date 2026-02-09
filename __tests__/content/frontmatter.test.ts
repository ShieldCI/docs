import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

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

const allFiles = collectMarkdownFiles(DOCS_DIR)

// Separate analyzer doc files (non-index pages inside analyzers/<category>/)
const analyzerFiles = allFiles.filter((f) => {
  const rel = path.relative(DOCS_DIR, f)
  // Matches analyzers/<category>/<slug>.md but NOT analyzers/index.md or analyzers/<category>/index.md
  return /^analyzers\/[^/]+\/[^/]+\.md$/.test(rel) && !rel.endsWith('index.md')
})

// All content pages (excluding README)
const contentFiles = allFiles.filter((f) => !f.endsWith('README.md'))

const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info']

describe('frontmatter — all content pages', () => {
  it.each(contentFiles.map((f) => [path.relative(DOCS_DIR, f), f]))(
    '%s has title and description',
    (_rel, filePath) => {
      const raw = fs.readFileSync(filePath as string, 'utf-8')
      const { data } = matter(raw)

      expect(data.title, 'missing frontmatter "title"').toBeTruthy()
      expect(data.description, 'missing frontmatter "description"').toBeTruthy()
    },
  )
})

describe('frontmatter — analyzer pages', () => {
  it('found analyzer files to test', () => {
    expect(analyzerFiles.length).toBeGreaterThan(0)
  })

  it.each(analyzerFiles.map((f) => [path.relative(DOCS_DIR, f), f]))(
    '%s has tags',
    (_rel, filePath) => {
      const raw = fs.readFileSync(filePath as string, 'utf-8')
      const { data } = matter(raw)

      expect(data.tags, 'missing frontmatter "tags"').toBeTruthy()
      expect(String(data.tags).length, '"tags" should not be empty').toBeGreaterThan(0)
    },
  )

  it.each(analyzerFiles.map((f) => [path.relative(DOCS_DIR, f), f]))(
    '%s has a severity table row with a valid severity',
    (_rel, filePath) => {
      const raw = fs.readFileSync(filePath as string, 'utf-8')
      const { content } = matter(raw)

      // Analyzer docs contain a markdown table with a severity value in the third column
      // | `analyzer-id` | Category | Severity | Time To Fix |
      const severityMatch = content.match(
        /\|\s*`[^`]+`\s*\|[^|]+\|\s*(\w+)\s*\|/,
      )

      expect(severityMatch, 'no severity table row found').not.toBeNull()

      const severity = severityMatch![1].toLowerCase()
      expect(
        VALID_SEVERITIES,
        `severity "${severity}" is not one of ${VALID_SEVERITIES.join(', ')}`,
      ).toContain(severity)
    },
  )

  it.each(analyzerFiles.map((f) => [path.relative(DOCS_DIR, f), f]))(
    '%s has required content sections',
    (_rel, filePath) => {
      const raw = fs.readFileSync(filePath as string, 'utf-8')
      const { content } = matter(raw)

      expect(content, 'missing "## What This Checks" section').toContain('## What This Checks')
      expect(content, 'missing "## Why It Matters" section').toContain('## Why It Matters')
    },
  )
})
