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

Validates Laravel Pennant feature flag configuration. Checks for:

- Driver configuration (array driver doesn't persist state between requests)
- Stale feature flag references (checked in code but never defined)
- Scope validation in feature definitions
- Default/fallback values in feature definitions (empty closures or missing returns)

## Why It Matters

- **State Persistence:** The array driver resets feature flags on every request, making A/B tests meaningless
- **Reliability:** Feature flags without default values behave unpredictably when the store is unavailable
- **Stale Flags:** Feature checks without definitions always resolve to `false`, potentially hiding features permanently
- **Type Safety:** Unvalidated scope parameters can cause runtime errors

## How to Fix

### Quick Fix (5 minutes)

Publish and configure Pennant:

```bash
php artisan vendor:publish --provider="Laravel\Pennant\PennantServiceProvider"
```

Set the database driver for production:

```php
// config/pennant.php
'default' => env('PENNANT_STORE', 'database'),
```

### Proper Fix (10 minutes)

**1. Use the database driver for production:**

```php
// config/pennant.php
'stores' => [
    'database' => [
        'driver' => 'database',
        'table' => 'features',
    ],
],
```

**2. Define features with proper defaults and scope types:**

**Before (❌):**
```php
Feature::define('new-onboarding', function ($scope) {
    // Empty - no default value
});
```

**After (✅):**
```php
Feature::define('new-onboarding', function (User $scope): bool {
    return $scope->created_at->isAfter('2024-01-01');
});
```

**3. Clean up stale feature flags:**

```bash
# List all defined features
php artisan pennant:purge

# Remove resolved values for a specific feature
php artisan pennant:purge new-onboarding
```

## References

- [Laravel Pennant Documentation](https://laravel.com/docs/pennant)
- [Laravel Pennant Configuration](https://laravel.com/docs/pennant#configuration)
- [Feature Flag Best Practices](https://martinfowler.com/articles/feature-toggles.html)

## Related Analyzers

- [Debug Mode](/analyzers/security/debug-mode) - Validates debug settings per environment
- [Env Calls Outside Config](/analyzers/performance/env-call-outside-config) - Detects env() misuse
- [Config Caching](/analyzers/performance/config-caching) - Validates configuration caching
