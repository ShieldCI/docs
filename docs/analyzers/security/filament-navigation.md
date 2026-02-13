---
title: Filament Navigation Analyzer
description: Validates that Filament navigation groups and items have proper permission gates for visibility control
icon: lock
outline: [2, 3]
tags: security,filament,navigation,permissions,visibility
pro: true
---

# Filament Navigation Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `filament-navigation` | 🛡️ Security  | Medium    | 10 minutes   |

## What This Checks

Validates that Filament navigation items have proper permission gates. Checks for:

- Resources with sensitive navigation groups that lack `shouldRegisterNavigation()` or `canAccess()`
- Navigation badges that may leak count information without authorization
- Custom navigation items in panel providers without visibility controls

## Why It Matters

- **Information Disclosure:** Navigation badges showing counts (e.g., "42 Users") leak data to unauthorized users
- **Security by Obscurity:** Visible navigation items invite exploration of unauthorized areas
- **User Confusion:** Showing navigation items that return 403 creates a poor user experience
- **Attack Surface:** Visible admin navigation reveals application structure to potential attackers

## How to Fix

### Quick Fix (5 minutes)

Add visibility controls to sensitive resources:

```php
// app/Filament/Resources/UserResource.php
class UserResource extends Resource
{
    public static function shouldRegisterNavigation(): bool
    {
        return auth()->user()?->hasRole('admin');
    }
}
```

### Proper Fix (10 minutes)

**1. Control badge visibility:**

```php
class OrderResource extends Resource
{
    public static function getNavigationBadge(): ?string
    {
        if (!auth()->user()?->can('viewAny', Order::class)) {
            return null;
        }

        return static::getModel()::where('status', 'pending')->count();
    }
}
```

**2. Add visibility to custom navigation items:**

```php
// In your PanelProvider
->navigationItems([
    NavigationItem::make('Analytics')
        ->url('/analytics')
        ->icon('heroicon-o-chart-bar')
        ->visible(fn () => auth()->user()?->hasPermission('view-analytics')),
])
```

**3. Control navigation group visibility:**

```php
class PaymentResource extends Resource
{
    protected static ?string $navigationGroup = 'Finance';

    public static function shouldRegisterNavigation(): bool
    {
        return auth()->user()?->hasRole(['admin', 'accountant']);
    }
}
```

## References

- [Filament Navigation](https://filamentphp.com/docs/panels/navigation)
- [Filament Resource Navigation](https://filamentphp.com/docs/panels/resources/getting-started#customizing-the-resource-navigation-item)
- [Filament Authorization](https://filamentphp.com/docs/panels/resources/getting-started#authorization)

## Related Analyzers

- [Filament Panel Security](/analyzers/security/filament-panel-security) - Validates panel authentication
- [Filament Custom Pages](/analyzers/security/filament-custom-pages) - Validates page authorization
- [Filament Widget Security](/analyzers/security/filament-widget-security) - Validates widget authorization
