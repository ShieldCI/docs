---
title: Queue Timeout Configuration Analyzer
description: Ensures queue timeout and retry_after values are properly configured to prevent job duplication and queue worker crashes
icon: alert-triangle
outline: [2, 3]
tags: queue,configuration,reliability,jobs
---

# Queue Timeout Configuration Analyzer

| Analyzer ID                    | Category       | Severity | Time To Fix |
| -------------------------------| :------------: |:--------:| -----------:|
| `queue-timeout-configuration`  | ✅ Reliability | Critical | 10 minutes  |

## What This Checks

- Validates that `retry_after` is greater than queue timeout values
- Ensures proper timeout configuration for queue workers
- Prevents jobs from being processed twice due to timeout issues
- Checks all queue connections (Redis, Database, Beanstalkd)
- Integrates with Laravel Horizon timeout configuration
- Skips sync and SQS drivers (they don't use retry_after)
- Reports exact configuration file location and line number

## Why It Matters

- **Job duplication**: When timeout >= retry_after, jobs can be released back to the queue before completion, causing duplicate processing
- **Data corruption**: Duplicate job processing leads to inconsistent database states, double charges, duplicate emails, etc.
- **Queue worker crashes**: Improperly configured timeouts cause workers to crash with "Maximum execution time exceeded" errors
- **Memory leaks**: Jobs timing out without proper cleanup cause memory exhaustion over time
- **Lost jobs**: Workers crashing mid-job can lose important queued tasks
- **Production incidents**: Timeout misconfigurations are a common cause of production outages
- **Financial impact**: Duplicate payment processing, double order fulfillment, or duplicate API calls cost money
- **User experience**: Users may receive duplicate notifications, emails, or see inconsistent data
- **Debugging difficulty**: Timeout issues create intermittent bugs that are hard to reproduce
- **Scaling problems**: Misconfigured timeouts prevent horizontal scaling of queue workers

## How to Fix

### Quick Fix (2 minutes)

If you have a timeout configuration error:

```php
// ❌ Before: retry_after too small
// config/queue.php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => 'default',
        'retry_after' => 60, // ❌ Same as or less than timeout (60)
    ],
],

// ✅ After: retry_after with proper buffer
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => 'default',
        'retry_after' => 90, // ✅ Timeout (60) + buffer (30)
    ],
],
```

### Proper Fix (10 minutes)

#### 1: Configure retry_after for Standard Queue Workers

Set `retry_after` to be at least 30 seconds more than your worker timeout:

```php
// config/queue.php
return [
    'default' => env('QUEUE_CONNECTION', 'redis'),

    'connections' => [
        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
            'queue' => env('REDIS_QUEUE', 'default'),
            // Worker timeout is 60 seconds by default
            // retry_after should be: max(timeout) + 30 seconds buffer
            'retry_after' => 90,
            'block_for' => null,
        ],

        'database' => [
            'driver' => 'database',
            'table' => 'jobs',
            'queue' => 'default',
            'retry_after' => 90,
        ],
    ],
];
```

**Running queue workers:**

```bash
# Default timeout is 60 seconds
php artisan queue:work

# Custom timeout - update retry_after accordingly
php artisan queue:work --timeout=120

# For timeout=120, set retry_after=150 in config
```

#### 2: Configure with Laravel Horizon

For applications using Horizon, configure timeouts in `config/horizon.php`:

```php
// config/horizon.php
return [
    'defaults' => [
        'supervisor-1' => [
            'connection' => 'redis',
            'queue' => ['default'],
            'balance' => 'auto',
            'processes' => 10,
            'tries' => 3,
            'timeout' => 120, // ⬅️ Maximum job timeout
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

```php
// config/queue.php
return [
    'connections' => [
        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
            'queue' => 'default',
            // retry_after = max Horizon timeout (120) + buffer (30)
            'retry_after' => 150, // ✅ Proper configuration
            'block_for' => null,
        ],
    ],
];
```

#### 3: Per-Job Timeout Configuration

For jobs with varying execution times, configure per-job timeouts:

```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessLargeReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 300; // 5 minutes for large reports

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Process large report...
    }
}
```

```php
// config/queue.php - ensure retry_after accommodates longest job
'redis' => [
    'driver' => 'redis',
    'connection' => 'default',
    'queue' => 'default',
    // retry_after must be greater than max job timeout (300)
    'retry_after' => 330, // ✅ 300 + 30 second buffer
],
```

#### 4: Multiple Queue Connections with Different Timeouts

Use separate connections for jobs with different timeout requirements:

```php
// config/queue.php
return [
    'connections' => [
        // Fast queue for quick jobs
        'redis-fast' => [
            'driver' => 'redis',
            'connection' => 'default',
            'queue' => 'fast',
            'retry_after' => 90, // For 60 second timeout jobs
        ],

        // Slow queue for long-running jobs
        'redis-slow' => [
            'driver' => 'redis',
            'connection' => 'default',
            'queue' => 'slow',
            'retry_after' => 330, // For 300 second timeout jobs
        ],
    ],
];
```

```php
// Dispatch to appropriate queue
ProcessQuickTask::dispatch()->onConnection('redis-fast');
ProcessLargeReport::dispatch()->onConnection('redis-slow');
```

**Run workers with appropriate timeouts:**

```bash
# Fast worker
php artisan queue:work redis-fast --timeout=60

# Slow worker
php artisan queue:work redis-slow --timeout=300
```

#### 5: Environment-Specific Configuration

Use environment variables for flexible timeout configuration:

```bash
# .env
QUEUE_RETRY_AFTER=90
QUEUE_TIMEOUT=60
```

```php
// config/queue.php
'connections' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'default',
        'queue' => env('REDIS_QUEUE', 'default'),
        'retry_after' => env('QUEUE_RETRY_AFTER', 90),
        'block_for' => null,
    ],
],
```

**Production environment:**

```bash
# .env
QUEUE_RETRY_AFTER=330  # Higher for production workloads
QUEUE_TIMEOUT=300
```

#### 6: Horizon with Multiple Supervisors

For complex Horizon setups with multiple supervisors:

```php
// config/horizon.php
return [
    'defaults' => [
        'fast-supervisor' => [
            'connection' => 'redis',
            'queue' => ['fast'],
            'balance' => 'auto',
            'processes' => 10,
            'tries' => 3,
            'timeout' => 60,
        ],
        'slow-supervisor' => [
            'connection' => 'redis',
            'queue' => ['slow'],
            'balance' => 'auto',
            'processes' => 5,
            'tries' => 2,
            'timeout' => 300, // ⬅️ Longest timeout
        ],
    ],

    'environments' => [
        'production' => [
            'fast-supervisor' => [
                'maxProcesses' => 20,
            ],
            'slow-supervisor' => [
                'maxProcesses' => 10,
            ],
        ],
    ],
];
```

```php
// config/queue.php
'redis' => [
    'driver' => 'redis',
    'connection' => 'default',
    'queue' => 'default',
    // retry_after must be greater than the MAXIMUM timeout across all supervisors
    'retry_after' => 330, // ✅ Max timeout (300) + buffer (30)
],
```

#### 7: Database Queue Configuration

For database driver queues:

```php
// config/queue.php
'database' => [
    'driver' => 'database',
    'table' => 'jobs',
    'queue' => 'default',
    'retry_after' => 90, // Worker timeout (60) + buffer (30)
],
```

**Database migration:**

```php
Schema::create('jobs', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('queue')->index();
    $table->longText('payload');
    $table->unsignedTinyInteger('attempts');
    $table->unsignedInteger('reserved_at')->nullable();
    $table->unsignedInteger('available_at');
    $table->unsignedInteger('created_at');
});
```

## References

- [Laravel Queues Documentation](https://laravel.com/docs/queues)
- [Laravel Horizon Documentation](https://laravel.com/docs/horizon)
- [Queue Configuration](https://laravel.com/docs/queues#configuration)
- [Queue Workers & Deployment](https://laravel.com/docs/queues#running-the-queue-worker)
- [Supervisor Configuration](http://supervisord.org/configuration.html)

## Related Analyzers

- [Maintenance Mode Status Analyzer](/analyzers/reliability/maintenance-mode-status) - Detects maintenance mode issues
- [Up-to-Date Migrations Analyzer](/analyzers/reliability/up-to-date-migrations) - Ensures all database migrations are up to date
- [Database Status Analyzer](/analyzers/reliability/database-status) - Ensures database connections are accessible and functioning
