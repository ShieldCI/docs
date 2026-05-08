import { defineConfig, type HeadConfig } from 'vitepress'
import { loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import llmstxt from 'vitepress-plugin-llms'

// Load env vars from .env files (local dev) merged with process.env (CloudFlare Pages)
const env = loadEnv('production', process.cwd(), '')

const siteUrl = env.SITE_URL || 'https://docs.shieldci.com'
const gaMeasurementId = env.GA_MEASUREMENT_ID || ''
const algoliaAppId = env.ALGOLIA_APP_ID || ''
const algoliaApiKey = env.ALGOLIA_API_KEY || ''
const algoliaIndexName = env.ALGOLIA_INDEX_NAME || 'shieldci_docs'
const algoliaAskAiId = env.ALGOLIA_ASK_AI_ID || ''

export default defineConfig({
    title: 'ShieldCI',
    description: 'Automated code analysis for Laravel applications — 73 analyzers covering security, performance, reliability, best practices, and code quality.',

    // Source directory
    srcDir: 'docs',

    // Exclude files from build
    srcExclude: ['**/README.md'],

    // Clean URLs
    cleanUrls: true,

    // Sitemap generation
    sitemap: {
        hostname: siteUrl,
        transformItems: (items) => items
            .filter(item => !item.url.includes('README')
                && item.url !== 'introduction/'
                && item.url !== 'getting-started/')
            .map(item => {
                const url = item.url
                return {
                    ...item,
                    url,
                    changefreq: url.includes('analyzers/') ? 'weekly' : 'monthly',
                    priority: url === '' ? 1.0 : url.includes('analyzers/') ? 0.8 : 0.6
                }
            })
    },

    // Head configuration for fonts, favicon, meta tags, and analytics
    head: [
        ['link', { rel: 'icon', href: '/icon.svg', type: 'image/svg+xml' }],
        ['meta', { name: 'theme-color', content: '#7F22FE' }],
        ['meta', { name: 'author', content: 'ShieldCI' }],
        ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
        ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
        ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
        ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
        ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap', rel: 'stylesheet' }],
        // Google Analytics (conditional — disabled when GA_MEASUREMENT_ID is unset)
        ...(gaMeasurementId ? [
            ['script', { async: '', src: `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}` }],
            ['script', {}, `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaMeasurementId}');`],
        ] as HeadConfig[] : []),
    ],

    // Dynamic per-page OG/Twitter meta and JSON-LD structured data
    transformHead({ pageData }) {
        const head: HeadConfig[] = []
        const title = pageData.frontmatter.title || pageData.title || 'ShieldCI Documentation'
        const description = pageData.frontmatter.description || 'Automated code analysis for Laravel applications — security, performance, reliability, best practices, and code quality.'
        const relativePath = pageData.relativePath.replace(/\.md$/, '').replace(/index$/, '')
        const pageUrl = `${siteUrl}/${relativePath}`

        // Canonical URL
        head.push(['link', { rel: 'canonical', href: pageUrl }])

        // Robots meta with rich snippet directives
        head.push(['meta', { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large' }])

        // Keywords meta from frontmatter tags
        if (pageData.frontmatter.tags) {
            head.push(['meta', { name: 'keywords', content: pageData.frontmatter.tags }])
        }

        // Article date metadata
        if (pageData.frontmatter.date) {
            head.push(['meta', { property: 'article:published_time', content: pageData.frontmatter.date }])
        }
        if (pageData.lastUpdated) {
            head.push(['meta', { property: 'article:modified_time', content: new Date(pageData.lastUpdated).toISOString() }])
        }

        // OG meta tags
        head.push(['meta', { property: 'og:title', content: title }])
        head.push(['meta', { property: 'og:description', content: description }])
        head.push(['meta', { property: 'og:type', content: 'article' }])
        head.push(['meta', { property: 'og:site_name', content: 'ShieldCI' }])
        head.push(['meta', { property: 'og:url', content: pageUrl }])
        head.push(['meta', { property: 'og:image', content: `${siteUrl}/og-image.png` }])
        head.push(['meta', { property: 'og:image:width', content: '1200' }])
        head.push(['meta', { property: 'og:image:height', content: '630' }])

        // Twitter card meta tags
        head.push(['meta', { name: 'twitter:card', content: 'summary_large_image' }])
        head.push(['meta', { name: 'twitter:site', content: '@shieldci' }])
        head.push(['meta', { name: 'twitter:title', content: title }])
        head.push(['meta', { name: 'twitter:description', content: description }])
        head.push(['meta', { name: 'twitter:image', content: `${siteUrl}/og-image.png` }])

        // Build breadcrumb items for JSON-LD
        const pathSegments = relativePath.split('/').filter(Boolean)
        const breadcrumbItems = [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl }
        ]

        let currentPath = ''
        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`
            const name = segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            breadcrumbItems.push({
                '@type': 'ListItem',
                position: index + 2,
                name: index === pathSegments.length - 1 ? title : name,
                item: index === pathSegments.length - 1 ? undefined : `${siteUrl}${currentPath}`
            })
        })

        // BreadcrumbList JSON-LD (for all pages with depth > 0)
        if (pathSegments.length > 0) {
            const breadcrumbSchema = {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: breadcrumbItems
            }
            head.push(['script', { type: 'application/ld+json' }, JSON.stringify(breadcrumbSchema)])
        }

        // TechArticle JSON-LD (for analyzer documentation pages)
        if (relativePath.startsWith('analyzers/') && pathSegments.length > 1) {
            const techArticleSchema = {
                '@context': 'https://schema.org',
                '@type': 'TechArticle',
                headline: title,
                description: description,
                url: pageUrl,
                author: {
                    '@type': 'Organization',
                    name: 'ShieldCI',
                    url: 'https://shieldci.com'
                },
                publisher: {
                    '@type': 'Organization',
                    name: 'ShieldCI',
                    url: 'https://shieldci.com'
                }
            }
            head.push(['script', { type: 'application/ld+json' }, JSON.stringify(techArticleSchema)])
        }

        // Organization JSON-LD (homepage only)
        if (relativePath === '' || relativePath === 'index') {
            const orgSchema = {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'ShieldCI',
                url: 'https://shieldci.com',
                logo: `${siteUrl}/logo.svg`,
                sameAs: [
                    'https://github.com/shieldci/laravel',
                    'https://discord.gg/2u6neGqD'
                ]
            }
            head.push(['script', { type: 'application/ld+json' }, JSON.stringify(orgSchema)])
        }

        return head
    },

    // Theme configuration
    themeConfig: {
        logo: {
            light: '/logo.svg',
            dark: '/logo-dark.svg',
            alt: 'ShieldCI',
        },
        siteTitle: false,

        // Navigation
        nav: [
            {
                text: 'Home',
                link: 'https://shieldci.com'
            },
            {
                text: 'Changelog',
                link: 'https://github.com/shieldci/laravel/blob/master/CHANGELOG.md'
            },
        ],

        // Sidebar (manually defined for control over ordering and naming)
        sidebar: {
            '/': [
                {
                    text: 'Introduction',
                    collapsed: true,
                    items: [
                        { text: 'What is ShieldCI?', link: '/introduction/what-is-shieldci' },
                        { text: 'Why ShieldCI?', link: '/introduction/why-shieldci' },
                        { text: 'How It Works', link: '/introduction/how-it-works' },
                    ]
                },
                {
                    text: 'Getting Started',
                    collapsed: true,
                    items: [
                        { text: 'Installation', link: '/getting-started/installation' },
                        { text: 'Configuration', link: '/getting-started/configuration' },
                        { text: 'First Analysis', link: '/getting-started/first-analysis' },
                        { text: 'CI/CD Integration', link: '/getting-started/ci-cd-integration' },
                        { text: 'Troubleshooting', link: '/getting-started/troubleshooting' },
                    ]
                },
                {
                    text: 'Analyzers',
                    link: '/analyzers/',
                    collapsed: false,
                    items: [
                        {
                            text: 'Security',
                            link: '/analyzers/security/',
                            collapsed: true,
                            items: [
                                { text: 'Application Key', link: '/analyzers/security/app-key-security' },
                                { text: 'Arbitrary File Upload', link: '/analyzers/security/arbitrary-file-upload' },
                                { text: 'Audit Logging', link: '/analyzers/security/audit-logging' },
                                { text: 'Auth & Authorization', link: '/analyzers/security/authentication-authorization' },
                                { text: 'Cashier Paddle', link: '/analyzers/security/cashier-paddle' },
                                { text: 'Cashier Security', link: '/analyzers/security/cashier-security' },
                                { text: 'Clickjacking', link: '/analyzers/security/clickjacking' },
                                { text: 'Column Name SQL Injection', link: '/analyzers/security/column-name-sql-injection' },
                                { text: 'Command Injection', link: '/analyzers/security/command-injection' },
                                { text: 'Cookie', link: '/analyzers/security/cookie' },
                                { text: 'Cookie Domain', link: '/analyzers/security/cookie-domain' },
                                { text: 'CORS Configuration', link: '/analyzers/security/cors-config' },
                                { text: 'CSRF Protection', link: '/analyzers/security/csrf-protection' },
                                { text: 'Cryptographic Weakness', link: '/analyzers/security/cryptographic-weakness' },
                                { text: 'Debug Mode', link: '/analyzers/security/debug-mode' },
                                { text: 'Directory Traversal', link: '/analyzers/security/directory-traversal' },
                                { text: 'Environment File', link: '/analyzers/security/env-file' },
                                { text: 'Env HTTP Exposure', link: '/analyzers/security/env-http-accessibility' },
                                { text: 'Eval Usage', link: '/analyzers/security/eval' },
                                { text: 'Extract Usage', link: '/analyzers/security/extract' },
                                { text: 'File Permissions', link: '/analyzers/security/file-permissions' },
                                { text: 'Filament Custom Pages', link: '/analyzers/security/filament-custom-pages' },
                                { text: 'Filament Form Validation', link: '/analyzers/security/filament-form-validation' },
                                { text: 'Filament Navigation', link: '/analyzers/security/filament-navigation' },
                                { text: 'Filament Panel Security', link: '/analyzers/security/filament-panel-security' },
                                { text: 'Filament Resource Authorization', link: '/analyzers/security/filament-resource-authorization' },
                                { text: 'Filament Tenancy', link: '/analyzers/security/filament-tenancy' },
                                { text: 'Filament Widget Security', link: '/analyzers/security/filament-widget-security' },
                                { text: 'Fillable Foreign Key', link: '/analyzers/security/fillable-foreign-key' },
                                { text: 'Fortify Security', link: '/analyzers/security/fortify-security' },
                                { text: 'Frontend Dependencies', link: '/analyzers/security/frontend-vulnerable-dependencies' },
                                { text: 'GDPR Compliance', link: '/analyzers/security/gdpr-compliance' },
                                { text: 'Hardcoded Credentials', link: '/analyzers/security/hardcoded-credentials' },
                                { text: 'Horizon Security', link: '/analyzers/security/horizon-security' },
                                { text: 'Host Injection', link: '/analyzers/security/host-injection' },
                                { text: 'HSTS Header', link: '/analyzers/security/hsts-header' },
                                { text: 'Inertia Security', link: '/analyzers/security/inertia-security' },
                                { text: 'License Compliance', link: '/analyzers/security/license-compliance' },
                                { text: 'Livewire Security', link: '/analyzers/security/livewire-security' },
                                { text: 'Login Throttling', link: '/analyzers/security/login-throttling' },
                                { text: 'Mass Assignment', link: '/analyzers/security/mass-assignment-vulnerabilities' },
                                { text: 'MIME Sniffing', link: '/analyzers/security/mime-sniffing' },
                                { text: 'Nova Security', link: '/analyzers/security/nova-security' },
                                { text: 'Object Injection', link: '/analyzers/security/object-injection' },
                                { text: 'Open Redirection', link: '/analyzers/security/open-redirection' },
                                { text: 'Passport Security', link: '/analyzers/security/passport-security' },
                                { text: 'Password Security', link: '/analyzers/security/password-security' },
                                { text: 'PHP Configuration', link: '/analyzers/security/php-ini' },
                                { text: 'Pulse Security', link: '/analyzers/security/pulse-security' },
                                { text: 'RCE', link: '/analyzers/security/rce' },
                                { text: 'Regex DoS', link: '/analyzers/security/regex-dos' },
                                { text: 'Reverb Security', link: '/analyzers/security/reverb-security' },
                                { text: 'Route Rate Limiting', link: '/analyzers/security/route-rate-limiting' },
                                { text: 'Sanctum Security', link: '/analyzers/security/sanctum-security' },
                                { text: 'Session Timeout', link: '/analyzers/security/session-timeout' },
                                { text: 'Socialite Security', link: '/analyzers/security/socialite-security' },
                                { text: 'SQL Injection', link: '/analyzers/security/sql-injection' },
                                { text: 'SSRF', link: '/analyzers/security/ssrf' },
                                { text: 'Stable Dependencies', link: '/analyzers/security/stable-dependencies' },
                                { text: 'Telescope Security', link: '/analyzers/security/telescope-security' },
                                { text: 'Unguarded Models', link: '/analyzers/security/unguarded-models' },
                                { text: 'Up-to-Date Dependencies', link: '/analyzers/security/up-to-date-dependencies' },
                                { text: 'Validation SQL Injection', link: '/analyzers/security/validation-sql-injection' },
                                { text: 'Vulnerable Dependencies', link: '/analyzers/security/vulnerable-dependencies' },
                                { text: 'Web Server Fingerprinting', link: '/analyzers/security/web-server-fingerprinting' },
                                { text: 'XSS Vulnerabilities', link: '/analyzers/security/xss-vulnerabilities' },
                                { text: 'XXE Vulnerabilities', link: '/analyzers/security/xxe-vulnerabilities' },
                            ]
                        },
                        {
                            text: 'Performance',
                            link: '/analyzers/performance/',
                            collapsed: true,
                            items: [
                                { text: 'Asset Cache Headers', link: '/analyzers/performance/asset-cache-headers' },
                                { text: 'Asset Minification', link: '/analyzers/performance/asset-minification' },
                                { text: 'Autoloader Optimization', link: '/analyzers/performance/autoloader-optimization' },
                                { text: 'Cache Driver', link: '/analyzers/performance/cache-driver' },
                                { text: 'CDN Configuration', link: '/analyzers/performance/cdn-configuration' },
                                { text: 'Collection Optimization', link: '/analyzers/performance/collection-call-optimization' },
                                { text: 'Command Eager Loading', link: '/analyzers/performance/command-eager-loading' },
                                { text: 'Compression Headers', link: '/analyzers/performance/compression-headers' },
                                { text: 'Config Caching', link: '/analyzers/performance/config-caching' },
                                { text: 'Database Query Optimization', link: '/analyzers/performance/database-query-optimization' },
                                { text: 'Debug Log Level', link: '/analyzers/performance/debug-log-level' },
                                { text: 'Dev Deps in Production', link: '/analyzers/performance/dev-dependencies-production' },
                                { text: 'Eager Loading', link: '/analyzers/performance/eager-loading' },
                                { text: 'Env Outside Config', link: '/analyzers/performance/env-call-outside-config' },
                                { text: 'Event Caching', link: '/analyzers/performance/event-caching' },
                                { text: 'Fallback Routes', link: '/analyzers/performance/fallback-routes' },
                                { text: 'Filament Table Optimization', link: '/analyzers/performance/filament-table-optimization' },
                                { text: 'Horizon Suggestion', link: '/analyzers/performance/horizon-suggestion' },
                                { text: 'HTTP/2 Support', link: '/analyzers/performance/http2-support' },
                                { text: 'Lazy Collection Opportunity', link: '/analyzers/performance/lazy-collection-opportunity' },
                                { text: 'MySQL Optimization', link: '/analyzers/performance/mysql-single-server-optimization' },
                                { text: 'OPcache', link: '/analyzers/performance/opcache-enabled' },
                                { text: 'Queue Driver', link: '/analyzers/performance/queue-driver' },
                                { text: 'Redis Rate Limiting', link: '/analyzers/performance/redis-rate-limiting' },
                                { text: 'Redis Single Server', link: '/analyzers/performance/redis-single-server' },
                                { text: 'Redis Throttling', link: '/analyzers/performance/redis-throttling' },
                                { text: 'Route Caching', link: '/analyzers/performance/route-caching' },
                                { text: 'Scout Config', link: '/analyzers/performance/scout-config' },
                                { text: 'Session Driver', link: '/analyzers/performance/session-driver' },
                                { text: 'Shared Cache Lock', link: '/analyzers/performance/shared-cache-lock' },
                                { text: 'Unused Middleware', link: '/analyzers/performance/unused-global-middleware' },
                                { text: 'View Caching', link: '/analyzers/performance/view-caching' },
                                { text: 'Xdebug Check', link: '/analyzers/performance/xdebug-enabled' },
                            ]
                        },
                        {
                            text: 'Reliability',
                            link: '/analyzers/reliability/',
                            collapsed: true,
                            items: [
                                { text: 'Alerting Configuration', link: '/analyzers/reliability/alerting-config' },
                                { text: 'Cache Busting', link: '/analyzers/reliability/cache-busting' },
                                { text: 'Cache Prefix', link: '/analyzers/reliability/cache-prefix-configuration' },
                                { text: 'Cache Status', link: '/analyzers/reliability/cache-status' },
                                { text: 'Composer Validation', link: '/analyzers/reliability/composer-validation' },
                                { text: 'Custom Error Pages', link: '/analyzers/reliability/custom-error-pages' },
                                { text: 'Data Retention Policy', link: '/analyzers/reliability/data-retention-policy' },
                                { text: 'Database Status', link: '/analyzers/reliability/database-status' },
                                { text: 'Dead Routes', link: '/analyzers/reliability/dead-route' },
                                { text: 'Directory Permissions', link: '/analyzers/reliability/directory-write-permissions' },
                                { text: 'Disk Space', link: '/analyzers/reliability/disk-space' },
                                { text: 'Env Example Docs', link: '/analyzers/reliability/env-example-documented' },
                                { text: 'Env File Exists', link: '/analyzers/reliability/env-file-exists' },
                                { text: 'Env Variables Complete', link: '/analyzers/reliability/env-variables-complete' },
                                { text: 'Global Variables', link: '/analyzers/reliability/global-variable' },
                                { text: 'Health Check', link: '/analyzers/reliability/health-check' },
                                { text: 'Horizon Prefix', link: '/analyzers/reliability/horizon-prefix' },
                                { text: 'Horizon Provisioning', link: '/analyzers/reliability/horizon-provisioning-plan' },
                                { text: 'Horizon Status', link: '/analyzers/reliability/horizon-status' },
                                { text: 'Maintenance Mode', link: '/analyzers/reliability/maintenance-mode-status' },
                                { text: 'Octane Configuration', link: '/analyzers/reliability/octane-config' },
                                { text: 'PCNTL Extension', link: '/analyzers/reliability/pcntl' },
                                { text: 'PHPStan', link: '/analyzers/reliability/phpstan' },
                                { text: 'Queue Blocking', link: '/analyzers/reliability/queue-blocking' },
                                { text: 'Queue Timeout', link: '/analyzers/reliability/queue-timeout-configuration' },
                                { text: 'Redis Eviction Policy', link: '/analyzers/reliability/redis-eviction-policy' },
                                { text: 'Redis Shared DB', link: '/analyzers/reliability/redis-shared-database' },
                                { text: 'Redis Status', link: '/analyzers/reliability/redis-status' },
                                { text: 'Up-to-Date Migrations', link: '/analyzers/reliability/up-to-date-migrations' },
                                { text: 'Vapor Configuration', link: '/analyzers/reliability/vapor-config' },
                            ]
                        },
                        {
                            text: 'Code Quality',
                            link: '/analyzers/code-quality/',
                            collapsed: true,
                            items: [
                                { text: 'Commented Code', link: '/analyzers/code-quality/commented-code' },
                                { text: 'Method Length', link: '/analyzers/code-quality/method-length' },
                                { text: 'Missing DocBlock', link: '/analyzers/code-quality/missing-docblock' },
                                { text: 'Naming Convention', link: '/analyzers/code-quality/naming-convention' },
                                { text: 'Nesting Depth', link: '/analyzers/code-quality/nesting-depth' },
                                { text: 'Test Coverage', link: '/analyzers/code-quality/test-coverage' },
                                { text: 'Test Data Management', link: '/analyzers/code-quality/test-data-management' },
                                { text: 'Test Quality', link: '/analyzers/code-quality/test-quality' },
                            ]
                        },
                        {
                            text: 'Best Practices',
                            link: '/analyzers/best-practices/',
                            collapsed: true,
                            items: [
                                { text: 'Accessibility', link: '/analyzers/best-practices/accessibility' },
                                { text: 'N+1 Query', link: '/analyzers/best-practices/eloquent-n-plus-one' },
                                { text: 'Fat Model', link: '/analyzers/best-practices/fat-model' },
                                { text: 'Form Request Validation', link: '/analyzers/best-practices/form-request-validation' },
                                { text: 'Framework Override', link: '/analyzers/best-practices/framework-override' },
                                { text: 'Hardcoded Config', link: '/analyzers/best-practices/config-outside-config' },
                                { text: 'Hardcoded Paths', link: '/analyzers/best-practices/hardcoded-storage-paths' },
                                { text: 'Helper Abuse', link: '/analyzers/best-practices/helper-function-abuse' },
                                { text: 'Logic in Blade', link: '/analyzers/best-practices/logic-in-blade' },
                                { text: 'Logic in Routes', link: '/analyzers/best-practices/logic-in-routes' },
                                { text: 'Middleware Misuse', link: '/analyzers/best-practices/middleware-misuse' },
                                { text: 'Missing Chunk', link: '/analyzers/best-practices/chunk-missing' },
                                { text: 'Missing Transactions', link: '/analyzers/best-practices/missing-database-transactions' },
                                { text: 'Missing Error Tracking', link: '/analyzers/best-practices/missing-error-tracking' },
                                { text: 'Mixed Query/Eloquent', link: '/analyzers/best-practices/mixed-query-builder-eloquent' },
                                { text: 'Pennant Config', link: '/analyzers/best-practices/pennant-config' },
                                { text: 'PHP-Side Filtering', link: '/analyzers/best-practices/php-side-filtering' },
                                { text: 'Policy Authorization', link: '/analyzers/best-practices/policy-authorization' },
                                { text: 'Container Resolution', link: '/analyzers/best-practices/service-container-resolution' },
                                { text: 'Silent Failure', link: '/analyzers/best-practices/silent-failure' },
                            ]
                        },
                    ]
                },
                {
                    text: 'Community',
                    collapsed: true,
                    items: [
                        { text: 'Contributing', link: '/contributing' },
                    ]
                },
            ],
        },

        // Search
        search: {
            provider: 'algolia',
            options: {
                appId: algoliaAppId,
                apiKey: algoliaApiKey,
                indexName: algoliaIndexName,
                ...(algoliaAskAiId && { askAi: algoliaAskAiId }),
            }
        },

        // Social links
        socialLinks: [
            { icon: 'github', link: 'https://github.com/shieldci/laravel' },
            { icon: 'discord', link: 'https://discord.gg/2u6neGqD' }
        ],

        // Edit on GitHub link
        editLink: {
            pattern: 'https://github.com/ShieldCI/docs/edit/master/docs/:path',
            text: 'Edit this page on GitHub'
        },

        // Footer
        footer: {
            copyright: `Copyright © ${new Date().getFullYear()} ShieldCI`
        },

        // Dark mode
        darkModeSwitchLabel: 'Theme',

        // Last updated
        lastUpdated: {
            text: 'Last updated',
            formatOptions: {
                dateStyle: 'short',
                timeStyle: 'medium'
            },
        },
    },

    // Markdown configuration
    markdown: {
        theme: {
            light: 'github-light',
            dark: 'github-dark'
        },
        lineNumbers: false, // Disabled globally; use :line-numbers per-block where needed
    },

    vite: {
        plugins: [
            tailwindcss(),
            llmstxt({ignoreFiles: ['index.md', 'README.md']})
        ],
    },
})

