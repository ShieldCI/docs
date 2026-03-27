# ShieldCI Documentation Site

## Purpose
Public documentation for ShieldCI platform and packages using VitePress.

## Status
✅ **IMPLEMENTED** - Using VitePress (https://vitepress.dev/)

## Stack
- VitePress (Vue.js-based static site generator)
- Vue 3 (for custom components)
- Markdown (content format)
- TypeScript (for custom functionality)
- Algolia DocSearch (search integration)

## Architecture

### VitePress Structure
```
docs/
├── .vitepress/
│   ├── config.ts              # VitePress configuration
│   ├── theme/
│   │   ├── index.ts           # Custom theme entry
│   │   ├── components/        # Custom Vue components
│   │   └── styles/            # Custom CSS
│   └── cache/
├── public/
│   ├── images/
│   ├── videos/
│   └── favicon.ico
├── guide/
│   ├── index.md               # Getting started
│   ├── installation.md
│   ├── configuration.md
│   └── usage.md
├── analyzers/
│   ├── security/
│   │   ├── xss-detection.md
│   │   ├── sql-injection.md
│   │   └── ... (100+ analyzer docs)
│   ├── performance/
│   ├── reliability/
│   ├── code-quality/
│   └── best-practices/
├── api/
│   ├── authentication.md
│   ├── endpoints.md
│   └── webhooks.md
├── platform/
│   ├── dashboard.md
│   ├── projects.md
│   ├── teams.md
│   └── billing.md
└── index.md                   # Homepage
```

**Why VitePress**: Fast, Vue-powered, excellent DX, built-in features (search, sidebar, code highlighting, dark mode).

### Configuration File

```typescript
// .vitepress/config.ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ShieldCI Documentation',
  description: 'Laravel Security Analysis Platform',

  themeConfig: {
    logo: '/images/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Analyzers', link: '/analyzers/' },
      { text: 'API', link: '/api/' },
      { text: 'Platform', link: '/platform/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Configuration', link: '/guide/configuration' },
          ]
        },
        {
          text: 'Usage',
          items: [
            { text: 'Running Analysis', link: '/guide/usage' },
            { text: 'CI Integration', link: '/guide/ci-integration' },
            { text: 'Platform Integration', link: '/guide/platform-integration' },
          ]
        }
      ],

      '/analyzers/': [
        {
          text: 'Security Analyzers',
          items: [
            { text: 'XSS Detection', link: '/analyzers/security/xss-detection' },
            { text: 'SQL Injection', link: '/analyzers/security/sql-injection' },
            // ... 100+ analyzers
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/shieldci' },
      { icon: 'twitter', link: 'https://twitter.com/shieldci' }
    ],

    search: {
      provider: 'algolia',
      options: {
        appId: process.env.ALGOLIA_APP_ID,
        apiKey: process.env.ALGOLIA_API_KEY,
        indexName: 'shieldci'
      }
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 ShieldCI'
    }
  }
})
```

**Why this config**: Comprehensive navigation. Search integration. Social links. Footer.

## Content Structure

### Analyzer Documentation Template
```markdown
---
title: XSS Detection
description: Detects Cross-Site Scripting vulnerabilities in Blade templates
category: Security
severity: Critical
tags: [security, xss, blade]
---

# XSS Detection

## Overview
Detects unescaped output in Blade templates that could lead to Cross-Site Scripting (XSS) vulnerabilities.

## What It Detects
- `{!! $variable !!}` unescaped output
- `<script>{{ $var }}</script>` within script tags
- Unsafe HTML attributes

## Examples

### ❌ Bad
```blade
<!-- Unescaped output -->
<div>{!! $user->name !!}</div>

<!-- Variable in script tag -->
<script>
  var name = '{{ $user->name }}';
</script>
```

### ✅ Good
```blade
<!-- Escaped output -->
<div>{{ $user->name }}</div>

<!-- JSON-encoded in script -->
<script>
  var name = @json($user->name);
</script>
```

## Configuration
```php
// config/shieldci.php
'analyzers' => [
    'xss-detection' => [
        'enabled' => true,
        'ignore_patterns' => [
            'resources/views/admin/**', // Trusted admin views
        ],
    ],
],
```

## How to Fix
1. Replace `{!! !!}` with `{{ }}` for automatic escaping
2. Use `@json()` directive for JavaScript variables
3. Use `Purifier` for user-generated HTML

## Learn More
- [Laravel Security Docs](https://laravel.com/docs/blade#displaying-unescaped-data)
- [OWASP XSS Guide](https://owasp.org/www-community/attacks/xss/)

## Related Analyzers
- [CSRF Protection](/analyzers/security/csrf-protection)
- [HTML Injection](/analyzers/security/html-injection)
```

**Why this template**: Consistent structure. Examples show problems and solutions. Configuration options. Related content.

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

### Code Comparison Component
```vue
<!-- .vitepress/theme/components/CodeComparison.vue -->
<template>
  <div class="code-comparison">
    <div class="bad">
      <h4>❌ Bad</h4>
      <slot name="bad" />
    </div>
    <div class="good">
      <h4>✅ Good</h4>
      <slot name="good" />
    </div>
  </div>
</template>

<style scoped>
.code-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
</style>
```

**Usage in Markdown**:
```markdown
<CodeComparison>
  <template #bad>
    ```php
    // Bad code
    ```
  </template>
  <template #good>
    ```php
    // Good code
    ```
  </template>
</CodeComparison>
```

**Why custom components**: Enhance documentation with interactive elements. Better than static markdown.

### Analyzer Card Component
```vue
<!-- .vitepress/theme/components/AnalyzerCard.vue -->
<template>
  <div class="analyzer-card" :class="severity">
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <div class="meta">
      <span class="category">{{ category }}</span>
      <span class="severity">{{ severity }}</span>
    </div>
  </div>
</template>
```

**Why analyzer cards**: Visual representation of analyzers. Filterable. Severity color-coding.

## Build & Deploy

### Development
```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Access at http://localhost:5173
```

### Build for Production
```bash
# Build static site
npm run build

# Preview production build
npm run preview
```

### Deploy to Cloudflare Pages

- **Build command**: `npm run build`
- **Build output directory**: `.vitepress/dist`
- **Redirects**: `public/_redirects` (Cloudflare `_redirects` format, copied to dist on build)
- **Headers**: `public/_headers` (if needed for custom cache/security headers)

**Why Cloudflare Pages**: Global edge network, automatic preview deployments on PRs, generous free tier, native `_redirects`/`_headers` support.

**Deploy URL**: https://docs.shieldci.com

## Content Automation

### Generate Analyzer Docs
```typescript
// scripts/generate-analyzer-docs.ts
import { analyzers } from '../laravel/src/Analyzers'

for (const analyzer of analyzers) {
  const metadata = analyzer.getMetadata()

  const content = `---
title: ${metadata.name}
description: ${metadata.description}
category: ${metadata.category}
severity: ${metadata.severity}
---

# ${metadata.name}

${metadata.description}

<!-- Auto-generated content -->
`

  writeFileSync(`docs/analyzers/${metadata.id}.md`, content)
}
```

**Why automate**: 100+ analyzers. Manual documentation error-prone. Single source of truth (analyzer metadata).

## Search Integration

### Algolia DocSearch
```javascript
// .vitepress/config.ts
search: {
  provider: 'algolia',
  options: {
    appId: 'SHIELDCI_ALGOLIA_APP_ID',
    apiKey: 'SHIELDCI_ALGOLIA_API_KEY',
    indexName: 'shieldci',

    // Custom search parameters
    searchParameters: {
      facetFilters: ['category:guide', 'category:analyzers']
    }
  }
}
```

**Why Algolia**: Fast, typo-tolerant, faceted search. Free for open source docs.

## Version Management

### Multi-Version Docs
```typescript
// .vitepress/config.ts
export default defineConfig({
  themeConfig: {
    nav: [
      {
        text: 'v1.0.0',
        items: [
          { text: 'v1.0.0 (current)', link: '/' },
          { text: 'v0.9.0', link: 'https://v0-9.docs.shieldci.com' }
        ]
      }
    ]
  }
})
```

**Why versioning**: Users on old versions need old docs. Platform evolves, docs must match.

## Common Tasks

### Add New Page
```bash
# Create markdown file
echo "# New Page" > docs/guide/new-page.md

# Add to sidebar in .vitepress/config.ts
# Edit sidebar configuration
```

### Update Analyzer Docs
```bash
# Run automation script
npm run generate:analyzers

# Review generated content
git diff docs/analyzers/

# Commit changes
git add docs/analyzers/
git commit -m "docs: update analyzer documentation"
```

### Add Custom Component
```bash
# Create component
touch .vitepress/theme/components/MyComponent.vue

# Register globally in theme/index.ts
# Import and use in markdown
```

## External References

- **PRD**: `../strategy/ShieldCI_PRD.md` (Section 13: Documentation)
- **VitePress Docs**: https://vitepress.dev/guide/what-is-vitepress
- **Laravel Package**: `./LARAVEL_CLAUDE.md` (Analyzer metadata source)

## When Building Here

1. **Check VitePress docs** - Learn built-in features before custom solutions
2. **Use markdown frontmatter** - Metadata for search, categorization
3. **Keep examples realistic** - Real-world Laravel code, not toy examples
4. **Test all links** - VitePress validates internal links at build time
5. **Optimize images** - Compress before adding to public/

## What NOT to Do

❌ Don't duplicate analyzer logic in docs (reference package code)
❌ Don't write docs without examples (show, don't just tell)
❌ Don't skip mobile testing (50%+ traffic from mobile)
❌ Don't commit large images (optimize first, or use CDN)
❌ Don't hardcode URLs (use relative links for internal pages)
❌ Don't skip dark mode testing (VitePress has built-in dark mode)
❌ Don't add "Co-Authored-By: Claude Code" or "Generated with Claude Code" attribution when committing code
