---
title: Cookie Security
description: Validates that Laravel's cookie security configuration properly protects against XSS, CSRF, and man-in-the-middle attacks
icon: lock
outline: [2, 3]
---

# Cookie Security

| Analyzer ID       | Category     | Severity   | Time To Fix  |
| ------------------| :----------: |:----------:| ------------:|
| `cookie-security` | 🛡️ Security  | Critical   | 15 minutes   |

## What This Checks

Validates that Laravel's cookie security configuration properly protects against XSS, CSRF, and man-in-the-middle attacks. Scans session configuration (`config/session.php`) and middleware registration (`app/Http/Kernel.php` or `bootstrap/app.php`) for HttpOnly flag, Secure flag, SameSite attribute, and EncryptCookies middleware to ensure cookies are protected from JavaScript access, transmitted only over HTTPS, defended against cross-site attacks, and encrypted.

## Why It Matters

- **Security Risk:** CRITICAL - Unprotected cookies expose users to session hijacking and account takeover
- **XSS Vulnerability:** Without HttpOnly, attackers use JavaScript to steal session cookies
- **CSRF Attacks:** Weak SameSite protection allows malicious sites to forge authenticated requests
- **Man-in-the-Middle:** Without Secure flag, cookies transmitted over HTTP can be intercepted on public WiFi
- **Cookie Tampering:** Missing encryption allows attackers to read and modify cookie values

Cookie security is your application's first line of defense against common web attacks. Proper configuration prevents:
- Session hijacking through XSS attacks (HttpOnly prevents `document.cookie` access)
- Cross-site request forgery from malicious websites (SameSite blocks cross-origin cookies)
- Network interception on unsecured connections (Secure restricts to HTTPS)
- Cookie value manipulation by attackers (encryption prevents tampering)

Without proper cookie security, a single XSS vulnerability becomes a complete account takeover vector. Public WiFi users are vulnerable to session hijacking, and users can be tricked into performing actions on malicious websites through CSRF attacks.

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: HttpOnly Flag Disabled**

```php
// config/session.php
'http_only' => true,  // Change from false to true
```

**Scenario 2: Secure Flag Disabled**

```php
// config/session.php
'secure' => env('SESSION_SECURE_COOKIE', true),

// .env.production
SESSION_SECURE_COOKIE=true

// .env (local development without HTTPS)
SESSION_SECURE_COOKIE=false
```

**Scenario 3: Weak SameSite Protection**

```php
// config/session.php
'same_site' => 'lax',  // Change from null or 'none' to 'lax'
```

**Scenario 4: EncryptCookies Middleware Missing**

```php
// app/Http/Kernel.php
protected $middleware = [
    \App\Http\Middleware\EncryptCookies::class,  // Uncomment or add
    // ... other middleware
];
```

### Proper Fix (30 minutes)

Implement comprehensive cookie security across your application:

**1. Configure Session Security Settings**

```php
// config/session.php

return [
    /*
    |--------------------------------------------------------------------------
    | HTTP Only Cookies - CRITICAL FOR XSS PROTECTION
    |--------------------------------------------------------------------------
    | Setting to true prevents JavaScript from accessing cookies via document.cookie
    | This protects against XSS attacks stealing session cookies
    */
    'http_only' => true,  // ALWAYS true

    /*
    |--------------------------------------------------------------------------
    | Secure Cookies - REQUIRED FOR HTTPS SITES
    |--------------------------------------------------------------------------
    | Setting to true restricts cookies to HTTPS only
    | Prevents session hijacking on public WiFi and MITM attacks
    */
    'secure' => env('SESSION_SECURE_COOKIE', true),

    /*
    |--------------------------------------------------------------------------
    | SameSite Cookies - CSRF PROTECTION
    |--------------------------------------------------------------------------
    | Options: 'lax', 'strict', 'none', null
    | - 'strict': Maximum CSRF protection (may break OAuth flows)
    | - 'lax': Recommended - balances security and usability
    | - 'none': Requires Secure=true, allows cross-site requests
    | - null: No CSRF protection (not recommended)
    */
    'same_site' => 'lax',  // Recommended default

    'cookie' => env('SESSION_COOKIE', 'laravel_session'),
    'lifetime' => 120,
    'expire_on_close' => false,
    'encrypt' => false,  // Cookies encrypted by EncryptCookies middleware
];
```

**2. Enable EncryptCookies Middleware (Laravel 10 and below)**

```php
// app/Http/Kernel.php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    /**
     * The application's global HTTP middleware stack.
     */
    protected $middleware = [
        // CRITICAL: Must be early in the stack
        \App\Http\Middleware\EncryptCookies::class,

        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
        \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        \App\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ];

    protected $middlewareGroups = [
        'web' => [
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];
}
```

**3. Laravel 11+ Cookie Encryption**

```php
// bootstrap/app.php

<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Cookie encryption enabled by default in Laravel 11
        // Explicitly configure if needed:
        $middleware->encryptCookies(except: [
            // Cookies to exclude from encryption (use sparingly)
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

**4. Configure Cookie Encryption Exceptions**

```php
// app/Http/Middleware/EncryptCookies.php

namespace App\Http\Middleware;

use Illuminate\Cookie\Middleware\EncryptCookies as Middleware;

class EncryptCookies extends Middleware
{
    /**
     * The names of cookies that should not be encrypted.
     *
     * Only exclude cookies that MUST be readable by JavaScript
     * or external services (use very sparingly).
     */
    protected $except = [
        // Example: 'google_analytics_id',
    ];
}
```

**5. Test Cookie Security**

```php
// tests/Feature/CookieSecurityTest.php

namespace Tests\Feature;

use Tests\TestCase;

class CookieSecurityTest extends TestCase
{
    /** @test */
    public function session_cookies_have_http_only_flag()
    {
        $response = $this->get('/');
        $cookie = $response->getCookie(config('session.cookie'));

        $this->assertTrue(
            $cookie->isHttpOnly(),
            'Session cookie must have HttpOnly flag'
        );
    }

    /** @test */
    public function session_cookies_are_secure_in_production()
    {
        if (config('app.env') === 'production') {
            $response = $this->get('/');
            $cookie = $response->getCookie(config('session.cookie'));

            $this->assertTrue(
                $cookie->isSecure(),
                'Session cookie must be Secure in production'
            );
        }

        $this->assertTrue(true);
    }

    /** @test */
    public function session_cookies_have_same_site_protection()
    {
        $sameSite = config('session.same_site');

        $this->assertContains(
            $sameSite,
            ['lax', 'strict'],
            'SameSite must be lax or strict'
        );
    }
}
```

**6. Environment-Specific Configuration**

```php
// config/session.php - Environment-aware configuration
return [
    'http_only' => true,  // Always true

    // Use Secure in production, flexible in local
    'secure' => env('SESSION_SECURE_COOKIE', app()->isProduction()),

    'same_site' => env('SESSION_SAME_SITE', 'lax'),
];

// .env.production
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

// .env (local without HTTPS)
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
```

## Common Mistakes to Avoid

1. **Disabling HttpOnly for no valid reason:**
   ```php
   // ❌ BAD - Allows JavaScript to access cookies
   'http_only' => false,

   // ✅ GOOD - JavaScript cannot access cookies
   'http_only' => true,
   ```

2. **Using Secure=false in production:**
   ```php
   // ❌ BAD - Cookies sent over HTTP (insecure)
   'secure' => false,

   // ✅ GOOD - Cookies only sent over HTTPS
   'secure' => env('SESSION_SECURE_COOKIE', true),
   ```

3. **Setting SameSite to null or 'none':**
   ```php
   // ❌ BAD - No CSRF protection
   'same_site' => null,
   'same_site' => 'none',

   // ✅ GOOD - CSRF protection enabled
   'same_site' => 'lax',    // Recommended
   'same_site' => 'strict',  // Maximum security
   ```

4. **Commenting out EncryptCookies middleware:**
   ```php
   // ❌ BAD - app/Http/Kernel.php
   protected $middleware = [
       // \App\Http\Middleware\EncryptCookies::class,  // Commented!
   ];

   // ✅ GOOD
   protected $middleware = [
       \App\Http\Middleware\EncryptCookies::class,  // Enabled
   ];
   ```

5. **Using SameSite=strict with OAuth:**
   ```php
   // ❌ BAD - Breaks OAuth login flows
   'same_site' => 'strict',  // Too restrictive for OAuth

   // ✅ GOOD - Allows OAuth while maintaining CSRF protection
   'same_site' => 'lax',
   ```

6. **Excluding too many cookies from encryption:**
   ```php
   // ❌ BAD - app/Http/Middleware/EncryptCookies.php
   protected $except = [
       'user_preferences',
       'cart_items',
       'session_data',  // Too many exclusions!
   ];

   // ✅ GOOD - Minimal exclusions
   protected $except = [
       // Only if absolutely necessary
   ];
   ```

## References

- [Laravel Session Documentation](https://laravel.com/docs/session)
- [Laravel Cookie Documentation](https://laravel.com/docs/requests#cookies)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [MDN: Secure Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)

## Related Analyzers

- [CSRF Protection](/analyzers/security/csrf-protection) - Validates CSRF token implementation
- [App Key Security](/analyzers/security/app-key-security) - Ensures encryption keys are secure
- [Session Security](/analyzers/security/session-security) - Validates session configuration
- [HTTPS Enforcement](/analyzers/security/https-enforcement) - Ensures HTTPS is required
