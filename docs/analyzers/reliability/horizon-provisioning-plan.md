---
title: Horizon Provisioning Plan Analyzer
description: Validates Horizon has a properly configured provisioning plan for the current environment
icon: settings
outline: [2, 3]
tags: horizon,provisioning,supervisor,reliability,queue
pro: true
---

# Horizon Provisioning Plan Analyzer

| Analyzer ID                  | Category       | Severity | Time To Fix |
| ---------------------------- | :------------: | :------: | ----------: |
| `horizon-provisioning-plan`  | ✅ Reliability | Critical | 15 minutes  |

## What This Checks

This analyzer validates that Laravel Horizon has a properly configured provisioning plan for the current application environment. It performs comprehensive checks across multiple configuration areas:

- **Environment plan exists** - Verifies that `config/horizon.php` has a provisioning plan matching the current `APP_ENV` (e.g., `production`, `staging`)
- **Valid environments config** - Ensures the `horizon.environments` configuration is a valid array structure
- **Queue configuration** - Checks that each supervisor has a `queue` property defining which queues to process
- **Memory limits** - Validates per-worker memory is between 64 MB (minimum) and 512 MB (maximum recommended)
- **Worker processes** - Ensures `minProcesses` is at least 1 and not greater than `maxProcesses`
- **Timeout values** - Flags timeouts below 10 seconds (too short) or above 3,600 seconds (too long)

::: tip When This Analyzer Runs
This analyzer only runs when:
- Laravel Horizon is installed and configured
- The application is NOT running on Laravel Vapor (Horizon is incompatible with serverless)
:::

## Why It Matters

A missing or misconfigured Horizon provisioning plan can cause serious reliability issues:

- **Horizon fails to start** - Without a plan for the current environment, Horizon cannot start workers at all
- **Queue processing halts** - Jobs pile up indefinitely if workers are not provisioned correctly
- **Incorrect worker allocation** - Too few workers cause backlogs; too many waste resources and can exhaust memory
- **Frequent worker restarts** - Low memory limits cause workers to restart constantly, losing in-progress jobs
- **Stuck workers** - Excessively long or short timeouts can leave workers in an unresponsive state or kill jobs prematurely
- **Silent failures** - Production environments missing from the config silently fail to process any queued jobs

## How to Fix

### Quick Fix

Add a provisioning plan for your current environment:

**Before (❌):**
```php
// config/horizon.php
'environments' => [
    'local' => [
        'supervisor-1' => [
            'maxProcesses' => 3,
            'queue' => ['default'],
        ],
    ],
    // Missing 'production' plan!
],
```

**After (✅):**
```php
// config/horizon.php
'environments' => [
    'production' => [
        'supervisor-1' => [
            'maxProcesses' => 10,
            'minProcesses' => 3,
            'queue' => ['default', 'high', 'low'],
            'memory' => 128,
            'timeout' => 60,
        ],
    ],
    'staging' => [
        'supervisor-1' => [
            'maxProcesses' => 5,
            'minProcesses' => 1,
            'queue' => ['default', 'high', 'low'],
            'memory' => 128,
            'timeout' => 60,
        ],
    ],
    'local' => [
        'supervisor-1' => [
            'maxProcesses' => 3,
            'queue' => ['default'],
        ],
    ],
],
```

### Proper Fix

Configure a comprehensive provisioning plan with multiple supervisors for different workloads:

```php
// config/horizon.php
'environments' => [
    'production' => [
        // High-priority jobs (payments, notifications)
        'supervisor-high' => [
            'connection' => 'redis',
            'queue' => ['high'],
            'balance' => 'auto',
            'minProcesses' => 2,
            'maxProcesses' => 10,
            'memory' => 128,
            'timeout' => 120,
            'tries' => 3,
            'nice' => 0,
        ],

        // Default queue processing
        'supervisor-default' => [
            'connection' => 'redis',
            'queue' => ['default'],
            'balance' => 'auto',
            'minProcesses' => 3,
            'maxProcesses' => 15,
            'memory' => 128,
            'timeout' => 60,
            'tries' => 3,
            'nice' => 5,
        ],

        // Low-priority jobs (reports, analytics)
        'supervisor-low' => [
            'connection' => 'redis',
            'queue' => ['low'],
            'balance' => 'simple',
            'minProcesses' => 1,
            'maxProcesses' => 5,
            'memory' => 256,
            'timeout' => 300,
            'tries' => 1,
            'nice' => 10,
        ],
    ],
],
```

**Memory guidelines:**

| Job Type | Recommended Memory |
| --- | --- |
| Simple notifications | 64-128 MB |
| Standard processing | 128-256 MB |
| Image/PDF processing | 256-512 MB |
| Data imports/exports | 256-512 MB |

**Timeout guidelines:**

| Job Type | Recommended Timeout |
| --- | --- |
| Email sending | 30-60 seconds |
| API calls | 60-120 seconds |
| Report generation | 300-600 seconds |
| Data imports | 600-3600 seconds |


## References

- [Laravel Horizon Documentation](https://laravel.com/docs/horizon)
- [Laravel Horizon Environments](https://laravel.com/docs/horizon#environments)
- [Laravel Horizon Supervisors](https://laravel.com/docs/horizon#supervisor-configuration)
- [Laravel Queue Configuration](https://laravel.com/docs/queues)

## Related Analyzers

- [Queue Timeout Configuration Analyzer](/analyzers/reliability/queue-timeout-configuration) - Validates queue worker timeout settings
- [Redis Status Analyzer](/analyzers/reliability/redis-status) - Checks Redis connectivity (required by Horizon)
- [Cache Status Analyzer](/analyzers/reliability/cache-status) - Validates cache connectivity and functionality

---
