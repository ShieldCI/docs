---
title: Telescope Security Analyzer
description: Validates Laravel Telescope debug tool is properly secured and disabled in production, preventing exposure of sensitive application data
icon: eye
outline: [2, 3]
tags: telescope,debug,authentication,security,production,debugging,data-exposure
pro: true
---

# Telescope Security Analyzer

| Analyzer ID          | Category     | Severity   | Time To Fix  |
| -------------------- | :----------: |:----------:| ------------:|
| `telescope-security` | 🛡️ Security  | Critical   | 10 minutes   |

## What This Checks

Validates that Laravel Telescope is properly secured and cannot leak sensitive data in production. Checks for:

- **`composer.json`**: Telescope in `require` instead of `require-dev` — will be installed in production
- **`composer.json`**: Auto-discovery not disabled (missing `dont-discover` entry) — registered in all environments
- **`config/app.php`**: `TelescopeServiceProvider` listed in providers array — loads in all environments
- **`bootstrap/providers.php`**: `TelescopeServiceProvider` registered unconditionally — loads in all environments
- **`AppServiceProvider`**: Telescope registration without an `environment('local')` guard
- **`TelescopeServiceProvider`**: File missing entirely — no gate or access control in place
- **`TelescopeServiceProvider`**: No `viewTelescope` gate defined — dashboard open to everyone
- **`TelescopeServiceProvider`**: `gate()` method exists but `Gate::define('viewTelescope', ...)` is absent
- **`TelescopeServiceProvider`**: Authorization callback returns hardcoded `true` — anyone can access the dashboard
- **`config/telescope.php`**: `enabled` defaults to `true` — Telescope active when `TELESCOPE_ENABLED` env var is unset
- **`config/telescope.php`**: Middleware only includes `web` — no authentication layer protecting the dashboard
- **`config/telescope.php`**: Default `/telescope` path — predictable and increases exposure risk (Info)
- **Scheduler**: `telescope:prune` not scheduled — `telescope_entries` table grows indefinitely
- **`TelescopeServiceProvider`**: `hideSensitiveRequestDetails()` not called — passwords and tokens may be recorded

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
protected function gate(): void
{
    Gate::define('viewTelescope', function (User $user) {
        return in_array($user->email, [
            'admin@example.com',
        ]);
    });
}
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
