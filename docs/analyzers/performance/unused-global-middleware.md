---
title: Unused Global Middleware
description: Detects global middleware that runs on every request but may not be needed, impacting performance
icon: alert-circle
outline: [2, 3]
---

# Unused Global Middleware

| Analyzer ID                | Category       | Severity  | Time To Fix  |
| ---------------------------| :------------: |:---------:| ------------:|
| `unused-global-middleware` | ⚡ Performance  | Low       | 10 minutes   |

## What This Checks

Detects global middleware that runs on every request but may not be needed, impacting performance.

## Why It Matters

- **Performance:** Unnecessary middleware adds latency to every request
- **Efficiency:** Dead code wastes CPU cycles
- **Maintenance:** Clutters middleware stack

Global middleware executes on every single request. Unused middleware wastes resources without providing value.

## How to Fix

### Quick Fix (5 minutes)

**Remove unused middleware:**
```php
// app/Http/Kernel.php
protected $middleware = [
    // Remove if not using these features
    // \Illuminate\Http\Middleware\TrustProxies::class,
    // \Fruitcake\Cors\HandleCors::class,
];
```

### Proper Fix (30 minutes)

**Audit Middleware:**
1. Review each global middleware
2. Move route-specific middleware to route groups
3. Remove truly unused middleware

**Convert Global to Route:**
```php
// Instead of global
Route::middleware(['auth', 'verified'])->group(function () {
    // Routes requiring auth
});
```

## References

- [Laravel Middleware](https://laravel.com/docs/middleware)

## Related Analyzers

- [Route Caching](/analyzers/performance/route-caching)
