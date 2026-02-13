---
title: Inertia Security Analyzer
description: Validates Inertia.js shared data exposure and middleware configuration to prevent sensitive data leakage
icon: lock
outline: [2, 3]
tags: security,inertia,shared-data,middleware,frontend
pro: true
---

# Inertia Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `inertia-security` | 🛡️ Security  | Medium    | 10 minutes   |

## What This Checks

Validates Inertia.js shared data exposure and middleware configuration. Checks for:

- Sensitive data in shared props (passwords, tokens, secrets, API keys)
- Missing `HandleInertiaRequests` middleware
- Unfiltered user model in shared data (exposes hashed password, `remember_token`)
- Redundant CSRF token sharing (Inertia handles this automatically)
- Application version exposure in `version()` method

## Why It Matters

- **Data Exposure:** Shared props are serialized into every page response and visible in browser DevTools
- **Password Leakage:** Sharing the full User model exposes the hashed password and remember_token
- **Attack Surface:** Application version exposure helps attackers target known vulnerabilities
- **Unnecessary Code:** Manually sharing CSRF tokens duplicates what Inertia does automatically

## How to Fix

### Quick Fix (5 minutes)

Filter shared user data:

**Before (❌):**
```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        'auth' => [
            'user' => $request->user(), // Shares ALL user fields!
        ],
    ]);
}
```

**After (✅):**
```php
public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        'auth' => [
            'user' => $request->user()?->only(['id', 'name', 'email', 'avatar']),
        ],
    ]);
}
```

### Proper Fix (10 minutes)

**1. Create HandleInertiaRequests middleware if missing:**

```bash
php artisan inertia:middleware
```

**2. Remove sensitive data from shared props:**

```php
public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        'auth' => [
            'user' => $request->user()?->only(['id', 'name', 'email']),
        ],
        'flash' => [
            'success' => fn () => $request->session()->get('success'),
            'error' => fn () => $request->session()->get('error'),
        ],
        // Don't share: tokens, secrets, API keys, or full models
    ]);
}
```

**3. Use a content hash instead of version string:**

```php
public function version(Request $request): ?string
{
    return md5_file(public_path('mix-manifest.json')) ?: null;
}
```

**4. Remove redundant CSRF sharing:**

```php
// Remove this - Inertia handles CSRF automatically:
// 'csrf_token' => csrf_token(),
```

## References

- [Inertia.js Shared Data](https://inertiajs.com/shared-data)
- [Inertia.js CSRF Protection](https://inertiajs.com/csrf-protection)
- [Laravel Inertia Documentation](https://laravel.com/docs/starter-kits#inertia)

## Related Analyzers

- [XSS Vulnerabilities](/analyzers/security/xss-vulnerabilities) - Detects cross-site scripting
- [CSRF Protection](/analyzers/security/csrf-protection) - Validates CSRF configuration
- [Hardcoded Credentials](/analyzers/security/hardcoded-credentials) - Detects hardcoded secrets
