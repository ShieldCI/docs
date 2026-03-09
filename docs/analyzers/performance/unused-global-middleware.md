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
| `HandleCors` | No paths configured in `config/cors.php` | 9–12 |

::: info Laravel 11+
`TrustProxies` and `TrustHosts` are framework-level defaults in Laravel 11+ and are not flagged. Only `HandleCors` is checked.
:::

## Why It Matters

- **Performance:** Unnecessary middleware adds latency to every request
- **Efficiency:** Dead code wastes CPU cycles on every single HTTP request
- **Maintenance:** Clutters the middleware stack with components that do nothing

## How to Fix

### HandleCors — configure paths or disable

The most common fix is to configure CORS properly rather than remove the middleware.

::: code-group
```php [Configure paths (recommended)]
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    // ...
];
```

```php [Laravel 11+ — disable if not needed]
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->remove(\Illuminate\Http\Middleware\HandleCors::class);
})
```

```php [Laravel 9–10 — remove from Kernel]
// app/Http/Kernel.php
protected $middleware = [
    // Comment out or remove:
    // \Fruitcake\Cors\HandleCors::class,
];
```
:::

### TrustProxies — configure or remove (Laravel 9–10 only)

::: code-group
```php [Configure proxies]
// app/Http/Middleware/TrustProxies.php
protected $proxies = '*'; // or specific IPs: ['192.168.1.1']
```

```php [Remove from Kernel]
// app/Http/Kernel.php
protected $middleware = [
    // Comment out or remove:
    // \App\Http\Middleware\TrustProxies::class,
];
```
:::

### TrustHosts — add TrustProxies or remove (Laravel 9–10 only)

`TrustHosts` only works when `TrustProxies` is also registered and configured. Either configure `TrustProxies` alongside it, or remove both if you are not behind a proxy.

## References

- [Laravel Middleware](https://laravel.com/docs/middleware)
- [Laravel CORS](https://laravel.com/docs/routing#cors)
- [Trusted Proxies](https://laravel.com/docs/requests#configuring-trusted-proxies)

## Related Analyzers

- [Route Caching Analyzer](/analyzers/performance/route-caching) - Ensures route caching is properly configured
