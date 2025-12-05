---
title: Debug Log Level Analyzer
description: Detects excessive debug logging in production that degrades performance and fills disk space
icon: alert-circle
outline: [2, 3]
---

# Debug Log Level Analyzer

| Analyzer ID       | Category       | Severity   | Time To Fix  |
| ------------------| :------------: |:----------:| ------------:|
| `debug-log-level` | ⚡ Performance  | High       | 5 minutes    |

## What This Checks

Detects excessive debug logging in production that degrades performance and fills disk space.

## Why It Matters

- **Performance Impact:** Debug logging can slow applications by 20-50%
- **Disk Space:** Verbose logs quickly fill disk storage
- **Security:** Debug logs may expose sensitive data

Debug-level logging captures every framework operation. In production, this creates massive log files and significantly impacts performance.

## How to Fix

### Quick Fix (1 minute)

```ini
# .env
LOG_LEVEL=warning
```

### Proper Fix (5 minutes)

**Configure Log Levels per Environment:**

```php
// config/logging.php
'channels' => [
    'stack' => [
        'driver' => 'stack',
        'channels' => ['single'],
        'ignore_exceptions' => false,
    ],

    'single' => [
        'driver' => 'single',
        'path' => storage_path('logs/laravel.log'),
        'level' => env('LOG_LEVEL', 'debug'),
    ],
],
```

```ini
# .env.production
LOG_LEVEL=error

# .env.staging
LOG_LEVEL=warning

# .env.local
LOG_LEVEL=debug
```

**Use Proper Logging:**
```php
// ❌ Don't log debug in production code
Log::debug('User accessed page', ['user' => $user]);

// ✅ Use appropriate levels
Log::error('Payment failed', ['error' => $e->getMessage()]);
Log::warning('API rate limit approaching');
Log::info('User registered', ['id' => $user->id]);
```

## References

- [Laravel Logging](https://laravel.com/docs/logging)
- [PSR-3 Log Levels](https://www.php-fig.org/psr/psr-3/)

## Related Analyzers

- [Debug Mode](/analyzers/security/debug-mode) - Ensures debug mode is disabled in production
