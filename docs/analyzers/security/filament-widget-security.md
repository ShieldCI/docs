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

Validates that Filament widgets have proper authorization and safe data handling. Checks for:

- Widget classes have `canView()` method or `authorize()` method
- `canView()` is not a weak allow-all gate (`return true` or `return auth()->check()`) when the widget displays sensitive data
- Sensitive data queries (financial aggregations on `amount`, `revenue`, `total`, etc.) are protected by authorization
- `StatsOverviewWidget` classes referencing financial models (`Payment`, `Transaction`, `Invoice`, etc.) have access controls
- `TableWidget` classes with a custom `getTableQuery()` have proper record scoping (tenant/user filtering)
- Widgets using `InteractsWithPageFilters` validate filter values before using them in database queries

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

**2. Optionally combine with lazy loading (performance only, not a substitute for authorization):**

```php
class UserStatsWidget extends Widget
{
    // $isLazy defers rendering for performance; it does NOT restrict who can view the widget
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

**4. Validate filter values when using `InteractsWithPageFilters`:**

Filament's page filters are **not validated automatically**: values from the dashboard filter form land directly in `$this->pageFilters`. Always validate before using in queries:

```php
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Carbon\Carbon;

class OrderStats extends StatsOverviewWidget
{
    use InteractsWithPageFilters;

    public static function canView(): bool
    {
        return auth()->user()?->hasRole('admin') ?? false;
    }

    protected function getStats(): array
    {
        $rawDate = $this->pageFilters['startDate'] ?? null;
        // Validate format before trusting the value
        $startDate = ($rawDate !== null && Carbon::hasFormat($rawDate, 'Y-m-d'))
            ? Carbon::parse($rawDate)->startOfDay()
            : null;

        return [
            Stat::make('Orders', Order::query()
                ->when($startDate, fn ($q) => $q->where('created_at', '>=', $startDate))
                ->count()),
        ];
    }
}
```

## References

- [Filament Widgets - Conditionally Hiding](https://filamentphp.com/docs/4.x/panels/dashboard#conditionally-hiding-widgets)
- [Filament Stats Overview](https://filamentphp.com/docs/4.x/widgets/stats-overview)
- [Filament Page Filters (unvalidated data warning)](https://filamentphp.com/docs/4.x/panels/dashboard#filtering-dashboard-widgets)
- [Laravel Authorization](https://laravel.com/docs/authorization)

## Related Analyzers

- [Filament Panel Security](/analyzers/security/filament-panel-security) - Validates panel authentication
- [Filament Custom Pages](/analyzers/security/filament-custom-pages) - Validates page authorization
- [Filament Navigation](/analyzers/security/filament-navigation) - Validates navigation permissions
