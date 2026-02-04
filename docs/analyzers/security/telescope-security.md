---
title: Telescope Security Analyzer
description: Validates Laravel Telescope debug tool is properly secured and disabled in production, preventing exposure of sensitive application data
icon: eye
outline: [2, 3]
tags: telescope,debug,authentication,security,production
---

# Telescope Security Analyzer

| Analyzer ID          | Category     | Severity   | Time To Fix  |
| -------------------- | :----------: |:----------:| ------------:|
| `telescope-security` | 🛡️ Security  | Critical   | 10 minutes   |

## What This Checks

This analyzer validates that Laravel Telescope, a powerful debugging and profiling tool, is properly secured so it cannot leak sensitive data in production environments.

**Detected Vulnerable Patterns:**

#### Production Usage (1)
- Telescope in `require` instead of `require-dev` in `composer.json` -- will be installed in production

#### Service Provider Registration (3)
- Telescope package auto-discovery enabled (not in `dont-discover` array)
- `TelescopeServiceProvider` registered in `config/app.php` (loads in all environments)
- Telescope registered in `AppServiceProvider` without environment check

#### Authorization Issues (3)
- Missing `TelescopeServiceProvider` entirely -- dashboard may be publicly accessible
- No `Telescope::auth()` gate configured -- dashboard is open to everyone
- `Telescope::auth()` returns hardcoded `true` -- bypasses authorization

#### Environment Checks (1)
- No environment checks (`isLocal()`, `isProduction()`) -- Telescope may run in production

#### Configuration Issues (3)
- `enabled` config defaults to `true` -- Telescope active when env var is missing
- Middleware only includes `web` without `auth` -- missing authentication layer
- Predictable `/telescope` path increases exposure risk (Info level)

#### Domain Security (2)
- Telescope domain set to `null` -- shares cookies with main application (session hijacking risk)
- Session cookies shared between main app and Telescope subdomain

::: tip What's NOT Flagged
The analyzer correctly recognizes these as **safe**:
- Telescope in `require-dev` with auto-discovery disabled
- `Telescope::auth()` with proper user validation
- `Telescope::night()` as a safe alternative (only shows in local)
- Environment-gated registration with `isLocal()` checks
- `'enabled' => env('TELESCOPE_ENABLED', false)` (defaults to disabled)
:::

## Why It Matters

Laravel Telescope records extensive debugging data that, if exposed in production, can leak:

- **API Keys and Tokens** - Authentication tokens visible in request/response details
- **User Passwords** - Form data including password fields in request recordings
- **Personal Data** - User PII exposed through query and request recordings
- **Business Logic** - Internal application structure and trade secrets revealed
- **Database Queries** - Sensitive data visible in recorded SQL queries
- **Mail Content** - Email contents including password resets and verification links
- **Exception Details** - Stack traces revealing application vulnerabilities
- **Authorization Attempts** - Gate check details exposing security architecture

A publicly accessible Telescope dashboard gives attackers a complete map of your application's internals.

## How to Fix

### Quick Fix (10 minutes)

Move Telescope to dev dependencies and disable in production:

**Before (❌):**
```json
{
    "require": {
        "laravel/telescope": "^5.0"
    }
}
```

**After (✅):**
```json
{
    "require-dev": {
        "laravel/telescope": "^5.0"
    },
    "extra": {
        "laravel": {
            "dont-discover": [
                "laravel/telescope"
            ]
        }
    }
}
```

Set your production `.env`:
```env
TELESCOPE_ENABLED=false
```

Set config default to `false`:
```php
// config/telescope.php
'enabled' => env('TELESCOPE_ENABLED', false),
```

### Proper Fix (15 minutes)

**Conditionally register Telescope in AppServiceProvider:**

**Before (❌):**
```php
// config/app.php
'providers' => [
    // ...
    App\Providers\TelescopeServiceProvider::class, // Loads in ALL environments!
],
```

**After (✅):**
```php
// app/Providers/AppServiceProvider.php
public function register(): void
{
    if ($this->app->environment('local')) {
        $this->app->register(\App\Providers\TelescopeServiceProvider::class);
    }
}
```

**Configure proper authorization gate:**

**Before (❌):**
```php
// app/Providers/TelescopeServiceProvider.php
protected function gate(): void
{
    Gate::define('viewTelescope', function ($user) {
        return true; // Anyone can access!
    });
}
```

**After (✅):**
```php
// app/Providers/TelescopeServiceProvider.php
public function boot(): void
{
    parent::boot();

    Telescope::auth(function (Request $request) {
        return app()->environment('local')
            || $request->user()?->isAdmin() ?? false;
    });
}
```

**Best Practice: Separate Domain for Telescope (✅✅):**

```php
// config/telescope.php
'domain' => env('TELESCOPE_DOMAIN', null),
'path' => 'telescope',
'middleware' => ['web', 'auth'],
```

```env
# .env.local
TELESCOPE_ENABLED=true
TELESCOPE_DOMAIN=telescope.myapp.test
```


## References

- [Laravel Telescope Documentation](https://laravel.com/docs/telescope)
- [Laravel Telescope Authorization](https://laravel.com/docs/telescope#dashboard-authorization)
- [OWASP Sensitive Data Exposure](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)
- [CWE-200: Exposure of Sensitive Information](https://cwe.mitre.org/data/definitions/200.html)
- [CWE-215: Insertion of Sensitive Information Into Debugging Code](https://cwe.mitre.org/data/definitions/215.html)

## Related Analyzers

- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Detects debug mode enabled in production
- [Env File Analyzer](/analyzers/security/env-file) - Checks environment file security
- [Authentication Authorization Analyzer](/analyzers/security/authentication-authorization) - Validates authentication patterns
- [Cookie Analyzer](/analyzers/security/cookie) - Checks cookie security configuration
- [Cookie Domain Analyzer](/analyzers/security/cookie-domain) - Validates cookie domain settings

---
