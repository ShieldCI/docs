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
  
  // Define custom ordering for specific directories
  const orderMap: Record<string, string[]> = {
    'introduction': ['what-is-shieldci', 'why-shieldci', 'how-it-works'],
    'getting-started': ['installation', 'configuration', 'first-analysis'],
    'security': ['overview'],
    'performance': ['overview'],
    'reliability': ['overview'],
    'code-quality': ['overview'],
    'best-practices': ['overview']
  }
  
  try {
    const entries = readdirSync(dir)
    const dirName = basePath.split('/').pop() || ''
    const customOrder = orderMap[dirName]
    
    // Sort entries based on custom order or alphabetically
    const sortedEntries = customOrder
      ? [...entries].sort((a, b) => {
          const aName = a.replace('.md', '')
          const bName = b.replace('.md', '')
          const aIndex = customOrder.indexOf(aName)
          const bIndex = customOrder.indexOf(bName)
          
          // If both are in custom order, sort by index
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex
          }
          // If only one is in custom order, prioritize it
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
          // Otherwise, sort alphabetically
          return a.localeCompare(b)
        })
      : entries.sort()
    
    for (const entry of sortedEntries) {
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
  
  // Build unified sidebar with all sections
  const allItems: SidebarItem[] = []
  
  // Introduction section
  if (introduction.length > 0) {
    allItems.push({
      text: 'Introduction',
      collapsed: false,
      items: introduction
    })
  }
  
  // Getting Started section
  if (gettingStarted.length > 0) {
    allItems.push({
      text: 'Getting Started',
      collapsed: false,
      items: gettingStarted
    })
  }
  
  // Analyzers section
  const analyzersItems: SidebarItem[] = [
    {
      text: 'Overview',
      link: '/analyzers/overview'
    }
  ]
  
  if (analyzersSecurity.length > 0) {
    // Find overview page and move it to the front
    const securityItems = [...analyzersSecurity]
    const overviewIndex = securityItems.findIndex(item => item.link?.includes('/security/overview'))
    if (overviewIndex > 0) {
      const overview = securityItems.splice(overviewIndex, 1)[0]
      securityItems.unshift(overview)
    }
    
    analyzersItems.push({
      text: 'Security',
      collapsed: false,
      items: securityItems
    })
  }
  
  if (analyzersPerformance.length > 0) {
    // Find overview page and move it to the front
    const performanceItems = [...analyzersPerformance]
    const overviewIndex = performanceItems.findIndex(item => item.link?.includes('/performance/overview'))
    if (overviewIndex > 0) {
      const overview = performanceItems.splice(overviewIndex, 1)[0]
      performanceItems.unshift(overview)
    }
    
    analyzersItems.push({
      text: 'Performance',
      collapsed: false,
      items: performanceItems
    })
  }
  
  if (analyzersReliability.length > 0) {
    // Find overview page and move it to the front
    const reliabilityItems = [...analyzersReliability]
    const overviewIndex = reliabilityItems.findIndex(item => item.link?.includes('/reliability/overview'))
    if (overviewIndex > 0) {
      const overview = reliabilityItems.splice(overviewIndex, 1)[0]
      reliabilityItems.unshift(overview)
    }
    
    analyzersItems.push({
      text: 'Reliability',
      collapsed: false,
      items: reliabilityItems
    })
  }
  
  if (analyzersCodeQuality.length > 0) {
    // Find overview page and move it to the front
    const codeQualityItems = [...analyzersCodeQuality]
    const overviewIndex = codeQualityItems.findIndex(item => item.link?.includes('/code-quality/overview'))
    if (overviewIndex > 0) {
      const overview = codeQualityItems.splice(overviewIndex, 1)[0]
      codeQualityItems.unshift(overview)
    }
    
    analyzersItems.push({
      text: 'Code Quality',
      collapsed: false,
      items: codeQualityItems
    })
  }
  
  if (analyzersBestPractices.length > 0) {
    // Find overview page and move it to the front
    const bestPracticesItems = [...analyzersBestPractices]
    const overviewIndex = bestPracticesItems.findIndex(item => item.link?.includes('/best-practices/overview'))
    if (overviewIndex > 0) {
      const overview = bestPracticesItems.splice(overviewIndex, 1)[0]
      bestPracticesItems.unshift(overview)
    }
    
    analyzersItems.push({
      text: 'Best Practices',
      collapsed: false,
      items: bestPracticesItems
    })
  }
  
  if (analyzersItems.length > 1) {
    allItems.push({
      text: 'Analyzers',
      collapsed: false,
      items: analyzersItems
    })
  }
  
  // Return unified sidebar that shows all items
  return {
    '/': allItems,  // Root and all pages show the same sidebar
    '/introduction/': allItems,
    '/getting-started/': allItems,
    '/analyzers/': allItems
  }
}

