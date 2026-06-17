---
title: Alerting Configuration Analyzer
description: Validates that proper alerting and notification mechanisms are configured for production issues
icon: bell
outline: [2, 3]
tags: reliability,alerting,monitoring,notifications,production
pro: true
---

# Alerting Configuration Analyzer

| Analyzer ID       |     Category     | Severity  | Time To Fix  |
| ------------------|:----------------:|:---------:| ------------:|
| `alerting-config` |  ✅ Reliability  | Medium    | 15 minutes   |

## What This Checks

Validates that proper alerting mechanisms are in place to detect production issues. Checks for:

- Exception notification handler (`report` / `reportable` callbacks with actual alerting)
- Log alerting channel (Slack, syslog, papertrail, Monolog custom, or alerting packages)
- Failed job notification (`Queue::failing` callback or job `failed()` methods)

The exception check also follows alerting that has been delegated out of `Handler.php` / `bootstrap/app.php` into a dedicated class — it recursively scans `app/Exceptions/**` for the same alerting patterns, so extracting your reportable callback into a dedicated class still satisfies the check.

## Why It Matters

- **Silent Failures:** Without alerting, production errors go unnoticed until users complain
- **Queue Health:** Failed jobs without notifications silently drop critical tasks (emails, payments, etc.)
- **Mean Time to Recovery:** Alerting reduces MTTR from hours/days to minutes

## How to Fix

### Quick Fix (5 minutes)

Install a monitoring package — these auto-register exception handlers and satisfy the check without any extra configuration:

```bash
composer require sentry/sentry-laravel
# or
composer require rollbar/rollbar-laravel
# or
composer require bugsnag/bugsnag-laravel
```

Alternatively, add a Slack log channel for immediate alerts:

```php
// config/logging.php
'channels' => [
    'slack' => [
        'driver' => 'slack',
        'url' => env('LOG_SLACK_WEBHOOK_URL'),
        'username' => 'Laravel Bot',
        'emoji' => ':boom:',
        'level' => 'error',
    ],
    'stack' => [
        'driver' => 'stack',
        'channels' => ['daily', 'slack'],
    ],
],
```

### Proper Fix (15 minutes)

**1. Add exception alerting:**

::: code-group

```php [Laravel 11+ (bootstrap/app.php)]
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->reportable(function (Throwable $e) {
        if (app()->environment('production')) {
            Notification::route('slack', config('services.slack.webhook'))
                ->notify(new ExceptionOccurred($e));
        }
    });
})
```

```php [Laravel 9-10 (Handler.php)]
public function register(): void
{
    $this->reportable(function (Throwable $e) {
        if (app()->environment('production')) {
            Notification::route('slack', config('services.slack.webhook'))
                ->notify(new ExceptionOccurred($e));
        }
    });
}
```

:::

**2. Add failed job notifications:**

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Support\Facades\Queue;
use Illuminate\Queue\Events\JobFailed;

public function boot(): void
{
    Queue::failing(function (JobFailed $event) {
        Log::channel('slack')->error('Job failed', [
            'job' => $event->job->resolveName(),
            'exception' => $event->exception->getMessage(),
        ]);
    });
}
```

## References

- [Laravel Error Handling](https://laravel.com/docs/errors)
- [Laravel Notifications](https://laravel.com/docs/notifications)
- [Laravel Queue Failed Jobs](https://laravel.com/docs/queues#dealing-with-failed-jobs)

## Related Analyzers

- [Missing Error Tracking](/analyzers/best-practices/missing-error-tracking) - Detects missing error tracking services
- [Health Check](/analyzers/reliability/health-check) - Validates health check endpoints
- [Data Retention Policy](/analyzers/reliability/data-retention-policy) - Validates data cleanup policies
