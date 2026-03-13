---
title: Data Retention Policy Analyzer
description: Validates that proper data retention policies are in place to prevent unbounded data growth
icon: shield
outline: [2, 3]
tags: reliability,data-retention,logging,pruning,cleanup
pro: true
---

# Data Retention Policy Analyzer

| Analyzer ID             | Category     | Severity   | Time To Fix  |
|-------------------------| :----------: |:----------:| ------------:|
| `data-retention-policy` | ✅ Reliability  | Medium    | 15 minutes   |

## What This Checks

Validates that data retention policies prevent unbounded growth. Checks for:

- Log channels using `single` driver (single file grows forever)
- Accumulating models without `Prunable` or `MassPrunable` trait
- Missing job/batch cleanup (`failed_jobs` table growing unbounded)
- Telescope installed without pruning scheduled
- Horizon installed without purging configured

## Why It Matters

- **Disk Exhaustion:** Unbounded log files and database tables eventually fill the disk, causing outages
- **Performance Degradation:** Large tables slow queries, even with indexes
- **Compliance:** GDPR and other regulations require data retention limits
- **Cost:** Cloud storage and database costs grow with unchecked data accumulation

## How to Fix

### Quick Fix (5 minutes)

Switch from `single` to `daily` log driver with rotation:

```php
// config/logging.php
'channels' => [
    'daily' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.log'),
        'level' => env('LOG_LEVEL', 'debug'),
        'days' => 14, // Keep 14 days of logs
    ],
],
```

### Proper Fix (15 minutes)

**1. Add Prunable trait to accumulating models:**

```php
use Illuminate\Database\Eloquent\Prunable;

class AuditLog extends Model
{
    use Prunable;

    public function prunable(): Builder
    {
        return static::where('created_at', '<=', now()->subDays(90));
    }
}
```

**2. Schedule model pruning:**

```php
// routes/console.php (Laravel 11+)
Schedule::command('model:prune')->daily();

// Or in app/Console/Kernel.php (Laravel 10-)
$schedule->command('model:prune')->daily();
```

**3. Schedule job cleanup:**

```php
Schedule::command('queue:prune-failed --hours=168')->daily();
Schedule::command('queue:prune-batches --hours=168')->daily();
```

**4. Schedule Telescope/Horizon cleanup:**

```php
Schedule::command('telescope:prune --hours=48')->daily();
Schedule::command('horizon:purge')->daily();
```

## References

- [Laravel Pruning Models](https://laravel.com/docs/eloquent#pruning-models)
- [Laravel Log Rotation](https://laravel.com/docs/logging#configuring-the-daily-channel)
- [Laravel Queue Pruning](https://laravel.com/docs/queues#pruning-failed-jobs)

## Related Analyzers

- [Alerting Configuration](/analyzers/reliability/alerting-config) - Validates alerting mechanisms
- [Telescope Security](/analyzers/security/telescope-security) - Validates Telescope configuration
- [Horizon Prefix](/analyzers/reliability/horizon-prefix) - Checks Horizon configuration
