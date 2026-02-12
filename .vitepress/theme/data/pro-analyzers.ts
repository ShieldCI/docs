/**
 * Pro analyzer paths — the single source of truth for which analyzer docs
 * belong to the ShieldCI Pro package. Cross-referenced from ANALYZER_CATALOG.md.
 *
 * Paths match the VitePress route (without trailing .md).
 */
export const proAnalyzerPaths = new Set<string>([
  // ── Security (24) ──────────────────────────────────────────
  '/analyzers/security/arbitrary-file-upload',
  '/analyzers/security/clickjacking',
  '/analyzers/security/column-name-sql-injection',
  '/analyzers/security/command-injection',
  '/analyzers/security/cookie-domain',
  '/analyzers/security/cryptographic-weakness',
  '/analyzers/security/directory-traversal',
  '/analyzers/security/eval',
  '/analyzers/security/extract',
  '/analyzers/security/hardcoded-credentials',
  '/analyzers/security/horizon-security',
  '/analyzers/security/host-injection',
  '/analyzers/security/mime-sniffing',
  '/analyzers/security/nova-security',
  '/analyzers/security/object-injection',
  '/analyzers/security/open-redirection',
  '/analyzers/security/rce',
  '/analyzers/security/regex-dos',
  '/analyzers/security/session-timeout',
  '/analyzers/security/ssrf',
  '/analyzers/security/telescope-security',
  '/analyzers/security/validation-sql-injection',
  '/analyzers/security/web-server-fingerprinting',
  '/analyzers/security/xxe-vulnerabilities',

  // ── Performance (12) ───────────────────────────────────────
  '/analyzers/performance/cdn-configuration',
  '/analyzers/performance/command-constructor-injection',
  '/analyzers/performance/compression-headers',
  '/analyzers/performance/database-query-optimization',
  '/analyzers/performance/eager-loading',
  '/analyzers/performance/event-caching',
  '/analyzers/performance/fallback-routes',
  '/analyzers/performance/http2-support',
  '/analyzers/performance/redis-rate-limiting',
  '/analyzers/performance/redis-single-server',
  '/analyzers/performance/redis-throttling',
  '/analyzers/performance/xdebug-enabled',

  // ── Reliability (11) ───────────────────────────────────────
  '/analyzers/reliability/cache-busting',
  '/analyzers/reliability/dead-route',
  '/analyzers/reliability/disk-space',
  '/analyzers/reliability/global-variable',
  '/analyzers/reliability/horizon-prefix',
  '/analyzers/reliability/horizon-provisioning-plan',
  '/analyzers/reliability/horizon-status',
  '/analyzers/reliability/pcntl',
  '/analyzers/reliability/redis-eviction-policy',
  '/analyzers/reliability/redis-shared-database',
  '/analyzers/reliability/redis-status',
])
