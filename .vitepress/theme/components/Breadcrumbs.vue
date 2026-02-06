<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'

const { frontmatter, title } = useData()
const route = useRoute()

interface BreadcrumbItem {
  text: string
  link?: string
}

// Helper to convert kebab-case to Title Case
const formatSegment = (segment: string): string => {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  // Get the path without leading/trailing slashes and .html extension
  const path = route.path.replace(/^\/|\/$/g, '').replace(/\.html$/, '')

  if (!path) {
    return []
  }

  const segments = path.split('/')
  const items: BreadcrumbItem[] = [
    { text: 'Home', link: '/' }
  ]

  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Last segment: use frontmatter title or page title
    if (index === segments.length - 1) {
      const pageTitle = frontmatter.value.title || title.value || formatSegment(segment)
      items.push({ text: pageTitle })
    } else {
      // Intermediate segments: convert kebab-case to Title Case
      items.push({ text: formatSegment(segment), link: currentPath })
    }
  })

  return items
})
</script>

<template>
  <nav v-if="breadcrumbs.length > 1" class="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      <li v-for="(item, index) in breadcrumbs" :key="index">
        <a v-if="item.link" :href="item.link">{{ item.text }}</a>
        <span v-else aria-current="page">{{ item.text }}</span>
        <span v-if="index < breadcrumbs.length - 1" class="separator" aria-hidden="true">/</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumbs {
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.breadcrumbs ol {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.breadcrumbs li {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.breadcrumbs a {
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.25s;
}

.breadcrumbs a:hover {
  color: var(--vp-c-brand-1);
}

.breadcrumbs span[aria-current="page"] {
  color: var(--vp-c-text-1);
  font-weight: 500;
}

.breadcrumbs .separator {
  color: var(--vp-c-text-3);
  margin: 0 0.125rem;
}
</style>
