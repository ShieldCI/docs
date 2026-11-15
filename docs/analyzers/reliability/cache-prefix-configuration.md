---
title: Cache Prefix Configuration Analyzer
description: Ensure shared cache backends use unique prefixes to prevent collisions across applications
icon: hash
outline: [2, 3]
tags: cache,configuration,reliability,multi-tenant
---

# Cache Prefix Configuration Analyzer

| Analyzer ID                  | Category       | Severity  | Time To Fix  |
| -----------------------------| :------------: |:---------:| ------------:|
| `cache-prefix-configuration` | ✅ Reliability | Medium    | 5 minutes   |

## What This Checks

- Detects when the default cache store uses a shared driver (`redis`, `memcached`, `dynamodb`, `database`) without a configured prefix
- Resolves the prefix the way Laravel does: a store's own `prefix` wins whenever it is set, even to an empty string, and otherwise the global `cache.prefix` applies
- Counts the prefix the cache client adds to every key: the Redis connection prefix (`REDIS_PREFIX`, a connection's own `prefix` or `options`, or a `?prefix=` in its URL) and the Memcached `OPT_PREFIX_KEY` option
- Flags key namespaces that are too generic (e.g., `laravel_cache`, `laravel-database-`, `app`, `cache`); one unique part, such as a unique Redis prefix, is enough to pass
- When the default store uses the `failover` driver, checks each shared store it lists, and reports each offending store by name
- Grades a `database` store **Low**, because its keys only collide when two applications share one database connection and cache table, and a `redis`, `memcached` or `dynamodb` store **Medium**, because several applications commonly share one cache server
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

This only clears the finding when `APP_NAME` is set to something unique: with the default `Laravel` the prefix is `laravel_cache`, which is generic.

2. For store-specific needs (e.g., `redis` only):

```php
'redis' => [
    'driver' => 'redis',
    'connection' => 'cache',
    'prefix' => env('CACHE_PREFIX', 'myapp_cache'),
],
```

3. Set `CACHE_PREFIX=myapp_production_cache` in `.env`.

4. On Redis, a unique connection prefix is enough on its own, because the client puts it in front of every key. Set `REDIS_PREFIX=myapp_production_` in `.env`, or set a unique `APP_NAME`, which the default `REDIS_PREFIX` is built from.

### Proper Fix (5 minutes)

1. **Slug your `APP_NAME`**: Ensure `APP_NAME` is unique per environment (DEV vs PROD) to make the default slug unique
2. **Override per store**: For multi-tenant Redis clusters, set `stores.redis.prefix` to a tenant-specific slug
3. **Automate**: Add an environment-specific fallback so ephemeral environments (review apps) auto-generate unique prefixes (`Str::uuid()`) on boot
4. **Test**: Write integration tests ensuring different `.env` configurations yield different cache keys (e.g., store and retrieve a known key)
5. **Monitor**: Consider namespacing keys (e.g., `myapp:prod:`) for easier debugging in Redis CLI

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- CI environments do not run a shared cache server (Redis/Memcached/DynamoDB), so prefix collisions are not possible
- Prevents irrelevant failures in pipelines where no cache infrastructure is present

**When to run this analyzer:**
- ✅ **Local development**: Catches misconfigured prefixes before they reach a shared environment
- ✅ **Staging/Production servers**: Validates that the deployed prefix is unique across applications sharing the cache cluster
- ❌ **CI/CD pipelines**: Skipped automatically (no shared cache server runs in CI)

## References

- [Laravel Cache Configuration](https://laravel.com/docs/cache#configuration)
- [Laravel Vapor Cache Best Practices](https://docs.vapor.build/resources/caches)

## Related Analyzers

- [Cache Status Analyzer](/analyzers/reliability/cache-status) - Validates cache connectivity and functionality
- [Queue Timeout Configuration Analyzer](/analyzers/reliability/queue-timeout-configuration) - Ensures queue timeout and retry_after values are properly configured
- [Composer Validation Analyzer](/analyzers/reliability/composer-validation) - Ensures composer.json is valid and follows best practices
