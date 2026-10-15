---
title: Missing Error Tracking Analyzer
description: Detects applications without error tracking services or custom error monitoring, ensuring production errors are properly captured and reported
icon: bug-play
outline: [2, 3]
tags: laravel,monitoring,production,error-tracking,observability,nightwatch,sentry,bugsnag,cloudwatch
---

# Missing Error Tracking Analyzer

| Analyzer ID                           | Category           | Severity | Time To Fix |
| ------------------------------------- | :----------------: |:--------:| -----------:|
| `missing-error-tracking`              | 🏅 Best Practices  | Info     | 30 minutes  |

## What This Checks

Detects applications without error tracking services or custom error monitoring. Checks for:

- **Popular Error Tracking Packages**: Nightwatch, Sentry, Bugsnag, Rollbar, Airbrake, Honeybadger, Flare, Inspector, installed as production dependencies (not `require-dev`)
- **Custom Error Tracking**: CloudWatch, Datadog, New Relic implementations in `app/Exceptions/Handler.php` (Laravel ≤10) or `bootstrap/app.php` (Laravel 11+)
- **Logging Configurations**: Papertrail, Logtail, LogEntries in `config/logging.php`
- **Disabled Nightwatch**: `'enabled' => false`, `NIGHTWATCH_ENABLED=false` or an empty `NIGHTWATCH_TOKEN` does not count

## Why It Matters

Without error tracking, production issues go unnoticed until users complain:

- **Blind to Production Errors**: You don't know when exceptions occur in production
- **No Stack Traces**: Debugging becomes guesswork without context
- **Slow Response Time**: Manual error discovery delays fixes by days or weeks
- **Poor User Experience**: Users encounter broken features without your knowledge
- **Lost Revenue**: Critical bugs in checkout/payment flows go undetected
- **No Error Grouping**: Can't identify patterns or prioritize fixes
- **Compliance Risk**: Some regulations require error logging and monitoring

## How to Fix

### Quick Fix (5 minutes)

Install a popular error tracking service via Composer:

**Laravel Nightwatch (Recommended)**
```bash
composer require laravel/nightwatch

# Add to .env
echo "NIGHTWATCH_TOKEN=your-token" >> .env

# Run the agent
php artisan nightwatch:agent
```

Nightwatch requires Laravel 10+ and PHP 8.2+.

**Sentry**
```bash
composer require sentry/sentry-laravel

# Publish config
php artisan sentry:publish

# Add to .env
echo "SENTRY_LARAVEL_DSN=your-dsn-here" >> .env
```

**Rollbar**
```bash
composer require rollbar/rollbar-laravel

# Publish config
php artisan vendor:publish --provider="Rollbar\Laravel\RollbarServiceProvider"

# Add to .env
echo "ROLLBAR_ACCESS_TOKEN=your-token" >> .env
```

### Proper Fix (30 minutes)

Implement comprehensive error tracking:

**1. Install and Configure Laravel Nightwatch (Most Popular)**

```bash
# Install package
composer require laravel/nightwatch

# Configure environment
cat >> .env << 'EOF'
NIGHTWATCH_TOKEN=your-token
NIGHTWATCH_REQUEST_SAMPLE_RATE=0.1
NIGHTWATCH_EXCEPTION_SAMPLE_RATE=1.0
EOF

# Keep the agent running, for example under Supervisor
php artisan nightwatch:agent
```

**2. Configure Release Tracking**

```bash
# .env: identify which deployment introduced an error
NIGHTWATCH_DEPLOY=v1.4.2
```

Laravel Cloud, Forge and Vapor deployments set this automatically.

**3. Custom Error Tracking with CloudWatch**

If you prefer AWS CloudWatch or already have APM:

::: code-group
```php [Laravel 11+]
// bootstrap/app.php
return Application::configure(basePath: dirname(__DIR__))
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (Throwable $exception) {
            if (app()->environment('production')) {
                $cloudwatch = app('cloudwatch');
                $cloudwatch->putLogEvents([
                    'logGroupName' => '/aws/laravel/errors',
                    'logStreamName' => date('Y-m-d'),
                    'logEvents' => [[
                        'timestamp' => now()->timestamp * 1000,
                        'message' => json_encode([
                            'message' => $exception->getMessage(),
                            'exception' => get_class($exception),
                            'file' => $exception->getFile(),
                            'line' => $exception->getLine(),
                            'trace' => $exception->getTraceAsString(),
                            'user_id' => auth()->id(),
                            'url' => request()->url(),
                            'method' => request()->method(),
                            'ip' => request()->ip(),
                        ]),
                    ]],
                ]);
            }
        });
    })
```

```php [Laravel 9–10]
// app/Exceptions/Handler.php
public function report(Throwable $exception)
{
    if ($this->shouldReport($exception) && app()->environment('production')) {
        // Custom CloudWatch error reporting
        $cloudwatch = app('cloudwatch');
        $cloudwatch->putLogEvents([
            'logGroupName' => '/aws/laravel/errors',
            'logStreamName' => date('Y-m-d'),
            'logEvents' => [[
                'timestamp' => now()->timestamp * 1000,
                'message' => json_encode([
                    'message' => $exception->getMessage(),
                    'exception' => get_class($exception),
                    'file' => $exception->getFile(),
                    'line' => $exception->getLine(),
                    'trace' => $exception->getTraceAsString(),
                    'user_id' => auth()->id(),
                    'url' => request()->url(),
                    'method' => request()->method(),
                    'ip' => request()->ip(),
                ]),
            ]],
        ]);
    }

    parent::report($exception);
}
```
:::

**4. Datadog via Logging Config**

```php
// config/logging.php
return [
    'default' => env('LOG_CHANNEL', 'stack'),

    'channels' => [
        'stack' => [
            'driver' => 'stack',
            'channels' => ['datadog', 'stderr'],
            'ignore_exceptions' => false,
        ],

        'datadog' => [
            'driver' => 'monolog',
            'handler' => Monolog\Handler\SocketHandler::class,
            'handler_with' => [
                'connection_string' => env('DATADOG_HOST', 'tcp://localhost:10518'),
            ],
            'level' => 'error',
            'processors' => [
                // Add context to logs
                function ($record) {
                    $record['extra']['user_id'] = auth()->id();
                    $record['extra']['environment'] = app()->environment();
                    return $record;
                },
            ],
        ],
    ],
];
```

**5. Test Your Error Tracking**

```php
// Create a test route to verify error tracking works
Route::get('/test-error-tracking', function () {
    if (!app()->environment('production')) {
        throw new \Exception('Testing error tracking - this should appear in Nightwatch/CloudWatch/Datadog');
    }
    abort(403, 'Only available in non-production');
});

// Or use Artisan Tinker
php artisan tinker
>>> throw new \Exception('Test error tracking');
```

**6. Set Up Alerts**

Configure your error tracking service to send alerts:

- **Slack Integration**: Real-time notifications for new errors
- **Email Alerts**: Daily digest or immediate alerts for critical errors
- **PagerDuty**: For on-call rotations
- **Threshold Alerts**: Alert when error rate exceeds threshold

**7. Customize Known Packages:**

To customize the list of detected error tracking packages, publish the config:
```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:
```php
'analyzers' => [
    'best-practices' => [
        'enabled' => true,
        
        'missing-error-tracking' => [
            'known_packages' => [
                // Add your custom error tracking packages:
                'your-company/internal-error-tracker',
                'custom-vendor/monitoring-package',
            ],
        ],
    ],
],
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`) and only runs in production and staging environments.

**Why skip in CI and development?**
- Developers don't need error tracking during local development
- Test suites don't need error tracking services
- Prevents unnecessary warnings in CI pipelines
- Focuses the check on environments where error tracking provides value

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

- [Laravel Nightwatch Documentation](https://nightwatch.laravel.com/docs)
- [Sentry Laravel Documentation](https://docs.sentry.io/platforms/php/guides/laravel/)
- [Bugsnag Laravel Documentation](https://docs.bugsnag.com/platforms/php/laravel/)
- [AWS CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/)
- [Datadog Laravel Integration](https://docs.datadoghq.com/logs/log_collection/php/)
- [Laravel Error Handling](https://laravel.com/docs/errors)
- [New Relic PHP Agent](https://docs.newrelic.com/docs/apm/agents/php-agent/)
- [Rollbar Laravel Documentation](https://docs.rollbar.com/docs/laravel)

## Related Analyzers

- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Ensures debug mode is off in production
