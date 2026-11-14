# ShieldCI Documentation Site

## Purpose
Public documentation for ShieldCI platform and packages using VitePress. Live at https://docs.shieldci.com.

## Stack
- VitePress (Vue.js-based static site generator)
- Vue 3 (custom theme components)
- Markdown (content format)
- TypeScript (config, theme, tests)
- Algolia DocSearch (search integration)
- Vitest + @vue/test-utils + jsdom (tests)

## Structure
```
.
├── .vitepress/
│   ├── config.ts              # Site config: nav, sidebar, search, head/SEO hooks
│   ├── seo.ts                 # analyzerSeoTitle(): search-facing <title> for analyzer pages
│   └── theme/
│       ├── index.ts           # Extends default theme, registers components
│       ├── components/        # AnalyzerCard, Breadcrumbs, CodeComparison, HomeContent,
│       │                      # HomeFeatures, ProBadge, SidebarAccordion
│       ├── composables/       # useScrollReveal
│       ├── data/              # pro-analyzers.ts (Pro tier list)
│       └── style/index.css
├── __tests__/
│   ├── components/            # One test per theme component
│   ├── composables/
│   ├── content/               # frontmatter, sidebar-sync, pro-tier-sync, seo-title
│   ├── theme/
│   └── setup-dom.ts           # jsdom mocks (IntersectionObserver, matchMedia)
├── docs/                      # srcDir — all site content lives here
│   ├── index.md               # Homepage
│   ├── introduction/
│   ├── getting-started/       # installation, configuration, first-analysis, ci-cd-integration, troubleshooting
│   ├── analyzers/
│   │   ├── security/
│   │   ├── performance/
│   │   ├── reliability/
│   │   ├── code-quality/
│   │   └── best-practices/
│   ├── api/                   # Platform API reference
│   ├── contributing.md
│   └── public/                # Static assets + Cloudflare _redirects
└── vitest.config.ts
```

## Configuration Notes
- `srcDir: 'docs'` — page paths and sidebar links are relative to `docs/`.
- Search: Algolia, configured from env (`ALGOLIA_APP_ID`, `ALGOLIA_API_KEY`, `ALGOLIA_INDEX_NAME`, optional `ALGOLIA_ASK_AI_ID`). Never hardcode keys.
- Sidebar is hand-maintained in `.vitepress/config.ts`. Every analyzer page must have a sidebar entry and vice versa — `__tests__/content/sidebar-sync.test.ts` enforces both directions.
- Analyzer page `<title>` comes from `analyzerSeoTitle()` in `.vitepress/seo.ts` ("Laravel {topic}: Detect & Fix"). Set `seoTopic` in frontmatter when the derived topic reads badly.

## Content Structure

### Analyzer Pages
Use an existing page (e.g. `docs/analyzers/security/sql-injection.md`) as the canonical example, or the `analyzer-docs` skill. Each page has:
- Frontmatter: `title`, `description`, `icon`, `outline`, `tags` (validated by `__tests__/content/frontmatter.test.ts`)
- An H1 matching `title`, then the Analyzer ID / Category / Severity / Time To Fix table
- Sections: What This Checks, Why It Matters, How to Fix, ShieldCI Configuration, References, Related Analyzers

Pro analyzers are listed in `.vitepress/theme/data/pro-analyzers.ts`; `pro-tier-sync.test.ts` keeps that list consistent with the pages.

### Code Example Conventions

There are **two distinct patterns** for showing before/after comparisons in analyzer docs. Use each in the right context — don't mix them.

#### 1. Bold section labels (outside code blocks)

Use when the before and after examples are **separate code blocks** with descriptive labels as headings.

```markdown
**Before (❌):**
```php
$results = DB::select("SELECT * FROM users WHERE id = '" . $userId . "'");
```

**After (✅):**
```php
$results = DB::select("SELECT * FROM users WHERE id = ?", [$userId]);
```
```

#### 2. Inline code comments (inside a single code block)

Use when showing the old and new code **side-by-side within one fenced block**, or when the comment is part of the code sample itself.

```markdown
```php
// ❌ Before: string concatenation
$results = DB::select("SELECT * FROM users WHERE id = '" . $userId . "'");

// ✅ After: parameter binding
$results = DB::select("SELECT * FROM users WHERE id = ?", [$userId]);
```
```

The `// ❌ BAD` / `// ✅ GOOD` variant (used in best-practices docs) is also acceptable for inline comments and follows the same rule.

#### ❌ Do NOT use these inconsistent formats
- `**Before:**` / `**After:**` — missing emoji, use pattern 1 above instead
- `### Before` / `### After` — heading level is wrong, use bold labels instead

## Custom Components
All components in `.vitepress/theme/components/` are registered globally in `.vitepress/theme/index.ts`, so they can be used directly in markdown. `Breadcrumbs` and `ProBadge` are also injected into the `doc-before` layout slot on every page.

To add one: create the `.vue` file, register it in `theme/index.ts`, and add a test under `__tests__/components/` (coverage thresholds are 100%).

## Development
```bash
npm install
npm run dev            # dev server at http://localhost:5173
npm run build          # static build → .vitepress/dist
npm run preview        # preview the production build
```

## Testing
```bash
npm test               # Vitest: content validation, sidebar sync, components, composables
npm run test:coverage  # Coverage for .vitepress/theme/** and .vitepress/seo.ts — thresholds: 100%
```
Run `npm test` before committing. CI (`.github/workflows/ci.yml`) runs the same suite and uploads coverage to Codecov.

## Deploy (Cloudflare Pages)
- Merging to `master` does **not** deploy. Publishing a GitHub release triggers `.github/workflows/deploy.yml`, which calls the Cloudflare Pages deploy hook (`CLOUDFLARE_DEPLOY_HOOK_URL` secret). It can also be run manually via `workflow_dispatch`.
- **Build command**: `npm run build`
- **Build output directory**: `.vitepress/dist`
- **Redirects**: `docs/public/_redirects` (Cloudflare `_redirects` format, copied to dist on build)

## External References
- **VitePress Docs**: https://vitepress.dev/guide/what-is-vitepress
- **Laravel Package** (analyzer source of truth): https://github.com/shieldci/laravel

## When Building Here

1. **Check VitePress docs** - Learn built-in features before custom solutions
2. **Use markdown frontmatter** - Metadata for search, categorization
3. **Keep examples realistic** - Real-world Laravel code, not toy examples
4. **Test all links** - VitePress validates internal links at build time
5. **Optimize images** - Compress before adding to `docs/public/`

## What NOT to Do

❌ Don't duplicate analyzer logic in docs (reference package code)
❌ Don't write docs without examples (show, don't just tell)
❌ Don't skip mobile testing (50%+ traffic from mobile)
❌ Don't commit large images (optimize first, or use CDN)
❌ Don't hardcode URLs (use relative links for internal pages)
❌ Don't skip dark mode testing (VitePress has built-in dark mode)
❌ Don't reference private repos or sibling-checkout paths — this file is public
❌ Don't add "Co-Authored-By: Claude Code" or "Generated with Claude Code" attribution when committing code
