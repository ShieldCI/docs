---
title: Pulse Security Analyzer
description: Validates Laravel Pulse dashboard authorization, data retention, and security settings
icon: lock
outline: [2, 3]
tags: security,pulse,monitoring,dashboard,authorization
pro: true
---

# Pulse Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `pulse-security` | 🛡️ Security  | High    | 10 minutes   |

## What This Checks

Validates Laravel Pulse dashboard security. Checks for:

- Dashboard authorization gate is configured (`Pulse::auth`)
- Sensitive data is not leaked through recorder configuration
- Data retention and trimming settings are appropriate
- Sampling rate is tuned for production environments

## Why It Matters

- **Public Dashboard:** Without authorization, Pulse exposes application performance data to anyone
- **Data Leakage:** SlowQuery recorder with `report_bindings` can expose passwords and tokens in query parameters
- **Database Growth:** Without data trimming, Pulse's `telescope_entries` table grows unbounded
- **Performance Overhead:** 100% sampling rate adds unnecessary overhead in production

## How to Fix

### Quick Fix (5 minutes)

Add dashboard authorization:

```php
// app/Providers/AppServiceProvider.php
use Laravel\Pulse\Facades\Pulse;

public function boot(): void
{
    Pulse::auth(function (Request $request) {
        return $request->user()?->isAdmin();
    });
}
```

### Proper Fix (10 minutes)

**1. Disable query binding reporting:**

```php
// config/pulse.php
'recorders' => [
    \Laravel\Pulse\Recorders\SlowQueries::class => [
        'threshold' => 1000,
        'report_bindings' => false, // Don't expose query parameters
    ],
],
```

**2. Configure data retention:**

```php
// config/pulse.php
'trim' => [
    'lottery' => [1, 1000], // 0.1% chance per request
    'keep' => CarbonInterval::days(7),
],
```

**3. Reduce sampling rate for production:**

```php
// config/pulse.php
'sample_rate' => env('PULSE_SAMPLE_RATE', 0.1), // 10% of requests
```

**4. Review custom recorders:**

```php
// Ensure custom recorders don't log PII
'recorders' => [
    App\Pulse\CustomRecorder::class => [
        'enabled' => true,
        // Never log passwords, API keys, or personal data
    ],
],
```

## References

- [Laravel Pulse Documentation](https://laravel.com/docs/pulse)
- [Laravel Pulse Authorization](https://laravel.com/docs/pulse#dashboard-authorization)
- [OWASP Sensitive Data Exposure](https://owasp.org/www-project-top-ten/)

## Related Analyzers

- [Telescope Security](/analyzers/security/telescope-security) - Validates Telescope debug tool security
- [Horizon Security](/analyzers/security/horizon-security) - Validates Horizon dashboard security
- [Debug Mode](/analyzers/security/debug-mode) - Validates debug mode configuration
