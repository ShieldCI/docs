---
title: Session Timeout Analyzer
description: Validates session timeout and lifetime configuration to prevent unauthorized access
icon: timer
outline: [2, 3]
tags: session,timeout,lifetime,security,configuration
pro: true
---

# Session Timeout Analyzer

| Analyzer ID       | Category      | Severity | Time To Fix |
| ----------------- | :-----------: | :------: | ----------: |
| `session-timeout` | 🛡️ Security  | Medium   | 5 minutes   |

## What This Checks

This analyzer validates session timeout, cookie security, and lifetime configuration across your Laravel application:

- **Session lifetime** - Checks `config/session.php` for `lifetime` values exceeding 120 minutes (2 hours). Supports both direct values and `env()` defaults
- **Expire on close** - Recognizes `expire_on_close => true` as a mitigating factor — downgrades excessive lifetime issues to Low severity rather than suppressing them, as browser behavior varies
- **Remember me tokens** - Checks `config/auth.php` for custom remember token lifetime keys exceeding 30 days
- **Cookie secure flag** - Flags `secure => false`; High severity. Cookie sent over unencrypted HTTP in production
- **Cookie HttpOnly flag** - Flags `http_only => false`; Medium severity. JavaScript can read the session cookie (XSS risk)
- **Cookie SameSite attribute** - Flags `same_site => 'none'` without `secure => true` (browser-rejected); High severity. Flags `same_site => 'none'` alone (cross-origin exposure); Medium severity
- **Session driver** - Flags `driver => 'cookie'` (client-side session storage); Medium severity

**Recommended limits:**

| Context | Maximum Lifetime |
| --- | --- |
| General applications | 120 minutes (2 hours) |
| Sensitive/financial apps | 15 minutes |
| Admin panels | 30 minutes |
| Remember me tokens | 30 days |

## Why It Matters

Excessively long session lifetimes increase the window for several attack vectors:

- **Session hijacking** - Longer sessions give attackers more time to steal or use a captured session ID
- **Session fixation** - Extended sessions increase exposure to fixation attacks
- **Unattended device access** - If a user leaves a device unlocked, long sessions allow unauthorized access
- **Compliance violations** - PCI-DSS, HIPAA, and similar standards require session timeout enforcement
- **Stale authentication** - Users who change passwords or have accounts disabled remain logged in

## How to Fix

### Quick Fix (2 minutes)

Update session lifetime in `config/session.php`:

**Before (❌):**
```php
// config/session.php
return [
    // 24 hours - excessively long
    'lifetime' => env('SESSION_LIFETIME', 1440),

    'expire_on_close' => false,
];
```

**After (✅):**
```php
// config/session.php
return [
    // 2 hours - appropriate for general applications
    'lifetime' => env('SESSION_LIFETIME', 120),

    'expire_on_close' => false,
];
```

### Proper Fix (5 minutes)

Configure appropriate session lifetime and cookie security:

**Session configuration:**
```php
// config/session.php
return [
    // General app: 120 minutes, Sensitive app: 15 minutes
    'lifetime' => env('SESSION_LIFETIME', 120),

    'expire_on_close' => false,

    // Cookie security
    'secure' => env('SESSION_SECURE_COOKIE', true),
    'http_only' => true,
    'same_site' => 'lax',
];
```

**Environment-specific session lifetime:**
```ini
# .env (production - general app)
SESSION_LIFETIME=120

# .env (production - financial app)
SESSION_LIFETIME=15

# .env (local development)
SESSION_LIFETIME=480
```

::: tip Sanctum and Passport token expiration
Sanctum and Passport token lifetimes are validated by their dedicated analyzers: [Sanctum Security](/analyzers/security/sanctum-security) and [Passport Security](/analyzers/security/passport-security).
:::


## References

- [Laravel Session Configuration](https://laravel.com/docs/session#configuration)
- [OWASP Session Management](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/06-Session_Management_Testing/)
- [OWASP Secure Cookie Attributes](https://owasp.org/www-community/controls/SecureCookieAttribute)
- [CWE-613: Insufficient Session Expiration](https://cwe.mitre.org/data/definitions/613.html)

## Related Analyzers

- [Cookie Analyzer](/analyzers/security/cookie) - Validates cookie security attributes (HttpOnly, Secure, SameSite)
- [CSRF Protection Analyzer](/analyzers/security/csrf-protection) - Ensures CSRF protection is enabled
- [Authentication Authorization Analyzer](/analyzers/security/authentication-authorization) - Validates authentication and authorization configurations

---
