---
title: Debug Log Level Analyzer
description: Detects excessive debug logging in production that degrades performance and fills disk space
icon: alert-circle
outline: [2, 3]
tags: logging,performance,configuration
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
# .env - Production
LOG_LEVEL=error

# .env - Staging
LOG_LEVEL=warning

# .env - Local/Development
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

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`) and only runs in production and staging environments.

**Why skip in CI and development?**
- CI environments typically use debug logging for detailed test output
- Local/development environments need verbose logging for debugging
- Prevents false failures when debug logging is intentionally used during development

**When to run this analyzer:**
- ✅ **Staging/Production servers**: Ensures debug logging is disabled in production
- ❌ **Local/Testing development**: Skipped automatically (debug logging acceptable)
- ❌ **CI/CD pipelines**: Skipped automatically (deployment-specific check)

**Environment Detection:**
The analyzer checks your Laravel `APP_ENV` setting and only runs when it maps to `production` or `staging`. Custom environment names can be mapped in `config/shieldci.php`:

```php
// config/shieldci.php
'environment_mapping' => [
    'production-us' => 'production',
    'production-blue' => 'production',
    'staging-preview' => 'staging',
],
```

**Examples:**
- `APP_ENV=production` → Runs (no mapping needed)
- `APP_ENV=production-us` → Maps to `production` → Runs
- `APP_ENV=local` → Skipped (not production/staging)

## References

- [Laravel Logging](https://laravel.com/docs/logging)
- [PSR-3 Log Levels](https://www.php-fig.org/psr/psr-3/)

## Related Analyzers

- [Debug Mode](/analyzers/security/debug-mode) - Ensures debug mode is disabled in production
