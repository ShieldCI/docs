---
title: Filament Widget Security Analyzer
description: Validates that Filament widgets have proper authorization and don't expose sensitive data to unauthorized users
icon: lock
outline: [2, 3]
tags: security,filament,widgets,authorization,data-exposure
pro: true
---

# Filament Widget Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `filament-widget-security` | 🛡️ Security  | Medium    | 10 minutes   |

## What This Checks

Validates that Filament widgets have proper authorization. Checks for:

- Widget classes have `canView()` method or `authorize()` method
- Sensitive data queries are protected by authorization
- Stats overview widgets with financial data have access controls

## Why It Matters

- **Data Exposure:** Dashboard widgets showing revenue, user counts, or financial data are visible to all panel users
- **Business Intelligence Leakage:** Competitors or unauthorized staff can see sensitive business metrics
- **Compliance:** Financial data displayed without access control may violate compliance requirements
- **Principle of Least Privilege:** Users should only see data relevant to their role

## How to Fix

### Quick Fix (5 minutes)

Add `canView()` to your widget:

```php
class RevenueOverview extends StatsOverviewWidget
{
    public static function canView(): bool
    {
        return auth()->user()?->hasRole('admin');
    }
}
```

### Proper Fix (10 minutes)

**1. Protect sensitive stats widgets:**

```php
class FinancialStats extends StatsOverviewWidget
{
    public static function canView(): bool
    {
        return auth()->user()?->hasPermission('view-financial-data');
    }

    protected function getStats(): array
    {
        return [
            Stat::make('Revenue', '$' . number_format(Order::sum('total') / 100, 2)),
            Stat::make('MRR', '$' . number_format($this->calculateMRR(), 2)),
        ];
    }
}
```

**2. Use lazy loading for performance:**

```php
class UserStatsWidget extends Widget
{
    protected static bool $isLazy = true;

    public static function canView(): bool
    {
        return auth()->user()?->can('viewAny', User::class);
    }
}
```

**3. Filter widget data by user permissions:**

```php
class OrderChart extends ChartWidget
{
    public static function canView(): bool
    {
        return auth()->user()?->hasAnyRole(['admin', 'manager']);
    }

    protected function getData(): array
    {
        // Only show data the user has access to
        $query = Order::query();

        if (!auth()->user()->hasRole('admin')) {
            $query->where('team_id', auth()->user()->team_id);
        }

        return [/* chart data */];
    }
}
```

## References

- [Filament Widgets](https://filamentphp.com/docs/panels/dashboard#conditionally-hiding-widgets)
- [Filament Stats Overview](https://filamentphp.com/docs/widgets/stats-overview)
- [Laravel Authorization](https://laravel.com/docs/authorization)

## Related Analyzers

- [Filament Panel Security](/analyzers/security/filament-panel-security) - Validates panel authentication
- [Filament Custom Pages](/analyzers/security/filament-custom-pages) - Validates page authorization
- [Filament Navigation](/analyzers/security/filament-navigation) - Validates navigation permissions
