---
title: Asset Cache Headers Analyzer
description: Validates that proper HTTP cache headers are configured for static assets and responses
icon: zap
outline: [2, 3]
tags: cache,assets,performance,headers,browser-cache
---

# Asset Cache Headers Analyzer

| Analyzer ID           | Category       | Severity   | Time To Fix  |
| ----------------------| :------------: |:----------:| ------------:|
| `asset-cache-headers` | ⚡ Performance  | High       | 30 minutes   |

## What This Checks

Validates that proper HTTP cache headers are configured for static assets and responses.

## Why It Matters

- **Performance Impact:** Browser caching reduces server load and bandwidth
- **User Experience:** Cached assets load instantly from browser cache
- **CDN Efficiency:** Proper headers enable CDN caching

Without cache headers, browsers re-download assets on every page load, wasting bandwidth and slowing page loads.

## How to Fix

### Proper Fix (30 minutes)

Add cache headers in `.htaccess` or Nginx config:

**Apache (.htaccess):**
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

**Nginx:**
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`) and only runs in production and staging environments.

**Why skip in CI and development?**
- HTTP cache header checks require a live web server, not applicable in CI
- Local/Development/Testing environments may not have cache headers configured, which is acceptable
- Production and staging should have proper cache headers for optimal browser caching

**Environment Detection:**
The analyzer checks your Laravel `APP_ENV` setting and only runs when it maps to `production` or `staging`. Custom environment names can be mapped in `config/shieldci.php`:

```php
// config/shieldci.php
'environment_mapping' => [
    'production-us' => 'production',
    'production-blue' => 'production',
    'staging-preview' => 'staging',
],
```

**Examples:**
- `APP_ENV=production` → Runs (no mapping needed)
- `APP_ENV=production-us` → Maps to `production` → Runs
- `APP_ENV=local` → Skipped (not production/staging)

**Laravel Cloud:** This analyzer is automatically skipped on Laravel Cloud (asset cache headers are managed by the platform and cannot be configured by the application).

## References

- [HTTP Caching](https://web.dev/http-cache/)
- [Laravel Response Caching](https://laravel.com/docs/responses#response-caching)

## Related Analyzers

- [Asset Minification Analyzer](/analyzers/performance/asset-minification) - Ensures JavaScript and CSS assets are minified for production
