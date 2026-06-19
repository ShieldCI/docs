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

Validates Filament table definitions for performance issues. The analyzer resolves the resource's Eloquent model — so it can tell genuine relationships from plain columns, accessors and computed values — and cross-references your migrations to avoid redundant hints. Only columns declared in the table's `->columns([...])` are analyzed; columns in export actions (`->withColumns([...])`) are ignored.

It checks for:

- Per-row callbacks (`description`, `getStateUsing`, `formatStateUsing`, `state`, `url`, …) that access an un-eager-loaded **relationship** — a likely N+1 query. Plain columns, accessors and aggregate attributes are ignored, and nothing is flagged when the model cannot be resolved.
- Searchable columns on relationship fields, which join the related table on each search request (informational).
- Tables with too many visible columns, impacting rendering performance.
- Sortable columns on real database columns that have no index in your migrations.

## Why It Matters

- **N+1 Queries:** Relationship columns without eager loading execute a query per row, degrading performance exponentially
- **Rendering Performance:** Tables with many visible columns increase DOM size and slow client-side rendering
- **Search Performance:** Searchable relationship columns join the related table on every search request
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

**3. Add database indexes for sortable columns:**

```php
// migration
Schema::table('orders', function (Blueprint $table) {
    $table->index('status');
    $table->index('created_at');
});
```

The analyzer reads your migrations, so once a sortable column is indexed — directly, via a chained `->index()`/`->unique()`, a primary or foreign key, or a `morphs()` index — the hint clears automatically. Searchable relationship columns are reported only for awareness: Filament's `searchable()` uses a leading-wildcard `LIKE`, which a plain index cannot serve, so no index is suggested there.

## ShieldCI Configuration

To tune the thresholds and toggles, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'performance' => [
        'emabled' => true,
        
        'filament-table-optimization' => [
            // Visible-column count above which a table is flagged (default 10)
            'max_visible_columns' => 10,

            // Set false to disable the too-many-columns check
            'flag_too_many_columns' => true,

            // Set false to silence the searchable-on-relationship finding
            'flag_searchable_relationships' => true,
        ],
    ],
],
```

## References

- [Filament Table Columns](https://filamentphp.com/docs/tables/columns)
- [Filament Performance Tips](https://filamentphp.com/docs/3.x/panels/resources/getting-started#customizing-the-eloquent-query)
- [Laravel Eager Loading](https://laravel.com/docs/eloquent-relationships#eager-loading)

## Related Analyzers

- [Eager Loading](/analyzers/performance/eager-loading) - Detects missing eager loading patterns
- [Database Query Optimization](/analyzers/performance/database-query-optimization) - Detects inefficient query patterns
- [Filament Resource Authorization](/analyzers/security/filament-resource-authorization) - Validates Filament resource security
