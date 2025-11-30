import { readdirSync, statSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
  collapsed?: boolean
}

const docsPath = join(process.cwd(), 'docs')

function getFileTitle(filePath: string): string {
  try {
    if (!existsSync(filePath)) {
      throw new Error('File does not exist')
    }
    const content = readFileSync(filePath, 'utf-8')
    const { data } = matter(content)
    if (data.title) {
      return data.title
    }
    // Fallback to filename
    const filename = filePath.split('/').pop()?.replace('.md', '') || ''
    return filename
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  } catch {
    const filename = filePath.split('/').pop()?.replace('.md', '') || ''
    return filename
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}

function buildSidebar(dir: string, basePath: string = ''): SidebarItem[] {
  const items: SidebarItem[] = []
  
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return items
  }
  
  try {
    const entries = readdirSync(dir).sort()
    
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      
      if (!existsSync(fullPath)) {
        continue
      }
      
      const stat = statSync(fullPath)
      const relativePath = join(basePath, entry)
      
      if (stat.isDirectory()) {
        const children = buildSidebar(fullPath, relativePath)
        if (children.length > 0) {
          // Use directory name as title, formatted
          const dirName = entry
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          
          items.push({
            text: dirName,
            items: children,
            collapsed: false
          })
        }
      } else if (entry.endsWith('.md') && entry !== 'README.md') {
        const slug = entry.replace('.md', '')
        const title = getFileTitle(fullPath)
        
        items.push({
          text: title,
          link: `/${relativePath.replace('.md', '')}`
        })
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error)
  }
  
  return items
}

export function getSidebar() {
  const introduction = buildSidebar(join(docsPath, 'introduction'), 'introduction')
  const gettingStarted = buildSidebar(join(docsPath, 'getting-started'), 'getting-started')
  
  // Analyzers structure
  const analyzersSecurity = buildSidebar(join(docsPath, 'analyzers/security'), 'analyzers/security')
  const analyzersPerformance = buildSidebar(join(docsPath, 'analyzers/performance'), 'analyzers/performance')
  const analyzersReliability = buildSidebar(join(docsPath, 'analyzers/reliability'), 'analyzers/reliability')
  const analyzersCodeQuality = buildSidebar(join(docsPath, 'analyzers/code-quality'), 'analyzers/code-quality')
  const analyzersBestPractices = buildSidebar(join(docsPath, 'analyzers/best-practices'), 'analyzers/best-practices')
  
  const sidebar: Record<string, SidebarItem[]> = {}
  
  if (introduction.length > 0) {
    sidebar['/introduction/'] = [
      {
        text: 'Introduction',
        items: introduction
      }
    ]
  }
  
  if (gettingStarted.length > 0) {
    sidebar['/getting-started/'] = [
      {
        text: 'Getting Started',
        items: gettingStarted
      }
    ]
  }
  
  const analyzersItems: SidebarItem[] = [
    {
      text: 'Overview',
      link: '/analyzers/overview'
    }
  ]
  
  if (analyzersSecurity.length > 0) {
    analyzersItems.push({
      text: 'Security',
      collapsed: false,
      items: analyzersSecurity
    })
  }
  
  if (analyzersPerformance.length > 0) {
    analyzersItems.push({
      text: 'Performance',
      collapsed: false,
      items: analyzersPerformance
    })
  }
  
  if (analyzersReliability.length > 0) {
    analyzersItems.push({
      text: 'Reliability',
      collapsed: false,
      items: analyzersReliability
    })
  }
  
  if (analyzersCodeQuality.length > 0) {
    analyzersItems.push({
      text: 'Code Quality',
      collapsed: false,
      items: analyzersCodeQuality
    })
  }
  
  if (analyzersBestPractices.length > 0) {
    analyzersItems.push({
      text: 'Best Practices',
      collapsed: false,
      items: analyzersBestPractices
    })
  }
  
  if (analyzersItems.length > 1) {
    sidebar['/analyzers/'] = analyzersItems
  }
  
  return sidebar
}

