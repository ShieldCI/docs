import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { proAnalyzerPaths } from '../../.vitepress/theme/data/pro-analyzers'

const DOCS_DIR = path.resolve(__dirname, '../../docs')

/** Collect all analyzer doc files (not index pages). */
function collectAnalyzerFiles(): string[] {
  const files: string[] = []
  const analyzersDir = path.join(DOCS_DIR, 'analyzers')

  for (const category of fs.readdirSync(analyzersDir, { withFileTypes: true })) {
    if (!category.isDirectory()) continue
    const catDir = path.join(analyzersDir, category.name)

    for (const file of fs.readdirSync(catDir, { withFileTypes: true })) {
      if (!file.isFile() || !file.name.endsWith('.md') || file.name === 'index.md') continue
      files.push(path.join(catDir, file.name))
    }
  }

  return files
}

const analyzerFiles = collectAnalyzerFiles()

/** Convert a file path to a VitePress route path. */
function fileToRoute(filePath: string): string {
  const rel = path.relative(DOCS_DIR, filePath)
  return '/' + rel.replace(/\.md$/, '')
}

describe('pro-tier-sync', () => {
  it('data file contains at least 40 entries', () => {
    expect(proAnalyzerPaths.size).toBeGreaterThanOrEqual(40)
  })

  it('every file with pro:true frontmatter is in the data file', () => {
    const missingFromData: string[] = []

    for (const filePath of analyzerFiles) {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(raw)
      if (data.pro !== true) continue

      const route = fileToRoute(filePath)
      if (!proAnalyzerPaths.has(route)) {
        missingFromData.push(route)
      }
    }

    expect(missingFromData).toEqual([])
  })

  it('every entry in the data file has a matching doc with pro:true frontmatter', () => {
    const missingFrontmatter: string[] = []

    for (const route of proAnalyzerPaths) {
      const filePath = path.join(DOCS_DIR, route + '.md')

      if (!fs.existsSync(filePath)) {
        missingFrontmatter.push(`${route} (file not found)`)
        continue
      }

      const raw = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(raw)

      if (data.pro !== true) {
        missingFrontmatter.push(`${route} (missing pro:true)`)
      }
    }

    expect(missingFrontmatter).toEqual([])
  })

  it('all data file paths follow the expected format', () => {
    for (const route of proAnalyzerPaths) {
      expect(route).toMatch(/^\/analyzers\/[a-z-]+\/[a-z0-9-]+$/)
    }
  })

  it('no free analyzer doc has pro:true frontmatter', () => {
    const incorrectlyMarked: string[] = []

    for (const filePath of analyzerFiles) {
      const route = fileToRoute(filePath)
      if (proAnalyzerPaths.has(route)) continue

      const raw = fs.readFileSync(filePath, 'utf-8')
      const { data } = matter(raw)

      if (data.pro === true) {
        incorrectlyMarked.push(route)
      }
    }

    expect(incorrectlyMarked).toEqual([])
  })
})
