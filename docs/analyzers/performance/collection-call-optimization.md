---
title: Collection Call Optimization Analyzer
description: Detects inefficient collection operations that could be optimized for better performance
icon: zap
outline: [2, 3]
tags: database,collection,performance,n+1,optimization,phpstan
---

# Collection Call Optimization Analyzer

| Analyzer ID                    | Category       | Severity   | Time To Fix  |
| -------------------------------| :------------: |:----------:| ------------:|
| `collection-call-optimization` | ⚡ Performance  | High       | 45 minutes   |

## What This Checks

Uses **PHPStan/Larastan** to detect inefficient collection operations that should be performed at the database query level instead of in-memory:

- `Model::all()->count()` → Should use `Model::count()`
- `Model::all()->sum('column')` → Should use `Model::sum('column')`
- `->get()->count()` → Should use `->count()`
- Other collection aggregations that could be database queries
- Operations that unnecessarily load all records into memory

**Detection Method:** Leverages Larastan's built-in `noUnnecessaryCollectionCall` rule for accurate detection.

## Why It Matters

- **Database Performance:** Loading entire result sets into memory when you only need aggregates wastes database resources
- **Memory Usage:** `Model::all()` loads every record; for large tables this causes out-of-memory errors
- **Query Efficiency:** Database aggregation functions (COUNT, SUM, AVG) are orders of magnitude faster than PHP loops
- **Scalability:** Code that works with 100 records fails catastrophically with 100,000 records

## How to Fix

### Quick Fix (5 minutes)

Replace collection aggregations with database queries:

**Count Records:**
```php
// ❌ BAD - Loads all records into memory
$userCount = User::all()->count();

// ✅ GOOD - Database count
$userCount = User::count();
```

**Sum Values:**
```php
// ❌ BAD - Loads all orders, sums in PHP
$totalRevenue = Order::all()->sum('amount');

// ✅ GOOD - Database aggregation
$totalRevenue = Order::sum('amount');
```

**Average Values:**
```php
// ❌ BAD - Loads all products, averages in PHP
$avgPrice = Product::all()->avg('price');

// ✅ GOOD - Database aggregation
$avgPrice = Product::avg('price');
```

### Proper Fix (45 minutes)

**1. Query Builder Optimization:**

```php
// ❌ BAD - Two queries - get() loads data, count() counts in PHP
$activeUsers = User::where('status', 'active')->get()->count();

// ✅ GOOD - Single database count
$activeUsers = User::where('status', 'active')->count();
```

**2. Complex Aggregations:**

```php
// ❌ BAD - Loads all records, groups in PHP memory
$ordersByMonth = Order::all()->groupBy(function($order) {
    return $order->created_at->format('Y-m');
});

// ✅ GOOD - Database grouping
$ordersByMonth = Order::query()
    ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count')
    ->groupBy('month')
    ->get();
```

**3. Conditional Aggregation:**

```php
// ❌ BAD - Loads all users, filters in PHP
$premiumUserCount = User::all()
    ->where('subscription_type', 'premium')
    ->count();

// ✅ GOOD - Filter at database level
$premiumUserCount = User::where('subscription_type', 'premium')->count();
```

**4. When Collection Operations ARE Appropriate:**

```php
// ✅ Correct: When you need the actual collection for multiple operations
$activeUsers = User::where('status', 'active')->get();
$userCount = $activeUsers->count();  // Already loaded, no extra query
$avgAge = $activeUsers->avg('age');   // Computing from loaded data
$names = $activeUsers->pluck('name'); // Extracting from loaded data
```

**5. Pagination Caveat:**

```php
// ⚠️ Note: paginate() automatically uses count() internally
// This is correct, not a performance issue
$users = User::paginate(50);  // Uses COUNT(*) for pagination automatically
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- PHPStan analysis can be slow on large codebases
- Prevents CI pipeline slowdowns from comprehensive code analysis

**When to run this analyzer:**
- ✅ **Local development**: Pre-commit checks during feature development
- ❌ **CI/CD pipelines**: Skipped automatically (can be slow)

## References

- [Laravel Collections](https://laravel.com/docs/collections)
- [Laravel Query Builder](https://laravel.com/docs/queries)
- [Laravel Eloquent Aggregates](https://laravel.com/docs/eloquent#aggregates)
- [Larastan Documentation](https://github.com/larastan/larastan)
- [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)

## Related Analyzers

- [MySQL Single Server Optimization Analyzer](/analyzers/performance/mysql-single-server-optimization) - Detects MySQL read/write configuration on single server
