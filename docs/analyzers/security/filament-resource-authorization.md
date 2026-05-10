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

- Resources that set `$shouldSkipAuthorization = true` (bypasses all policy checks — High severity)
- Each resource has a corresponding model policy
- Resources implement `canAccess()` or model has `viewAny` policy method
- Weak `canAccess()` implementations that only check authentication (`return true`, `return auth()->check()`, `return Auth::check()`) — High severity
- All CRUD operations are protected by policy methods (`viewAny`, `view`, `create`, `update`, `delete`, `deleteAny`)
- SoftDeletes models have both single-record and bulk soft-delete policy methods (`restore`, `forceDelete`, `restoreAny`, `forceDeleteAny`)
- Model-less resources must override `canAccess()` to control who can access them
- Resources override authorization methods when no policy exists

## Why It Matters

- **Unauthorized Access:** Without policies, all authenticated panel users can perform any CRUD operation
- **Data Modification:** Users may edit or delete records they shouldn't have access to
- **Bulk Destruction:** Missing `deleteAny`, `forceDeleteAny` leaves bulk-action buttons completely unguarded — a single click can wipe large datasets
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

    public function view(User $user, User $model): bool
    {
        return $user->hasRole('admin') || $user->id === $model->id;
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

    public function deleteAny(User $user): bool
    {
        return $user->hasRole('super-admin');
    }
}
```

**2. For models that use SoftDeletes, also add:**

```php
// app/Policies/UserPolicy.php (continued)
    public function restore(User $user, User $model): bool
    {
        return $user->hasRole('admin');
    }

    public function restoreAny(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function forceDelete(User $user, User $model): bool
    {
        return $user->hasRole('super-admin');
    }

    public function forceDeleteAny(User $user): bool
    {
        return $user->hasRole('super-admin');
    }
```

**3. For model-less resources, override `canAccess()`:**

Model-less resources (those without a `$model` property pointing to an Eloquent model) have no policy to bind to. They must explicitly declare who can access them:

```php
// app/Filament/Resources/DashboardResource.php
class DashboardResource extends Resource
{
    protected static ?string $model = null;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }
}
```

**4. Or use per-resource authorization method overrides:**

As an alternative to policies, you can override individual authorization methods directly on the resource. This approach skips policy binding entirely:

```php
// app/Filament/Resources/UserResource.php
class UserResource extends Resource
{
    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }

    public static function canViewAny(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }

    public static function canView(Model $record): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }

    public static function canCreate(): bool
    {
        return auth()->user()?->hasPermission('create-users') ?? false;
    }

    public static function canEdit(Model $record): bool
    {
        return auth()->user()?->hasPermission('edit-users') ?? false;
    }

    public static function canDelete(Model $record): bool
    {
        return auth()->user()?->hasRole('super-admin') ?? false;
    }

    public static function canDeleteAny(): bool
    {
        return auth()->user()?->hasRole('super-admin') ?? false;
    }
}
```

> **Note:** The analyzer checks for a bound policy. Using resource-level overrides without a policy will produce warnings for the missing policy, but the resource is still properly secured. Use `// @shield-ignore filament-resource-authorization` on the resource class if you intentionally rely on method overrides with no policy.

## References

- [Filament Authorization](https://filamentphp.com/docs/panels/resources/getting-started#authorization-2)
- [Filament Custom Authorization](https://filamentphp.com/docs/panels/resources/getting-started#custom-authorization)
- [Laravel Policies](https://laravel.com/docs/authorization#creating-policies)
- [Filament Resource Configuration](https://filamentphp.com/docs/panels/resources/getting-started)

## Related Analyzers

- [Filament Panel Security](/analyzers/security/filament-panel-security) - Validates panel authentication
- [Filament Tenancy](/analyzers/security/filament-tenancy) - Validates multi-tenancy scoping
- [Policy Authorization](/analyzers/best-practices/policy-authorization) - Validates controller policies
