---
title: Sanctum Security Analyzer
description: Validates Laravel Sanctum token configuration, abilities, and security settings
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

Validates Laravel Sanctum token configuration and security. Checks for:

- Sanctum config file is published (allows customising all Sanctum settings)
- Token creation uses explicit abilities/scopes
- Token abilities are enforced via middleware or `tokenCan()` (not just created)
- Stateful domains are explicitly listed — no wildcards
- `HasApiTokens` trait is present on the User model
- Token prefix is set for monitoring and log identification
- `sanctum:prune-expired` is scheduled when token expiration is configured

::: info Token expiration
Token expiration value is intentionally **not** checked. `null` (never expire) is the Sanctum default and the correct setting for long-lived CI/CD API keys and service tokens. Expiration is a business decision that depends on how the tokens are used — user-session tokens versus permanent integration keys — which cannot be determined by static analysis.
:::

::: info SPA middleware
`EnsureFrontendRequestsAreStateful` is **not** required and its absence is not flagged. SPA cookie-based authentication is an opt-in architectural pattern. Pure bearer-token APIs (CI/CD integrations, mobile backends) correctly omit this middleware; adding it to those apps would boot the session pipeline unnecessarily on every API request.
:::

## Why It Matters

- **Unrestricted Token Access:** Tokens without abilities can access every API endpoint regardless of what the token was issued for
- **Decorative Scopes:** Token abilities do nothing without enforcement via `abilities:`/`ability:` middleware or `tokenCan()` — scopes without enforcement are purely cosmetic
- **Session Hijacking:** Wildcard stateful domains allow any origin to make stateful requests
- **Missing Trait:** Without `HasApiTokens`, `createToken()` and `tokenCan()` are unavailable on the User model
- **Token Bloat:** Expired tokens accumulate in `personal_access_tokens` indefinitely without a pruning schedule, slowing lookups over time

## How to Fix

### Quick Fix (5 minutes)

Publish the Sanctum config and add `HasApiTokens` to your User model:

```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

```php
// app/Models/User.php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;
}
```

### Proper Fix (10 minutes)

**1. Create tokens with explicit abilities:**

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

**2. Enforce abilities on routes:**

```php
// routes/api.php
Route::middleware(['auth:sanctum', 'abilities:read,write'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
});
```

Or check inside a controller:

```php
if (! $request->user()->tokenCan('read')) {
    abort(403);
}
```

**3. Configure stateful domains (no wildcards):**

```php
// config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS',
    'app.example.com,localhost:3000'
)),
```

**4. Set a token prefix for log identification:**

```php
// config/sanctum.php
'token_prefix' => env('SANCTUM_TOKEN_PREFIX', 'myapp_'),
```

**5. Schedule expired token pruning** (only needed when token expiration is configured):

::: code-group
```php [Laravel 9/10]
// app/Console/Kernel.php
$schedule->command('sanctum:prune-expired --hours=24')->daily();
```

```php [Laravel 11/12 — console.php]
// routes/console.php
Schedule::command('sanctum:prune-expired --hours=24')->daily();
```

```php [Laravel 11/12 — bootstrap/app.php]
->withSchedule(function (Schedule $schedule): void {
    $schedule->command('sanctum:prune-expired --hours=24')->daily();
})
```
:::

## References

- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)
- [Laravel Sanctum SPA Authentication](https://laravel.com/docs/sanctum#spa-authentication)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

## Related Analyzers

- [Passport Security](/analyzers/security/passport-security) - Validates Passport OAuth2 configuration
- [Session Timeout](/analyzers/security/session-timeout) - Validates session timeout settings
- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
