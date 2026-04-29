---
title: Pennant Config Analyzer
description: Validates Laravel Pennant feature flag configuration, driver settings, and usage patterns
icon: check-circle
outline: [2, 3]
tags: best-practices,pennant,feature-flags,configuration,testing
pro: true
---

# Pennant Config Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `pennant-config` | 🏅 Best Practices  | Medium    | 10 minutes   |

## What This Checks

Validates Laravel Pennant feature flag configuration, driver settings, and usage patterns. Checks for:

- Unpublished `config/pennant.php` — driver configuration cannot be verified
- Explicit use of the `array` driver — feature flag state is not persisted between requests
- Stale feature flag references — flags checked via `Feature::active()`, `inactive()`, `when()`, `unless()`, `value()`, and bulk methods (`allAreActive()`, `someAreActive()`, `allAreInactive()`, `someAreInactive()`) that have no corresponding definition
- Feature definitions without a type hint on the scope parameter (including PHP 8 union types such as `User|null`)
- Feature definitions with empty closures or bare `return;` statements — no default value when the store is unavailable
- Class-based features in `app/Features/` (with a `resolve()` method) are recognised as definitions, including those using the `#[Name('...')]` attribute

> **Severity note:** Missing scope type hints raise a **Low** severity issue; all other findings are **Medium**.

## Why It Matters

- **State Persistence:** The `array` driver resets all feature flag state on every request, making gradual rollouts and A/B tests meaningless in production
- **Auditability:** Without a published config file the active driver cannot be reviewed or controlled via source code
- **Stale Flags:** Feature checks without a matching definition always resolve to `false`, permanently hiding features with no visible error
- **Type Safety:** Unvalidated scope parameters can cause runtime errors when the wrong scope type is passed to a feature closure
- **Reliability:** Feature definitions that return nothing behave unpredictably when the flag store is unavailable

## How to Fix

### Quick Fix (2 minutes)

Publish the Pennant configuration and migration files, then run the migrations:

```bash
php artisan vendor:publish --provider="Laravel\Pennant\PennantServiceProvider"
php artisan migrate
```

### Proper Fix (10 minutes)

**1. Use the database driver for production:**

```php
// config/pennant.php
'default' => env('PENNANT_STORE', 'database'),

'stores' => [
    'database' => [
        'driver' => 'database',
        'connection' => null,
        'table' => 'features',
    ],
],
```

**2. Define all referenced feature flags:**

**Before (❌):**
```php
// Flag is checked but never defined
if (Feature::active('new-dashboard')) { ... }
```

**After (✅) — closure-based:**
```php
// app/Providers/AppServiceProvider.php
Feature::define('new-dashboard', function (User $scope): bool {
    return $scope->is_beta_tester;
});
```

**After (✅) — class-based:**
```php
// app/Features/NewDashboard.php
class NewDashboard
{
    public function resolve(User $scope): bool
    {
        return $scope->is_beta_tester;
    }
}
```

**3. Add type hints to scope parameters (nullable union types are also valid):**

**Before (❌):**
```php
Feature::define('guest-banner', function ($scope) {
    return $scope === null;
});
```

**After (✅):**
```php
Feature::define('guest-banner', function (User|null $scope): bool {
    return $scope === null;
});
```

**4. Provide a return value in every feature definition:**

**Before (❌):**
```php
Feature::define('maintenance-banner', function (User $scope) {});
```

**After (✅):**
```php
Feature::define('maintenance-banner', function (User $scope): bool {
    return false; // safe default when store is unavailable
});
```

**5. Clean up stale flags:**

```bash
# Remove stored values for a specific feature
php artisan pennant:purge new-dashboard

# Purge all stored feature values
php artisan pennant:purge
```

## References

- [Laravel Pennant Documentation](https://laravel.com/docs/pennant)
- [Laravel Pennant Configuration](https://laravel.com/docs/pennant#configuration)
- [Class-based Features](https://laravel.com/docs/pennant#class-based-features)

## Related Analyzers

- [Debug Mode](/analyzers/security/debug-mode) - Validates debug mode is disabled in production
- [Env Calls Outside Config](/analyzers/performance/env-call-outside-config) - Detects `env()` calls outside config files
- [Config Caching](/analyzers/performance/config-caching) - Validates configuration caching
