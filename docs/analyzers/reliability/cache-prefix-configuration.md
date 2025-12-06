---
title: Cache Prefix Configuration Analyzer
description: Ensure shared cache backends use unique prefixes to prevent collisions across applications
icon: hash
outline: [2, 3]
---

# Cache Prefix Configuration Analyzer

| Analyzer ID                  | Category       | Severity  | Time To Fix  |
| -----------------------------| :------------: |:---------:| ------------:|
| `cache-prefix-configuration` | ✅ Reliability | High      | 5 minutes   |

## What This Checks

- Detects when shared cache drivers (`redis`, `memcached`, `dynamodb`, `database`) are in use without a configured prefix
- Verifies both the global `cache.prefix` and store-specific prefixes to ensure they’re non-empty
- Flags prefixes that are too generic (e.g., `laravel_cache`, `app`, `cache`) or identical to other tenants
- Provides location hints (line numbers in `config/cache.php`) for quick remediation

## Why It Matters

- **Multi-tenant collisions**: On shared Redis/Memcached clusters, generic prefixes cause one project to overwrite another’s entries
- **Production stability**: Cache collisions lead to inconsistent sessions, stale feature flags, and corrupted cached data
- **Best practices**: Laravel recommends slugging `APP_NAME` and appending `_cache`; forgetting this leaves you exposed when deploying to shared environments (e.g., Vapor, multi-app Redis)

## How to Fix

### Quick Fix (1 minute)

1. Edit `config/cache.php`:

```php
'prefix' => env('CACHE_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_cache'),
```

2. For store-specific needs (e.g., `redis` only):

```php
'redis' => [
    'driver' => 'redis',
    'connection' => 'cache',
    'prefix' => env('CACHE_PREFIX', 'myapp_cache'),
],
```

3. Set `CACHE_PREFIX=myapp_production_cache` in `.env`.

### Proper Fix (5 minutes)

1. **Slug your `APP_NAME`**: Ensure `APP_NAME` is unique per environment (DEV vs PROD) to make the default slug unique
2. **Override per store**: For multi-tenant Redis clusters, set `stores.redis.prefix` to a tenant-specific slug
3. **Automate**: Add an environment-specific fallback so ephemeral environments (review apps) auto-generate unique prefixes (`Str::uuid()`) on boot
4. **Test**: Write integration tests ensuring different `.env` configurations yield different cache keys (e.g., store and retrieve a known key)
5. **Monitor**: Consider namespacing keys (e.g., `myapp:prod:`) for easier debugging in Redis CLI

## Common Mistakes to Avoid

- Leaving the default `laravel_cache` prefix on Redis/Aurora clusters shared with other projects
- Assuming the `array` cache driver requires a prefix—this analyzer skips non-shared drivers
- Forgetting to override `stores.redis.prefix` when using multiple Redis stores; the global `prefix` alone isn’t enough
- Hard-coding prefixes in code instead of referencing config/env values

## References

- [Laravel Cache Configuration](https://laravel.com/docs/cache#configuration)
- [Laravel Vapor Cache Best Practices](https://docs.vapor.laravel.com/docs/1.0/applications/cache.html)

## Related Analyzers

- [Cache Status Analyzer](/analyzers/reliability/cache-status) - Validates cache connectivity and functionality
- [Queue Timeout Configuration Analyzer](/analyzers/reliability/queue-timeout-configuration) - Ensures queue timeout and retry_after values are properly configured
- [Composer Validation Analyzer](/analyzers/reliability/composer-validation) - Ensures composer.json is valid and follows best practices
