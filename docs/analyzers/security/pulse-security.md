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
| `pulse-security` | 🛡️ Security  | High    | 10 minutes   |

## What This Checks

Validates Laravel Pulse dashboard security. Checks for:

- `viewPulse` gate defined in a service provider (AppServiceProvider, AuthServiceProvider, or PulseServiceProvider)
- Gate callback is not trivially permissive (`return true`, `fn() => true`, auth-only, `?? true` fallback)
- Data retention (`keep` config) is 7 days or less
- Data trimming lottery is not disabled (`lottery` not set to `[0, …]`)

## Why It Matters

- **Public Dashboard** - Without the `viewPulse` gate, the `/pulse` route is accessible to any authenticated user in non-local environments, exposing slow queries, job timings, request data, and exception counts
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

**2. Configure data retention and trimming:**

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
