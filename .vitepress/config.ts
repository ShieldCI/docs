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
                                { text: 'Application Key', link: '/analyzers/security/app-key' },
                                { text: 'Auth & Authorization', link: '/analyzers/security/authentication-authorization' },
                                { text: 'Cookie', link: '/analyzers/security/cookie' },
                                { text: 'CSRF Protection', link: '/analyzers/security/csrf-protection' },
                                { text: 'Cryptographic Weakness', link: '/analyzers/security/cryptographic-weakness' },
                                { text: 'Debug Mode', link: '/analyzers/security/debug-mode' },
                                { text: 'Directory Traversal', link: '/analyzers/security/directory-traversal' },
                                { text: 'Environment File', link: '/analyzers/security/env-file' },
                                { text: 'Env HTTP Exposure', link: '/analyzers/security/env-http-accessibility' },
                                { text: 'Eval Usage', link: '/analyzers/security/eval' },
                                { text: 'Extract Usage', link: '/analyzers/security/extract' },
                                { text: 'File Permissions', link: '/analyzers/security/file-permissions' },
                                { text: 'Fillable Foreign Key', link: '/analyzers/security/fillable-foreign-key' },
                                { text: 'Frontend Dependencies', link: '/analyzers/security/frontend-vulnerable-dependencies' },
                                { text: 'Hardcoded Credentials', link: '/analyzers/security/hardcoded-credentials' },
                                { text: 'Hashing Strength', link: '/analyzers/security/hashing-strength' },
                                { text: 'Horizon Security', link: '/analyzers/security/horizon-security' },
                                { text: 'Host Injection', link: '/analyzers/security/host-injection' },
                                { text: 'HSTS Header', link: '/analyzers/security/hsts-header' },
                                { text: 'License Compliance', link: '/analyzers/security/license-compliance' },
                                { text: 'Login Throttling', link: '/analyzers/security/login-throttling' },
                                { text: 'Mass Assignment', link: '/analyzers/security/mass-assignment-vulnerabilities' },
                                { text: 'MIME Sniffing', link: '/analyzers/security/mime-sniffing' },
                                { text: 'Nova Security', link: '/analyzers/security/nova-security' },
                                { text: 'Object Injection', link: '/analyzers/security/object-injection' },
                                { text: 'Open Redirection', link: '/analyzers/security/open-redirection' },
                                { text: 'PHP Configuration', link: '/analyzers/security/php-ini' },
                                { text: 'RCE', link: '/analyzers/security/rce' },
                                { text: 'Regex DoS', link: '/analyzers/security/regex-dos' },
                                { text: 'Session Timeout', link: '/analyzers/security/session-timeout' },
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
                                { text: 'Command Constructor Injection', link: '/analyzers/performance/command-constructor-injection' },
                                { text: 'Compression Headers', link: '/analyzers/performance/compression-headers' },
                                { text: 'Config Caching', link: '/analyzers/performance/config-caching' },
                                { text: 'Database Query Optimization', link: '/analyzers/performance/database-query-optimization' },
                                { text: 'Debug Log Level', link: '/analyzers/performance/debug-log-level' },
                                { text: 'Dev Deps in Production', link: '/analyzers/performance/dev-dependencies-production' },
                                { text: 'Eager Loading', link: '/analyzers/performance/eager-loading' },
                                { text: 'Env Outside Config', link: '/analyzers/performance/env-call-outside-config' },
                                { text: 'Event Caching', link: '/analyzers/performance/event-caching' },
                                { text: 'Fallback Routes', link: '/analyzers/performance/fallback-routes' },
                                { text: 'Horizon Suggestion', link: '/analyzers/performance/horizon-suggestion' },
                                { text: 'HTTP/2 Support', link: '/analyzers/performance/http2-support' },
                                { text: 'MySQL Optimization', link: '/analyzers/performance/mysql-single-server-optimization' },
                                { text: 'OPcache', link: '/analyzers/performance/opcache-enabled' },
                                { text: 'Queue Driver', link: '/analyzers/performance/queue-driver' },
                                { text: 'Redis Rate Limiting', link: '/analyzers/performance/redis-rate-limiting' },
                                { text: 'Redis Single Server', link: '/analyzers/performance/redis-single-server' },
                                { text: 'Redis Throttling', link: '/analyzers/performance/redis-throttling' },
                                { text: 'Route Caching', link: '/analyzers/performance/route-caching' },
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
                                { text: 'Cache Busting', link: '/analyzers/reliability/cache-busting' },
                                { text: 'Cache Prefix', link: '/analyzers/reliability/cache-prefix-configuration' },
                                { text: 'Cache Status', link: '/analyzers/reliability/cache-status' },
                                { text: 'Composer Validation', link: '/analyzers/reliability/composer-validation' },
                                { text: 'Custom Error Pages', link: '/analyzers/reliability/custom-error-pages' },
                                { text: 'Database Status', link: '/analyzers/reliability/database-status' },
                                { text: 'Dead Routes', link: '/analyzers/reliability/dead-route' },
                                { text: 'Directory Permissions', link: '/analyzers/reliability/directory-write-permissions' },
                                { text: 'Disk Space', link: '/analyzers/reliability/disk-space' },
                                { text: 'Env Example Docs', link: '/analyzers/reliability/env-example-documented' },
                                { text: 'Env File Exists', link: '/analyzers/reliability/env-file-exists' },
                                { text: 'Env Variables Complete', link: '/analyzers/reliability/env-variables-complete' },
                                { text: 'Global Variables', link: '/analyzers/reliability/global-variable' },
                                { text: 'Horizon Prefix', link: '/analyzers/reliability/horizon-prefix' },
                                { text: 'Horizon Provisioning', link: '/analyzers/reliability/horizon-provisioning-plan' },
                                { text: 'Horizon Status', link: '/analyzers/reliability/horizon-status' },
                                { text: 'Maintenance Mode', link: '/analyzers/reliability/maintenance-mode-status' },
                                { text: 'PCNTL Extension', link: '/analyzers/reliability/pcntl' },
                                { text: 'PHPStan', link: '/analyzers/reliability/phpstan' },
                                { text: 'Queue Blocking', link: '/analyzers/reliability/queue-blocking' },
                                { text: 'Queue Timeout', link: '/analyzers/reliability/queue-timeout-configuration' },
                                { text: 'Redis Eviction Policy', link: '/analyzers/reliability/redis-eviction-policy' },
                                { text: 'Redis Shared DB', link: '/analyzers/reliability/redis-shared-database' },
                                { text: 'Redis Status', link: '/analyzers/reliability/redis-status' },
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

