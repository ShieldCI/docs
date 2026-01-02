---
title: Cookie Domain Analyzer
description: Detects unnecessary cookie domain configuration that makes cookies less restrictive and exposes them to subdomain takeover attacks
icon: lock
outline: [2, 3]
tags: cookies,domain,subdomain,security,configuration,session
---

# Cookie Domain Analyzer

| Analyzer ID       | Category     | Severity   | Time To Fix  |
| ------------------| :----------: |:----------:| ------------:|
| `cookie-domain` | 🛡️ Security  | Low   | 1 minute   |

## What This Checks

Validates that the `session.domain` configuration is only set when your application actually uses subdomain routing. Scans your session configuration (`config/session.php`) and route definitions to detect if a cookie domain attribute is unnecessarily configured.

**Key Detection:**
- Checks if `session.domain` is set in configuration
- Analyzes route definitions for subdomain routing patterns
- Flags unnecessary domain configuration when no subdomain routes exist

## Why It Matters

Setting a domain attribute on cookies when not using subdomain routing is actually **LESS restrictive** than omitting it, because subdomains are always included when this attribute is specified.

**The Counterintuitive Truth:**

```php
// ❌ LESS SECURE (when not using subdomains)
'domain' => '.example.com'
// Cookies work on: example.com, api.example.com, admin.example.com, ANY.example.com

// ✅ MORE SECURE (default behavior)
'domain' => null
// Cookies only work on: example.com (exact domain only)
```

**Security Risks:**

- **Subdomain Takeover:** Cookies exposed to all subdomains, including abandoned or compromised ones
- **Unintended Cookie Sharing:** Session cookies accessible by unrelated services on subdomains
- **Expanded Attack Surface:** More entry points for session hijacking attacks
- **Third-Party Subdomain Risk:** If you use third-party services on subdomains, they can access your cookies

**Real-World Attack Scenario:**

1. Your app runs on `example.com` with `domain => '.example.com'`
2. You previously used `old-feature.example.com` but abandoned it
3. Attacker takes over the abandoned subdomain DNS
4. Attacker can now read/write cookies for your main application
5. Result: Session hijacking, account takeover

## How to Fix

### Quick Fix (1 minute)

**Remove the domain configuration entirely:**

```php
// config/session.php - BEFORE
return [
    'domain' => '.example.com',  // ❌ Remove this line
    'path' => '/',
    'http_only' => true,
];

// config/session.php - AFTER
return [
    // 'domain' => null,  // ✅ Omit entirely or set to null
    'path' => '/',
    'http_only' => true,
];
```

**Or explicitly set to null:**

```php
// config/session.php
return [
    'domain' => null,  // ✅ Explicit null = secure default
    'path' => '/',
    'http_only' => true,
];
```

### When Domain Configuration IS Appropriate

**Only set `session.domain` when you have legitimate subdomain routing:**

```php
// routes/web.php - Example: Subdomain routing in use

Route::domain('admin.example.com')->group(function () {
    Route::get('/', [AdminController::class, 'index']);
});

Route::domain('api.example.com')->group(function () {
    Route::get('/users', [ApiController::class, 'users']);
});

// config/session.php - Domain configuration is APPROPRIATE here
return [
    'domain' => '.example.com',  // ✅ Needed for cross-subdomain sessions
    'path' => '/',
    'http_only' => true,
];
```

**Use Cases for Cookie Domain:**

1. **Multi-tenant applications** with subdomain routing (`tenant1.app.com`, `tenant2.app.com`)
2. **Shared authentication** across subdomains (`app.example.com` ↔ `admin.example.com`)
3. **API and frontend** on separate subdomains sharing sessions (`api.example.com` ↔ `app.example.com`)

### Best Practice Configuration

**For single-domain applications:**

```php
// config/session.php - Single domain (example.com only)
return [
    'driver' => env('SESSION_DRIVER', 'file'),
    'lifetime' => 120,
    'expire_on_close' => false,
    'encrypt' => false,
    'files' => storage_path('framework/sessions'),
    'connection' => null,
    'table' => 'sessions',
    'store' => null,
    'lottery' => [2, 100],
    'cookie' => env('SESSION_COOKIE', 'laravel_session'),
    'path' => '/',

    // ✅ Domain omitted - cookies restricted to exact domain
    // 'domain' => null,

    'secure' => env('SESSION_SECURE_COOKIE', true),
    'http_only' => true,
    'same_site' => 'lax',
];
```

**For multi-subdomain applications:**

```php
// config/session.php - Multi-subdomain architecture
return [
    'cookie' => env('SESSION_COOKIE', 'laravel_session'),
    'path' => '/',

    // ✅ Domain set for legitimate subdomain routing
    'domain' => env('SESSION_DOMAIN', '.example.com'),

    'secure' => env('SESSION_SECURE_COOKIE', true),
    'http_only' => true,
    'same_site' => 'lax',
];

// .env - Production with subdomains
SESSION_DOMAIN=.example.com

// .env - Local/Development
SESSION_DOMAIN=null
```

## Common Mistakes to Avoid

### Mistake 1: Copying Configuration Without Understanding

```php
// ❌ BAD: Copied from another project with subdomain routing
'domain' => '.example.com',  // Do you actually need this?

// ✅ GOOD: Only set if you use subdomain routing
'domain' => null,
```

**Why it's wrong:** Many developers copy session configuration from tutorials or other projects that use subdomain routing, unnecessarily exposing their cookies.

### Mistake 2: Setting Domain for "Future Subdomain Plans"

```php
// ❌ BAD: "We might add subdomains later"
'domain' => '.example.com',

// ✅ GOOD: Configure when you actually implement subdomains
'domain' => null,
```

**Why it's wrong:** Don't expand your attack surface for hypothetical future features. Add the domain configuration when you actually implement subdomain routing.

### Mistake 3: Using Domain for www Subdomain

```php
// ❌ UNNECESSARY: Trying to share cookies between example.com and www.example.com
'domain' => '.example.com',

// ✅ BETTER: Configure proper redirect
// In your web server config (nginx/apache)
// Redirect www.example.com → example.com

// Or use Laravel middleware:
if (request()->getHost() === 'www.example.com') {
    return redirect('https://example.com' . request()->getRequestUri(), 301);
}
```

**Why it's wrong:** Instead of exposing cookies to all subdomains, configure your web server to redirect `www` to the canonical domain.

### Mistake 4: Confusing Domain with CORS

```php
// ❌ WRONG: Thinking domain helps with CORS
'domain' => '.example.com',  // This doesn't solve CORS issues

// ✅ CORRECT: Use proper CORS configuration
// config/cors.php
return [
    'paths' => ['api/*'],
    'allowed_origins' => ['https://frontend.example.com'],
    'allowed_methods' => ['*'],
    'allowed_headers' => ['*'],
    'supports_credentials' => true,
];
```

**Why it's wrong:** Cookie domain and CORS are different security mechanisms. Use Laravel's CORS configuration for cross-origin requests.

## How Subdomain Detection Works

The analyzer checks your route definitions for subdomain routing patterns:

```php
// The analyzer looks for routes with domain constraints

// Single domain - No subdomain routing
Route::get('/', [HomeController::class, 'index']);
Route::get('/about', [AboutController::class, 'index']);
// Result: session.domain should be null

// Multiple subdomains - Subdomain routing detected
Route::domain('admin.{tenant}.example.com')->group(function () {
    Route::get('/', [AdminController::class, 'index']);
});

Route::domain('api.{tenant}.example.com')->group(function () {
    Route::get('/users', [ApiController::class, 'users']);
});
// Result: session.domain = '.example.com' is appropriate
```

**Detection Logic:**

1. ✅ **Pass:** `session.domain` is `null` (secure default)
2. ✅ **Pass:** `session.domain` is set AND 2+ unique route domains exist
3. ❌ **Fail:** `session.domain` is set BUT no subdomain routes exist

## Testing Your Configuration

**Test 1: Verify Cookie Scope**

```php
// tests/Feature/CookieDomainTest.php

namespace Tests\Feature;

use Tests\TestCase;

class CookieDomainTest extends TestCase
{
    /** @test */
    public function session_domain_is_null_without_subdomain_routing()
    {
        // If you don't use subdomain routing
        $this->assertNull(
            config('session.domain'),
            'session.domain should be null when not using subdomain routing'
        );
    }

    /** @test */
    public function session_domain_is_set_with_subdomain_routing()
    {
        // If you DO use subdomain routing
        $this->assertEquals(
            '.example.com',
            config('session.domain'),
            'session.domain should match your root domain for subdomain routing'
        );
    }

    /** @test */
    public function cookies_are_not_accessible_from_subdomains()
    {
        // Test that cookies don't leak to unintended subdomains
        $response = $this->get('/');
        $cookie = $response->getCookie(config('session.cookie'));

        if (is_null(config('session.domain'))) {
            // Cookie should only work on exact domain
            $this->assertStringNotContainsString(
                '.',
                $cookie->getDomain() ?? ''
            );
        }
    }
}
```

**Test 2: Manual Browser Testing**

```bash
# 1. Visit your application
https://example.com

# 2. Open browser DevTools → Application/Storage → Cookies

# 3. Check the Domain column for your session cookie:
# ✅ GOOD: Domain is empty or "example.com" (exact domain)
# ❌ BAD: Domain is ".example.com" (includes all subdomains)

# 4. If you see ".example.com" and don't use subdomains:
#    → Remove session.domain from config/session.php
#    → Clear cookies and reload
#    → Verify Domain is now exact match
```

## Environment-Specific Configuration

**Use environment variables for flexibility:**

```php
// config/session.php
return [
    'domain' => env('SESSION_DOMAIN', null),  // Default to null
    'path' => '/',
    'http_only' => true,
];

// .env - Production WITHOUT subdomains
SESSION_DOMAIN=null

// .env - Production WITH subdomains
SESSION_DOMAIN=.example.com

// .env - Local development
SESSION_DOMAIN=null
```

## Security Checklist

Before deploying, verify:

- ✅ `session.domain` is `null` if you don't use subdomain routing
- ✅ `session.domain` is only set when you have legitimate subdomain routes
- ✅ You don't have abandoned subdomains that could be taken over
- ✅ Third-party services on your subdomains don't need your cookies
- ✅ You're not setting domain just for `www` subdomain (use redirects instead)
- ✅ Your CORS configuration is separate from cookie domain

## Migration Guide

**If you currently have `session.domain` set unnecessarily:**

```bash
# 1. Update configuration
# config/session.php
- 'domain' => '.example.com',
+ 'domain' => null,

# 2. Deploy the change
git add config/session.php
git commit -m "Remove unnecessary session.domain configuration"
git push

# 3. Clear application cache
php artisan config:cache

# 4. Notify users to clear cookies (optional)
# Existing sessions will work, but new sessions will have correct scope
```

**No user impact:** Existing sessions continue to work. New sessions created after deployment will have the correct, more restrictive cookie scope.

## Advanced: When to Use Subdomain Wildcard

**Wildcard subdomain routing requires domain configuration:**

```php
// routes/web.php - Wildcard subdomain routing
Route::domain('{tenant}.example.com')->group(function () {
    Route::get('/', [TenantController::class, 'index']);
});

// config/session.php - Domain IS needed here
return [
    'domain' => '.example.com',  // ✅ Required for tenant1.example.com, tenant2.example.com, etc.
];
```

**Alternative: Tenant-Specific Subdomains**

```php
// routes/web.php - Specific subdomain routing
Route::domain('tenant1.example.com')->group(function () {
    // Tenant 1 routes
});

Route::domain('tenant2.example.com')->group(function () {
    // Tenant 2 routes
});

// config/session.php - Domain IS needed for cross-tenant features
return [
    'domain' => '.example.com',  // ✅ Appropriate for multi-tenant architecture
];
```

## Performance Impact

**No performance impact from this configuration:**

- Cookie domain is set once during session creation
- No runtime overhead from omitting domain attribute
- Browser cookie storage is equally efficient either way

**Security vs. Convenience:**

```php
// More Secure (recommended)
'domain' => null,  // Cookies isolated to exact domain

// More Convenient (only if needed)
'domain' => '.example.com',  // Cookies shared across subdomains
```

Choose security unless you have a specific technical requirement for subdomain cookie sharing.

## References

- [Laravel Session Configuration](https://laravel.com/docs/session#configuration)
- [MDN: Set-Cookie Domain Attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#domaindomain-value)
- [OWASP Session Management: Domain and Path Attributes](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#domain-and-path-attributes)
- [RFC 6265: HTTP State Management Mechanism](https://datatracker.ietf.org/doc/html/rfc6265#section-4.1.2.3)
- [Subdomain Takeover Attacks](https://owasp.org/www-community/attacks/Subdomain_Takeover)

## Related Analyzers

- [Cookie Analyzer](/analyzers/security/cookie) - Validates cookie encryption and security flags
- [CSRF Protection Analyzer](/analyzers/security/csrf-protection) - Validates CSRF token implementation
- [Session Driver Configuration Analyzer](/analyzers/performance/session-driver) - Validates session driver for scalability
- [Authentication & Authorization Analyzer](/analyzers/security/authentication-authorization) - Validates route protection
