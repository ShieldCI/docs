<script setup lang="ts">
defineProps<{
  title: string
  description: string
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category?: string
  link?: string
  pro?: boolean
}>()

const severityConfig = {
  critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Critical' },
  high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'High' },
  medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Medium' },
  low: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Low' },
  info: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', label: 'Info' }
}
</script>

<template>
  <component
    :is="link ? 'a' : 'div'"
    :href="link"
    class="block no-underline! p-4 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 hover:border-violet-300 dark:hover:border-violet-600 transition-colors"
    :class="{ 'cursor-pointer': link }"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 m-0!">
          <span
            v-if="pro"
            class="pro-pill inline-flex mr-1.5 px-1.5 py-px text-[0.625rem] font-bold leading-tight uppercase tracking-wide rounded text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 align-middle"
          >Pro</span>
          {{ title }}
        </h3>
        <p class="mt-2! text-sm text-gray-600 dark:text-gray-400 m-0! line-clamp-2">
          {{ description }}
        </p>
      </div>
      <span
        v-if="severity"
        class="shrink-0 px-2 py-0.5 text-xs font-medium rounded"
        :class="[severityConfig[severity].bg, severityConfig[severity].text]"
      >
        {{ severityConfig[severity].label }}
      </span>
    </div>
    <div v-if="category" class="mt-2">
      <span class="text-xs text-gray-500 dark:text-gray-500">{{ category }}</span>
    </div>
  </component>
</template>
