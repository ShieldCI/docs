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
## Contributing

### Documentation Standards

Each analyzer documentation page should follow this structure:

1. **Frontmatter** - Title, description, icon
2. **What This Checks** - Clear description of what the analyzer detects
3. **Why It Matters** - Explain the security risk, performance impact, or compliance requirement
4. **How to Fix** - Provide Quick Fix and Proper Fix with code examples
5. **References** - Link to Laravel docs, security advisories, and related resources
6. **Related Analyzers** - Cross-link to related analyzers

## License

Same license as ShieldCI project.

---

**Built with ❤️ using VitePress**
