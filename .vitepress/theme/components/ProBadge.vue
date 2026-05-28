<script setup lang="ts">
import { useData } from 'vitepress'

const { frontmatter } = useData()
</script>

<template>
  <div
    v-if="frontmatter.pro"
    role="note"
    aria-label="This is a Pro analyzer"
    class="flex items-center gap-3 px-4 py-3 mb-6 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-900/15"
  >
    <svg
      class="shrink-0 w-5 h-5 text-amber-600 dark:text-amber-400"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
    <div class="flex-1 min-w-0">
      <span class="text-sm font-semibold text-amber-800 dark:text-amber-300">Pro Analyzer</span>
      <span class="text-sm text-amber-700 dark:text-amber-400">
        &mdash; Available with
        <a
          href="/pro/"
          class="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
        >ShieldCI Pro</a>
      </span>
    </div>
  </div>
</template>
