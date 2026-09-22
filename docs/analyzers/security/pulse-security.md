---
title: Pulse Security Analyzer
description: Validates Laravel Pulse dashboard authorization, data retention, and security settings
icon: shield
outline: [2, 3]
tags: security,pulse,monitoring,dashboard,authorization
pro: true
---

# Pulse Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `pulse-security` | 🛡️ Security  | Critical| 10 minutes   |

## What This Checks

Validates Laravel Pulse dashboard security.

**Checks Performed:**

#### Gate Registration
- **`viewPulse` gate defined** - Checks that the gate is registered. It is read from the parsed syntax tree, so it is found in any file under `app/Providers` or in `bootstrap/app.php`, not only in `AppServiceProvider`, `AuthServiceProvider` or `PulseServiceProvider`. Pulse documents only `Gate::define('viewPulse', ...)`, so there is no `Pulse::auth()` form to match

#### Gate Callback Quality
- **Blanket grant** - Flags callbacks that return `true` on every path, including the `fn () => true` shorthand
- **Auth-only gate** - Flags callbacks that only ask whether anybody is signed in, which every registered user satisfies: `auth()->check()`, `auth()?->check()`, `Auth::check()`, `$request->user() !== null`, `! is_null($request->user())`
- **Permissive fallback** - Flags callbacks that can fall through to `true` in the fallback position (`$user?->isAdmin() ?? true`, `... ?: true`), which admits people exactly when the real check could not be answered
- **Environment bypass** - Flags callbacks that decide on the environment or the debug flag somewhere beyond `local`, where that decision can grant on its own: as the whole answer, alongside an `||`, or as an `if` whose branch returns `true`

::: tip Severity depends on how the gate is registered
These defects are graded by reach rather than at a fixed level. A gate registered unconditionally reports **High**, or **Critical** for a blanket grant. One registered only inside an `environment('local')` check drops to **Low**, or **Medium** for a blanket grant, because Laravel's own dashboards already behave that way by default. Any wider guard, such as `staging`, lands between the two.

Three shapes are deliberately not reported: `$user->isAdmin() ? true : false`, because the `true` is not in the fallback position; `app()->environment('local') || $user->isAdmin()`, because a local-only escape hatch is not a bypass; and an environment test that only picks which user check to run.
:::

#### Configuration Validation
- **Data retention** - Checks that `keep` is 7 days or less
- **Data trimming** - Flags a disabled trimming lottery (`lottery` set to `[0, …]`)

## Why It Matters

- **Undefined Gate** - Until a `viewPulse` gate exists, nobody has decided who may see slow queries, job timings, request data, and exception counts
- **Weak Authorization** - A gate that returns `true` or only checks `auth()->check()` grants the full dashboard to every logged-in user, not just administrators
- **Sensitive Query Data** - Pulse records slow query text and timing; this information can reveal table names, column names, and data patterns useful to attackers
- **Database Growth** - Without data trimming, Pulse's storage tables grow unbounded and can exhaust disk space in high-traffic applications
- **Data Minimisation** - Retaining monitoring data longer than necessary increases the blast radius of a database breach

## How to Fix

### Quick Fix (5 minutes)

Define the `viewPulse` gate in `AppServiceProvider::boot()`:

**Before (❌):**
```php
// app/Providers/AppServiceProvider.php
public function boot(): void
{
    // No viewPulse gate — dashboard open to all authenticated users
}
```

**After (✅):**
```php
// app/Providers/AppServiceProvider.php
use Illuminate\Support\Facades\Gate;

public function boot(): void
{
    Gate::define('viewPulse', function (User $user) {
        return $user->isAdmin();
    });
}
```

### Proper Fix (10 minutes)

**1. Fix a permissive gate:**

**Before (❌):**
```php
Gate::define('viewPulse', function ($user) {
    return true; // Grants access to everyone
});
```

**After (✅):**
```php
Gate::define('viewPulse', function (User $user) {
    return in_array($user->email, [
        'admin@example.com',
        'devops@example.com',
    ], true);
});
```

**2. Fix an environment bypass:**

**Before (❌):**
```php
Gate::define('viewPulse', function ($user) {
    // Access depends on APP_ENV staying correct on every deployed box,
    // and the environment test grants on its own
    return app()->environment('staging') || $user->isAdmin();
});
```

**After (✅):**
```php
Gate::define('viewPulse', function (User $user) {
    // Decide on the user, not on configuration
    return $user->isAdmin();
});
```

::: tip
An `environment('local')` escape hatch is not reported, so `app()->environment('local') || $user->isAdmin()` stays as it is. Only environments beyond `local` count as a bypass.
:::

**3. Configure data retention and trimming:**

**Before (❌):**
```php
// config/pulse.php
'trim' => [
    'lottery' => [0, 100], // Trimming disabled
    'keep'    => CarbonInterval::days(30), // Excessive retention
],
```

**After (✅):**
```php
// config/pulse.php
'trim' => [
    'lottery' => [1, 1000], // Trim on ~0.1% of requests
    'keep'    => CarbonInterval::days(7),
],
```

## References

- [Laravel Pulse Documentation](https://laravel.com/docs/pulse)
- [Laravel Pulse Authorization](https://laravel.com/docs/pulse#dashboard-authorization)
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
- [CWE-284: Improper Access Control](https://cwe.mitre.org/data/definitions/284.html)
- [CWE-359: Exposure of Private Personal Information](https://cwe.mitre.org/data/definitions/359.html)

## Related Analyzers

- [Telescope Security](/analyzers/security/telescope-security) - Validates Telescope debug tool security
- [Horizon Security](/analyzers/security/horizon-security) - Validates Horizon dashboard security
- [Debug Mode](/analyzers/security/debug-mode) - Validates debug mode configuration

---
