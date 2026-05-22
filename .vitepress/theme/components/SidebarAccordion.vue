<script setup lang="ts">
import { onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()
const STORAGE_KEY = 'shieldci-sidebar-open'

function closeOpenSiblings(openItem: HTMLElement) {
  openItem.parentElement!
    .querySelectorAll<HTMLElement>(':scope > .VPSidebarItem')
    .forEach(sibling => {
      if (sibling === openItem) return
      if (!sibling.classList.contains('collapsed')) {
        sibling.querySelector<HTMLElement>(':scope > .item > .caret')?.click()
      }
    })
}

function enforceAccordion() {
  const activeItem = document.querySelector<HTMLElement>('.VPSidebarItem.level-1.has-active')

  if (activeItem) {
    const href = activeItem.querySelector<HTMLAnchorElement>(':scope > .item > a')?.getAttribute('href')
    if (href) sessionStorage.setItem(STORAGE_KEY, href)
    closeOpenSiblings(activeItem)
  } else {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (!saved) return
    document.querySelectorAll<HTMLElement>('.VPSidebarItem.level-1').forEach(item => {
      const href = item.querySelector<HTMLAnchorElement>(':scope > .item > a')?.getAttribute('href')
      if (href === saved && item.classList.contains('collapsed')) {
        item.querySelector<HTMLElement>(':scope > .item > .caret')?.click()
      }
    })
  }
}

// Watch for class changes on sidebar items — fires when VitePress toggles collapsed state
// (covers both manual caret clicks and programmatic navigation)
let observer: MutationObserver | null = null

function setupObserver() {
  const sidebar = document.querySelector('.VPSidebar')
  if (!sidebar) return

  observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      const target = mutation.target as HTMLElement
      if (!target.classList.contains('VPSidebarItem') || !target.classList.contains('level-1')) continue

      const wasCollapsed = (mutation.oldValue ?? '').includes('collapsed')
      const isNowOpen = !target.classList.contains('collapsed')

      // Item just opened — close its siblings
      if (wasCollapsed && isNowOpen) {
        closeOpenSiblings(target)
        break
      }
    }
  })

  observer.observe(sidebar, {
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
    attributeOldValue: true,
  })
}

onMounted(() => nextTick(() => { enforceAccordion(); setupObserver() }))
onUnmounted(() => observer?.disconnect())
watch(() => route.path, enforceAccordion, { flush: 'post' })
</script>

<template />
