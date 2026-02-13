---
title: Filament Table Optimization Analyzer
description: Checks Filament table definitions for N+1 queries and performance issues in resource tables
icon: zap
outline: [2, 3]
tags: performance,filament,tables,n-plus-one,optimization
pro: true
---

# Filament Table Optimization Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `filament-table-optimization` | ⚡ Performance  | Medium    | 15 minutes   |

## What This Checks

Validates Filament table definitions for performance issues. Checks for:

- Columns accessing relationship data without eager loading (N+1 queries)
- Searchable columns on relationship fields without proper indexing
- Tables with too many visible columns impacting rendering performance
- Sortable columns on relationship fields that may cause slow queries

## Why It Matters

- **N+1 Queries:** Relationship columns without eager loading execute a query per row, degrading performance exponentially
- **Rendering Performance:** Tables with many visible columns increase DOM size and slow client-side rendering
- **Search Performance:** Searchable relationship columns without indexes cause full table scans
- **User Experience:** Slow admin panels frustrate operators and reduce productivity

## How to Fix

### Quick Fix (5 minutes)

Add eager loading to your resource:

```php
// app/Filament/Resources/OrderResource.php
public static function table(Table $table): Table
{
    return $table
        ->columns([
            TextColumn::make('user.name'), // This causes N+1 without eager loading
        ]);
}

// Add this to the resource class:
protected static function getEloquentQuery(): Builder
{
    return parent::getEloquentQuery()->with(['user']);
}
```

### Proper Fix (15 minutes)

**1. Reduce visible columns:**

```php
public static function table(Table $table): Table
{
    return $table
        ->columns([
            TextColumn::make('name'),
            TextColumn::make('email'),
            TextColumn::make('status'),
            // Hide less important columns by default
            TextColumn::make('created_at')
                ->toggleable(isToggledHiddenByDefault: true),
            TextColumn::make('phone')
                ->toggleable(isToggledHiddenByDefault: true),
        ]);
}
```

**2. Eager load all relationship columns:**

```php
protected static function getEloquentQuery(): Builder
{
    return parent::getEloquentQuery()
        ->with(['user', 'category', 'tags']);
}
```

**3. Add database indexes for searchable/sortable columns:**

```php
// migration
Schema::table('orders', function (Blueprint $table) {
    $table->index('status');
    $table->index('created_at');
});
```

## References

- [Filament Table Columns](https://filamentphp.com/docs/tables/columns)
- [Filament Performance Tips](https://filamentphp.com/docs/panels/resources/getting-started#customizing-the-eloquent-query)
- [Laravel Eager Loading](https://laravel.com/docs/eloquent-relationships#eager-loading)

## Related Analyzers

- [Eager Loading](/analyzers/performance/eager-loading) - Detects missing eager loading patterns
- [Database Query Optimization](/analyzers/performance/database-query-optimization) - Detects inefficient query patterns
- [Filament Resource Authorization](/analyzers/security/filament-resource-authorization) - Validates Filament resource security
