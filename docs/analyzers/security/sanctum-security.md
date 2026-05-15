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
- Token abilities are enforced via middleware or `tokenCan()` (not just created)
- Stateful domains are explicitly listed (no wildcards)
- SPA middleware is properly configured
- `HasApiTokens` trait is present on the User model
- Token prefix is set for monitoring/identification
- `sanctum:prune-expired` is scheduled when token expiration is configured

## Why It Matters

- **Perpetual Tokens:** Tokens that never expire provide an unlimited window for stolen token abuse
- **Unrestricted Access:** Tokens without abilities can access every API endpoint
- **Decorative Scopes:** Token abilities do nothing without enforcement via `abilities:`/`ability:` middleware or `tokenCan()` checks — scopes without enforcement are purely cosmetic
- **Session Hijacking:** Wildcard stateful domains allow any subdomain to make stateful requests
- **SPA Auth Failure:** Missing `EnsureFrontendRequestsAreStateful` middleware breaks SPA authentication
- **Missing Trait:** Without `HasApiTokens`, `createToken()` and `tokenCan()` are unavailable on the User model
- **Token Bloat:** Expired tokens accumulate in `personal_access_tokens` indefinitely without a pruning schedule, growing the table and slowing lookups

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

**4. Add `HasApiTokens` trait to User model:**

```php
// app/Models/User.php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;
}
```

**5. Enforce token abilities on routes:**

```php
// routes/api.php
Route::middleware(['auth:sanctum', 'abilities:read,write'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
});

// Or check inside a controller:
// $request->user()->tokenCan('read')
```

**6. Set token prefix for log identification:**

```php
// config/sanctum.php
'token_prefix' => env('SANCTUM_TOKEN_PREFIX', 'myapp_'),
```

**7. Schedule expired token pruning:**

```php
// Laravel 9/10 — app/Console/Kernel.php
$schedule->command('sanctum:prune-expired --hours=24')->daily();

// Laravel 11+ — routes/console.php
Schedule::command('sanctum:prune-expired --hours=24')->daily();
```

## References

- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)
- [Laravel Sanctum SPA Authentication](https://laravel.com/docs/sanctum#spa-authentication)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

## Related Analyzers

- [Passport Security](/analyzers/security/passport-security) - Validates Passport OAuth2 configuration
- [Session Timeout](/analyzers/security/session-timeout) - Validates session timeout settings
- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
