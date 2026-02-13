---
title: Sanctum Security Analyzer
description: Validates Laravel Sanctum token configuration, expiration settings, and SPA middleware setup
icon: lock
outline: [2, 3]
tags: security,sanctum,authentication,tokens,api
pro: true
---

# Sanctum Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `sanctum-security` | 🛡️ Security  | High    | 10 minutes   |

## What This Checks

Validates Laravel Sanctum token configuration. Checks for:

- Token expiration is configured (not `null` — tokens never expire)
- Token creation uses explicit abilities/scopes
- Stateful domains are explicitly listed (no wildcards)
- SPA middleware is properly configured
- Token prefix is set for monitoring/identification

## Why It Matters

- **Perpetual Tokens:** Tokens that never expire provide an unlimited window for stolen token abuse
- **Unrestricted Access:** Tokens without abilities can access every API endpoint
- **Session Hijacking:** Wildcard stateful domains allow any subdomain to make stateful requests
- **SPA Auth Failure:** Missing `EnsureFrontendRequestsAreStateful` middleware breaks SPA authentication

## How to Fix

### Quick Fix (5 minutes)

Set token expiration:

```php
// config/sanctum.php
'expiration' => 60 * 24, // 24 hours in minutes
```

### Proper Fix (10 minutes)

**1. Configure stateful domains:**

```php
// config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS',
    'app.example.com,admin.example.com,localhost:3000'
)),
```

**2. Create tokens with explicit abilities:**

```php
// Instead of unrestricted tokens:
// $token = $user->createToken('api-token');

// Use scoped abilities:
$token = $user->createToken('api-token', [
    'read:profile',
    'update:profile',
    'read:orders',
]);
```

**3. Add SPA middleware:**

```php
// app/Http/Kernel.php
'api' => [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    \Illuminate\Routing\Middleware\ThrottleRequests::class . ':api',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
```

**4. Set token prefix for log identification:**

```php
// config/sanctum.php
'token_prefix' => env('SANCTUM_TOKEN_PREFIX', 'myapp_'),
```

## References

- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)
- [Laravel Sanctum SPA Authentication](https://laravel.com/docs/sanctum#spa-authentication)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

## Related Analyzers

- [Passport Security](/analyzers/security/passport-security) - Validates Passport OAuth2 configuration
- [Session Timeout](/analyzers/security/session-timeout) - Validates session timeout settings
- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
