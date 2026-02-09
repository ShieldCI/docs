import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const DOCS_DIR = path.resolve(__dirname, '../../docs')

/**
 * Sidebar definition mirroring .vitepress/config.ts.
 * We import it statically rather than importing config.ts (which pulls in
 * VitePress internals and Tailwind plugins that break in a Vitest context).
 */
interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
}

/** Extract every `link` value from a nested sidebar tree. */
function extractLinks(items: SidebarItem[]): string[] {
  const links: string[] = []
  for (const item of items) {
    if (item.link) links.push(item.link)
    if (item.items) links.push(...extractLinks(item.items))
  }
  return links
}

/**
 * We read the config file as text and extract the sidebar JSON-like structure
 * by finding all `link:` values. This avoids importing the full VitePress config.
 */
function extractSidebarLinksFromConfig(): string[] {
  const configPath = path.resolve(__dirname, '../../.vitepress/config.ts')
  const configText = fs.readFileSync(configPath, 'utf-8')

  // Match all link: '/some/path' patterns — only internal (relative) links
  const linkMatches = configText.matchAll(/link:\s*['"]([^'"]+)['"]/g)
  return [...linkMatches].map((m) => m[1]).filter((l) => l.startsWith('/'))
}

/** Convert a VitePress link to the expected markdown file path. */
function linkToFile(link: string): string {
  // Remove leading slash
  const rel = link.replace(/^\//, '')

  // Trailing slash or empty → index.md
  if (rel.endsWith('/') || rel === '') {
    return path.join(DOCS_DIR, rel, 'index.md')
  }

  return path.join(DOCS_DIR, `${rel}.md`)
}

/** Collect all non-index .md files under analyzers/<category>/ */
function collectAnalyzerFiles(): string[] {
  const analyzersDir = path.join(DOCS_DIR, 'analyzers')
  const files: string[] = []

  for (const category of fs.readdirSync(analyzersDir, { withFileTypes: true })) {
    if (!category.isDirectory()) continue
    const catDir = path.join(analyzersDir, category.name)
    for (const file of fs.readdirSync(catDir, { withFileTypes: true })) {
      if (file.isFile() && file.name.endsWith('.md') && file.name !== 'index.md') {
        files.push(`/analyzers/${category.name}/${file.name.replace('.md', '')}`)
      }
    }
  }

  return files
}

describe('sidebar sync', () => {
  const sidebarLinks = extractSidebarLinksFromConfig()

  it('extracted sidebar links from config', () => {
    expect(sidebarLinks.length).toBeGreaterThan(0)
  })

  it.each(sidebarLinks.map((link) => [link]))(
    'sidebar link %s resolves to an existing file',
    (link) => {
      const filePath = linkToFile(link)
      expect(
        fs.existsSync(filePath),
        `sidebar link "${link}" → file not found: ${filePath}`,
      ).toBe(true)
    },
  )

  it('every analyzer doc has a sidebar entry', () => {
    const analyzerPaths = collectAnalyzerFiles()
    const missingSidebar = analyzerPaths.filter(
      (p) => !sidebarLinks.includes(p),
    )

    expect(
      missingSidebar,
      `analyzer docs missing from sidebar:\n${missingSidebar.join('\n')}`,
    ).toEqual([])
  })
})
