<script setup lang="ts">
const categories = [
  {
    name: 'Security',
    count: 22,
    href: '/analyzers/security/',
    color: 'red',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    highlights: ['SQL Injection', 'XSS', 'CSRF', 'Mass Assignment', 'Vulnerable Dependencies'],
  },
  {
    name: 'Performance',
    count: 18,
    href: '/analyzers/performance/',
    color: 'amber',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    highlights: ['N+1 Queries', 'Caching', 'OPcache', 'Asset Optimization', 'Queue Drivers'],
  },
  {
    name: 'Reliability',
    count: 13,
    href: '/analyzers/reliability/',
    color: 'blue',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    highlights: ['PHPStan', 'Database Health', 'Env Validation', 'Composer Checks'],
  },
  {
    name: 'Code Quality',
    count: 5,
    href: '/analyzers/code-quality/',
    color: 'violet',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    highlights: ['Method Length', 'Naming Conventions', 'Nesting Depth', 'Missing Docblocks'],
  },
  {
    name: 'Best Practices',
    count: 15,
    href: '/analyzers/best-practices/',
    color: 'emerald',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
    highlights: ['Eloquent Patterns', 'MVC Separation', 'Error Handling', 'Transactions'],
  },
]

const steps = [
  {
    number: '1',
    title: 'Install',
    code: 'composer require shieldci/laravel',
    description: 'Add ShieldCI to your Laravel application via Composer.',
  },
  {
    number: '2',
    title: 'Analyze',
    code: 'php artisan shield:analyze',
    description: 'Run a full analysis of your codebase — security, performance, reliability, and more.',
  },
  {
    number: '3',
    title: 'Fix',
    code: 'Follow actionable recommendations',
    description: 'Get clear explanations, exact locations, and links to fix every issue found.',
  },
]
</script>

<template>
  <!-- Categories Section -->
  <section class="mx-auto px-6 sm:px-12 md:px-16 pt-16 pb-8">
    <div class="text-center mb-10">
      <h2 class="text-2xl! sm:text-3xl! font-bold! text-gray-900! dark:text-gray-100! m-0! border-none!">
          AI-powered Analyzers Across 5 Categories
      </h2>
      <p class="mt-3! text-base! text-gray-600! dark:text-gray-400! m-0! leading-relaxed!">
        Comprehensive Laravel static analysis and vulnerability scanning covering everything from SQL injection to N+1 queries.
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <a
        v-for="cat in categories"
        :key="cat.name"
        :href="cat.href"
        class="group relative no-underline! rounded-xl border border-gray-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-800/50 p-5 transition-all duration-200 hover:border-gray-300 dark:hover:border-neutral-600 hover:shadow-md dark:hover:shadow-neutral-900/40"
      >
        <!-- Top row: icon + name + count -->
        <div class="flex items-center gap-3 mb-3">
          <div
            class="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
            :class="{
              'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400': cat.color === 'red',
              'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400': cat.color === 'amber',
              'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400': cat.color === 'blue',
              'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400': cat.color === 'violet',
              'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400': cat.color === 'emerald',
            }"
          >
            <span class="w-[18px] h-[18px] [&>svg]:w-full [&>svg]:h-full" v-html="cat.icon" />
          </div>
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-semibold text-gray-900 dark:text-gray-100 text-[15px]">{{ cat.name }}</span>
            <span
              class="text-xs font-medium px-1.5 py-0.5 rounded-full"
              :class="{
                'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300': cat.color === 'red',
                'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300': cat.color === 'amber',
                'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300': cat.color === 'blue',
                'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300': cat.color === 'violet',
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300': cat.color === 'emerald',
              }"
            >
              {{ cat.count }}
            </span>
          </div>
        </div>

        <!-- Highlights as tags -->
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="h in cat.highlights"
            :key="h"
            class="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-700/60 text-gray-600 dark:text-gray-400"
          >
            {{ h }}
          </span>
        </div>

        <!-- Hover arrow -->
        <div class="absolute top-5 right-4 text-gray-300 dark:text-neutral-600 group-hover:text-gray-500 dark:group-hover:text-neutral-400 transition-colors">
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </a>
    </div>
  </section>

  <!-- How It Works Section -->
  <section class="mx-auto px-6 sm:px-12 md:px-16 pt-8 pb-8">
    <div class="text-center mb-10">
      <h2 class="text-2xl! sm:text-3xl! font-bold! text-gray-900! dark:text-gray-100! m-0! border-none!">
        How It Works
      </h2>
      <p class="mt-3! text-base! text-gray-600! dark:text-gray-400! m-0! leading-relaxed!">
        Get up and running in under a minute. No configuration required.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="step in steps"
        :key="step.number"
        class="relative"
      >
        <!-- Step card -->
        <div class="rounded-xl border border-gray-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-800/50 p-5 h-full">
          <!-- Step number -->
          <div class="flex items-center gap-3 mb-3">
            <span class="flex items-center justify-center w-7 h-7 rounded-full bg-violet-600 text-white text-xs font-bold shrink-0">
              {{ step.number }}
            </span>
            <span class="font-semibold text-gray-900 dark:text-gray-100">{{ step.title }}</span>
          </div>

          <!-- Code block -->
          <div class="rounded-lg bg-gray-900 dark:bg-neutral-900 px-3.5 py-2.5 mb-3 overflow-x-auto">
            <code class="text-[13px] text-emerald-400 font-mono whitespace-nowrap bg-transparent! p-0!">{{ step.code }}</code>
          </div>

          <!-- Description -->
          <p class="text-sm text-gray-600 dark:text-gray-400 m-0! leading-relaxed">
            {{ step.description }}
          </p>
        </div>

        <!-- Connector arrow (between steps, hidden on mobile) -->
        <div
          v-if="Number(step.number) < 3"
          class="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 text-gray-300 dark:text-neutral-600"
        >
          <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="mx-auto px-6 sm:px-12 md:px-16 pt-4 pb-16">
    <div class="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/20 p-8 text-center">
      <h3 class="text-xl! font-bold! text-gray-900! dark:text-gray-100! m-0! border-none!">
        Ship secure Laravel applications with confidence
      </h3>
      <p class="mt-2! text-sm! text-gray-600! dark:text-gray-400! m-0! leading-relaxed!">
        ShieldCI supports Laravel 9+ and integrates with GitHub Actions, GitLab CI, and any CI/CD provider.
      </p>
      <div class="mt-5 flex flex-wrap justify-center gap-3">
        <a
          href="/getting-started/installation"
          class="no-underline! inline-flex items-center px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white! text-sm font-medium transition-colors"
        >
          Get Started
        </a>
        <a
          href="/introduction/what-is-shieldci"
          class="no-underline! inline-flex items-center px-5 py-2.5 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700! dark:text-gray-300! text-sm font-medium transition-colors"
        >
          Learn More
        </a>
      </div>
    </div>
  </section>
</template>
