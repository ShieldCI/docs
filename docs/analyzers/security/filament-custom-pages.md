---
title: Filament Custom Pages Analyzer
description: Validates that custom Filament pages have proper authorization to prevent unauthorized access
icon: lock
outline: [2, 3]
tags: security,filament,pages,authorization,custom-pages
pro: true
---

# Filament Custom Pages Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `filament-custom-pages` | 🛡️ Security  | Medium    | 10 minutes   |

## What This Checks

Validates that custom Filament pages have proper authorization. Checks for:

- Custom pages have `canAccess()` or `authorize()` method
- Pages with sensitive operations (database writes, config changes) have authorization
- Pages with forms have authorization to prevent unauthorized data submission
- Dashboard pages are treated with lower severity (panel-level auth usually covers them)

## Why It Matters

- **Unauthorized Access:** Custom pages without authorization are accessible to all panel users
- **Data Modification:** Pages with forms can be used to submit unauthorized data changes
- **Privilege Escalation:** Sensitive operations (user management, settings) may be accessible to low-privilege users
- **Audit Trail:** Without access control, there's no way to track who accessed what

## How to Fix

### Quick Fix (5 minutes)

Add `canAccess()` to your custom page:

```php
// app/Filament/Pages/SystemSettings.php
class SystemSettings extends Page
{
    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole('admin');
    }
}
```

### Proper Fix (10 minutes)

**1. Add authorization to pages with sensitive operations:**

```php
class ImportUsers extends Page
{
    public static function canAccess(): bool
    {
        return auth()->user()?->can('import', User::class);
    }

    protected function authorizeAccess(): void
    {
        abort_unless(static::canAccess(), 403);
    }

    public function import(): void
    {
        $this->authorize('import', User::class);

        // Import logic...
    }
}
```

**2. Protect pages with forms:**

```php
class EditSettings extends Page implements HasForms
{
    public static function canAccess(): bool
    {
        return auth()->user()?->hasPermission('manage-settings');
    }

    public function save(): void
    {
        $this->authorize('manage-settings');

        // Save settings...
    }
}
```

## References

- [Filament Pages](https://filamentphp.com/docs/panels/pages)
- [Filament Page Authorization](https://filamentphp.com/docs/panels/pages#authorization)
- [Laravel Authorization](https://laravel.com/docs/authorization)

## Related Analyzers

- [Filament Panel Security](/analyzers/security/filament-panel-security) - Validates panel authentication
- [Filament Widget Security](/analyzers/security/filament-widget-security) - Validates widget authorization
- [Filament Navigation](/analyzers/security/filament-navigation) - Validates navigation permissions
