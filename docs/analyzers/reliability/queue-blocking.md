---
title: Queue Blocking Analyzer
description: Validates Redis queue blocking configuration for optimal performance and signal handling
icon: pause
outline: [2, 3]
tags: queue,blocking,jobs,reliability,configuration
---

# Queue Blocking Analyzer

| Analyzer ID       | Category       | Severity | Time To Fix |
| ------------------| :------------: |:--------:| -----------:|
| `queue-blocking`  | ✅ Reliability |   High   | 5 minutes   |

## What This Checks

- Inspects the `block_for` setting on all Redis queue connections in `config/queue.php`
- Flags `block_for = 0` as a high-severity issue (busy polling with excessive CPU usage and blocked signal handling)
- Warns when `block_for` exceeds 5 seconds (slow signal handling, delayed graceful shutdown)
- Recommends `null` (BLPOP) or 1-3 seconds as optimal values
- Checks all Redis queue connections, not just the default
- Only runs when the application uses at least one Redis queue connection

## Why It Matters

- **Excessive CPU usage**: Setting `block_for` to `0` causes workers to busy-poll Redis in a tight loop, consuming 100% CPU on each worker process even when no jobs are available
- **Blocked signal handling**: With `block_for = 0`, PHP blocks inside the Redis polling call and cannot process signals (`SIGTERM`, `SIGINT`) until a job arrives, preventing graceful shutdown during deployments
- **Delayed deployments**: Large `block_for` values (e.g., 30 seconds) mean workers can take up to that many seconds to respond to termination signals, delaying deployment restarts
- **Worker crash risk**: Busy-polling can exhaust system resources, causing worker processes to be killed by the OOM killer or watchdog timers
- **Redis connection overhead**: Rapid polling with `block_for = 0` generates excessive Redis commands, increasing network traffic and Redis CPU load
- **Horizon compatibility**: Horizon relies on timely signal handling for its auto-scaling and process management; poor `block_for` values degrade Horizon's ability to manage workers

## How to Fix

### Quick Fix

Update `block_for` in your `config/queue.php`:

```php
// ❌ Before: Busy polling (block_for = 0)
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => env('REDIS_QUEUE', 'default'),
        'retry_after' => 90,
        'block_for' => 0,  // ❌ Busy polling, high CPU, blocks signals
    ],
],

// ✅ After: Use BLPOP (block_for = null)
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => env('REDIS_QUEUE', 'default'),
        'retry_after' => 90,
        'block_for' => null,  // ✅ Uses Redis BLPOP, efficient and signal-aware
    ],
],
```

### Proper Fix

#### 1: Understand the `block_for` options

| Value | Behavior | CPU Usage | Signal Handling | Recommendation |
| --- | --- | --- | --- | --- |
| `null` | Uses Redis `BLPOP` | Minimal | Immediate | **Best for most apps** |
| `0` | Busy polling | Very High | Blocked | **Never use** |
| `1-3` | Poll every 1-3 sec | Low | 1-3 sec delay | Good alternative |
| `> 5` | Poll every N sec | Low | N sec delay | Too slow for deploys |

#### 2: Configure for optimal performance

```php
// config/queue.php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => env('REDIS_QUEUE', 'default'),
        'retry_after' => 90,
        'block_for' => null,  // ✅ Recommended: BLPOP
    ],
],
```

`null` uses Redis `BLPOP`, which:
- Blocks efficiently at the Redis level (no CPU spinning)
- Returns immediately when a job is pushed
- Allows PHP to handle signals between BLPOP calls

#### 3: Use a small poll interval if BLPOP is problematic

In rare cases where `BLPOP` causes issues (e.g., proxy timeouts), use a small interval:

```php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => env('REDIS_QUEUE', 'default'),
        'retry_after' => 90,
        'block_for' => 2,  // ✅ Acceptable: 2-second poll interval
    ],
],
```

#### 4: Configure multiple connections appropriately

```php
// config/queue.php
'connections' => [
    // Default queue - low latency
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => 'default',
        'retry_after' => 90,
        'block_for' => null,
    ],

    // High-priority queue - low latency
    'redis-high' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => 'high',
        'retry_after' => 90,
        'block_for' => null,
    ],

    // Batch processing queue - slightly higher interval is acceptable
    'redis-batch' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => 'batch',
        'retry_after' => 330,
        'block_for' => 3,  // ✅ Acceptable for batch processing
    ],
],
```

#### 5: Set block_for via environment variables

```bash
# .env
QUEUE_BLOCK_FOR=
# Leave empty for null (BLPOP), or set to 1-3
```

```php
// config/queue.php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => env('REDIS_QUEUE', 'default'),
        'retry_after' => env('QUEUE_RETRY_AFTER', 90),
        'block_for' => env('QUEUE_BLOCK_FOR') !== null
            ? (int) env('QUEUE_BLOCK_FOR')
            : null,
    ],
],
```


## References

- [Laravel Queue Configuration](https://laravel.com/docs/queues#driver-prerequisites)
- [Redis BLPOP Command](https://redis.io/commands/blpop/)
- [Laravel Horizon Documentation](https://laravel.com/docs/horizon)
- [PHP Signal Handling](https://www.php.net/manual/en/function.pcntl-signal.php)

## Related Analyzers

- [Queue Timeout Configuration Analyzer](/analyzers/reliability/queue-timeout-configuration) - Ensures queue timeout and retry_after values are properly configured
- [Horizon Status Analyzer](/analyzers/reliability/horizon-status) - Monitors Horizon runtime status and health
- [Horizon Prefix Analyzer](/analyzers/reliability/horizon-prefix) - Validates Horizon prefix uniqueness
- [PCNTL Extension Analyzer](/analyzers/reliability/pcntl) - Verifies required PHP extensions for queue signal handling
