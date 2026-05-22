---
title: Unused Global Middleware Analyzer
description: Detects global middleware that runs on every request but may not be needed, impacting performance
icon: alert-circle
outline: [2, 3]
tags: performance,middleware,optimization,http
---

# Unused Global Middleware Analyzer

| Analyzer ID                | Category       | Severity  | Time To Fix  |
| ---------------------------| :------------: |:---------:| ------------:|
| `unused-global-middleware` | ⚡ Performance  | Low       | 10 minutes   |

## What This Checks

Detects global middleware that runs on every request but provides no benefit due to missing configuration.

Specifically checks for:

| Middleware | Flagged when | Laravel versions |
|---|---|:---:|
| `TrustProxies` | No proxies configured (property empty, no `trustedproxy.proxies` config) | 9–10 |
| `TrustHosts` | Registered without `TrustProxies` (useless without it) | 9–10 |
| `HandleCors` | No paths configured in `config/cors.php` | 9+ |

::: info Laravel 11+
`TrustProxies` and `TrustHosts` are framework-level defaults in Laravel 11+ and are not flagged. Only `HandleCors` is checked.
:::

## Why It Matters

- **Performance:** Unnecessary middleware adds latency to every request
- **Efficiency:** Dead code wastes CPU cycles on every single HTTP request
- **Maintenance:** Clutters the middleware stack with components that do nothing

## How to Fix

### Quick Fix (5 minutes)

Configure the flagged middleware so it runs with a purpose:

**HandleCors — add CORS paths:**

```php
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    // ...
];
```

**TrustProxies — configure your proxy (Laravel 9–10):**

```php
// app/Http/Middleware/TrustProxies.php
protected $proxies = '*'; // or specific IPs: ['192.168.1.1']
```

**TrustHosts — configure TrustProxies alongside it (Laravel 9–10):**

`TrustHosts` only functions when `TrustProxies` is registered and configured. Apply the `TrustProxies` fix above first.

### Proper Fix (10 minutes)

If you don't use the middleware's feature, remove it entirely rather than adding placeholder configuration.

**HandleCors — remove if you have no CORS requirements:**

::: code-group
```php [Laravel 11+]
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->remove(\Illuminate\Http\Middleware\HandleCors::class);
})
```

```php [Laravel 9–10]
// app/Http/Kernel.php
protected $middleware = [
    // Comment out or remove:
    // \Fruitcake\Cors\HandleCors::class,
];
```
:::

**TrustProxies and TrustHosts — remove both if you are not behind a proxy (Laravel 9–10):**

```php
// app/Http/Kernel.php
protected $middleware = [
    // Comment out or remove both:
    // \App\Http\Middleware\TrustProxies::class,
    // \App\Http\Middleware\TrustHosts::class,
];
```

## References

- [Laravel Middleware](https://laravel.com/docs/middleware)
- [Laravel CORS](https://laravel.com/docs/routing#cors)
- [Trusted Proxies](https://laravel.com/docs/requests#configuring-trusted-proxies)

## Related Analyzers

- [Route Caching Analyzer](/analyzers/performance/route-caching) - Ensures route caching is properly configured
