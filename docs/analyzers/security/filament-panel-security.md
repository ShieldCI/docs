---
title: Filament Panel Security Analyzer
description: Validates Filament admin panel security including authentication, middleware, and access restrictions
icon: lock
outline: [2, 3]
tags: security,filament,authentication,admin,panel
pro: true
---

# Filament Panel Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `filament-panel-security` | 🛡️ Security  | High    | 10 minutes   |

## What This Checks

Validates Filament admin panel security configuration. Checks for:

- Panel provider exists in `app/Providers/Filament/` or `app/Providers/`
- Authentication middleware is configured (`Authenticate::class` or the `auth` alias, in `->authMiddleware()` or `->middleware()`)
- Login page is enabled (`->login()`)
- Public registration on admin/staff panels (`->registration()` on privileged surfaces)
- Registration without email verification (`->emailVerification()` absent)
- Revealable passwords enabled (`->revealablePasswords()`)
- No model implements `FilamentUser`: any authenticated user can access all panels
- `canAccessPanel()` returns `true`, or only checks that someone is signed in: implementing the interface restricts nobody

## Why It Matters

- **Public Admin Access:** Without auth middleware, anyone can access your admin panel
- **Rubber-Stamp Access:** `canAccessPanel()` returning `true`, or only calling `auth()->check()`, reads as an access decision while admitting every registered user. When several panels share one guard it is the only thing separating them
- **Missing Login:** Panels without login pages may be accessible to unauthenticated users
- **Unrestricted Panel Access:** Without `FilamentUser::canAccessPanel()`, all authenticated users reach all panels regardless of role
- **Admin Self-Registration:** Allowing self-signup on admin panels lets untrusted users create privileged accounts
- **Unverified Accounts:** Registration without email verification allows throwaway accounts to access protected resources
- **Credential Exposure:** Revealable passwords increase risk via shoulder surfing or screen recording
- **Data Exposure:** Admin panels expose sensitive data, user records, and configuration options

## How to Fix

### Quick Fix (5 minutes)

Add authentication middleware to your panel:

```php
// app/Providers/Filament/AdminPanelProvider.php
public function panel(Panel $panel): Panel
{
    return $panel
        ->default()
        ->id('admin')
        ->path('admin')
        ->login()
        ->authMiddleware([
            Authenticate::class,
        ]);
}
```

### Proper Fix (10 minutes)

**1. Configure complete panel security:**

```php
public function panel(Panel $panel): Panel
{
    return $panel
        ->default()
        ->id('admin')
        ->path('admin')
        ->login()
        ->registration(false)
        ->passwordReset()
        ->emailVerification()
        ->authMiddleware([
            Authenticate::class,
        ])
        ->authGuard('admin');
}
```

**2. Optionally, give each panel its own guard.** Not required — Filament's generated providers declare none, and panels sharing the default `web` guard are separated by `canAccessPanel()`. Use a separate guard when the panels are backed by different user models:

```php
// config/auth.php
'guards' => [
    'admin' => [
        'driver' => 'session',
        'provider' => 'admins',
    ],
],
'providers' => [
    'admins' => [
        'driver' => 'eloquent',
        'model' => App\Models\Admin::class,
    ],
],
```

**3. Restrict panel access per user with FilamentUser.** Read the `$panel` you are given — a `canAccessPanel()` that ignores it applies one decision to every panel:

```php
// app/Models/User.php
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;

class User extends Authenticatable implements FilamentUser
{
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->hasVerifiedEmail() && $this->hasRole('admin');
    }
}
```

## References

- [Filament Panel Configuration](https://filamentphp.com/docs/3.x/panels/configuration)
- [Filament Authentication](https://filamentphp.com/docs/3.x/panels/users)
- [Filament Panel Users & Access](https://filamentphp.com/docs/3.x/panels/users#authorizing-access-to-the-panel)
- [Laravel Authentication Guards](https://laravel.com/docs/authentication#adding-custom-guards)

## Related Analyzers

- [Filament Resource Authorization](/analyzers/security/filament-resource-authorization) - Validates resource policies
- [Filament Tenancy](/analyzers/security/filament-tenancy) - Validates multi-tenancy scoping
- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
