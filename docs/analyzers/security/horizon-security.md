---
title: Horizon Security Analyzer
description: Validates that Laravel Horizon dashboard is properly secured with authentication and authorization gates
icon: shield
outline: [2, 3]
tags: horizon,dashboard,authentication,security,authorization
---

# Horizon Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| ------------------ | :----------: |:----------:| ------------:|
| `horizon-security` | 🛡️ Security  | Critical   | 10 minutes   |

## What This Checks

This analyzer validates the security configuration of Laravel Horizon's dashboard to ensure it is not publicly accessible. Horizon provides a web-based dashboard for monitoring Redis queues, failed jobs, and job metrics -- sensitive operational data that must be protected.

**Checks Performed:**

#### Service Provider Validation
- **HorizonServiceProvider existence** - Verifies `app/Providers/HorizonServiceProvider.php` exists
- **Horizon::auth() gate** - Checks that an authorization gate is defined to restrict dashboard access
- **Hardcoded boolean returns** - Flags `return true;` or `return false;` in the auth gate as insecure
- **Environment-aware checks** - Verifies production-specific authorization logic is present (e.g., `isProduction()`, `environment()`)
- **Auth middleware** - Checks for authentication middleware on the Horizon routes

#### Configuration File Validation
- **Middleware configuration** - Flags when `config/horizon.php` only includes `web` middleware without `auth`

::: tip When This Analyzer Runs
This analyzer only runs when Laravel Horizon is installed (detected via `composer.json` or `vendor/` directory). If Horizon is not installed, the analyzer is automatically skipped.
:::

## Why It Matters

An unsecured Horizon dashboard exposes critical operational information that can be leveraged by attackers:

- **Sensitive Job Data** - Job payloads may contain user emails, payment data, API tokens, and other PII
- **Application Architecture** - Queue names, job classes, and processing patterns reveal internal architecture
- **Failed Job Information** - Failed job details often include stack traces, database queries, and configuration values
- **Queue Metrics** - Throughput and timing data can inform denial-of-service attack strategies
- **Redis Configuration** - Connection details and memory usage patterns can be exploited

A publicly accessible Horizon dashboard is equivalent to giving an attacker a monitoring console for your application's background processing.

## How to Fix

### Quick Fix (5 minutes)

Add a `Horizon::auth()` gate in your `HorizonServiceProvider`:

**Before:**
```php
// app/Providers/HorizonServiceProvider.php
class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    protected function gate(): void
    {
        // NO AUTHORIZATION - Horizon is publicly accessible!
    }
}
```

**After:**
```php
// app/Providers/HorizonServiceProvider.php
use Laravel\Horizon\Horizon;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    protected function gate(): void
    {
        Horizon::auth(function ($request) {
            return $request->user()?->isAdmin() ?? false;
        });
    }
}
```

### Proper Fix (10 minutes)

Implement environment-aware authorization with role checks:

**Before:**
```php
// app/Providers/HorizonServiceProvider.php
protected function gate(): void
{
    Horizon::auth(function ($request) {
        // VULNERABLE: Hardcoded boolean - no real authorization
        return true;
    });
}
```

**After:**
```php
// app/Providers/HorizonServiceProvider.php
use Laravel\Horizon\Horizon;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    protected function gate(): void
    {
        Horizon::auth(function ($request) {
            // Strict authorization with environment check
            if (app()->environment('local')) {
                return true; // Allow all access in local development
            }

            // In production, restrict to admin users only
            return $request->user()?->hasRole('admin')
                || $request->user()?->email === config('horizon.admin_email');
        });
    }
}
```

**Best Practice: Combine auth gate with middleware:**

```php
// config/horizon.php
return [
    'path' => env('HORIZON_PATH', 'horizon'),

    // Require both web session AND authentication
    'middleware' => ['web', 'auth'],

    // ...other config
];
```

```php
// app/Providers/HorizonServiceProvider.php
use Laravel\Horizon\Horizon;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    protected function gate(): void
    {
        Horizon::auth(function ($request) {
            if (app()->isProduction()) {
                return in_array($request->user()?->email, [
                    'admin@yourcompany.com',
                    'devops@yourcompany.com',
                ], true);
            }

            return $request->user() !== null;
        });
    }
}
```


## References

- [Laravel Horizon Documentation](https://laravel.com/docs/horizon)
- [Laravel Horizon Authorization](https://laravel.com/docs/horizon#dashboard-authorization)
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
- [CWE-284: Improper Access Control](https://cwe.mitre.org/data/definitions/284.html)
- [CWE-306: Missing Authentication for Critical Function](https://cwe.mitre.org/data/definitions/306.html)

## Related Analyzers

- [Nova Security Analyzer](/analyzers/security/nova-security) - Validates Laravel Nova admin panel security
- [Authentication Authorization Analyzer](/analyzers/security/authentication-authorization) - Checks authentication and authorization configuration
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Ensures debug mode is disabled in production
- [Env HTTP Accessibility Analyzer](/analyzers/security/env-http-accessibility) - Prevents sensitive files from being publicly accessible

---
