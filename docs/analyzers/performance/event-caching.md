---
title: Event Caching Analyzer
description: Validates that events are cached in production for optimal performance
icon: bell
outline: [2, 3]
tags: events,caching,performance,optimization
pro: true
---

# Event Caching Analyzer

| Analyzer ID       | Category       | Severity   | Time To Fix  |
| ------------------| :------------: |:----------:| ------------:|
| `event-caching`   | ⚡ Performance  | Low        | 5 minutes    |

## What This Checks

Validates that Laravel's event-to-listener mappings are cached in production environments using `php artisan event:cache`. Specifically:

- Checks for the existence of `bootstrap/cache/events.php`
- Warns if the cache file is older than 30 days, which may indicate new events were added without re-caching

This mapping is generated from the `$listen` array in `EventServiceProvider`, auto-discovered events, and event subscribers.

## Why It Matters

- **Performance:** Without caching, Laravel scans for event listeners on every request
- **Discovery Overhead:** Event auto-discovery examines class files to find listeners
- **Boot Time:** Cached events eliminate discovery overhead during application boot
- **Production Optimization:** Caching is a quick win that's often overlooked

While the impact is smaller than config or route caching, event caching still provides measurable improvement, especially in applications with many events and listeners.

## How to Fix

### Quick Fix (5 minutes)

**Cache events during deployment:**

```bash
php artisan event:cache
```

**Clear and refresh cache:**

```bash
php artisan event:clear
php artisan event:cache
```

### Proper Fix (5 minutes)

Add `php artisan event:cache` to your deployment pipeline so it runs automatically after every deploy.

**Standard deploy script:**
```bash
#!/bin/bash
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`) and in non-production environments.

**Why skip in CI and development?**
- Event caching is a deployment-time operation: it has no meaning until the app is deployed to a live environment
- CI pipelines run with uncached events intentionally to keep listener registration testable
- Development environments skip caching so listener changes take effect immediately without clearing the cache

**When to run this analyzer:**
- ✅ **Production/Staging servers**: Validates events are cached for optimal boot performance
- ❌ **CI/CD pipelines**: Skipped automatically (deployment-specific check)
- ❌ **Local development**: Skipped automatically (only relevant in production and staging)

**Staleness detection:** When the cache file exists, the analyzer compares its modification time against the newest mtime among `app/Providers/EventServiceProvider.php`, `bootstrap/app.php`, and any file under `app/Listeners/`. If a source file is newer than the cache, a stale-cache warning is raised.

## References

- [Laravel Event Documentation](https://laravel.com/docs/events)
- [Laravel Deployment Optimization](https://laravel.com/docs/deployment#optimization)
- [Event Discovery](https://laravel.com/docs/events#event-discovery)

## Related Analyzers

- [Configuration Caching Analyzer](/analyzers/performance/config-caching) - Ensures config is cached
- [Route Caching Analyzer](/analyzers/performance/route-caching) - Ensures routes are cached
- [View Caching Analyzer](/analyzers/performance/view-caching) - Ensures views are compiled
