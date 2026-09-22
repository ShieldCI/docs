---
title: Telescope Security Analyzer
description: Validates Laravel Telescope debug tool is properly secured and disabled in production, preventing exposure of sensitive application data
icon: eye
outline: [2, 3]
tags: telescope,debug,authentication,security,production,debugging,data-exposure
pro: true
---

# Telescope Security Analyzer

| Analyzer ID          | Category     | Severity   | Time To Fix  |
| -------------------- | :----------: |:----------:| ------------:|
| `telescope-security` | 🛡️ Security  | Critical   | 10 minutes   |

## What This Checks

Validates that Laravel Telescope is properly secured and cannot leak sensitive data in production.

**Checks Performed:**

#### Package Installation
- **Production dependency** - Flags Telescope in `require` instead of `require-dev` in `composer.json`; it will be installed in production
- **Auto-discovery enabled** - Flags a missing `dont-discover` entry in `composer.json`; Telescope is then registered in all environments

#### Provider Registration
- **Listed in `config/app.php`** - Flags `TelescopeServiceProvider` in the providers array; it loads in all environments
- **Listed in `bootstrap/providers.php`** - Flags `TelescopeServiceProvider` registered unconditionally; it loads in all environments
- **Unguarded registration** - Flags Telescope registered in `AppServiceProvider` without an `environment('local')` guard
- **TelescopeServiceProvider existence** - Verifies the file exists; if missing, access falls back to the local-environment default

#### Gate Registration
The gate is read from the parsed syntax tree, so it is found in any file under `app/Providers` or in `bootstrap/app.php`, not only in `TelescopeServiceProvider`.

- **Authorization gate** - Checks that `Gate::define('viewTelescope', ...)` or `Telescope::auth(...)` is registered
- **Empty gate() method** - Flags a `gate()` method with no `Gate::define('viewTelescope')` call

#### Gate Callback Quality
- **Blanket grant** - Flags callbacks that return `true` on every path, plus ones that never read their argument
- **Auth-only gate** - Flags callbacks that only check whether anyone is signed in: `auth()->check()`, `Auth::check()`, `$request->user() !== null`
- **Permissive fallback** - Flags `?? true` or `?: true` in the fallback position
- **Environment bypass** - Flags an environment or debug check beyond `local` that can grant on its own

#### Configuration Validation
- **Enabled by default** - Flags `enabled` defaulting to `true` in `config/telescope.php`; Telescope is active whenever `TELESCOPE_ENABLED` is unset
- **Middleware configuration** - Flags when `config/telescope.php` middleware only includes `web`, leaving no authentication layer protecting the dashboard
- **Predictable path** - Warns when `path` is left at the default `/telescope`, which increases exposure risk (Info)

#### Data Retention and Redaction
- **Pruning not scheduled** - Flags a missing `telescope:prune` schedule; the `telescope_entries` table then grows indefinitely
- **Sensitive data recorded** - Flags when `hideSensitiveRequestDetails()` is not called; passwords and tokens may be recorded

::: info Gate Severity Is Graded by Reach
The gate defects above are not reported at a fixed level. Where the gate is registered decides the grade:

- **Unconditionally** - **High**, or **Critical** for a blanket grant
- **Only inside an `environment('local')` check** - **Low**, or **Medium** for a blanket grant, since Laravel's own dashboards already behave that way by default
- **Behind any wider guard**, such as `staging` - between the two
:::

## Why It Matters

Laravel Telescope records extensive debugging data that, if exposed in production, can leak:

- **API Keys and Tokens** - Authentication tokens visible in request/response details
- **User Passwords** - Form data including password fields in request recordings
- **Personal Data** - User PII exposed through query and request recordings
- **Business Logic** - Internal application structure and trade secrets revealed
- **Database Queries** - Sensitive data visible in recorded SQL queries
- **Mail Content** - Email contents including password resets and verification links
- **Exception Details** - Stack traces revealing application vulnerabilities
- **Authorization Attempts** - Gate check details exposing security architecture

A publicly accessible Telescope dashboard gives attackers a complete map of your application's internals.

## How to Fix

### Quick Fix (10 minutes)

Move Telescope to dev dependencies and disable in production:

**Before (❌):**
```json
{
    "require": {
        "laravel/telescope": "^5.0"
    }
}
```

**After (✅):**
```json
{
    "require-dev": {
        "laravel/telescope": "^5.0"
    },
    "extra": {
        "laravel": {
            "dont-discover": [
                "laravel/telescope"
            ]
        }
    }
}
```

Set your production `.env`:
```ini
TELESCOPE_ENABLED=false
```

Set config default to `false`:
```php
// config/telescope.php
'enabled' => env('TELESCOPE_ENABLED', false),
```

### Proper Fix (15 minutes)

**Conditionally register Telescope in AppServiceProvider:**

**Before (❌):**
```php
// config/app.php
'providers' => [
    // ...
    App\Providers\TelescopeServiceProvider::class, // Loads in ALL environments!
],
```

**After (✅):**
```php
// app/Providers/AppServiceProvider.php
public function register(): void
{
    if ($this->app->environment('local')) {
        $this->app->register(\App\Providers\TelescopeServiceProvider::class);
    }
}
```

**Configure proper authorization gate:**

**Before (❌):**
```php
// app/Providers/TelescopeServiceProvider.php
protected function gate(): void
{
    Gate::define('viewTelescope', function ($user) {
        return true; // Anyone can access!
    });
}
```

**After (✅):**
```php
// app/Providers/TelescopeServiceProvider.php
protected function gate(): void
{
    Gate::define('viewTelescope', function (User $user) {
        return in_array($user->email, [
            'admin@example.com',
        ]);
    });
}
```

**Fix the weaker gate shapes:**

A gate that stops short of naming who may look is reported too, not just one that returns `true`. Each of these grants more than intended:

```php
// app/Providers/TelescopeServiceProvider.php

// ❌ Auth-only: every registered user passes, including one who signed up a second ago
Gate::define('viewTelescope', fn ($user) => auth()->check());

// ❌ Permissive fallback: admits people exactly when the real check cannot be answered,
//    such as a null user or a missing relation
Gate::define('viewTelescope', fn ($user) => $user?->isAdmin() ?? true);

// ❌ Environment bypass: access now depends on APP_ENV staying correct on every box
Gate::define('viewTelescope', fn ($user) => app()->environment('staging') || $user->isAdmin());

// ✅ Decide on the user's role or permission, and fall back to denial
Gate::define('viewTelescope', fn ($user) => $user?->hasRole('admin') ?? false);
```

## References

- [Laravel Telescope Documentation](https://laravel.com/docs/telescope)
- [Laravel Telescope Authorization](https://laravel.com/docs/telescope#dashboard-authorization)
- [OWASP Sensitive Data Exposure](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)
- [CWE-200: Exposure of Sensitive Information](https://cwe.mitre.org/data/definitions/200.html)
- [CWE-215: Insertion of Sensitive Information Into Debugging Code](https://cwe.mitre.org/data/definitions/215.html)

## Related Analyzers

- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Detects debug mode enabled in production
- [Env File Analyzer](/analyzers/security/env-file) - Checks environment file security
- [Authentication Authorization Analyzer](/analyzers/security/authentication-authorization) - Validates authentication patterns
- [Cookie Analyzer](/analyzers/security/cookie) - Checks cookie security configuration
- [Cookie Domain Analyzer](/analyzers/security/cookie-domain) - Validates cookie domain settings

---
