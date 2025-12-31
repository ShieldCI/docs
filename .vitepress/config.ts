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
            light: '/logo-version-2.svg',
            dark: '/logo-dark-version-2.svg',
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
                                { text: 'Application Key Analyzer', link: '/analyzers/security/app-key' },
                                { text: 'Authentication & Authorization Analyzer', link: '/analyzers/security/authentication-authorization' },
                                { text: 'Cookie Analyzer', link: '/analyzers/security/cookie' },
                                { text: 'CSRF Protection Analyzer', link: '/analyzers/security/csrf-protection' },
                                { text: 'Debug Mode Analyzer', link: '/analyzers/security/debug-mode' },
                                { text: 'Dependency License Compliance Analyzer', link: '/analyzers/security/license-compliance' },
                                { text: 'Environment File Analyzer', link: '/analyzers/security/env-file' },
                                { text: 'Environment File HTTP Accessibility Analyzer', link: '/analyzers/security/env-http-accessibility' },
                                { text: 'File Permissions Analyzer', link: '/analyzers/security/file-permissions' },
                                { text: 'Fillable Foreign Key Analyzer', link: '/analyzers/security/fillable-foreign-key' },
                                { text: 'Frontend Vulnerable Dependencies Analyzer', link: '/analyzers/security/frontend-vulnerable-dependencies' },
                                { text: 'HSTS Header Analyzer', link: '/analyzers/security/hsts-header' },
                                { text: 'Login Throttling Analyzer', link: '/analyzers/security/login-throttling' },
                                { text: 'Mass Assignment Vulnerabilities Analyzer', link: '/analyzers/security/mass-assignment-vulnerabilities' },
                                { text: 'Password Hashing Strength Analyzer', link: '/analyzers/security/hashing-strength' },
                                { text: 'PHP Configuration Analyzer', link: '/analyzers/security/php-ini' },
                                { text: 'SQL Injection Analyzer', link: '/analyzers/security/sql-injection' },
                                { text: 'Stable Dependencies Analyzer', link: '/analyzers/security/stable-dependencies' },
                                { text: 'Unguarded Models Analyzer', link: '/analyzers/security/unguarded-models' },
                                { text: 'Up-to-Date Dependencies Analyzer', link: '/analyzers/security/up-to-date-dependencies' },
                                { text: 'Vulnerable Dependencies Analyzer', link: '/analyzers/security/vulnerable-dependencies' },
                                { text: 'XSS Vulnerabilities Analyzer', link: '/analyzers/security/xss-vulnerabilities' },
                            ]
                        },
                        {
                            text: 'Performance',
                            link: '/analyzers/performance/',
                            collapsed: true,
                            items: [
                                { text: 'Asset Cache Headers Analyzer', link: '/analyzers/performance/asset-cache-headers' },
                                { text: 'Asset Minification Analyzer', link: '/analyzers/performance/asset-minification' },
                                { text: 'Cache Driver Configuration Analyzer', link: '/analyzers/performance/cache-driver' },
                                { text: 'Collection Call Optimization Analyzer', link: '/analyzers/performance/collection-call-optimization' },
                                { text: 'Composer Autoloader Optimization Analyzer', link: '/analyzers/performance/autoloader-optimization' },
                                { text: 'Configuration Caching Analyzer', link: '/analyzers/performance/config-caching' },
                                { text: 'Debug Log Level Analyzer', link: '/analyzers/performance/debug-log-level' },
                                { text: 'Dev Dependencies in Production Analyzer', link: '/analyzers/performance/dev-dependencies-production' },
                                { text: 'Env Calls Outside Config Analyzer', link: '/analyzers/performance/env-call-outside-config' },
                                { text: 'Horizon Suggestion Analyzer', link: '/analyzers/performance/horizon-suggestion' },
                                { text: 'MySQL Single Server Optimization Analyzer', link: '/analyzers/performance/mysql-single-server-optimization' },
                                { text: 'OPcache Enabled Analyzer', link: '/analyzers/performance/opcache-enabled' },
                                { text: 'Queue Driver Configuration Analyzer', link: '/analyzers/performance/queue-driver' },
                                { text: 'Route Caching Analyzer', link: '/analyzers/performance/route-caching' },
                                { text: 'Session Driver Configuration Analyzer', link: '/analyzers/performance/session-driver' },
                                { text: 'Shared Cache Lock Store Analyzer', link: '/analyzers/performance/shared-cache-lock' },
                                { text: 'Unused Global Middleware Analyzer', link: '/analyzers/performance/unused-global-middleware' },
                                { text: 'View Caching Analyzer', link: '/analyzers/performance/view-caching' },
                            ]
                        },
                        {
                            text: 'Reliability',
                            link: '/analyzers/reliability/',
                            collapsed: true,
                            items: [
                                { text: 'Cache Prefix Configuration Analyzer', link: '/analyzers/reliability/cache-prefix-configuration' },
                                { text: 'Cache Status Analyzer', link: '/analyzers/reliability/cache-status' },
                                { text: 'Composer Validation Analyzer', link: '/analyzers/reliability/composer-validation' },
                                { text: 'Custom Error Pages Analyzer', link: '/analyzers/reliability/custom-error-pages' },
                                { text: 'Database Status Analyzer', link: '/analyzers/reliability/database-status' },
                                { text: 'Directory Write Permissions Analyzer', link: '/analyzers/reliability/directory-write-permissions' },
                                { text: 'Environment Example Documentation Analyzer', link: '/analyzers/reliability/env-example-documented' },
                                { text: 'Environment File Existence Analyzer', link: '/analyzers/reliability/env-file-exists' },
                                { text: 'Environment Variables Complete Analyzer', link: '/analyzers/reliability/env-variables-complete' },
                                { text: 'Maintenance Mode Status Analyzer', link: '/analyzers/reliability/maintenance-mode-status' },
                                { text: 'PHPStan Static Analysis Analyzer', link: '/analyzers/reliability/phpstan' },
                                { text: 'Queue Timeout Configuration Analyzer', link: '/analyzers/reliability/queue-timeout-configuration' },
                                { text: 'Up-to-Date Migrations Analyzer', link: '/analyzers/reliability/up-to-date-migrations' },
                            ]
                        },
                        {
                            text: 'Code Quality',
                            link: '/analyzers/code-quality/',
                            collapsed: true,
                            items: [
                                { text: 'Commented Code Analyzer', link: '/analyzers/code-quality/commented-code' },
                                { text: 'Method Length Analyzer', link: '/analyzers/code-quality/method-length' },
                                { text: 'Missing DocBlock Analyzer', link: '/analyzers/code-quality/missing-docblock' },
                                { text: 'Naming Convention Analyzer', link: '/analyzers/code-quality/naming-convention' },
                                { text: 'Nesting Depth Analyzer', link: '/analyzers/code-quality/nesting-depth' },
                            ]
                        },
                        {
                            text: 'Best Practices',
                            link: '/analyzers/best-practices/',
                            collapsed: true,
                            items: [
                                { text: 'Eloquent N+1 Query Analyzer', link: '/analyzers/best-practices/eloquent-n-plus-one' },
                                { text: 'Fat Model Analyzer', link: '/analyzers/best-practices/fat-model' },
                                { text: 'Framework Override Analyzer', link: '/analyzers/best-practices/framework-override' },
                                { text: 'Hardcoded Configuration Analyzer', link: '/analyzers/best-practices/config-outside-config' },
                                { text: 'Hardcoded Storage Paths Analyzer', link: '/analyzers/best-practices/hardcoded-storage-paths' },
                                { text: 'Helper Function Abuse Analyzer', link: '/analyzers/best-practices/helper-function-abuse' },
                                { text: 'Logic in Blade Analyzer', link: '/analyzers/best-practices/logic-in-blade' },
                                { text: 'Logic in Routes Analyzer', link: '/analyzers/best-practices/logic-in-routes' },
                                { text: 'Missing Chunk Analyzer', link: '/analyzers/best-practices/chunk-missing' },
                                { text: 'Missing Database Transactions Analyzer', link: '/analyzers/best-practices/missing-database-transactions' },
                                { text: 'Missing Error Tracking Analyzer', link: '/analyzers/best-practices/missing-error-tracking' },
                                { text: 'Mixed Query Builder and Eloquent Analyzer', link: '/analyzers/best-practices/mixed-query-builder-eloquent' },
                                { text: 'PHP-Side Collection Filtering Analyzer', link: '/analyzers/best-practices/php-side-filtering' },
                                { text: 'Service Container Resolution Analyzer', link: '/analyzers/best-practices/service-container-resolution' },
                                { text: 'Silent Failure Analyzer', link: '/analyzers/best-practices/silent-failure' },
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
                indexName: 'shieldCI_docs',
                askAi: "vm0ybu30QDS3"
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

