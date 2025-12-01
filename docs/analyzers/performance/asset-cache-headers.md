---
title: Asset Cache Headers
description: Validates that proper HTTP cache headers are configured for static assets and responses
icon: zap
outline: [2, 3]
---

# Asset Cache Headers

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

### Quick Fix (5 minutes)

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

## References

- [HTTP Caching](https://web.dev/http-cache/)
- [Laravel Response Caching](https://laravel.com/docs/responses#response-caching)

## Related Analyzers

- [Minification](/analyzers/performance/minification)
