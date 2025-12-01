---
title: View Caching
description: Validates that Blade templates are properly precompiled and cached in production/staging environments for optimal performance
icon: zap
outline: [2, 3]
---

# View Caching

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

### Quick Fix (5 minutes)

```bash
# Precompile all Blade views
php artisan view:cache
```

### Proper Fix (30 minutes)

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

## Common Mistakes to Avoid

1. **Caching views in development:**
   ```bash
   # ❌ Don't cache in local
   php artisan view:cache

   # ✅ Keep views uncached
   php artisan view:clear
   ```

2. **Not recaching after view changes:**
   ```bash
   # After modifying Blade templates
   php artisan view:cache  # ✅ Recache
   ```

## References

- [Laravel View Caching](https://laravel.com/docs/views#optimizing-views)
- [Laravel Deployment](https://laravel.com/docs/deployment#optimization)

## Related Analyzers

- [Route Caching](/analyzers/performance/route-caching)
- [Configuration Caching](/analyzers/performance/config-caching)
