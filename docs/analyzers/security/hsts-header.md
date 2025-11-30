---
title: HSTS Header Analyzer
description: Validates that HTTPS-only applications properly implement HTTP Strict Transport Security (HSTS) headers
icon: shield-check
outline: [2, 3]
---

# HSTS Header Analyzer

## What This Checks

Validates that HTTPS-only applications properly implement HTTP Strict Transport Security (HSTS) headers. Checks for HSTS middleware presence, max-age directive (minimum 6 months), includeSubDomains directive, optional preload directive, and secure session cookie configuration.

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

class SecurityHeaders
{
    public function handle($request, Closure $next)
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

```php
// app/Http/Kernel.php - Add to global middleware
protected $middleware = [
    \App\Http\Middleware\SecurityHeaders::class,
];
```

**Scenario 2: Weak max-age Value**

```php
// ❌ BEFORE: Only 1 day
'Strict-Transport-Security' => 'max-age=86400'

// ✅ AFTER: 1 year (recommended)
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

### Proper Fix (30 minutes)

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

**5. Configure for Different Environments**

```php
// config/shieldci.php
return [
    'hsts_header' => [
        'min_max_age' => env('HSTS_MIN_MAX_AGE', 15768000),  // 6 months
        'require_include_subdomains' => env('HSTS_REQUIRE_SUBDOMAINS', true),
        'require_preload' => env('HSTS_REQUIRE_PRELOAD', false),
        'check_session_secure' => true,
    ],
];

// .env.production
HSTS_MIN_MAX_AGE=31536000  // 1 year

// .env.staging
HSTS_MIN_MAX_AGE=604800  // 1 week for testing
```

## Common Mistakes to Avoid

1. **Adding HSTS before testing HTTPS thoroughly:**
   ```php
   // ❌ BAD - Set max-age to 1 year immediately
   // Day 1 of HTTPS: 'max-age=31536000'

   // ✅ GOOD - Start small, increase gradually
   // Week 1: 'max-age=604800'  // 1 week
   // Week 2-3: 'max-age=2592000'  // 1 month
   // After testing: 'max-age=31536000'  // 1 year
   ```

2. **Adding includeSubDomains without testing all subdomains:**
   ```php
   // ❌ BAD - Forgot dev.example.com doesn't have HTTPS
   'max-age=31536000; includeSubDomains'
   // Result: dev.example.com becomes inaccessible!

   // ✅ GOOD - Test all subdomains first
   // curl -I https://www.example.com  ✓
   // curl -I https://api.example.com  ✓
   // curl -I https://dev.example.com  ✗ Fix this first!
   ```

3. **Submitting to preload list prematurely:**
   ```php
   // ❌ BAD - Preload on day 1 of HTTPS
   // Preload is permanent - very hard to remove!

   // ✅ GOOD - Test for months, then preload
   // Test with 'max-age=31536000; includeSubDomains' for 3-6 months
   // Then add 'preload' and submit to hstspreload.org
   ```

4. **HSTS enabled but cookies still insecure:**
   ```php
   // ❌ BAD - HSTS protects connection, but cookies sent over HTTP
   // HSTS: 'max-age=31536000; includeSubDomains'
   // config/session.php: 'secure' => false

   // ✅ GOOD - Enable secure cookies
   // config/session.php: 'secure' => true
   ```

5. **Disabling HSTS in staging/testing:**
   ```php
   // ❌ BAD - Staging should mirror production
   if (app()->environment('production')) {
       'max-age=31536000'
   } else {
       'max-age=0'  // Disabled!
   }

   // ✅ GOOD - Use shorter max-age, not zero
   if (app()->environment('production')) {
       'max-age=31536000'
   } else {
       'max-age=3600'  // 1 hour for testing
   }
   ```

6. **Mixing HTTP and HTTPS content:**
   ```html
   <!-- ❌ BAD - Mixed content errors -->
   <img src="http://example.com/logo.png">
   <script src="http://cdn.example.com/app.js"></script>

   <!-- ✅ GOOD - All HTTPS -->
   <img src="https://example.com/logo.png">
   <script src="https://cdn.example.com/app.js"></script>
   ```

## References

- [Laravel HTTPS Configuration](https://laravel.com/docs/requests#configuring-trusted-proxies)
- [MDN: HTTP Strict Transport Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [OWASP HSTS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html)
- [RFC 6797: HSTS Specification](https://tools.ietf.org/html/rfc6797)
- [HSTS Preload List](https://hstspreload.org/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)

## Related Analyzers

- [Cookie Security](/analyzers/security/cookie-security) - Validates secure cookie configuration
- [Debug Mode](/analyzers/security/debug-mode) - Ensures HTTPS in production
- [Environment File Security](/analyzers/security/env-file-security) - Protects HTTPS configuration
- [Session Security](/analyzers/security/session-security) - Validates session configuration
