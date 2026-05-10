---
title: Filament Tenancy Analyzer
description: Validates multi-tenancy scope enforcement in Filament panels to prevent cross-tenant data leakage
icon: lock
outline: [2, 3]
tags: security,filament,tenancy,multi-tenant,scope
pro: true
---

# Filament Tenancy Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `filament-tenancy` | 🛡️ Security  | High    | 20 minutes   |

## What This Checks

Validates multi-tenancy scope enforcement in Filament panels. Checks for:

- Panel providers with `->tenant()` configuration
- User model implements `HasTenants` interface
- User model implements `canAccessTenant()` to prevent cross-tenant access via URL manipulation
- Resources have proper tenant scoping (`BelongsToTenant` trait or scoped queries)
- Tenant middleware is configured
- Tenant registration has profile management

## Why It Matters

- **Data Leakage:** Without tenant scoping, users of one organization can see data from others
- **Compliance Violation:** Multi-tenant SaaS must enforce strict data isolation (SOC 2, GDPR)
- **Trust Erosion:** Cross-tenant data exposure destroys customer trust and can lead to legal liability
- **Security Breach:** Missing tenant middleware allows URL manipulation to access other tenants

## How to Fix

### Quick Fix (5 minutes)

Configure tenant scoping on your panel:

```php
// app/Providers/Filament/AdminPanelProvider.php
public function panel(Panel $panel): Panel
{
    return $panel
        ->tenant(Team::class)
        ->tenantMiddleware([
            ApplyTenantScopes::class,
        ]);
}
```

### Proper Fix (20 minutes)

**1. Implement HasTenants on User model:**

```php
use Filament\Models\Contracts\HasTenants;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable implements HasTenants
{
    public function getTenants(Panel $panel): Collection
    {
        return $this->teams;
    }

    public function canAccessTenant(Model $tenant): bool
    {
        return $this->teams()->whereKey($tenant)->exists();
    }

    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class);
    }
}
```

**2. Scope resources to tenant:**

```php
// app/Filament/Resources/ProjectResource.php
class ProjectResource extends Resource
{
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->whereBelongsTo(Filament::getTenant());
    }
}
```

**Note:** Resources that should not be scoped to a tenant (e.g., global settings panels) can opt out with `public static bool $isScopedToTenant = false;`. This is recognized by the analyzer and will not trigger a scoping warning.

**3. Add tenant profile management:**

```php
public function panel(Panel $panel): Panel
{
    return $panel
        ->tenant(Team::class)
        ->tenantProfile(EditTeamProfile::class)
        ->tenantRegistration(RegisterTeam::class);
}
```

## References

- [Filament Multi-Tenancy](https://filamentphp.com/docs/panels/tenancy)
- [Filament Tenant Scoping](https://filamentphp.com/docs/panels/tenancy#setting-up-tenancy)
- [OWASP Multi-Tenancy Security](https://owasp.org/www-project-web-security-testing-guide/)

## Related Analyzers

- [Filament Panel Security](/analyzers/security/filament-panel-security) - Validates panel authentication
- [Filament Resource Authorization](/analyzers/security/filament-resource-authorization) - Validates resource policies
- [GDPR Compliance](/analyzers/security/gdpr-compliance) - Validates data protection compliance
