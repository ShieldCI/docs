---
title: Eager Loading Analyzer
description: Detects lazy-loaded relationship access causing N+1 queries inside loops, and over-eager loading where rarely-used relations are bundled into a single query unnecessarily
icon: layers
outline: [2, 3]
tags: n+1,eager-loading,relationships,eloquent,performance
pro: true
---

# Eager Loading Analyzer

| Analyzer ID       | Category       | Severity   | Time To Fix  |
| ------------------| :------------: |:----------:| ------------:|
| `eager-loading`   | ⚡ Performance  | Medium     | 5 minutes    |

## What This Checks

Detects two categories of eager loading problems in Eloquent queries. Checks for:

- Eloquent relationship property access inside `foreach` loops (N+1 problem — Medium severity)
- Single `with()` calls loading an unusually large number of relations at once (over-eager loading — Low severity)

## Why It Matters

- **Exponential Queries:** A page listing 100 posts with authors executes 101 queries instead of 2
- **Slow Page Loads:** Each extra query adds ~1-5ms, compounding to seconds of delay
- **Database Load:** N+1 queries create excessive connections and lock contention under load
- **Hidden Problem:** The code looks correct and works fine with small datasets, but degrades as data grows
- **Over-Eager Overhead:** Loading every relation upfront when only some are used on each code path wastes memory and executes joins or subqueries that are never consumed

N+1 queries are the single most common performance issue in Laravel applications.

## How to Fix

### Quick Fix (2 minutes)

Add `with()` to the query that feeds the loop — this replaces N+1 lazy loads with a fixed number of upfront queries.

**Before (❌):**

```php
$orders = Order::where('status', 'pending')->get();

foreach ($orders as $order) {
    $name = $order->customer->name;  // query per iteration
    $total = $order->items->sum('price');  // query per iteration
}
// Queries: 1 + N (customers) + N (items) = 2N+1
```

**After (✅):**

```php
$orders = Order::where('status', 'pending')
    ->with(['customer', 'items'])
    ->get();

foreach ($orders as $order) {
    $name = $order->customer->name;  // already loaded
    $total = $order->items->sum('price');  // already loaded
}
// Queries: 3 (orders + customers + items)
```

### Proper Fix (5 minutes)

Apply eager loading consistently and use the right loading strategy per access pattern.

**Nested relationships:**

```php
Post::with('comments.user')->get();
```

**Constrained eager loading:**

```php
Post::with(['comments' => function ($query) {
    $query->where('approved', true)->latest()->limit(5);
}])->get();
```

**Eager loading counts (avoids loading full relation just for a number):**

```php
Post::withCount('comments')->get();
// Access: $post->comments_count
```

**Default eager loading on models (for relations always needed):**

```php
// app/Models/Post.php
class Post extends Model
{
    protected $with = ['author'];
}
```

**Reduce over-eager loading — defer rarely-used relations:**

```php
// ❌ Before: 8 subqueries on every request, most unused
$orders = Order::with([
    'customer', 'items', 'discount', 'tax',
    'shipping', 'invoice', 'notes', 'history',
])->get();

// ✅ After: load common relations upfront, defer the rest
$orders = Order::with(['customer', 'items'])->get();

if ($showInvoice) {
    $orders->load('invoice');
}

$order->loadMissing(['discount', 'tax']); // safe to call — skips already-loaded relations
```

**Prevent N+1 during development:**

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Database\Eloquent\Model;

public function boot(): void
{
    Model::preventLazyLoading(! app()->isProduction());
}
```

## References

- [Laravel Eager Loading](https://laravel.com/docs/eloquent-relationships#eager-loading)
- [Preventing Lazy Loading](https://laravel.com/docs/eloquent-relationships#preventing-lazy-loading)
- [Laravel Debugbar](https://github.com/barryvdh/laravel-debugbar)

## Related Analyzers

- [Database Query Optimization Analyzer](/analyzers/performance/database-query-optimization) - Broader query pattern analysis including SELECT * and count() misuse
