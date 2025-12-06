---
title: Queue Timeout Configuration Analyzer
description: Ensures queue timeout and retry_after values are properly configured to prevent job duplication and queue worker crashes
icon: alert-triangle
outline: [2, 3]
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

#### Fix #1: Configure retry_after for Standard Queue Workers

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

#### Fix #2: Configure with Laravel Horizon

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

#### Fix #3: Per-Job Timeout Configuration

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

#### Fix #4: Multiple Queue Connections with Different Timeouts

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

#### Fix #5: Environment-Specific Configuration

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
# .env.production
QUEUE_RETRY_AFTER=330  # Higher for production workloads
QUEUE_TIMEOUT=300
```

#### Fix #6: Horizon with Multiple Supervisors

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

#### Fix #7: Database Queue Configuration

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

## Understanding the Formula

The golden rule for queue timeout configuration:

```
retry_after = max(all_job_timeouts) + buffer
```

Where:
- **max(all_job_timeouts)**: The longest timeout across all jobs and workers
- **buffer**: Safety margin (recommended: 30 seconds minimum)

### Why the Buffer Matters

The buffer accounts for:
1. **Network latency**: Redis/database communication delays
2. **Graceful shutdown**: Time for job to finish current operation
3. **Resource cleanup**: File handles, database connections, etc.
4. **System load**: CPU/memory spikes can slow job execution
5. **Clock drift**: Small timing differences between servers

### Examples

```php
// ✅ Correct configurations

// Single worker, 60s timeout
'retry_after' => 90  // 60 + 30 buffer

// Multiple workers, max timeout 120s
'retry_after' => 150 // 120 + 30 buffer

// Horizon with max supervisor timeout 300s
'retry_after' => 330 // 300 + 30 buffer

// ❌ Incorrect configurations

// Timeout equals retry_after
'retry_after' => 60  // ❌ No buffer!

// retry_after less than timeout
'retry_after' => 45  // ❌ Jobs will timeout!

// Insufficient buffer
'retry_after' => 65  // ❌ Only 5 second buffer
```

## Best Practices

### 1. Use Consistent Environment Variables

```bash
# .env
QUEUE_CONNECTION=redis
QUEUE_TIMEOUT=60
QUEUE_RETRY_AFTER=90
HORIZON_TIMEOUT=60
```

### 2. Document Your Configuration

```php
// config/queue.php
'redis' => [
    'driver' => 'redis',
    'connection' => 'default',
    'queue' => 'default',
    // Configured for worker timeout of 60 seconds
    // Formula: retry_after = timeout (60) + buffer (30)
    // Update if worker --timeout flag changes!
    'retry_after' => 90,
],
```

### 3. Monitor Queue Metrics

```php
// Monitor job timeouts
use Illuminate\Support\Facades\Queue;

Queue::failing(function ($connection, $job, $data) {
    \Log::error('Job failed', [
        'connection' => $connection,
        'job' => $job->resolveName(),
        'attempts' => $job->attempts(),
        'timeout_exceeded' => $job->timeout(),
    ]);
});
```

### 4. Test Timeout Configuration

```bash
# Create a test job that runs for known duration
php artisan make:job TestTimeoutJob

# Dispatch and monitor
php artisan tinker
>>> App\Jobs\TestTimeoutJob::dispatch();

# Check if job completes or times out
php artisan queue:work --timeout=60 --tries=1
```

### 5. Use Horizon Dashboard

Monitor job performance through Horizon dashboard:

```bash
# Access dashboard at /horizon
php artisan horizon

# Monitor for:
# - Jobs timing out
# - Jobs being retried multiple times
# - Worker memory usage
# - Queue depth
```

### 6. Set Alerts for Configuration Drift

```php
// app/Console/Commands/ValidateQueueConfig.php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ValidateQueueConfig extends Command
{
    protected $signature = 'queue:validate-config';

    public function handle()
    {
        $timeout = config('horizon.defaults.supervisor.timeout', 60);
        $retryAfter = config('queue.connections.redis.retry_after', 90);

        if ($timeout >= $retryAfter) {
            $this->error("❌ Queue misconfiguration detected!");
            $this->error("Timeout: {$timeout}s, Retry After: {$retryAfter}s");
            $this->info("retry_after must be greater than timeout");
            return 1;
        }

        $this->info("✅ Queue configuration is valid");
        return 0;
    }
}
```

```php
// Run in CI/CD pipeline
composer validate-queue-config || exit 1
```

## ShieldCI Integration

ShieldCI automatically validates queue timeout configuration:

```bash
# Run ShieldCI analysis
php artisan shield:analyze --analyzer=queue-timeout-configuration

# Or run all reliability analyzers
php artisan shield:analyze --category=reliability
```

### CI/CD Integration

```yaml
# .github/workflows/queue-config-check.yml
name: Queue Configuration Check

on: [push, pull_request]

jobs:
  validate-queue:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'

      - name: Install dependencies
        run: composer install --no-dev

      - name: Check Queue Configuration
        run: |
          php artisan shield:analyze \
            --analyzer=queue-timeout-configuration \
            --fail-on=critical
```

## Common Mistakes to Avoid

### Mistake #1: Using Same Value for timeout and retry_after

```php
// ❌ Wrong
'retry_after' => 60,  // Worker --timeout=60

// ✅ Correct
'retry_after' => 90,  // Worker --timeout=60 with buffer
```

### Mistake #2: Forgetting to Update After Changing Worker Timeout

```bash
# ❌ Wrong: Changed worker timeout but not retry_after
php artisan queue:work --timeout=120  # Increased timeout
# But config still has retry_after=90

# ✅ Correct: Update config first
# config/queue.php: 'retry_after' => 150
php artisan queue:work --timeout=120
```

### Mistake #3: Not Accounting for All Supervisor Timeouts

```php
// ❌ Wrong: Only considering one supervisor
// Horizon has supervisor-1 with timeout=60 and supervisor-2 with timeout=300
'retry_after' => 90,  // Only accounts for supervisor-1

// ✅ Correct: Use maximum timeout
'retry_after' => 330,  // Accounts for supervisor-2 (300) + buffer
```

### Mistake #4: Insufficient Buffer

```php
// ❌ Wrong: Buffer too small
'retry_after' => 65,  // Only 5 second buffer

// ✅ Correct: Minimum 30 second buffer
'retry_after' => 90,  // 30 second buffer
```

## Related Analyzers

- [Maintenance Mode Status Analyzer](/analyzers/reliability/maintenance-mode-status) - Detects maintenance mode issues
- [Up-to-Date Migrations Analyzer](/analyzers/reliability/up-to-date-migrations) - Ensures all database migrations are up to date
- [Database Status Analyzer](/analyzers/reliability/database-status) - Ensures database connections are accessible and functioning

## References

- [Laravel Queues Documentation](https://laravel.com/docs/queues)
- [Laravel Horizon Documentation](https://laravel.com/docs/horizon)
- [Queue Configuration](https://laravel.com/docs/queues#configuration)
- [Queue Workers & Deployment](https://laravel.com/docs/queues#running-the-queue-worker)
- [Supervisor Configuration](http://supervisord.org/configuration.html)
