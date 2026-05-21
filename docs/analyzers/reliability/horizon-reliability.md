---
title: Horizon Reliability Analyzer
description: Validates Horizon prefix configuration, provisioning plan, and runtime health
icon: shield
outline: [2, 3]
tags: reliability,horizon,redis,queue,configuration,workers,monitoring
pro: true
---

# Horizon Reliability Analyzer

| Analyzer ID           |     Category     | Severity  | Time To Fix  |
| ----------------------|:----------------:|:---------:| ------------:|
| `horizon-reliability` |  ✅ Reliability  | Critical  | 15 minutes   |

## What This Checks

Validates that Laravel Horizon is correctly configured and healthy. Checks for:

- Horizon prefix is set and not a generic value (`laravel_horizon:`, `horizon:`)
- Horizon prefix differs sufficiently from the cache prefix
- Prefix includes an environment identifier in production and staging
- A provisioning plan exists for the current `APP_ENV`
- Each supervisor has valid queue, memory, worker count, timeout, balance, connection, and retry settings
- Horizon master process is running (production and staging only)
- Pending job count is below the configured threshold (production and staging only)
- No supervisors are paused (production and staging only)

## Why It Matters

- **Silent Job Loss:** A missing or misconfigured provisioning plan causes Horizon to start but process no jobs
- **Redis Key Collisions:** Generic or duplicate prefixes corrupt Horizon's internal data when multiple apps share Redis
- **Production Downtime:** A stopped or paused Horizon master halts all background processing silently
- **Job Backlog:** Unchecked pending job growth degrades application performance and can exhaust Redis memory
- **Worker Crashes:** Misconfigured memory limits or timeouts cause workers to restart continuously

## How to Fix

### Quick Fix (5 minutes)

Set a unique, environment-aware prefix in `config/horizon.php`:

```php
// ❌ Before: generic prefix, no environment context
'prefix' => 'laravel_horizon:',

// ✅ After: unique, environment-scoped prefix
'prefix' => env('HORIZON_PREFIX', 'myapp_production_horizon:'),
```

### Proper Fix (15 minutes)

**1. Configure a unique prefix:**

```php
// config/horizon.php
return [
    'prefix' => env('HORIZON_PREFIX', 'myapp_production_horizon:'),

    'defaults' => [
        'supervisor-1' => [
            'connection' => 'redis',
            'queue' => ['default', 'high', 'low'],
            'balance' => 'auto',
            'minProcesses' => 1,
            'maxProcesses' => 10,
            'memory' => 128,
            'tries' => 3,
            'timeout' => 60,
        ],
    ],

    'environments' => [
        'production' => [
            'supervisor-1' => [
                'maxProcesses' => 20,
                'balanceMaxShift' => 1,
                'balanceCooldown' => 3,
            ],
        ],
        'local' => [
            'supervisor-1' => [
                'maxProcesses' => 3,
            ],
        ],
    ],
];
```

**2. Ensure Horizon runs continuously via Supervisor:**

```ini
# /etc/supervisor/conf.d/horizon.conf
[program:horizon]
process_name=%(program_name)s
command=php /var/www/html/artisan horizon
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/html/storage/logs/horizon.log
stopwaitsecs=3600
```

**3. Resume if paused:**

```bash
php artisan horizon:continue
```

**4. Customize ShieldCI threshold (Optional):**

To configure a pending job threshold, publish the config:
```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
return [
    'analyzers' => [
        'reliability' => [
            'enabled' => true,
            
            'horizon-reliability' => [
                'pending_job_threshold' => 500,
            ],
        ],
    ],
];
```

## References

- [Laravel Horizon Documentation](https://laravel.com/docs/horizon)
- [Horizon Configuration](https://laravel.com/docs/horizon#configuration)
- [Supervisor Configuration](http://supervisord.org/configuration.html)

## Related Analyzers

- [Alerting Configuration](/analyzers/reliability/alerting-config) - Validates alerting and notification mechanisms
- [Job Queue Configuration](/analyzers/reliability/job-queue-config) - Validates job retry policies and failed job handling
- [Queue Timeout Configuration](/analyzers/reliability/queue-timeout-configuration) - Ensures retry_after values are properly configured
- [Redis Status](/analyzers/reliability/redis-status) - Verifies Redis connectivity
