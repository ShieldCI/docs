---
title: Horizon Security Analyzer
description: Validates that Laravel Horizon dashboard is properly secured with authentication and authorization gates
icon: shield
outline: [2, 3]
tags: horizon,dashboard,authentication,security,authorization
pro: true
---

# Horizon Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| ------------------ | :----------: |:----------:| ------------:|
| `horizon-security` | 🛡️ Security  | High       | 10 minutes   |

## What This Checks

This analyzer validates the security configuration of Laravel Horizon's dashboard to ensure it is not publicly accessible. Horizon provides a web-based dashboard for monitoring Redis queues, failed jobs, and job metrics -- sensitive operational data that must be protected.

**Checks Performed:**

#### Service Provider Validation
- **HorizonServiceProvider existence** - Verifies `app/Providers/HorizonServiceProvider.php` exists
- **Horizon::auth() gate** - Checks that an authorization gate is defined to restrict dashboard access
- **Hardcoded boolean returns** - Flags `return true;` in the auth gate as insecure (grants access to everyone)
- **Auth-only checks** - Flags gates that only verify the user is logged in (`auth()->check()`) without restricting to specific users or roles
- **Auth middleware** - Checks for authentication middleware on the Horizon routes

#### Configuration File Validation
- **Middleware configuration** - Flags when `config/horizon.php` only includes `web` middleware without `auth`, but only when no `viewHorizon` gate is configured. When a gate is present it already handles authorization, making `auth` middleware redundant.

#### Redis Configuration Validation
- **Redis password** - Flags when `config/database.php` has a hardcoded `null` or empty password for the Redis connection instead of using `env('REDIS_PASSWORD')`


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

Add a `viewHorizon` gate in your `HorizonServiceProvider`. A role-check or email-allowlist is sufficient — no environment-specific branching is required.

**Before (❌):**
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

**After (✅):**
```php
// app/Providers/HorizonServiceProvider.php
use Illuminate\Support\Facades\Gate;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    protected function gate(): void
    {
        Gate::define('viewHorizon', function ($user): bool {
            return $user->hasRole('admin');
        });
    }
}
```

Alternatively, drive the allowlist from an environment variable so no code change is needed per environment:

```php
protected function gate(): void
{
    Gate::define('viewHorizon', function ($user): bool {
        $authorized = array_filter(
            array_map('trim', explode(',', config('horizon.authorized_emails', '')))
        );

        return in_array($user->email, $authorized, strict: true);
    });
}
```

```ini
# .env
HORIZON_AUTHORIZED_EMAILS=admin@yourcompany.com,devops@yourcompany.com
```

### Proper Fix (10 minutes)

Also make sure weak gates are not in use:

**Before (❌) — grants access to everyone:**
```php
protected function gate(): void
{
    Horizon::auth(function ($request) {
        return true; // VULNERABLE: no real authorization
    });
}
```

**Before (❌) — authentication only, not authorization:**
```php
protected function gate(): void
{
    Horizon::auth(function ($request) {
        return auth()->check(); // Any logged-in user can access Horizon
    });
}
```

**After (✅) — proper role/permission check:**
```php
// app/Providers/HorizonServiceProvider.php
use Illuminate\Support\Facades\Gate;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    protected function gate(): void
    {
        Gate::define('viewHorizon', function ($user): bool {
            return $user->hasRole('admin')
                || $user->can('view-horizon');
        });
    }
}
```

**Optional: add `auth` middleware as an extra layer (not required when a gate is configured):**

```php
// config/horizon.php
return [
    'middleware' => ['web', 'auth'], // 'auth' ensures unauthenticated users get a login redirect
    // ...
];
```


### Fix Redis Authentication

Ensure the Redis password is read from environment variables, not hardcoded:

**Before (❌):**
```php
// config/database.php
'redis' => [
    'default' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => null,  // Unauthenticated Redis
        'port' => env('REDIS_PORT', 6379),
    ],
],
```

**After (✅):**
```php
// config/database.php
'redis' => [
    'default' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', 6379),
    ],
],
```

```ini
# .env
REDIS_PASSWORD=your-strong-redis-password
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
