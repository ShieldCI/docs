---
title: Job Queue Configuration Analyzer
description: Validates job queue configuration including blocking, retry policies, and failed job handling
icon: alert-triangle
outline: [2, 3]
tags: reliability,queue,jobs,redis,configuration
pro: true
---

# Job Queue Configuration Analyzer

| Analyzer ID        |     Category     | Severity | Time To Fix  |
| -------------------|:----------------:|:--------:| ------------:|
| `job-queue-config` |  ✅ Reliability  |   High   | 10 minutes   |

## What This Checks

Validates that job queue configuration is correctly set up to prevent common reliability issues. Checks for:

- Redis connections with `block_for = 0` (busy polling that wastes CPU and blocks signal handling)
- Redis connections with a very high `block_for` value (slow SIGTERM response on shutdown)
- Job classes in `app/Jobs/` that do not implement `ShouldQueue` or `ShouldQueueAfterCommit`
- Job classes missing `$tries` or a `retryUntil()` method (unlimited retries on failure)
- Job classes missing a `$timeout` property (workers can block indefinitely)
- Job classes with `$tries` but no `$backoff` (immediate retry hammers external services)
- Missing or incomplete `queue.failed` configuration (failed jobs are not persisted)

## Why It Matters

- **CPU Waste:** `block_for = 0` causes workers to busy-poll Redis continuously, driving up CPU usage under low traffic
- **Graceful Shutdown Delays:** A high `block_for` value means workers ignore SIGTERM for the full duration of each poll cycle
- **Infinite Retry Loops:** Jobs without `$tries` are retried forever on failure, filling the queue and consuming worker capacity
- **Stuck Workers:** Jobs without `$timeout` can run indefinitely, blocking a worker slot for all other jobs
- **Thundering Herd:** Failing jobs without `$backoff` hammer external services on every retry, compounding failures
- **Unrecoverable Failures:** Without a configured `failed` table, failed jobs are lost and cannot be inspected or retried

## How to Fix

### Quick Fix (2 minutes)

Fix `block_for` in `config/queue.php`:

```php
// ❌ Before: busy polling
'redis' => [
    'driver' => 'redis',
    'block_for' => 0,
],

// ✅ After: efficient blocking with fast signal response
'redis' => [
    'driver' => 'redis',
    'block_for' => null, // uses BLPOP — signals handled immediately
],
```

### Proper Fix (10 minutes)

**1. Configure Redis queue connections:**

```php
// config/queue.php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => env('REDIS_QUEUE', 'default'),
        'retry_after' => 90,
        'block_for' => null, // ✅ BLPOP — responds to signals immediately
    ],
],

'failed' => [
    'driver' => env('QUEUE_FAILED_DRIVER', 'database-uuids'),
    'database' => env('DB_CONNECTION', 'mysql'),
    'table' => 'failed_jobs',
],
```

Run the migration if it does not exist:

```bash
php artisan queue:failed-table
php artisan migrate
```

**2. Configure job classes with retry policies:**

```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWelcomeEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // ✅ Maximum number of attempts before the job fails
    public int $tries = 3;

    // ✅ Seconds before a worker running this job is killed
    public int $timeout = 60;

    // ✅ Seconds to wait before retrying after failure
    public int $backoff = 10;

    public function handle(): void
    {
        // Send the email...
    }
}
```

**3. Use exponential backoff for external service calls:**

```php
class CallExternalApi implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;
    public int $timeout = 30;

    // ✅ Exponential backoff: 10s, 30s, 60s, 120s, 240s
    public function backoff(): array
    {
        return [10, 30, 60, 120, 240];
    }

    public function handle(): void
    {
        // Call external API...
    }
}
```

## References

- [Laravel Queues Documentation](https://laravel.com/docs/queues)
- [Queue Configuration](https://laravel.com/docs/queues#configuration)
- [Job Retries & Backoff](https://laravel.com/docs/queues#max-job-attempts-and-timeout)
- [Dealing with Failed Jobs](https://laravel.com/docs/queues#dealing-with-failed-jobs)

## Related Analyzers

- [Horizon Reliability](/analyzers/reliability/horizon-reliability) - Validates Horizon prefix, provisioning plan, and runtime health
- [Queue Timeout Configuration](/analyzers/reliability/queue-timeout-configuration) - Ensures retry_after values are properly configured
- [Alerting Configuration](/analyzers/reliability/alerting-config) - Validates failed job notification mechanisms
- [Redis Status](/analyzers/reliability/redis-status) - Verifies Redis connectivity
