// Analyzer pages: analyzers/<category>/<slug>.md, excluding the category index pages
const ANALYZER_PAGE = /^analyzers\/[^/]+\/(?!index\.md$)[^/]+\.md$/

/**
 * Search-facing title for an analyzer page, e.g. "Laravel SQL Injection: Detect & Fix".
 *
 * The frontmatter title ("SQL Injection Analyzer") stays as the H1 and breadcrumb label;
 * this only replaces the <title> and social titles, which are what search matches against.
 * Set `seoTopic` in frontmatter where the derived topic reads badly.
 */
export function analyzerSeoTitle(relativePath: string, frontmatter: Record<string, unknown>): string | null {
    if (!ANALYZER_PAGE.test(relativePath)) {
        return null
    }

    const topic = typeof frontmatter.seoTopic === 'string'
        ? frontmatter.seoTopic
        : String(frontmatter.title ?? '').replace(/ Analyzer$/, '')

    return topic ? `Laravel ${topic}: Detect & Fix` : null
}
