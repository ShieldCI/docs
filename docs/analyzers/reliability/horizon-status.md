---
title: Horizon Status Analyzer
description: Monitors Horizon runtime status including master process, supervisors, and queue depth
icon: activity
outline: [2, 3]
tags: horizon,status,queue,monitoring,reliability
pro: true
---

# Horizon Status Analyzer

| Analyzer ID       | Category       | Severity | Time To Fix |
| ------------------| :------------: |:--------:| -----------:|
| `horizon-status`  | ✅ Reliability |   High   | 10 minutes  |

## What This Checks

- Verifies the Horizon master process is running via the `horizon:status` Artisan command
- Checks the Horizon heartbeat timestamp in Redis and warns if it is stale (older than 120 seconds), indicating a hung process
- Monitors pending job count and warns when it exceeds the configurable threshold (default 1,000 jobs)
- Detects paused supervisors that are not processing jobs
- Enumerates all supervisor keys in Redis and checks their status
- Automatically skips on Laravel Vapor (incompatible with Horizon's process-based architecture)
- Only runs in production and staging environments
- Automatically skips in CI environments

## Why It Matters

- **Silent job failure**: When Horizon stops running, jobs accumulate in the queue without being processed, and there is no visible error unless you actively monitor Horizon's status
- **Stale processes**: A Horizon master process may become hung (heartbeat stops updating) while still appearing to be running, leaving all queues unprocessed
- **Queue backlog**: A growing pending job count indicates workers cannot keep up with demand, leading to delayed emails, notifications, webhooks, and other async tasks
- **Paused supervisors**: Supervisors paused during maintenance or debugging may be accidentally left paused, silently halting job processing
- **Deployment issues**: After deployments, Horizon may fail to restart if Supervisor is misconfigured or if the new code has a fatal error
- **Revenue impact**: Jobs processing payments, order fulfillment, and subscription renewals failing silently can cause direct financial losses

## How to Fix

### Quick Fix (5 minutes)

Start Horizon and verify it is running:

```bash
# Check current status
php artisan horizon:status

# Start Horizon
php artisan horizon

# Resume paused supervisors
php artisan horizon:continue

# If Horizon is stuck, terminate and restart
php artisan horizon:terminate
php artisan horizon
```

### Proper Fix (10 minutes)

#### 1: Configure Supervisor to keep Horizon running

```ini
# /etc/supervisor/conf.d/horizon.conf
[program:horizon]
process_name=%(program_name)s
command=php /var/www/your-app/artisan horizon
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/your-app/storage/logs/horizon.log
stopwaitsecs=3600
```

```bash
# Apply Supervisor configuration
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start horizon
```

#### 2: Add Horizon restart to your deployment script

```bash
# deploy.sh
php artisan horizon:terminate

# Supervisor will automatically restart Horizon
# Wait for graceful shutdown before proceeding
sleep 5
```

Or with Laravel Forge / Envoyer:

```bash
# Deployment hook
php artisan horizon:terminate
```

#### 3: Monitor pending job count

Set an appropriate threshold for your application:

```php
// config/shieldci.php
return [
    'horizon' => [
        'pending_job_threshold' => 500,  // Warn above 500 pending jobs
    ],
];
```

#### 4: Set up external monitoring

```php
// routes/web.php
Route::get('/horizon/health', function () {
    try {
        Artisan::call('horizon:status');
        $output = Artisan::output();

        if (str_contains($output, 'Horizon is running')) {
            return response()->json(['status' => 'healthy'], 200);
        }

        return response()->json(['status' => 'unhealthy', 'output' => trim($output)], 503);
    } catch (\Throwable $e) {
        return response()->json(['status' => 'error', 'message' => $e->getMessage()], 503);
    }
})->middleware('auth:api');
```

#### 5: Add Horizon monitoring to Laravel Pulse or similar

```php
// app/Console/Kernel.php
protected function schedule(Schedule $schedule): void
{
    // Check Horizon status every minute
    $schedule->command('horizon:snapshot')->everyFiveMinutes();

    // Prune old Horizon data
    $schedule->command('horizon:purge')->hourly();
}
```

#### 6: Handle supervisor pauses intentionally

If you need to pause Horizon during maintenance:

```bash
# Pause before maintenance
php artisan horizon:pause

# Perform maintenance...

# Resume after maintenance
php artisan horizon:continue
```

Always verify resume after maintenance windows:

```bash
php artisan horizon:status
# Should output: "Horizon is running."
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments and only runs in production and staging. It is also skipped on Laravel Vapor.

Configure the pending job threshold via `config/shieldci.php`:

```php
// config/shieldci.php
return [
    'horizon' => [
        // Warn when pending jobs exceed this count
        'pending_job_threshold' => 1000,
    ],
];
```

**When to run this analyzer:**
- ✅ **Production/Staging servers**: Monitors live Horizon process health
- ❌ **CI/CD pipelines**: Skipped automatically (Horizon is not running in CI)
- ❌ **Laravel Vapor**: Skipped automatically (Vapor is incompatible with Horizon)

## References

- [Laravel Horizon Documentation](https://laravel.com/docs/horizon)
- [Laravel Horizon Deploying](https://laravel.com/docs/horizon#deploying-horizon)
- [Supervisor Configuration](http://supervisord.org/configuration.html)
- [Laravel Queues Documentation](https://laravel.com/docs/queues)

## Related Analyzers

- [Horizon Prefix Analyzer](/analyzers/reliability/horizon-prefix) - Validates Horizon prefix uniqueness to prevent Redis collisions
- [Queue Timeout Configuration Analyzer](/analyzers/reliability/queue-timeout-configuration) - Ensures queue timeout and retry_after values are properly configured
- [Queue Blocking Analyzer](/analyzers/reliability/queue-blocking) - Validates Redis queue blocking configuration
