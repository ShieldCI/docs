<script setup lang="ts">
import { ref } from 'vue'
import { useScrollReveal } from '../composables/useScrollReveal'

const sectionRef = ref<HTMLElement | null>(null)
useScrollReveal(sectionRef)

const features = [
  {
    title: 'Catch Vulnerabilities Early',
    description: 'Detect SQL injection, XSS, CSRF, mass assignment, and more — before they reach production.',
    color: 'red',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  },
  {
    title: 'Optimize Performance',
    description: 'Find N+1 queries, missing caching, and performance bottlenecks across your entire Laravel codebase.',
    color: 'amber',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  },
  {
    title: 'Deep Coverage, 5 Categories',
    description: 'Analyzers spanning security, performance, reliability, best practices, and code quality — all in one tool.',
    color: 'blue',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  },
  {
    title: 'CI/CD Integration',
    description: 'Works with GitHub Actions, GitLab CI, and any pipeline. Fail builds automatically on critical issues.',
    color: 'violet',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>`,
  },
  {
    title: 'Actionable Fix Guidance',
    description: 'Every issue includes clear explanations, exact file locations, and before/after code examples.',
    color: 'emerald',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  },
  {
    title: 'Built for Teams',
    description: 'Share analysis results, track progress, and enforce consistent code quality standards across your team.',
    color: 'cyan',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
]
</script>

<template>
  <section ref="sectionRef" class="mx-auto px-6 sm:px-12 md:px-16 pt-16 pb-8">
    <div data-reveal class="text-center mb-10">
      <h2 class="text-2xl! sm:text-3xl! font-bold! text-gray-900! dark:text-gray-100! m-0! border-none!">
        Why ShieldCI?
      </h2>
      <p class="mt-3! text-base! text-gray-600! dark:text-gray-400! m-0! leading-relaxed!">
        Built for developers, teams, and organizations shipping world-class Laravel applications and APIs.
      </p>
    </div>

    <div data-reveal data-reveal-stagger class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="feature in features"
        :key="feature.title"
        class="rounded-xl border border-gray-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-800/50 p-5 transition-all duration-200 hover:border-gray-300 dark:hover:border-neutral-600 hover:shadow-md dark:hover:shadow-neutral-900/40"
      >
        <div class="flex items-center gap-3 mb-3">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
            :class="{
              'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400': feature.color === 'red',
              'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400': feature.color === 'amber',
              'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400': feature.color === 'blue',
              'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400': feature.color === 'violet',
              'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400': feature.color === 'emerald',
              'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400': feature.color === 'cyan',
            }"
          >
            <span class="w-[20px] h-[20px] [&>svg]:w-full [&>svg]:h-full" v-html="feature.icon" />
          </div>
          <span class="font-semibold text-gray-900 dark:text-gray-100 text-[15px]">{{ feature.title }}</span>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-400 m-0! leading-relaxed">
          {{ feature.description }}
        </p>
      </div>
    </div>
  </section>
</template>
