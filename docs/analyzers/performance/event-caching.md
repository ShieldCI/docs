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

Validates that Laravel's event-to-listener mappings are cached in production environments using `php artisan event:cache`.

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

### Deployment Script

Add to your deployment script (after `composer install`):

```bash
#!/bin/bash
# deploy.sh

# Install dependencies
composer install --no-dev --optimize-autoloader

# Cache configurations
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache  # Don't forget this!

# Clear old caches first (optional but recommended)
# php artisan optimize:clear
# php artisan optimize
```

### Laravel Forge / Envoyer

Add to your deploy script:

```bash
cd /home/forge/your-site.com

php artisan down
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan event:cache  # Add this line
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan up
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM php:8.1-fpm

# ... your setup ...

# Cache events during build
RUN php artisan event:cache
```

Or in your entrypoint:

```bash
#!/bin/bash
# docker-entrypoint.sh

php artisan event:cache
php artisan config:cache
php artisan route:cache

exec php-fpm
```

## What Gets Cached

The event cache file (`bootstrap/cache/events.php`) contains:

```php
<?php return array (
    'App\\Events\\UserRegistered' => array (
        0 => 'App\\Listeners\\SendWelcomeEmail',
        1 => 'App\\Listeners\\CreateUserProfile',
    ),
    'App\\Events\\OrderPlaced' => array (
        0 => 'App\\Listeners\\SendOrderConfirmation',
    ),
);
```

This mapping is generated from:
- `$listen` array in `EventServiceProvider`
- Auto-discovered events (if enabled)
- Event subscribers

## Stale Cache Detection

This analyzer also warns if your event cache is older than 30 days, which may indicate:
- New events/listeners added but cache not refreshed
- Deployment script missing event caching step
- Manual changes to events without re-caching

## ShieldCI Configuration

This analyzer:
- Runs only in **production** and **staging** environments
- Skips if no events are registered (empty `$listen` array)
- Checks for `bootstrap/cache/events.php` existence
- Warns about potentially stale caches

## Verification

```bash
# Check if events are cached
ls -la bootstrap/cache/events.php

# View cached events
cat bootstrap/cache/events.php

# Clear and regenerate
php artisan event:clear && php artisan event:cache

# Verify events list
php artisan event:list
```

## References

- [Laravel Event Documentation](https://laravel.com/docs/events)
- [Laravel Deployment Optimization](https://laravel.com/docs/deployment#optimization)
- [Event Discovery](https://laravel.com/docs/events#event-discovery)

## Related Analyzers

- [Configuration Caching Analyzer](/analyzers/performance/config-caching) - Ensures config is cached
- [Route Caching Analyzer](/analyzers/performance/route-caching) - Ensures routes are cached
- [View Caching Analyzer](/analyzers/performance/view-caching) - Ensures views are compiled
