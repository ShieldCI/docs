import { defineConfig } from 'vitepress'
import tailwindcss from '@tailwindcss/vite'
import llmstxt from 'vitepress-plugin-llms'

export default defineConfig({
    title: 'ShieldCI',
    description: 'Comprehensive security and performance analysis for Laravel applications',

    // Source directory
    srcDir: 'docs',

    // Clean URLs
    cleanUrls: true,

    // Ignore dead links
    ignoreDeadLinks: true,

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
            /*{
                text: 'Home',
                link: 'https://shieldci.com'
            },*/
            {
                text: 'Changelog',
                link: 'https://github.com/shieldci/laravel/releases'
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
                                { text: 'Application Key', link: '/analyzers/security/app-key' },
                                { text: 'Auth & Authorization', link: '/analyzers/security/authentication-authorization' },
                                { text: 'Cookie', link: '/analyzers/security/cookie' },
                                { text: 'CSRF Protection', link: '/analyzers/security/csrf-protection' },
                                { text: 'Debug Mode', link: '/analyzers/security/debug-mode' },
                                { text: 'License Compliance', link: '/analyzers/security/license-compliance' },
                                { text: 'Environment File', link: '/analyzers/security/env-file' },
                                { text: 'Env HTTP Exposure', link: '/analyzers/security/env-http-accessibility' },
                                { text: 'File Permissions', link: '/analyzers/security/file-permissions' },
                                { text: 'Fillable Foreign Key', link: '/analyzers/security/fillable-foreign-key' },
                                { text: 'Frontend Dependencies', link: '/analyzers/security/frontend-vulnerable-dependencies' },
                                { text: 'HSTS Header', link: '/analyzers/security/hsts-header' },
                                { text: 'Login Throttling', link: '/analyzers/security/login-throttling' },
                                { text: 'Mass Assignment', link: '/analyzers/security/mass-assignment-vulnerabilities' },
                                { text: 'Hashing Strength', link: '/analyzers/security/hashing-strength' },
                                { text: 'PHP Configuration', link: '/analyzers/security/php-ini' },
                                { text: 'SQL Injection', link: '/analyzers/security/sql-injection' },
                                { text: 'Stable Dependencies', link: '/analyzers/security/stable-dependencies' },
                                { text: 'Unguarded Models', link: '/analyzers/security/unguarded-models' },
                                { text: 'Up-to-Date Dependencies', link: '/analyzers/security/up-to-date-dependencies' },
                                { text: 'Vulnerable Dependencies', link: '/analyzers/security/vulnerable-dependencies' },
                                { text: 'XSS Vulnerabilities', link: '/analyzers/security/xss-vulnerabilities' },
                            ]
                        },
                        {
                            text: 'Performance',
                            link: '/analyzers/performance/',
                            collapsed: true,
                            items: [
                                { text: 'Asset Cache Headers', link: '/analyzers/performance/asset-cache-headers' },
                                { text: 'Asset Minification', link: '/analyzers/performance/asset-minification' },
                                { text: 'Cache Driver', link: '/analyzers/performance/cache-driver' },
                                { text: 'Collection Optimization', link: '/analyzers/performance/collection-call-optimization' },
                                { text: 'Autoloader Optimization', link: '/analyzers/performance/autoloader-optimization' },
                                { text: 'Config Caching', link: '/analyzers/performance/config-caching' },
                                { text: 'Debug Log Level', link: '/analyzers/performance/debug-log-level' },
                                { text: 'Dev Deps in Production', link: '/analyzers/performance/dev-dependencies-production' },
                                { text: 'Env Outside Config', link: '/analyzers/performance/env-call-outside-config' },
                                { text: 'Horizon Suggestion', link: '/analyzers/performance/horizon-suggestion' },
                                { text: 'MySQL Optimization', link: '/analyzers/performance/mysql-single-server-optimization' },
                                { text: 'OPcache', link: '/analyzers/performance/opcache-enabled' },
                                { text: 'Queue Driver', link: '/analyzers/performance/queue-driver' },
                                { text: 'Route Caching', link: '/analyzers/performance/route-caching' },
                                { text: 'Session Driver', link: '/analyzers/performance/session-driver' },
                                { text: 'Shared Cache Lock', link: '/analyzers/performance/shared-cache-lock' },
                                { text: 'Unused Middleware', link: '/analyzers/performance/unused-global-middleware' },
                                { text: 'View Caching', link: '/analyzers/performance/view-caching' },
                            ]
                        },
                        {
                            text: 'Reliability',
                            link: '/analyzers/reliability/',
                            collapsed: true,
                            items: [
                                { text: 'Cache Prefix', link: '/analyzers/reliability/cache-prefix-configuration' },
                                { text: 'Cache Status', link: '/analyzers/reliability/cache-status' },
                                { text: 'Composer Validation', link: '/analyzers/reliability/composer-validation' },
                                { text: 'Custom Error Pages', link: '/analyzers/reliability/custom-error-pages' },
                                { text: 'Database Status', link: '/analyzers/reliability/database-status' },
                                { text: 'Directory Permissions', link: '/analyzers/reliability/directory-write-permissions' },
                                { text: 'Env Example Docs', link: '/analyzers/reliability/env-example-documented' },
                                { text: 'Env File Exists', link: '/analyzers/reliability/env-file-exists' },
                                { text: 'Env Variables Complete', link: '/analyzers/reliability/env-variables-complete' },
                                { text: 'Maintenance Mode', link: '/analyzers/reliability/maintenance-mode-status' },
                                { text: 'PHPStan', link: '/analyzers/reliability/phpstan' },
                                { text: 'Queue Timeout', link: '/analyzers/reliability/queue-timeout-configuration' },
                                { text: 'Up-to-Date Migrations', link: '/analyzers/reliability/up-to-date-migrations' },
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
                            ]
                        },
                        {
                            text: 'Best Practices',
                            link: '/analyzers/best-practices/',
                            collapsed: true,
                            items: [
                                { text: 'N+1 Query', link: '/analyzers/best-practices/eloquent-n-plus-one' },
                                { text: 'Fat Model', link: '/analyzers/best-practices/fat-model' },
                                { text: 'Framework Override', link: '/analyzers/best-practices/framework-override' },
                                { text: 'Hardcoded Config', link: '/analyzers/best-practices/config-outside-config' },
                                { text: 'Hardcoded Paths', link: '/analyzers/best-practices/hardcoded-storage-paths' },
                                { text: 'Helper Abuse', link: '/analyzers/best-practices/helper-function-abuse' },
                                { text: 'Logic in Blade', link: '/analyzers/best-practices/logic-in-blade' },
                                { text: 'Logic in Routes', link: '/analyzers/best-practices/logic-in-routes' },
                                { text: 'Missing Chunk', link: '/analyzers/best-practices/chunk-missing' },
                                { text: 'Missing Transactions', link: '/analyzers/best-practices/missing-database-transactions' },
                                { text: 'Missing Error Tracking', link: '/analyzers/best-practices/missing-error-tracking' },
                                { text: 'Mixed Query/Eloquent', link: '/analyzers/best-practices/mixed-query-builder-eloquent' },
                                { text: 'PHP-Side Filtering', link: '/analyzers/best-practices/php-side-filtering' },
                                { text: 'Container Resolution', link: '/analyzers/best-practices/service-container-resolution' },
                                { text: 'Silent Failure', link: '/analyzers/best-practices/silent-failure' },
                            ]
                        },
                    ]
                },
            ],
        },

        // Search
        search: {
            provider: 'algolia',
            options: {
                appId: 'XVN8IXORZF',
                apiKey: '86f0c3b09d78172f3cc3cac991c10af0',
                indexName: 'shieldci_docs',
                askAi: 'vm0ybu30QDS3'
            }
        },

        // Social links
        socialLinks: [
            {
                icon: 'github',
                link: 'https://github.com/shieldci/laravel'
            }
        ],

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
        lineNumbers: true,
    },

    vite: {
        plugins: [
            tailwindcss(),
            llmstxt({ignoreFiles: ['index.md']})
        ],
    },
})

