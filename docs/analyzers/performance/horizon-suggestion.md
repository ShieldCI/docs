---
title: Horizon Suggestion Analyzer
description: Recommends Laravel Horizon for better queue monitoring and management when using Redis queues
icon: zap
outline: [2, 3]
tags: queue,horizon,redis,monitoring,performance
---

# Horizon Suggestion Analyzer

| Analyzer ID          | Category       | Severity   | Time To Fix  |
| ---------------------| :------------: |:----------:| ------------:|
| `horizon-suggestion` | ⚡ Performance  | Low       | 15 minutes   |

## What This Checks

Recommends Laravel Horizon for better queue monitoring and management when using Redis queues.

## Why It Matters

- **Monitoring:** Real-time queue metrics and failed job tracking
- **Management:** Easy queue worker management and scaling
- **Developer Experience:** Beautiful dashboard for queue insights

Horizon provides essential visibility into queue operations that basic queue:work doesn't offer.

## How to Fix

### Quick Fix (5 minutes)

```bash
composer require laravel/horizon
php artisan horizon:install
php artisan migrate
```

### Proper Fix (30 minutes)

**Install and Configure:**
```bash
composer require laravel/horizon
php artisan horizon:install
php artisan migrate

# Configure
php artisan vendor:publish --tag=horizon-config
```

**Start Horizon:**
```bash
php artisan horizon
```

**Production Supervisor Config:**
```ini
[program:horizon]
process_name=%(program_name)s
command=php /path/to/artisan horizon
autostart=true
autorestart=true
user=forge
redirect_stderr=true
stdout_logfile=/path/to/horizon.log
stopwaitsecs=3600
```

## ShieldCI Configuration

**When to run this analyzer:**
- ✅ **Local/Staging/Production**: Runs when you are on a Redis queue driver and not on Vapor
- ❌ **Laravel Vapor / Serverless**: Skipped automatically (incompatible architecture)
- ❌ **Non-Redis queue drivers**: Skipped automatically (Horizon requires Redis)

## References

- [Laravel Horizon](https://laravel.com/docs/horizon)

## Related Analyzers

- [Queue Driver Configuration Analyzer](/analyzers/performance/queue-driver) - Ensures a proper queue driver configuration for optimal performance and reliability
