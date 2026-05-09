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

- Panel provider exists in `app/Providers/Filament/`
- Authentication middleware is configured (`Authenticate::class` in `->authMiddleware()`)
- Login page is enabled (`->login()`)
- Auth guard is configured for multi-panel setups (`->authGuard()`)
- Public registration on admin/staff panels (`->registration()` on privileged surfaces)
- Registration without email verification (`->emailVerification()` absent)
- Revealable passwords enabled (`->revealablePasswords()`)
- No model implements `FilamentUser` — any authenticated user can access all panels

## Why It Matters

- **Public Admin Access:** Without auth middleware, anyone can access your admin panel
- **Guard Confusion:** Multiple panels without custom guards can share authentication state
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

**2. Configure separate guards for multiple panels:**

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

**3. Restrict panel access per user with FilamentUser:**

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

- [Filament Panel Configuration](https://filamentphp.com/docs/panels/configuration)
- [Filament Authentication](https://filamentphp.com/docs/panels/users)
- [Filament Panel Users & Access](https://filamentphp.com/docs/panels/users#authorizing-access-to-the-panel)
- [Laravel Authentication Guards](https://laravel.com/docs/authentication#adding-custom-guards)

## Related Analyzers

- [Filament Resource Authorization](/analyzers/security/filament-resource-authorization) - Validates resource policies
- [Filament Tenancy](/analyzers/security/filament-tenancy) - Validates multi-tenancy scoping
- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
