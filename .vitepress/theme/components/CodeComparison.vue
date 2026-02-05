<script setup lang="ts">
defineProps<{
  badLabel?: string
  goodLabel?: string
}>()
</script>

<template>
  <div class="code-comparison grid gap-4 my-4 md:grid-cols-2">
    <div class="bad">
      <div class="flex items-center gap-2 mb-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-t-lg border border-b-0 border-red-200 dark:border-red-800">
        <span class="text-red-600 dark:text-red-400 font-medium text-sm">{{ badLabel || 'Bad' }}</span>
      </div>
      <div class="bad-code border border-red-200 dark:border-red-800 rounded-b-lg overflow-hidden [&>div]:!m-0 [&>div]:!rounded-none [&_pre]:!m-0">
        <slot name="bad" />
      </div>
    </div>
    <div class="good">
      <div class="flex items-center gap-2 mb-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-t-lg border border-b-0 border-green-200 dark:border-green-800">
        <span class="text-green-600 dark:text-green-400 font-medium text-sm">{{ goodLabel || 'Good' }}</span>
      </div>
      <div class="good-code border border-green-200 dark:border-green-800 rounded-b-lg overflow-hidden [&>div]:!m-0 [&>div]:!rounded-none [&_pre]:!m-0">
        <slot name="good" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Remove default VitePress code block margins when inside comparison */
.bad-code :deep(div[class*="language-"]),
.good-code :deep(div[class*="language-"]) {
  margin: 0 !important;
  border-radius: 0 !important;
}

.bad-code :deep(pre),
.good-code :deep(pre) {
  margin: 0 !important;
}
</style>
