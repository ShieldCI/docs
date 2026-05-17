---
title: Nova Security Analyzer
description: Validates that Laravel Nova admin panel is properly secured with authentication gates, middleware, resource policies, and tool authorization
icon: shield
outline: [2, 3]
tags: nova,admin,authentication,security,authorization,dashboard
pro: true
---

# Nova Security Analyzer

| Analyzer ID     | Category     | Severity   | Time To Fix  |
| --------------- | :----------: |:----------:| ------------:|
| `nova-security` | 🛡️ Security  | Critical   | 15 minutes   |

## What This Checks

This analyzer validates the security configuration of Laravel Nova to ensure the admin panel is not publicly accessible and has proper authorization controls at multiple levels.

**Checks Performed:**

#### Service Provider Validation
- **NovaServiceProvider existence** - Verifies the file exists; if missing, Nova has no authorization gate
- **Authorization gate** - Checks for `Gate::define('viewNova', ...)` (Nova 4/5) or `Nova::auth()` (Nova 3 legacy)
- **Empty gate() method** - Flags a `gate()` method with no `Gate::define('viewNova')` call
- **Hardcoded return true** - Flags callbacks that unconditionally return `true`
- **Arrow function shorthand** - Flags `fn($user) => true` gate definitions
- **Auth-only gate** - Flags callbacks that only verify authentication without checking roles or permissions
- **Permissive fallback** - Flags `?? true` or `?: true` in the gate expression
- **Environment bypass** - Flags environment conditions (`staging`, `testing`, `dev`) or `config('app.debug')` used as the sole authorization check

#### Configuration Validation
- **Stripped middleware** - Flags when `middleware` contains only `'web'`, meaning Nova's own middleware have been removed
- **Missing Authenticate middleware** - Flags when `api_middleware` does not include `Authenticate::class`
- **Missing Authorize middleware** - Flags when `api_middleware` does not include `Authorize::class`
- **Predictable path** - Warns when `path` is set to `/nova` or `/admin`

#### Resource Authorization
- **Disabled authorization** - Flags Nova resource classes where `authorizable()` returns `false`, disabling all policy checks

#### Tool Authorization
- **Missing canSee()** - Flags tools registered without a `->canSee()` authorization callback
- **Permissive canSee()** - Flags tools where `canSee()` unconditionally returns `true`

## Why It Matters

An unsecured Nova admin panel provides complete administrative access to your application, exposing:

- **Full database access** — CRUD operations on all application resources and sensitive data
- **User management** — Ability to create, modify, and delete user accounts including administrators
- **Application configuration** — Settings, feature flags, and system configuration changes
- **File management** — Upload, download, and delete files through Nova file fields
- **Custom actions** — Execution of bulk operations, data exports, and administrative actions

A publicly accessible Nova panel is equivalent to giving an attacker full database admin access with a user-friendly interface.

## How to Fix

### Quick Fix (5 minutes)

Define the `viewNova` gate in your `NovaServiceProvider`:

**Before (❌):**
```php
// app/Providers/NovaServiceProvider.php
class NovaServiceProvider extends NovaApplicationServiceProvider
{
    protected function gate(): void
    {
        // No gate defined — any authenticated user can access Nova
    }
}
```

**After (✅):**
```php
// app/Providers/NovaServiceProvider.php
use Illuminate\Support\Facades\Gate;

class NovaServiceProvider extends NovaApplicationServiceProvider
{
    protected function gate(): void
    {
        Gate::define('viewNova', function ($user) {
            return $user->hasRole('admin');
        });
    }
}
```

::: tip Nova 3 Legacy Pattern
If you are on Nova 3, use `Nova::auth()` inside `boot()` instead of `Gate::define()` inside `gate()`. Nova 4 and 5 use the `Gate::define('viewNova', ...)` approach shown above.
:::

### Proper Fix (15 minutes)

**Step 1: Define a strong authorization gate**

```php
// app/Providers/NovaServiceProvider.php
use Illuminate\Support\Facades\Gate;

class NovaServiceProvider extends NovaApplicationServiceProvider
{
    protected function gate(): void
    {
        Gate::define('viewNova', function ($user) {
            return $user->hasRole('admin') || $user->hasRole('super-admin');
        });
    }
}
```

**Step 2: Verify `config/nova.php` retains Nova's default middleware**

```php
// config/nova.php
return [
    'path' => env('NOVA_PATH', 'manage'),   // avoid predictable /nova or /admin

    // Web middleware: Nova UI delivery — do not add 'auth' here
    'middleware' => [
        'web',
        \Laravel\Nova\Http\Middleware\HandleInertiaRequests::class,
        \Laravel\Nova\Http\Middleware\DispatchServingNovaEvent::class,
        \Laravel\Nova\Http\Middleware\BootTools::class,
    ],

    // API middleware: authentication and gate enforcement
    'api_middleware' => [
        'nova',
        \Laravel\Nova\Http\Middleware\Authenticate::class,
        \Laravel\Nova\Http\Middleware\Authorize::class,
    ],
];
```

**Step 3: Do not disable resource authorization**

```php
// app/Nova/User.php

// WRONG (❌) — disables all policy checks for this resource
public static function authorizable(): bool
{
    return false;
}

// CORRECT (✅) — remove the override entirely, or register a policy
// php artisan nova:policy User
```

**Step 4: Authorize custom tools**

```php
// app/Providers/NovaServiceProvider.php
public function tools(): array
{
    return [
        (new \App\Nova\Tools\AuditLog)->canSee(
            fn ($request) => $request->user()->hasRole('super-admin')
        ),
    ];
}
```

## References

- [Laravel Nova Authorization](https://nova.laravel.com/docs/resources/authorization)
- [Laravel Nova — Gates](https://laravel.com/docs/authorization#gates)
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
- [CWE-284: Improper Access Control](https://cwe.mitre.org/data/definitions/284.html)
- [CWE-306: Missing Authentication for Critical Function](https://cwe.mitre.org/data/definitions/306.html)
- [CWE-862: Missing Authorization](https://cwe.mitre.org/data/definitions/862.html)

## Related Analyzers

- [Horizon Security Analyzer](/analyzers/security/horizon-security) — Validates Laravel Horizon dashboard security
- [Authentication Authorization Analyzer](/analyzers/security/authentication-authorization) — Checks authentication and authorization configuration
- [Debug Mode Analyzer](/analyzers/security/debug-mode) — Ensures debug mode is disabled in production
- [Mass Assignment Vulnerabilities Analyzer](/analyzers/security/mass-assignment-vulnerabilities) — Protects against mass assignment in models

---
