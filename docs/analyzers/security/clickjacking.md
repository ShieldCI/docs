---
title: Clickjacking Protection Analyzer
description: Detects missing clickjacking protection via X-Frame-Options or CSP frame-ancestors in Laravel applications
icon: shield-x
outline: [2, 3]
tags: clickjacking,x-frame-options,csp,frame-ancestors,security,headers
pro: true
---

# Clickjacking Protection Analyzer

| Analyzer ID       | Category     | Severity | Time To Fix  |
| ------------------| :----------: |:--------:| ------------:|
| `clickjacking`    | 🛡️ Security  | High     | 5 minutes    |

## What This Checks

Detects missing clickjacking protection in Laravel applications. Validates that the application is protected from clickjacking attacks through one of these methods:
- FrameGuard middleware (sets `X-Frame-Options: SAMEORIGIN` by default)
- Manual `X-Frame-Options` header in middleware or service providers
- Content-Security-Policy `frame-ancestors` directive in middleware, config, or service providers
- `spatie/laravel-csp` package configuration with `frame-ancestors`
- `bepsvpt/secure-headers` package configuration with X-Frame-Options or CSP
- Server-level protection via `.htaccess` or `nginx.conf`

Also detects and warns about:
- Deprecated `ALLOW-FROM` directive (not supported by modern browsers)
- Overly permissive `frame-ancestors *` wildcard (effectively disables protection)
- `Content-Security-Policy-Report-Only` used without an enforcing policy (logs violations but does not block framing)

## Why It Matters

- **UI Redressing Attacks**: Attackers can embed your application in an invisible iframe and trick users into clicking on elements they can't see
- **Credential Theft**: Users can be tricked into entering credentials on what appears to be your site but is actually an attacker's overlay
- **Unauthorized Actions**: Clickjacking can trick authenticated users into performing actions like changing passwords, transferring money, or deleting data
- **Session Hijacking**: Attackers can capture user interactions and session data through iframe embedding

Clickjacking (also known as "UI redressing") occurs when an attacker embeds your application in an invisible iframe on a malicious website. When users think they're clicking on the attacker's page, they're actually clicking on your application, potentially performing unauthorized actions while authenticated.

## How to Fix

### Quick Fix (2 minutes)

::: code-group
```php [Laravel 11+]
// bootstrap/app.php
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        // ✅ Add FrameGuard to web middleware
        $middleware->web(append: [
            \Illuminate\Http\Middleware\FrameGuard::class,
        ]);
    })
    ->create();
```

```php [Laravel 9–10]
// app/Http/Kernel.php
protected $middlewareGroups = [
    'web' => [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\Http\Middleware\FrameGuard::class,  // ✅ Add this
    ],
];
```
:::

### Proper Fix (5 minutes)

**Option 1: FrameGuard Middleware (Recommended)**

The simplest approach is using Laravel's built-in FrameGuard middleware, which automatically sets the `X-Frame-Options: SAMEORIGIN` header.

::: code-group
```php [Laravel 11+]
// bootstrap/app.php
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        // Add FrameGuard to web middleware group
        $middleware->web(append: [
            \Illuminate\Http\Middleware\FrameGuard::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();
```

```php [Laravel 9–10]
// app/Http/Kernel.php
protected $middlewareGroups = [
    'web' => [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \App\Http\Middleware\VerifyCsrfToken::class,
        \Illuminate\Http\Middleware\FrameGuard::class,  // ✅ Add FrameGuard
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
];
```
:::

**Option 2: Manual X-Frame-Options Header**

Set the header manually in middleware for more control:

```php
// app/Http/Middleware/SecurityHeaders.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // ✅ Prevent clickjacking - only allow same origin
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Or deny all framing
        // $response->headers->set('X-Frame-Options', 'DENY');

        return $response;
    }
}
```

Register the middleware:

```php
// Laravel 10+ - bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        \App\Http\Middleware\SecurityHeaders::class,
    ]);
})

// Laravel 9 - app/Http/Kernel.php
protected $middlewareGroups = [
    'web' => [
        \App\Http\Middleware\SecurityHeaders::class,
    ],
];
```

**Option 3: Content-Security-Policy with frame-ancestors**

Use the more modern CSP approach for better control:

```php
// app/Http/Middleware/SecurityHeaders.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // ✅ Modern CSP approach
        $csp = "default-src 'self'; frame-ancestors 'self'";
        $response->headers->set('Content-Security-Policy', $csp);

        // For broader browser support, also set X-Frame-Options
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        return $response;
    }
}
```

> **Browser compatibility note:** `Content-Security-Policy: frame-ancestors` is the modern standard and takes precedence in all current browsers. For maximum compatibility with legacy browsers (Internet Explorer), keep both `X-Frame-Options` and the CSP header, as shown above.

**Option 4: Configuration-Based Approach**

Store CSP configuration in a config file:

```php
// config/security.php
return [
    'csp' => [
        'directives' => [
            'default-src' => ["'self'"],
            'frame-ancestors' => ["'self'"],
            'script-src' => ["'self'", "'unsafe-inline'"],
        ],
    ],

    'headers' => [
        'X-Frame-Options' => 'SAMEORIGIN',
    ],
];
```

Apply headers from config:

```php
// app/Http/Middleware/SecurityHeaders.php
public function handle(Request $request, Closure $next)
{
    $response = $next($request);

    // Apply headers from config
    foreach (config('security.headers', []) as $header => $value) {
        $response->headers->set($header, $value);
    }

    // Build and apply CSP
    $directives = config('security.csp.directives', []);
    if (!empty($directives)) {
        $csp = $this->buildCspHeader($directives);
        $response->headers->set('Content-Security-Policy', $csp);
    }

    return $response;
}

private function buildCspHeader(array $directives): string
{
    $parts = [];
    foreach ($directives as $directive => $values) {
        $parts[] = $directive . ' ' . implode(' ', $values);
    }
    return implode('; ', $parts);
}
```

**Option 5: Using Response::macro() for Reusable Security Headers**

```php
// app/Providers/AppServiceProvider.php
namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Response;

class AppServiceProvider extends ServiceProvider
{
    public function boot()
    {
        // Create a macro for secure responses
        Response::macro('withSecurityHeaders', function ($value = null) {
            /** @var \Illuminate\Http\Response $this */
            return $this->withHeaders([
                'X-Frame-Options' => 'SAMEORIGIN',
                'Content-Security-Policy' => "default-src 'self'; frame-ancestors 'self'",
                'X-Content-Type-Options' => 'nosniff',
                'X-XSS-Protection' => '1; mode=block',
            ]);
        });
    }
}

// Usage in controllers
public function index()
{
    return response()
        ->view('dashboard')
        ->withSecurityHeaders();
}
```

**Option 6: Environment-Based CSP Configuration**

Store CSP values in a config file (never call `env()` directly in middleware, as it returns `null` after `php artisan config:cache`):

```php
// config/security.php
return [
    'csp_frame_ancestors' => env('CSP_FRAME_ANCESTORS', "'self'"),
    'csp_default_src' => env('CSP_DEFAULT_SRC', "'self'"),
];
```

```ini
# .env
CSP_FRAME_ANCESTORS="'self' https://trusted-partner.com"
CSP_DEFAULT_SRC="'self'"
```

```php
// app/Http/Middleware/SecurityHeaders.php
public function handle(Request $request, Closure $next)
{
    $response = $next($request);

    // ✅ Read from config — works correctly after config:cache
    $frameAncestors = config('security.csp_frame_ancestors', "'self'");
    $defaultSrc = config('security.csp_default_src', "'self'");

    $csp = "default-src {$defaultSrc}; frame-ancestors {$frameAncestors}";
    $response->headers->set('Content-Security-Policy', $csp);

    return $response;
}
```

## Advanced Configuration

**Allowing Specific Trusted Partners:**

```php
// app/Http/Middleware/SecurityHeaders.php
public function handle(Request $request, Closure $next)
{
    $response = $next($request);

    // Trusted partners that can embed our app
    $trustedPartners = [
        'https://partner1.com',
        'https://partner2.com',
    ];

    $frameAncestors = implode(' ', array_merge(["'self'"], $trustedPartners));
    $csp = "default-src 'self'; frame-ancestors {$frameAncestors}";

    $response->headers->set('Content-Security-Policy', $csp);

    // For older browser support
    $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

    return $response;
}
```

**Route-Specific Exceptions:**

```php
// app/Http/Middleware/ClickjackingProtection.php
public function handle(Request $request, Closure $next)
{
    $response = $next($request);

    // Allow framing from specific trusted origins for embed/widget routes
    if ($request->is('embed/*') || $request->is('widget/*')) {
        // ✅ CSP frame-ancestors for precise cross-origin control (ALLOW-FROM is deprecated)
        $response->headers->set(
            'Content-Security-Policy',
            "frame-ancestors 'self' https://trusted-partner.com"
        );
        // Note: X-Frame-Options is omitted for embed routes to avoid conflicts
    } else {
        // ✅ Strict for all other routes
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Content-Security-Policy', "frame-ancestors 'none'");
    }

    return $response;
}
```

## References

- [Laravel FrameGuard Middleware](https://laravel.com/docs/middleware)
- [MDN: X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- [MDN: CSP frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)
- [OWASP Clickjacking Defense](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)
- [CWE-1021: Improper Restriction of Rendered UI Layers](https://cwe.mitre.org/data/definitions/1021.html)

## Related Analyzers

- [CSRF Protection Analyzer](/analyzers/security/csrf-protection) - Protects against cross-site request forgery
- [XSS Vulnerabilities Analyzer](/analyzers/security/xss-vulnerabilities) - Prevents cross-site scripting attacks
- [Cookie Analyzer](/analyzers/security/cookie) - Validates session cookie security
- [HSTS Header Analyzer](/analyzers/security/hsts-header) - Validates HTTPS enforcement
