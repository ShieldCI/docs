---
title: Disk Space Analyzer
description: Monitors disk space and inode usage across application directories to prevent storage-related outages
icon: hard-drive
outline: [2, 3]
tags: disk-space,storage,monitoring,reliability,infrastructure
pro: true
---

# Disk Space Analyzer

| Analyzer ID   | Category       | Severity | Time To Fix |
| --------------| :------------: |:--------:| -----------:|
| `disk-space`  | ✅ Reliability |   High   | 15 minutes  |

## What This Checks

- Monitors disk usage against configurable warning (70%) and critical (90%) thresholds
- Checks multiple paths: root filesystem (`/`), application directory, storage directory, and logs directory
- Detects high inode usage (many small files problem) on Unix/Linux systems with a default 80% threshold
- Enforces a minimum free space requirement (default 500 MB)
- Avoids redundant checks when multiple paths share the same filesystem (uses device ID deduplication)
- Supports custom paths via configuration
- Uses Laravel `storage_path()` for automatic storage path detection
- Only runs in production and staging environments
- Automatically skips in CI environments and when `disk_free_space()`/`disk_total_space()` functions are unavailable

## Why It Matters

- **Application crashes**: When disk space runs out, Laravel cannot write to logs, cache, sessions, or temp files, causing immediate application failures
- **Database corruption**: Database servers sharing the same disk may corrupt data when writes fail due to insufficient space
- **Lost uploads**: User file uploads fail silently or with cryptic errors when storage is full
- **Queue failures**: Queue workers write job data to disk; full disks cause jobs to fail and potentially be lost
- **Log file explosion**: Unrotated log files are a common cause of disk exhaustion, and the issue compounds because the errors themselves generate more logs
- **Inode exhaustion**: Even with available disk space, running out of inodes (from millions of small session/cache files) prevents creating new files
- **Slow recovery**: Disk space issues often cascade, making recovery more difficult the longer they go undetected

## How to Fix

### Quick Fix

Free up disk space immediately:

```bash
# Check current disk usage
df -h

# Check inode usage
df -i

# Clear Laravel logs
truncate -s 0 storage/logs/laravel.log

# Clear application cache
php artisan cache:clear
php artisan view:clear
php artisan config:clear
php artisan route:clear

# Remove old compiled files
php artisan optimize:clear

# Find large files in storage
du -sh storage/*
du -sh storage/logs/*
```

### Proper Fix

#### 1: Set up log rotation

```bash
# /etc/logrotate.d/laravel
/path/to/your/app/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0664 www-data www-data
}
```

Or configure daily log files in Laravel:

```php
// config/logging.php
'channels' => [
    'daily' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.log'),
        'level' => env('LOG_LEVEL', 'debug'),
        'days' => 14,  // Keep 14 days of logs
    ],
],
```

#### 2: Configure session cleanup

```php
// config/session.php
'lifetime' => 120,       // Session lifetime in minutes
'expire_on_close' => false,
'lottery' => [2, 100],   // 2% chance of garbage collection per request

// For file-based sessions, consider switching to Redis/database
'driver' => env('SESSION_DRIVER', 'redis'),
```

#### 3: Set up scheduled cleanup tasks

```php
// app/Console/Kernel.php
protected function schedule(Schedule $schedule): void
{
    // Clean old session files
    $schedule->command('session:gc')->daily();

    // Prune old telescope entries
    $schedule->command('telescope:prune --hours=48')->daily();

    // Prune old Horizon metrics
    $schedule->command('horizon:clear')->weekly();

    // Custom cleanup for uploaded files
    $schedule->call(function () {
        // Remove temporary uploads older than 24 hours
        $tempPath = storage_path('app/temp');
        $files = glob($tempPath . '/*');
        foreach ($files as $file) {
            if (filemtime($file) < time() - 86400) {
                unlink($file);
            }
        }
    })->daily();
}
```

#### 4: Add disk monitoring alerts

```php
// app/Console/Commands/CheckDiskSpace.php
use Illuminate\Support\Facades\Notification;

$freeSpace = disk_free_space('/');
$totalSpace = disk_total_space('/');
$usedPercent = round((1 - $freeSpace / $totalSpace) * 100, 2);

if ($usedPercent > 85) {
    Notification::route('slack', config('services.slack.webhook'))
        ->notify(new DiskSpaceWarning($usedPercent));
}
```

#### 5: Move large files to object storage

```php
// config/filesystems.php
'disks' => [
    'uploads' => [
        'driver' => 's3',
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION'),
        'bucket' => env('AWS_BUCKET'),
    ],
],
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments and only runs in production and staging.

Configure thresholds and additional paths via `config/shieldci.php`:

```php
// config/shieldci.php
return [
    'disk_space' => [
        // Disk usage warning threshold (percentage)
        'warning_threshold' => 70,

        // Disk usage critical threshold (percentage)
        'critical_threshold' => 90,

        // Minimum free space in MB
        'min_free_mb' => 500,

        // Inode usage warning threshold (percentage)
        'inode_warning_threshold' => 80,

        // Additional paths to monitor
        'paths' => [
            'Uploads' => '/var/www/uploads',
            'Backups' => '/mnt/backups',
        ],
    ],
];
```

**When to run this analyzer:**
- ✅ **Production/Staging servers**: Monitors real disk usage
- ✅ **Local development**: Validates disk space availability
- ❌ **CI/CD pipelines**: Skipped automatically (disk space varies per runner)

## References

- [Laravel Filesystem Documentation](https://laravel.com/docs/filesystem)
- [Laravel Logging Configuration](https://laravel.com/docs/logging)
- [Linux Disk Usage Commands](https://man7.org/linux/man-pages/man1/df.1.html)
- [Logrotate Configuration](https://linux.die.net/man/8/logrotate)

## Related Analyzers

- [Cache Status Analyzer](/analyzers/reliability/cache-status) - Verifies cache driver connectivity and operation
- [Database Status Analyzer](/analyzers/reliability/database-status) - Ensures database connections are accessible and functioning
- [Directory Write Permissions Analyzer](/analyzers/reliability/directory-write-permissions) - Ensures required directories are writable
