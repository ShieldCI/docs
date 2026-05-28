---
title: Custom Error Pages Analyzer
description: Checks for proper 404 and 500 error page templates in your Laravel application, ensuring users see branded error pages instead of raw framework output
icon: alert-triangle
outline: [2, 3]
tags: errors,ux,reliability,security,fingerprinting
---

# Custom Error Pages Analyzer

| Analyzer ID          |    Category    | Severity | Time To Fix |
| ---------------------|:--------------:|:--------:|------------:|
| `custom-error-pages` | ✅ Reliability |    Low   |  30 minutes |

## What This Checks

This analyzer validates the **conventional Laravel approach** of creating individual error template files in `resources/views/errors/`:

- `401.blade.php` - Unauthorized (authentication required)
- `403.blade.php` - Forbidden (authorization failed)
- `404.blade.php` - Not Found
- `419.blade.php` - Page Expired (CSRF token mismatch)
- `429.blade.php` - Too Many Requests (rate limiting)
- `500.blade.php` - Internal Server Error
- `503.blade.php` - Service Unavailable (maintenance mode)

**What this analyzer checks:**
- Existence of conventional error template files on the filesystem
- All configured view paths and custom error view namespaces
- Skips stateless/API-only apps (no session middleware)

**What this analyzer does NOT check:**
- Custom exception handlers in `app/Exceptions/Handler.php`
- Dynamic error views (single template handling multiple HTTP codes)
- Middleware-level error response overrides
- Custom render methods on exception classes
- Error responses returned from controllers

::: warning Important
Applications can implement custom error handling through various approaches. If you use custom exception handlers or other non-conventional methods, you can safely ignore this warning.
:::

## Why It Matters

- **Framework fingerprinting**: Default error pages advertise "Laravel", helping attackers tailor exploits
- **Security exposure**: CSRF errors (419) and authorization failures (401, 403) revealing framework details can guide attacks
- **User experience**: Users prefer branded error pages with recovery instructions (contact support, try again)
- **Rate limiting clarity**: Custom 429 pages can explain retry timing and help prevent support tickets
- **Consistency**: Custom error pages maintain brand experience even during failures or maintenance

## How to Fix

Custom error handling can be implemented in several ways. Choose the approach that best fits your architecture:

### Approach 1: Conventional File-Based (Checked by This Analyzer)

**Quick Fix (15 minutes):**

1. Publish the default error views:

```bash
php artisan vendor:publish --tag=laravel-errors
```

2. Customize all error templates in `resources/views/errors/`:
   - `401.blade.php` - Unauthorized
   - `403.blade.php` - Forbidden
   - `404.blade.php` - Not Found
   - `419.blade.php` - Page Expired (CSRF)
   - `429.blade.php` - Too Many Requests
   - `500.blade.php` - Internal Server Error
   - `503.blade.php` - Service Unavailable

**Best Practices:**
- Add helpful CTAs (support links, status pages, recovery instructions)
- Display correlation/request IDs for debugging
- Localize error messages for multilingual apps
- Write feature tests to verify templates render correctly

### Approach 2: Custom Exception Handler

::: code-group
```php [Laravel 11+]
// bootstrap/app.php
return Application::configure(basePath: dirname(__DIR__))
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (NotFoundHttpException $e) {
            return response()->view('errors.custom-404', [], 404);
        });

        $exceptions->render(function (AuthorizationException $e) {
            return response()->view('errors.custom-403', [], 403);
        });
    })
```

```php [Laravel 9–10]
// app/Exceptions/Handler.php
public function render($request, Throwable $e)
{
    if ($e instanceof NotFoundHttpException) {
        return response()->view('errors.custom-404', [], 404);
    }

    if ($e instanceof AuthorizationException) {
        return response()->view('errors.custom-403', [], 403);
    }

    return parent::render($request, $e);
}
```
:::

### Approach 3: Dynamic Error View

Create a single template that handles all error codes:

```blade
{{-- resources/views/errors/error.blade.php --}}
@switch($exception->getStatusCode())
    @case(404)
        <h1>Page Not Found</h1>
    @case(500)
        <h1>Server Error</h1>
    @default
        <h1>An Error Occurred</h1>
@endswitch
```

### Approach 4: Middleware-Based

Transform error responses in middleware:

```php
public function handle($request, Closure $next)
{
    $response = $next($request);

    if ($response->status() >= 400) {
        return response()->view('errors.handler', [
            'code' => $response->status()
        ], $response->status());
    }

    return $response;
}
```

### Skipping This Analyzer

If you use approaches 2-4, add to `config/shieldci.php`:

```php
'dont_report' => [
    'custom-error-pages',
],
```

## ShieldCI Configuration

This analyzer is automatically skipped for stateless/API-only applications.

**Overriding the required template list**

By default the analyzer requires all 7 templates. If your project only needs a subset you can restrict the list via config, with no changes to the published `config/shieldci.php` required:

```php
// config/shieldci.php
return [
    'analyzers' => [
        'reliability' => [
            'enabled' => true,
        
            'custom-error-pages' => [
                'required_templates' => [
                    '404.blade.php',
                    '500.blade.php',
                    '503.blade.php',
                ],
            ],
        ],
    ],
];
```

Only the templates listed here will be checked. The recommendation text will also reflect only the templates that are actually missing.

**Why skip for stateless/API-only apps?**
- API-only applications return JSON error responses, not HTML pages
- Stateless apps (no session middleware) don't serve traditional web pages
- Custom HTML error pages aren't relevant for pure API applications

**When to run this analyzer:**
- ✅ **Web applications with sessions**: Full-stack Laravel apps serving HTML
- ✅ **Hybrid apps**: Applications with both web and API routes
- ✅ **Local development**: Ensures error pages are configured before deployment
- ✅ **Staging/Production servers**: Validates custom error pages are in place
- ❌ **API-only applications**: Skipped automatically (no session middleware detected)

## References

- [Laravel Error Pages](https://laravel.com/docs/errors)
- [HTTP Status Codes](https://developer.mozilla.org/docs/Web/HTTP/Status)

## Related Analyzers

- [Cache Status Analyzer](/analyzers/reliability/cache-status) - Validates cache connectivity and functionality
- [Cache Prefix Configuration Analyzer](/analyzers/reliability/cache-prefix-configuration) - Ensures cache prefix is set to avoid collisions
- [Maintenance Mode Status Analyzer](/analyzers/reliability/maintenance-mode-status) - Checks if the application is in maintenance mode
