---
title: Filament Resource Authorization Analyzer
description: Validates that Filament resources have proper policy bindings for authorization on CRUD operations
icon: lock
outline: [2, 3]
tags: security,filament,authorization,resources,policies
pro: true
---

# Filament Resource Authorization Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `filament-resource-authorization` | 🛡️ Security  | High    | 15 minutes   |

## What This Checks

Validates that Filament resources have proper authorization. Checks for:

- Each resource has a corresponding model policy
- Resources implement `canAccess()` or model has `viewAny` policy method
- CRUD operations are protected by policy methods (create, update, delete)
- Resources override authorization methods when no policy exists

## Why It Matters

- **Unauthorized Access:** Without policies, all authenticated panel users can perform any CRUD operation
- **Data Modification:** Users may edit or delete records they shouldn't have access to
- **Privilege Escalation:** Admin panel users may access resources meant for higher privilege levels
- **Compliance:** Access control is a fundamental requirement for security compliance

## How to Fix

### Quick Fix (5 minutes)

Generate a policy for your resource's model:

```bash
php artisan make:policy UserPolicy --model=User
```

### Proper Fix (15 minutes)

**1. Create policies for all resource models:**

```php
// app/Policies/UserPolicy.php
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('create-users');
    }

    public function update(User $user, User $model): bool
    {
        return $user->hasRole('admin') || $user->id === $model->manager_id;
    }

    public function delete(User $user, User $model): bool
    {
        return $user->hasRole('super-admin');
    }
}
```

**2. Or override authorization in the resource:**

```php
// app/Filament/Resources/UserResource.php
class UserResource extends Resource
{
    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole('admin');
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasPermission('create-users');
    }

    public static function canEdit(Model $record): bool
    {
        return auth()->user()?->hasPermission('edit-users');
    }

    public static function canDelete(Model $record): bool
    {
        return auth()->user()?->hasRole('super-admin');
    }
}
```

## References

- [Filament Authorization](https://filamentphp.com/docs/panels/resources/getting-started#authorization)
- [Laravel Policies](https://laravel.com/docs/authorization#creating-policies)
- [Filament Resource Configuration](https://filamentphp.com/docs/panels/resources/getting-started)

## Related Analyzers

- [Filament Panel Security](/analyzers/security/filament-panel-security) - Validates panel authentication
- [Filament Tenancy](/analyzers/security/filament-tenancy) - Validates multi-tenancy scoping
- [Policy Authorization](/analyzers/best-practices/policy-authorization) - Validates controller policies
