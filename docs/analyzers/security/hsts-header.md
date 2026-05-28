---
title: HSTS Header Analyzer
description: Validates that HTTPS-only applications properly implement HTTP Strict Transport Security (HSTS) headers
icon: shield-check
outline: [2, 3]
tags: hsts,https,headers,security,ssl,tls
---

# HSTS Header Analyzer

| Analyzer ID   | Category     | Severity   | Time To Fix  |
| --------------| :----------: |:----------:| ------------:|
| `hsts-header` | 🛡️ Security  | High       | 10 minutes   |

## What This Checks

Validates that HTTPS-only applications properly implement HTTP Strict Transport Security (HSTS) headers. Checks for HSTS middleware presence, max-age directive (minimum 6 months), includeSubDomains directive, optional preload directive, and secure session cookie configuration.

The analyzer handles multi-line header definitions (e.g. when the header name and value are on separate lines) and performs case-insensitive directive matching per [RFC 6797](https://tools.ietf.org/html/rfc6797).

## Why It Matters

- **Security Risk:** HIGH - Without HSTS, users are vulnerable to SSL stripping attacks on their first HTTP request
- **Man-in-the-Middle:** Attackers can intercept the initial HTTP request before HTTPS redirect and steal credentials
- **Cookie Theft:** Insecure subdomains can be exploited to steal cookies set on parent domains
- **Protocol Downgrade:** Corporate proxies or malicious actors can downgrade HTTPS connections to HTTP

HSTS instructs browsers to automatically upgrade all HTTP requests to HTTPS, even before the user's browser makes the first request. This prevents SSL stripping attacks where an attacker intercepts the initial HTTP connection.

**Real-World Impact:**
- 2009: SSL Strip attack demonstrated at Black Hat - millions vulnerable at public WiFi hotspots
- Cookie hijacking via subdomain attacks remains common without `includeSubDomains` directive
- Short max-age values leave users vulnerable after certificate rotation or expiration

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: Missing HSTS Header**

```bash
# Create security headers middleware
php artisan make:middleware SecurityHeaders
```

```php
// app/Http/Middleware/SecurityHeaders.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains'
        );

        return $response;
    }
}
```

::: tip Multi-line definitions supported
The analyzer correctly handles both single-line and multi-line header definitions. Whether you write `$response->headers->set('Strict-Transport-Security', 'max-age=...')` on one line or split the arguments across multiple lines, the analyzer will detect all directives. Directive names like `includeSubDomains` and `preload` are matched case-insensitively per RFC 6797.
:::

::: code-group
```php [Laravel 11+]
// bootstrap/app.php
use App\Http\Middleware\SecurityHeaders;

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(SecurityHeaders::class);
    })
```

```php [Laravel 9–10]
// app/Http/Kernel.php - Add to global middleware
protected $middleware = [
    \App\Http\Middleware\SecurityHeaders::class,
];
```
:::

**Scenario 2: Weak max-age Value**

```php
// ❌ BAD - Only 1 day
'Strict-Transport-Security' => 'max-age=86400'

// ✅ GOOD - 1 year (recommended)
'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains'
```

**Scenario 3: Insecure Session Cookies**

```php
// config/session.php
return [
    'secure' => env('SESSION_SECURE_COOKIE', true),  // Force HTTPS
    'same_site' => 'strict',  // Prevent CSRF
];
```

### Proper Fix (10 minutes)

**1. Gradual max-age Rollout**

Start with a short max-age and increase gradually to avoid issues:

```php
// Week 1: Test with 1 week
'max-age=604800; includeSubDomains'

// Week 2-3: Increase to 1 month
'max-age=2592000; includeSubDomains'

// After testing: Set to 1 year (recommended)
'max-age=31536000; includeSubDomains'
```

**2. Add includeSubDomains Safely**

Before adding `includeSubDomains`, verify ALL subdomains support HTTPS:

```bash
# Test all subdomains
curl -I https://www.example.com  # Should return 200
curl -I https://api.example.com  # Should return 200
curl -I https://cdn.example.com  # Should return 200

# If any subdomain fails, fix it first!
```

**3. Optional: Submit to HSTS Preload List**

For maximum protection (protects even first visit), submit to browser preload lists:

```php
// Add preload directive after months of testing
'max-age=63072000; includeSubDomains; preload'  // 2 years required
```

Then submit at https://hstspreload.org/

**Warning:** Preload list submission is permanent and difficult to reverse. Only do this after extensive testing.

**4. Use Security Headers Package (Alternative)**

```bash
composer require bepsvpt/secure-headers
php artisan vendor:publish --provider="Bepsvpt\SecureHeaders\SecureHeadersServiceProvider"
```

```php
// config/secure-headers.php
return [
    'hsts' => [
        'enable' => true,
        'max-age' => 31536000,
        'include-sub-domains' => true,
        'preload' => false,  // Only enable after extensive testing
    ],
];
```

**5. Configure Requirements (Optional)**

By default, the analyzer requires a minimum max-age of 6 months and `includeSubDomains` directive. To customize these requirements, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'security' => [
        'enabled' => true,
        
        'hsts-header' => [
            'min_max_age' => env('HSTS_MIN_MAX_AGE', 15768000),  // 6 months default
            'require_include_subdomains' => env('HSTS_REQUIRE_SUBDOMAINS', true),
            'require_preload' => env('HSTS_REQUIRE_PRELOAD', false),
            'check_session_secure' => true,
            'ignored_middleware' => [],  // Middleware files to skip
        ],
    ],
],
```

Environment-specific settings:

```ini
# .env
HSTS_MIN_MAX_AGE=31536000  # 1 year
```

::: tip
The default settings follow OWASP recommendations. Only customize if you have specific security requirements or are gradually rolling out HSTS.
:::

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- HSTS header checks require a live web server, not applicable in CI
- CI environments typically don't have a publicly accessible HTTPS web server
- Requires actual HTTP requests to verify HSTS headers are present

**When to run this analyzer:**
- ✅ **HTTPS-only applications**: Runs when ShieldCI detects HTTPS enforcement via `session.secure`, `APP_URL=https://...`, `FORCE_HTTPS=true`, `force_https` in `config/app.php`, `URL::forceScheme('https')` / `URL::forceHttps()` in `AppServiceProvider`, or a `ForceHttps` middleware in `Kernel.php`
- ❌ **Non-HTTPS-only applications**: Skipped automatically (HSTS has no effect unless the app enforces HTTPS)
- ❌ **CI/CD pipelines**: Skipped automatically (requires a live web server)

## References

- [Laravel HTTPS Configuration](https://laravel.com/docs/requests#configuring-trusted-proxies)
- [MDN: HTTP Strict Transport Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [OWASP HSTS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html)
- [RFC 6797: HSTS Specification](https://tools.ietf.org/html/rfc6797)
- [HSTS Preload List](https://hstspreload.org/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)

## Related Analyzers

- [Cookie Analyzer](/analyzers/security/cookie) - Validates secure cookie configuration
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Ensures HTTPS in production
- [Environment File Analyzer](/analyzers/security/env-file) - Protects HTTPS configuration
