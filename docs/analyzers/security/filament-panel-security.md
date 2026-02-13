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
- Authentication middleware is configured
- Login page is enabled
- Auth guard is configured for multi-panel setups

## Why It Matters

- **Public Admin Access:** Without auth middleware, anyone can access your admin panel
- **Guard Confusion:** Multiple panels without custom guards can share authentication state
- **Missing Login:** Panels without login pages may be accessible to unauthenticated users
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

## References

- [Filament Panel Configuration](https://filamentphp.com/docs/panels/configuration)
- [Filament Authentication](https://filamentphp.com/docs/panels/users)
- [Laravel Authentication Guards](https://laravel.com/docs/authentication#adding-custom-guards)

## Related Analyzers

- [Filament Resource Authorization](/analyzers/security/filament-resource-authorization) - Validates resource policies
- [Filament Tenancy](/analyzers/security/filament-tenancy) - Validates multi-tenancy scoping
- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
