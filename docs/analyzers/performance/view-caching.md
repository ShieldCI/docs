---
title: View Caching Analyzer
description: Validates that Blade templates are properly precompiled and cached in production/staging environments for optimal performance
icon: zap
outline: [2, 3]
tags: cache,views,blade,performance,optimization
---

# View Caching Analyzer

| Analyzer ID    | Category       | Severity  | Time To Fix  |
| ---------------| :------------: |:---------:| ------------:|
| `view-caching` | ⚡ Performance  | Medium    | 5 minutes    |

## What This Checks

Validates that Blade templates are properly precompiled and cached in production/staging environments for optimal performance.

## Why It Matters

- **Performance Impact:** Precompiled views improve render time by 2-5x
- **Bootstrap Speed:** Eliminates template compilation on first request
- **Production Critical:** Without caching, Blade templates are compiled on-demand, adding latency

Blade templates must be compiled to PHP before execution. Without caching, Laravel compiles templates on the first request, adding overhead. Precompiling ensures all views are ready before the first user request.

## How to Fix

### Quick Fix (1 minute)

```bash
# Precompile all Blade views
php artisan view:cache
```

### Proper Fix (5 minutes)

Add view caching to your deployment workflow:

**Deployment Script:**
```bash
#!/bin/bash
php artisan route:cache
php artisan config:cache
php artisan view:cache      # Precompile all Blade templates
php artisan event:cache
```

**Docker:**
```dockerfile
RUN php artisan view:cache && \
    php artisan config:cache && \
    php artisan route:cache
```

**Laravel Vapor:**
```yaml
# vapor.yml
environments:
  production:
    build:
      - 'php artisan view:cache'
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments and only runs in production and staging environments.

**Why skip in CI and development?**
- View caching checks are not applicable in CI
- Local/Development/Testing environments may have views uncached for easier debugging, which is acceptable
- Production and staging should have views precompiled for optimal performance

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

## References

- [Laravel View Caching](https://laravel.com/docs/views#optimizing-views)
- [Laravel Deployment](https://laravel.com/docs/deployment#optimization)

## Related Analyzers

- [Route Caching Analyzer](/analyzers/performance/route-caching) - Ensures route caching is properly configured
- [Configuration Caching Analyzer](/analyzers/performance/config-caching) - Ensures config is cached in production
