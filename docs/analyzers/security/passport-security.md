---
title: Passport Security Analyzer
description: Validates Laravel Passport OAuth2 configuration, token lifetimes, encryption keys, and security settings
icon: lock
outline: [2, 3]
tags: security,passport,oauth,authentication,tokens
pro: true
---

# Passport Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `passport-security` | 🛡️ Security  | High    | 15 minutes   |

## What This Checks

Validates Laravel Passport OAuth2 configuration. Checks for:

- Token lifetimes are configured and not overly long (default is 1 year)
- PKCE is enforced via hashed client secrets
- OAuth encryption keys exist with proper permissions
- Scopes are defined via `Passport::tokensCan()`
- Expired token pruning is scheduled

## Why It Matters

- **Long-Lived Tokens:** Default 1-year access tokens provide an extended window for token theft
- **Key Exposure:** OAuth private keys with world-readable permissions allow token forgery
- **Unlimited Scopes:** Without defined scopes, any token can access all API endpoints
- **Database Bloat:** Without pruning, expired tokens accumulate and slow queries

## How to Fix

### Quick Fix (5 minutes)

Set reasonable token lifetimes:

```php
// app/Providers/AuthServiceProvider.php
public function boot(): void
{
    Passport::tokensExpireIn(now()->addDays(15));
    Passport::refreshTokensExpireIn(now()->addDays(30));
    Passport::personalAccessTokensExpireIn(now()->addMonths(6));
}
```

### Proper Fix (15 minutes)

**1. Define API scopes:**

```php
Passport::tokensCan([
    'read-profile' => 'Read user profile',
    'update-profile' => 'Update user profile',
    'manage-orders' => 'Create and manage orders',
    'admin' => 'Full administrative access',
]);

Passport::setDefaultScope(['read-profile']);
```

**2. Enable PKCE with hashed client secrets:**

```php
Passport::hashClientSecrets();
```

**3. Generate and secure OAuth keys:**

```bash
php artisan passport:keys
chmod 600 storage/oauth-private.key
chmod 644 storage/oauth-public.key
```

**4. Schedule token pruning:**

```php
// routes/console.php (Laravel 11+)
Schedule::command('passport:purge')->daily();
```

## References

- [Laravel Passport Documentation](https://laravel.com/docs/passport)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OWASP OAuth Security](https://cheatsheetseries.owasp.org/cheatsheets/OAuth_Cheat_Sheet.html)

## Related Analyzers

- [Sanctum Security](/analyzers/security/sanctum-security) - Validates Sanctum token configuration
- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
- [Session Timeout](/analyzers/security/session-timeout) - Validates session timeout settings
