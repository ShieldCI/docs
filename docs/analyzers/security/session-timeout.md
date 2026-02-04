---
title: Session Timeout Analyzer
description: Validates session timeout and lifetime configuration to prevent unauthorized access
icon: timer
outline: [2, 3]
tags: session,timeout,lifetime,security,configuration
---

# Session Timeout Analyzer

| Analyzer ID       | Category      | Severity | Time To Fix |
| ----------------- | :-----------: | :------: | ----------: |
| `session-timeout` | 🛡️ Security  | Medium   | 5 minutes   |

## What This Checks

This analyzer validates session timeout and token lifetime configuration across your Laravel application to ensure sessions do not remain active longer than recommended:

- **Session lifetime** - Checks `config/session.php` for `lifetime` values exceeding 120 minutes (2 hours). Supports both direct values and `env()` defaults
- **Expire on close** - Recognizes `expire_on_close => true` as a safe configuration and skips lifetime checks
- **Remember me tokens** - Checks `config/auth.php` for remember token lifetimes exceeding 30 days
- **Sanctum token expiration** - Validates `config/sanctum.php` expiration settings; flags `null` (no expiration) and values exceeding 1 year (525,600 minutes)
- **Passport token expiration** - Validates `config/passport.php` token expiration values exceeding 365 days

**Recommended limits:**

| Context | Maximum Lifetime |
| --- | --- |
| General applications | 120 minutes (2 hours) |
| Sensitive/financial apps | 15 minutes |
| Admin panels | 30 minutes |
| Remember me tokens | 30 days |
| API tokens (Sanctum) | 1 year |
| OAuth tokens (Passport) | 1 year |

::: tip When This Analyzer Runs
This analyzer only runs when a `config/session.php` file exists. It is automatically skipped for applications that do not use session-based authentication.
:::

## Why It Matters

Excessively long session lifetimes increase the window for several attack vectors:

- **Session hijacking** - Longer sessions give attackers more time to steal or use a captured session ID
- **Session fixation** - Extended sessions increase exposure to fixation attacks
- **Unattended device access** - If a user leaves a device unlocked, long sessions allow unauthorized access
- **Compliance violations** - PCI-DSS, HIPAA, and similar standards require session timeout enforcement
- **Stale authentication** - Users who change passwords or have accounts disabled remain logged in

## How to Fix

### Quick Fix

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

### Proper Fix

Configure appropriate timeouts across all authentication mechanisms:

**Session configuration:**
```php
// config/session.php
return [
    // General app: 120 minutes, Sensitive app: 15 minutes
    'lifetime' => env('SESSION_LIFETIME', 120),

    // Optionally expire session when browser closes
    'expire_on_close' => false,
];
```

**Sanctum token expiration:**
```php
// config/sanctum.php
return [
    // Before (❌): no expiration
    // 'expiration' => null,

    // After (✅): tokens expire after 1 year (525600 minutes)
    'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 525600),
];
```

**Passport token expiration:**
```php
// app/Providers/AuthServiceProvider.php
use Laravel\Passport\Passport;

public function boot()
{
    // Before (❌): tokens never expire
    // Passport::tokensExpireIn(now()->addYears(10));

    // After (✅): reasonable token lifetimes
    Passport::tokensExpireIn(now()->addDays(15));
    Passport::refreshTokensExpireIn(now()->addDays(30));
    Passport::personalAccessTokensExpireIn(now()->addMonths(6));
}
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


## References

- [Laravel Session Configuration](https://laravel.com/docs/session#configuration)
- [Laravel Sanctum Token Expiration](https://laravel.com/docs/sanctum#token-expiration)
- [Laravel Passport Token Lifetimes](https://laravel.com/docs/passport#token-lifetimes)
- [OWASP Session Management](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/06-Session_Management_Testing/)
- [CWE-613: Insufficient Session Expiration](https://cwe.mitre.org/data/definitions/613.html)

## Related Analyzers

- [Cookie Analyzer](/analyzers/security/cookie) - Validates cookie security attributes (HttpOnly, Secure, SameSite)
- [CSRF Protection Analyzer](/analyzers/security/csrf-protection) - Ensures CSRF protection is enabled
- [Authentication Authorization Analyzer](/analyzers/security/authentication-authorization) - Validates authentication and authorization configurations

---
