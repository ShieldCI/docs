---
title: Cache Status Analyzer
description: Verify your cache driver can write, read, and clean up entries without errors
icon: database
outline: [2, 3]
tags: cache,infrastructure,reliability,availability
---

# Cache Status Analyzer

| Analyzer ID    | Category       | Severity  | Time To Fix  |
| ---------------| :------------: |:---------:| ------------:|
| `cache-status` | ✅ Reliability | Critical  | 15 minutes   |

## What This Checks

- Performs a real cache write/read/forget cycle using the configured default cache store
- Reports failures when the cache driver throws exceptions or returns unexpected values
- Skips automatically in CI (where cache backends may not be available)
- Points to `config/cache.php` so you know where to fix connection details

## Why It Matters

- **Session stability**: Laravel sessions, rate limiters, and queues often depend on Redis/Memcached; if cache is offline, user logins fail silently
- **Deployment surprises**: Misconfigured cache hosts or credentials show up only at runtime—this analyzer surfaces them before production deploys
- **Shared environments**: Platform-as-a-service providers require explicit configuration; forgetting a prefix or host leads to cross-tenant leaks

## How to Fix

### Quick Fix (5 minutes)

1. Verify your cache server is running and reachable:

```bash
redis-cli ping
```

2. Update `config/cache.php` with the correct connection/credentials:

```php
'redis' => [
    'driver' => 'redis',
    'connection' => 'cache',
],
```

3. Deploy updated `.env` values (`REDIS_HOST`, `REDIS_PASSWORD`, etc.)

### Proper Fix (15 minutes)

1. **Add monitoring**: Use a health endpoint or Laravel Pulse to confirm cache availability continuously
2. **Graceful degradation**: Add fallbacks (`Cache::remember()` with local defaults) for critical flows
3. **Automate testing**: Include a smoke test in CI/CD that boots the app and runs `php artisan cache:table`/`php artisan config:cache`
4. **Secure credentials**: Ensure secrets are injected securely (Vault/Parameter Store) so deployments don’t reference outdated hosts
5. **Document recovery steps**: Standardize how to restart Redis/Memcached, flush keys, or switch to the `array` driver temporarily

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- Cache backends (Redis, Memcached) may not be available in CI pipelines
- CI environments often use different cache configurations (array/file) than production
- Prevents false failures when external cache services aren't configured in CI

**When to run this analyzer:**
- ✅ **Local development**: Ensures your cache is properly configured during development
- ✅ **Staging/Production servers**: Confirms cache is accessible and functioning
- ❌ **CI/CD pipelines**: Skipped automatically (cache services typically unavailable)

## References

- [Laravel Cache Docs](https://laravel.com/docs/cache)
- [Laravel Health Checks](https://laravel.com/docs/10.x/validation#available-validation-rules)

## Related Analyzers

- [Cache Prefix Configuration Analyzer](/analyzers/reliability/cache-prefix-configuration) - Ensures cache prefix is set to avoid collisions
- [Queue Timeout Configuration Analyzer](/analyzers/reliability/queue-timeout-configuration) - Ensures queue timeout and retry_after values are properly configured
- [Database Status Analyzer](/analyzers/reliability/database-status) - Ensures database connections are accessible and functioning
