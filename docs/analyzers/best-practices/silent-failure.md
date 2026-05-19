---
title: Silent Failure Analyzer
description: Detects empty catch blocks and error suppression that hide failures, making debugging impossible and masking critical production issues.
icon: shield-alert
outline: [2, 3]
tags: error-handling,exceptions,debugging,monitoring,reliability,laravel
---

# Silent Failure Analyzer

| Analyzer ID      |    Category    | Severity | Time To Fix |
|------------------|:--------------:|:--------:|------------:|
| `silent-failure` | 🏅 Best Practices |  Medium  |  20 minutes |

## What This Checks

The Silent Failure Analyzer identifies four dangerous error handling patterns that hide exceptions and errors, making bugs impossible to debug in production:

**Detected Patterns:**

1. **Empty Catch Blocks** (High Severity)
   - `catch (Exception $e) { }` - Completely swallows exceptions
   - No logging, no rethrow, no error handling

2. **Catch Without Logging or Rethrow** (Medium Severity)
   - `catch (Exception $e) { return null; }` - Handles exception but doesn't log
   - Missing `Log::error()`, `report()`, or `throw`
   - Silently fails without any trace

3. **Broad Exception Catch Without Logging** (High/Medium Severity)
   - `catch (\Throwable $e) { ... }` - catching `Throwable`, `Exception`, or `Error` is overly broad and can mask fatal programming errors like `TypeError` or `ArgumentCountError`
   - **High** - no logging at all (genuinely silent failure)
   - **Medium** - logging present but exception variable unused (error details are lost)
   - Not flagged when logging is present **and** the exception variable is used (e.g. `Log::error('...', ['error' => $e->getMessage()])`) - this is considered well-handled

4. **Error Suppression Operator** (High/Medium Severity)
   - `@file_get_contents($path)` - Hides all errors and warnings
   - `@mysql_query($sql)` - Suppresses error messages
   - Makes debugging impossible when things go wrong

## Why It Matters

Silent failures are among the most dangerous anti-patterns in production: when exceptions are swallowed, applications appear to work while silently losing data, failing operations, and hiding security events:

- **Impossible Debugging**: Swallowed exceptions leave no log trace. When a payment fails silently, there is no stack trace, no context, and no way to reproduce the issue.
- **Hidden Security Events**: Silent failures in authentication or token validation mask attack attempts, making security audits blind to brute-force or injection activity.
- **Data Loss**: Import jobs, file processing, and write operations that fail silently leave the database in a partially-updated state with no indication of what was lost.
- **Masked Programming Errors**: Catching `\Throwable` without logging swallows fatal errors like `TypeError` and `ArgumentCountError`, letting bugs ship undetected to production.
- **Error Suppression (`@`)**: The `@` operator discards PHP's native error system entirely, hiding file I/O failures, database connection errors, and extension misconfigurations.
- **No Alerting**: Without logged exceptions, error tracking tools (Sentry, Bugsnag) never fire, so on-call teams are unaware of production failures until users report them.

**Real-world impact:**
- A payment processor catching `Exception` and returning `false` silently causes checkout failures with no alerts and no way to diagnose the root cause
- An empty catch in an import job allows partial writes to persist without rollback, silently corrupting the database
- Catching `\Throwable` in a queued job can hide a `TypeError` introduced by a refactor that staging tests would otherwise have surfaced

## How to Fix

### Quick Fix (~5 minutes per catch block)

For simple cases, add logging to catch blocks:

**Before (❌):**
```php
class OrderService
{
    public function createOrder($data)
    {
        try {
            return Order::create($data);
        } catch (Exception $e) {
            return null;
        }
    }
}
```

**After (✅):**
```php
class OrderService
{
    public function createOrder($data)
    {
        try {
            return Order::create($data);
        } catch (Exception $e) {
            Log::error('Order creation failed', [
                'data' => $data,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
```

**Steps:**
1. Add `use Illuminate\Support\Facades\Log;` at the top
2. Call `Log::error()` in catch block with context
3. Include relevant data for debugging
4. Consider using `report($e)` for error tracking services

### Proper Fix (~20 minutes per class)

For production code, implement comprehensive error handling:

**Before (❌):**
```php
class EmailService
{
    public function send($user, $message)
    {
        try {
            Mail::to($user)->send($message);
        } catch (Exception $e) {
            // Silent failure
        }
    }

    public function readTemplate($path)
    {
        return @file_get_contents($path);
    }
}
```

**After (✅):**
```php
class EmailService
{
    public function send($user, $message)
    {
        try {
            Mail::to($user)->send($message);
        } catch (Exception $e) {
            // Log with full context
            Log::error('Email sending failed', [
                'user_id' => $user->id,
                'email' => $user->email,
                'message_class' => get_class($message),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Report to error tracking (Sentry, Bugsnag, etc.)
            report($e);

            // Optionally rethrow for critical failures
            if ($message instanceof CriticalNotification) {
                throw $e;
            }
        }
    }

    public function readTemplate($path)
    {
        // Replace error suppression with proper error handling
        if (!file_exists($path)) {
            Log::warning('Email template not found', ['path' => $path]);
            return $this->getDefaultTemplate();
        }

        $content = file_get_contents($path);

        if ($content === false) {
            Log::error('Failed to read email template', ['path' => $path]);
            throw new TemplateException("Cannot read template: {$path}");
        }

        return $content;
    }
}
```

**Steps:**
1. Add comprehensive logging with context
2. Integrate error tracking (Sentry, Bugsnag, Rollbar)
3. Replace `@` operator with proper error handling
4. Add graceful fallbacks where appropriate
5. Rethrow critical exceptions
6. Document expected exceptions

## ShieldCI Configuration

To configure whitelists, publish the config:
```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'best-practices' => [
        'enabled' => true,

        'silent-failure' => [
            // Directories to skip (tests can have empty catches)
            'whitelist_dirs' => [
                'tests',
                'database/seeders',
                'database/factories',
            ],

            // Class patterns to skip
            'whitelist_classes' => [
                '*Test',          // PHPUnit tests
                '*TestCase',      // Test base classes
                '*Seeder',        // Database seeders
                'DatabaseSeeder', // Main seeder
            ],

            // Exception types that are expected and can be safely caught
            'whitelist_exceptions' => [
                'ModelNotFoundException',    // Expected when using findOrFail
                'NotFoundException',          // Custom not found exceptions
                'NotFoundHttpException',      // HTTP 404 exceptions
                'ValidationException',        // Validation failures
            ],

            // Functions where @ operator is acceptable (supports namespaced: @\unlink())
            'whitelist_error_suppression_functions' => [
                'unlink',            // File might not exist
                'fopen',             // File might not be readable
                'file_get_contents', // File might not exist
                'mkdir',             // Directory might exist
                'rmdir',             // Directory might not exist
            ],

            // Static methods where @ operator is acceptable (e.g., @Storage::delete())
            // Wildcards supported: 'Storage::*', '*::delete'
            'whitelist_error_suppression_static_methods' => [
                'Storage::delete',          // File might not exist
                'Storage::deleteDirectory', // Directory might not exist
                'File::delete',             // File might not exist
                'File::deleteDirectory',    // Directory might not exist
            ],

            // Instance methods where @ operator is acceptable (e.g., @$file->delete())
            // Matches by method name only. Wildcards supported: 'remove*'
            'whitelist_error_suppression_instance_methods' => [
                'delete',  // Resource deletion
                'close',   // File handle closing
                'unlink',  // File unlinking
            ],
        ],
    ],
],
```

#### Error Suppression Whitelist Details

The error suppression whitelist supports three types of calls:

| Call Type | Example | Config Key |
|-----------|---------|------------|
| Function calls | `@unlink($path)`, `@\unlink($path)` | `whitelist_error_suppression_functions` |
| Static method calls | `@Storage::delete($path)` | `whitelist_error_suppression_static_methods` |
| Instance method calls | `@$file->delete()` | `whitelist_error_suppression_instance_methods` |

**Wildcard patterns** are supported in all whitelist keys:
- `Storage::*` - matches any method on Storage
- `*::delete` - matches delete on any class
- `remove*` - matches removeFile, removeAll, etc.

**Dynamic calls are always flagged** for security reasons:
- `@$func($path)` - dynamic function call
- `@$class::method()` - dynamic class
- `@$obj->$method()` - dynamic method name

## References

- [Laravel Error Handling](https://laravel.com/docs/10.x/errors) - Official Laravel documentation
- [PSR-3 Logger Interface](https://www.php-fig.org/psr/psr-3/) - Standard logging interface
- [Sentry for Laravel](https://docs.sentry.io/platforms/php/guides/laravel/) - Error tracking integration
- [Bugsnag Laravel Integration](https://docs.bugsnag.com/platforms/php/laravel/) - Alternative error tracking
- [Logging Best Practices](https://www.loggly.com/ultimate-guide/php-logging-basics/) - Comprehensive logging guide
- [Exception Handling Patterns](https://martinfowler.com/articles/replaceThrowWithNotification.html) - Martin Fowler on exceptions

---

## Related Analyzers

- **[Service Container Resolution](/analyzers/best-practices/service-container-resolution)** - Avoid manual container resolution that hides dependencies
- **[Debug Mode Analyzer](/analyzers/security/debug-mode)** - Detects debug mode enabled in production
