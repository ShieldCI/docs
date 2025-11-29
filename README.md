# ShieldCI Documentation

A modern, high-performance documentation site built with **VitePress** to serve ShieldCI's analyzer documentation with a beautiful, developer-friendly interface.

## Overview

This documentation site provides a comprehensive platform for ShieldCI documentation with:
- **Markdown-based content** - All docs written in simple Markdown files with frontmatter
- **VitePress-powered** - Fast, Vue-based static site generator optimized for documentation
- **ShieldCI brand design** - Clean, modern UI following ShieldCI Brand Design System
- **Dark/light mode** - Built-in theme switching with system preference detection
- **Full-text search** - Fast, client-side search with ⌘K keyboard shortcut
- **Auto-generated navigation** - Sidebar navigation generated from file structure
- **Table of contents** - Auto-generated TOC from page headings
- **Responsive layout** - Mobile-friendly three-column layout

## Tech Stack

- **VitePress** - Vue-powered static site generator
- **Vue 3** - Reactive UI framework
- **TypeScript** - Type-safe configuration
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide Icons** - Beautiful, consistent icon system
- **Vite** - Lightning-fast build tool and dev server

## Project Structure

```
docs/
├── .vitepress/
│   ├── config.ts              # VitePress configuration
│   ├── theme/
│   │   ├── index.ts           # Theme entry point
│   │   ├── Layout.vue         # Main layout component
│   │   ├── components/        # Custom Vue components
│   │   │   ├── Icon.vue       # Lucide icon wrapper
│   │   │   ├── Badge.vue      # Severity/status badges
│   │   │   ├── Card.vue       # Content cards
│   │   │   ├── Alert.vue      # Info/warning/error alerts
│   │   │   └── SearchModal.vue # Enhanced search with ⌘K
│   │   └── style/
│   │       └── index.css      # Global styles & Tailwind
│   └── public/                # Static assets (logo, images)
├── docs/                      # Markdown documentation files
│   ├── introduction/
│   │   ├── what-is-shieldci.md
│   │   ├── why-shieldci.md
│   │   └── how-it-works.md
│   ├── getting-started/
│   │   ├── installation.md
│   │   ├── configuration.md
│   │   └── first-analysis.md
│   └── analyzers/
│       ├── overview.md
│       ├── security/          
│       ├── performance/       
│       ├── reliability/
│       ├── code-quality/
│       └── best-practices/
├── package.json
└── tsconfig.json
```

## Key Features

### 1. VitePress Configuration (`.vitepress/config.ts`)

The core configuration handles:
- **Navigation structure** - Auto-generated sidebar from file structure
- **Search configuration** - Local search with custom styling
- **Theme customization** - ShieldCI brand colors, fonts, and components
- **Markdown extensions** - Code highlighting, frontmatter, custom components
- **SEO optimization** - Meta tags, sitemap, structured data

### 2. Custom Theme Components

Built with Vue 3 and following ShieldCI Brand Design System:

- **Layout.vue** - Main layout with header, sidebar, content, and footer
- **Icon.vue** - Lucide icon wrapper component
- **Badge.vue** - Severity indicators (critical, high, medium, low, success)
- **Card.vue** - Content cards with header, content, and footer sections
- **Alert.vue** - Info, warning, error, and success alerts
- **SearchModal.vue** - Enhanced search with ⌘K shortcut and keyboard navigation

### 3. ShieldCI Brand Design

Design tokens aligned with ShieldCI Brand Design System:

- **Typography**: Inter (body), JetBrains Mono (code)
- **Colors**: Shield Blue (#3B82F6) primary, semantic colors for status
- **Icons**: Lucide icon library
- **Spacing**: 8px grid system
- **Components**: Buttons, cards, badges following brand specifications

### 4. Enhanced Search

- **⌘K / Ctrl+K** keyboard shortcut to open search
- **Live search** across all documentation pages
- **Category filters** for better result organization
- **Keyboard navigation** (arrow keys, enter to select)
- **Result highlighting** with excerpts

### 5. Dark/Light Mode

- **System preference detection** on first visit
- **User preference persistence** in localStorage
- **Smooth theme transitions**
- **Optimized contrast** for both themes

## Development

### Prerequisites

- **Node.js** 18+ and npm
- **TypeScript** knowledge (for theme customization)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit: http://localhost:5173
```

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Serve production build
npm run serve
```

### Adding New Documentation

1. Create a Markdown file in the appropriate directory:
   ```
   docs/analyzers/{category}/{slug}.md
   ```

2. Add frontmatter to the file:
   ```yaml
   ---
   title: Page Title
   description: Page description for SEO and search
   icon: shield-check
   sidebar: true
   outline: [2, 3]
   ---
   ```

3. Write your content in Markdown:
   ```markdown
   # Page Title

   Your content here...
   ```

4. The page will automatically appear in navigation and search results

### Frontmatter Options

- `title` - Page title (used in navigation and `<title>` tag)
- `description` - Page description (SEO and search)
- `icon` - Lucide icon name (displayed in navigation)
- `sidebar` - Show in sidebar navigation (default: `true`)
- `outline` - Table of contents depth (e.g., `[2, 3]` for h2 and h3)

### URL Structure

Documentation is served with clean URLs:
- Homepage: `/` (defaults to introduction/what-is-shieldci)
- Category pages: `/{category}/{slug}`
- Analyzer pages: `/analyzers/{category}/{slug}`

Examples:
- `/introduction/what-is-shieldci`
- `/getting-started/installation`
- `/analyzers/security/app-key-security`
- `/analyzers/performance/opcache-enabled`

## Customization

### Changing Colors

Edit `.vitepress/theme/style/index.css`:
```css
@theme {
  --color-primary-600: #3B82F6;  /* ShieldCI brand blue */
  /* Add custom theme variables */
}
```

### Modifying Navigation

Edit `.vitepress/theme/utils/sidebar.ts`:
- Customize sidebar structure
- Add icons to navigation items
- Control section collapsing behavior

### Updating Layout

Edit `.vitepress/theme/Layout.vue`:
- Header, footer, and overall structure
- Custom components and slots
- Meta tags and SEO settings

### Adding Custom Components

1. Create component in `.vitepress/theme/components/`
2. Register in `.vitepress/theme/index.ts`
3. Use in Markdown with `<ComponentName />`

## Performance

- **Static Site Generation** - Pre-rendered HTML for optimal performance
- **Code Splitting** - Automatic route-based code splitting
- **Asset Optimization** - Images, fonts, and assets optimized automatically
- **Fast Navigation** - Client-side routing with prefetching
- **Small Bundle Size** - Tree-shaking and minification

Expected performance:
- **First Contentful Paint**: < 1s
- **Lighthouse Score**: > 90
- **Bundle Size**: ~50KB CSS, ~100KB JS (gzipped)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile, tablet, and desktop
- Progressive enhancement (works without JavaScript for static content)

## Deployment

### Build for Production

```bash
npm run build
```

Output directory: `.vitepress/dist/`

### Deployment Options

**Vercel (Recommended)**
```bash
npm install -g vercel
vercel
```

**Netlify**
- Connect GitHub repository
- Build command: `npm run build`
- Publish directory: `.vitepress/dist`

**GitHub Pages**
```bash
npm install -D gh-pages
npm run build
npx gh-pages -d .vitepress/dist
```

**Static Server (Nginx/Apache)**
```bash
npm run build
# Copy .vitepress/dist/* to web server root
```

## Contributing

### Documentation Standards

Each analyzer documentation page should follow this structure:

1. **Frontmatter** - Title, description, icon
2. **What This Checks** - Clear description of what the analyzer detects
3. **Why It Matters** - Explain the security risk, performance impact, or compliance requirement
4. **How to Fix** - Provide Quick Fix and Proper Fix with code examples
5. **Common Mistakes to Avoid** - List frequent errors and pitfalls
6. **References** - Link to Laravel docs, security advisories, and related resources
7. **Related Analyzers** - Cross-link to related analyzers

### Code Examples

Always provide before/after code examples:

```php
**Before (❌):**
// Vulnerable code
DB::raw($userInput);

**After (✅):**
// Secure code
DB::raw(DB::escape($userInput));
```

### Severity Indicators

Use Badge components for severity:
- **Critical:** `<Badge variant="critical">Critical</Badge>`
- **High:** `<Badge variant="high">High</Badge>`
- **Medium:** `<Badge variant="medium">Medium</Badge>`
- **Low:** `<Badge variant="low">Low</Badge>`

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules .vitepress/cache
npm install
npm run build
```

### Search Not Working

- Ensure all Markdown files have proper frontmatter
- Check that `search.provider: 'local'` is set in config
- Verify file structure matches navigation configuration

### Styling Issues

- Clear browser cache
- Check Tailwind CSS configuration in `index.css`
- Verify brand color variables are defined

## Resources

- [VitePress Documentation](https://vitepress.dev/)
- [VitePress Theme Guide](https://vitepress.dev/guide/theme-introduction)
- [Vue 3 Documentation](https://vuejs.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [ShieldCI Brand Design System](../strategy/ShieldCI_Brand_Design_System.md)

## License

Same license as ShieldCI project.

---

**Built with ❤️ using VitePress**
