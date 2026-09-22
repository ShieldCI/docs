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

Validates that Laravel Telescope is properly secured and cannot leak sensitive data in production. Checks for:

- **`composer.json`**: Telescope in `require` instead of `require-dev` - will be installed in production
- **`composer.json`**: Auto-discovery not disabled (missing `dont-discover` entry) - registered in all environments
- **`config/app.php`**: `TelescopeServiceProvider` listed in providers array - loads in all environments
- **`bootstrap/providers.php`**: `TelescopeServiceProvider` registered unconditionally - loads in all environments
- **`AppServiceProvider`**: Telescope registration without an `environment('local')` guard
- **`TelescopeServiceProvider`**: File missing entirely - access falls back to the local-environment default
- **`TelescopeServiceProvider`**: `gate()` method exists but `Gate::define('viewTelescope', ...)` is absent
- **Gate**: No `viewTelescope` gate registered anywhere - access relies on the local-environment default
- **`config/telescope.php`**: `enabled` defaults to `true` - Telescope active when `TELESCOPE_ENABLED` env var is unset
- **`config/telescope.php`**: Middleware only includes `web` - no authentication layer protecting the dashboard
- **`config/telescope.php`**: Default `/telescope` path - predictable and increases exposure risk (Info)
- **Scheduler**: `telescope:prune` not scheduled - `telescope_entries` table grows indefinitely
- **`TelescopeServiceProvider`**: `hideSensitiveRequestDetails()` not called - passwords and tokens may be recorded

#### Gate Callback Quality

The gate is read from the parsed syntax tree, so it is found wherever it is registered: any file under `app/Providers`, or `bootstrap/app.php`, through either `Gate::define('viewTelescope', ...)` or `Telescope::auth(...)`. The callback itself is then checked for:

- **Blanket grant** - Flags callbacks that return `true` on every path, including the `fn ($user) => true` shorthand, so everyone who reaches the dashboard is admitted. A `Telescope::auth(...)` callback that never reads the `$request` it was given is reported the same way, since it can only answer alike for everyone
- **Auth-only gate** - Flags callbacks that only ask whether anybody is signed in, which every registered user satisfies: `auth()->check()`, `auth()?->check()`, `Auth::check()`, `$request->user() !== null`, `! is_null($request->user())`
- **Permissive fallback** - Flags callbacks that can fall through to `true` in the fallback position (`$user?->isAdmin() ?? true`, `... ?: true`), which admits people exactly when the real check could not be answered
- **Environment bypass** - Flags callbacks that decide on the environment or the debug flag somewhere beyond `local`, where that decision can grant on its own: as the whole answer, alongside an `||`, or as an `if` whose branch returns `true`

::: tip Severity depends on how the gate is registered
These defects are graded by reach rather than at a fixed level. A gate registered unconditionally reports **High**, or **Critical** for a blanket grant. One registered only inside an `environment('local')` check drops to **Low**, or **Medium** for a blanket grant, because Laravel's own dashboards already behave that way by default. Any wider guard, such as `staging`, lands between the two.

Three shapes are deliberately not reported: `$user->isAdmin() ? true : false`, because the `true` is not in the fallback position; `app()->environment('local') || $user->isAdmin()`, because a local-only escape hatch is not a bypass; and an environment test that only picks which user check to run.
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
