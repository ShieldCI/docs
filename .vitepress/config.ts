import { defineConfig } from 'vitepress'
import { getSidebar } from './theme/utils/sidebar'
import tailwindcss from '@tailwindcss/vite'

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

        // Sidebar (auto-generated from file structure)
        sidebar: getSidebar(),

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
        plugins: [tailwindcss()],
    },
})

