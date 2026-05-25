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

Validates Inertia.js shared data exposure and middleware configuration. Inertia bridges server-side Laravel with client-side SPA frameworks — any data placed in shared props is serialized into every page response and visible in the browser's JavaScript context.

**Checks Performed:**

#### Middleware Configuration
- **Missing middleware** — flags when no class extending `Inertia\Middleware` exists in `app/Http/Middleware/`
- **Unregistered middleware** — flags when `HandleInertiaRequests` exists but is not added to the `web` group in `Kernel.php` (Laravel 9/10)

#### Sensitive Keys in `share()`
Flags known credential-related key names in the `share()` method return array: `password`, `secret`, `api_key`, `access_token`, `refresh_token`, `client_secret`, `private_key`, `bearer`, `authorization`, and similar. Session flash reads (values sourced from `$request->session()->get(...)`) are excluded — they are intentional one-time display values.

#### Dangerous Values in `share()`
Flags high-risk expressions regardless of key name: `config('app.key')`, `env('APP_KEY')` and other sensitive env vars, `->bearerToken()`, `->password`, `->remember_token`, `->two_factor_secret`, `->recoveryCodes()`. Null-existence checks such as `$user->password !== null` are excluded — they evaluate to a boolean and expose no field value.

#### Unfiltered User Model
Flags `$request->user()`, `auth()->user()`, or `Auth::user()` shared without field filtering. The full Eloquent model serializes every column, including hashed password and `remember_token`. Filtered forms are safe: `->only([...])`, `->makeHidden([...])`, a wrapping API Resource, or an `instanceof` check (which produces a boolean).

#### CSRF Token Sharing
Flags explicit CSRF token sharing (`'csrf_token'`, `'_token'`, or `'token'` paired with `session()->token()` / `csrf_token()`). Inertia handles CSRF automatically via the `X-XSRF-TOKEN` header.

#### Version Exposure
Flags `version()` methods that return a hardcoded version string or `config('app.version')`. A content hash is a safer alternative.

#### Controller and Provider Shares
Scans `app/Http/Controllers/`, `app/Providers/`, and `app/Livewire/` for the same sensitive-key and dangerous-value patterns in `Inertia::share()`, `Inertia::render()`, the `inertia()` helper, and Inertia v2 APIs (`defer()`, `merge()`, `optional()`, `always()`).

## Why It Matters

- **Data Exposure** — Shared props are serialized into every page response and visible in browser DevTools under the `__page` property
- **Password Leakage** — Sharing the full User model exposes the bcrypt hash of the password and the `remember_token`
- **Render Props** — Props passed to `Inertia::render()` and `inertia()` are also serialized and sent to the browser, not just shared middleware data
- **Global Data Sharing** — `Inertia::share()` in service providers applies to every request, making sensitive data visible on every single page
- **Attack Surface** — Application version strings help attackers find and exploit known CVEs
- **Unnecessary Code** — Manually sharing CSRF tokens duplicates what Inertia does automatically

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
            'user' => $request->user(), // Shares ALL columns including hashed password
        ],
    ]);
}
```

**After (✅) — inline filtering:**
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

**After (✅) — variable assignment then filtered later in the same method:**
```php
public function share(Request $request): array
{
    $user = $request->user(); // assignment is fine as long as $user is filtered below

    return array_merge(parent::share($request), [
        'auth' => [
            'user' => $user?->only(['id', 'name', 'email', 'avatar_url']),
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
            'error'   => fn () => $request->session()->get('error'),
            // Session flash reads are safe — they display a value once and are sourced from the session
            'two_factor_secret' => fn () => $request->session()->get('two_factor_secret'),
        ],
        // Don't share: access_token, api_key, client_secret, or unfiltered models
    ]);
}
```

**3. Use a content hash instead of a version string:**

```php
public function version(Request $request): ?string
{
    return Vite::manifestHash() ?: null;
    // or: md5_file(public_path('build/manifest.json')) ?: null
}
```

**4. Remove redundant CSRF sharing:**

```php
// Remove these — Inertia handles CSRF automatically:
// 'csrf_token' => csrf_token(),
// '_token'     => csrf_token(),
```

**5. Avoid sensitive data in controller render calls and global shares:**

```php
// ❌ Auth token in render props
return Inertia::render('Profile', [
    'access_token' => $user->currentAccessToken(),
]);

// ✅ Share only what the view needs
return Inertia::render('Profile', [
    'user' => $user->only(['id', 'name', 'email']),
]);

// ❌ Existence check using instanceof is safe — evaluates to boolean, not the user object
// (this is NOT flagged — shown here for clarity)
return Inertia::render('Profile/Edit', [
    'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail, // ✅ boolean
    'hasPassword'     => $user->password !== null,                     // ✅ boolean
]);

// ❌ Global share in a service provider with sensitive data
Inertia::share('config', [
    'app_key' => config('app.key'),
]);

// ✅ Share only non-sensitive config
Inertia::share('config', [
    'app_name' => config('app.name'),
    'locale'   => app()->getLocale(),
]);
```

## References

- [Inertia.js Shared Data](https://inertiajs.com/shared-data)
- [Inertia.js CSRF Protection](https://inertiajs.com/csrf-protection)
- [Laravel Inertia Documentation](https://laravel.com/docs/starter-kits#inertia)

## Related Analyzers

- [XSS Vulnerabilities](/analyzers/security/xss-vulnerabilities) - Detects cross-site scripting
- [CSRF Protection](/analyzers/security/csrf-protection) - Validates CSRF configuration
- [Hardcoded Credentials](/analyzers/security/hardcoded-credentials) - Detects hardcoded secrets

---
