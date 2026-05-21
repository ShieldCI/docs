---
title: Eager Loading Analyzer
description: Detects missing eager loading that causes N+1 query problems
icon: layers
outline: [2, 3]
tags: n+1,eager-loading,relationships,eloquent,performance
pro: true
---

# Eager Loading Analyzer

| Analyzer ID       | Category       | Severity   | Time To Fix  |
| ------------------| :------------: |:----------:| ------------:|
| `eager-loading`   | ⚡ Performance  | High       | 5 minutes    |

## What This Checks

Detects Eloquent relationship property access inside `foreach` loops: the classic N+1 query problem where each loop iteration triggers a separate database query.

## Why It Matters

- **Exponential Queries:** A page listing 100 posts with authors executes 101 queries instead of 2
- **Slow Page Loads:** Each extra query adds ~1-5ms, compounding to seconds of delay
- **Database Load:** N+1 queries create excessive connections and lock contention under load
- **Hidden Problem:** The code looks correct and works fine with small datasets, but degrades as data grows

N+1 queries are the single most common performance issue in Laravel applications.

## How to Fix

### Use `with()` for Eager Loading

**Before (❌):**

```php
$orders = Order::where('status', 'pending')->get();

foreach ($orders as $order) {
    // Lazy loads customer for EACH order
    $name = $order->customer->name;
    $total = $order->items->sum('price');
}
// Queries: 1 + N (customers) + N (items) = 2N+1
```

**After (✅):**

```php
$orders = Order::where('status', 'pending')
    ->with(['customer', 'items'])
    ->get();

foreach ($orders as $order) {
    // Already loaded — no additional queries
    $name = $order->customer->name;
    $total = $order->items->sum('price');
}
// Queries: 3 (orders + customers + items)
```

### Common Eager Loading Patterns

**Multiple relationships:**

```php
Post::with(['author', 'tags', 'comments'])->get();
```

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

**Eager loading counts:**

```php
Post::withCount('comments')->get();
// Access: $post->comments_count
```

**Lazy eager loading (when you already have the collection):**

```php
$posts = Post::all();

// Load relationships after the fact
$posts->load('author');
```

### Prevent N+1 in Development

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Database\Eloquent\Model;

public function boot(): void
{
    // Throws exception on lazy loading in non-production
    Model::preventLazyLoading(! app()->isProduction());
}
```

### Default Eager Loading on Models

```php
// app/Models/Post.php
class Post extends Model
{
    // Always eager load these relationships
    protected $with = ['author'];
}
```

## ShieldCI Configuration

This analyzer:
- Scans PHP files for relationship property access (`$model->relationship`)
- Checks if the access occurs inside a `foreach` loop
- Excludes common non-relationship properties (`id`, `created_at`, `updated_at`, `deleted_at`)
- Reports High severity since N+1 has significant performance impact

## Verification

```bash
# Enable query logging to verify
DB::enableQueryLog();

// ... run your code ...

dd(DB::getQueryLog());
# Before: 101 queries
# After:  2 queries
```

```bash
# Or use Laravel Debugbar
composer require barryvdh/laravel-debugbar --dev
# Check the "Queries" tab for duplicate queries
```

## References

- [Laravel Eager Loading](https://laravel.com/docs/eloquent-relationships#eager-loading)
- [Preventing Lazy Loading](https://laravel.com/docs/eloquent-relationships#preventing-lazy-loading)
- [Laravel Debugbar](https://github.com/barryvdh/laravel-debugbar)

## Related Analyzers

- [Database Query Optimization Analyzer](/analyzers/performance/database-query-optimization) - Broader query pattern analysis including SELECT * and count() misuse
