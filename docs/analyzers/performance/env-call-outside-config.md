---
title: Env Call Analyzer
description: Detects direct env() calls outside config files, which breaks config caching and causes unpredictable behavior
icon: alert-circle
outline: [2, 3]
---

# Env Call Analyzer

| Analyzer ID               | Category       | Severity   | Time To Fix  |
| --------------------------| :------------: |:----------:| ------------:|
| `env-call-outside-config` | ⚡ Performance  | High       | 30 minutes   |

## What This Checks

Detects direct `env()` calls outside config files, which breaks config caching and causes unpredictable behavior.

## Why It Matters

- **Performance:** Config caching doesn't work with env() calls
- **Reliability:** env() returns null when config is cached
- **Best Practice:** Violates Laravel's configuration patterns

When configuration is cached, `env()` always returns `null` outside config files. This causes features to break mysteriously in production.

## How to Fix

### Quick Fix (5 minutes)

Replace env() calls with config() calls:

**Before:**
```php
// ❌ app/Services/PaymentService.php
$apiKey = env('STRIPE_KEY');
```

**After:**
```php
// ✅ app/Services/PaymentService.php
$apiKey = config('services.stripe.key');

// config/services.php
return [
    'stripe' => [
        'key' => env('STRIPE_KEY'),
    ],
];
```

### Proper Fix (30 minutes)

**Migrate All env() Calls:**

1. Find all env() calls:
```bash
grep -r "env(" app/ --exclude-dir=vendor
```

2. Create config entries:
```php
// config/myapp.php
return [
    'api_key' => env('MYAPP_API_KEY'),
    'enabled' => env('MYAPP_ENABLED', false),
];
```

3. Update code:
```php
// ❌ Before
if (env('FEATURE_ENABLED')) {
    // ...
}

// ✅ After
if (config('myapp.enabled')) {
    // ...
}
```

## Common Mistakes to Avoid

1. **env() in controllers/services:**
   ```php
   // ❌ Breaks with config:cache
   $key = env('API_KEY');

   # ✅ Always works
   $key = config('services.api.key');
   ```

2. **Forgetting config defaults:**
   ```php
   // ❌ No default
   'key' => env('API_KEY'),

   // ✅ With default
   'key' => env('API_KEY', 'default-value'),
   ```

## References

- [Laravel Configuration](https://laravel.com/docs/configuration)
- [Config Caching](https://laravel.com/docs/configuration#configuration-caching)

## Related Analyzers

- [Configuration Caching](/analyzers/performance/config-caching)
