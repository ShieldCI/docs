---
title: Cookie Domain Analyzer
description: Detects unnecessary cookie domain configuration that makes cookies less restrictive and exposes them to subdomain takeover attacks
icon: lock
outline: [2, 3]
tags: cookies,domain,subdomain,security,configuration,session,cookie
pro: true
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
