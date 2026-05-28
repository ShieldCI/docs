---
title: Eager Loading Analyzer
description: Detects wasteful eager loading in Eloquent queries — relations loaded with with(), load(), or loadMissing() that are never accessed in the same method, and single calls that load an unusually large number of relations at once
icon: layers
outline: [2, 3]
tags: eager-loading,relationships,eloquent,performance
pro: true
---

# Eager Loading Analyzer

| Analyzer ID       | Category       | Severity   | Time To Fix  |
| ------------------| :------------: |:----------:| ------------:|
| `eager-loading`   | ⚡ Performance  | Medium     | 5 minutes    |

## What This Checks

Detects two categories of wasteful eager loading in Eloquent queries. Checks for:

- **Unnecessary eager loading** (Medium): a relation passed to `with()`, `load()`, or `loadMissing()` is never accessed within the enclosing method and the holding variable does not escape to a view, response, or downstream call
- **Over-eager loading** (Low): a single eager-load call requests more than five relations and at least one of them goes unused, suggesting that some should be deferred with lazy eager loading

::: tip Complementary analyzer
The free-package [Eloquent N+1 Query Analyzer](/analyzers/best-practices/eloquent-n-plus-one) covers the opposite failure mode — *missing* eager loading that causes N+1 queries inside loops. These two analyzers work together to keep your relationship loading strategy balanced.
:::

## Why It Matters

- **Wasted Queries:** Every relation in a `with()` call fires an extra SQL query upfront, even when the data is never read
- **Memory Overhead:** Eager-loaded collections are hydrated into PHP objects immediately — loading ten relations when only two are used inflates peak memory consumption
- **Slower Responses:** Unnecessary joins and subqueries add latency even when their results are discarded
- **Hidden Cost:** The waste is invisible in small datasets but compounds under load and as data grows

## How to Fix

### Quick Fix (2 minutes)

If a relation is flagged as never accessed, remove it from the `with()` call.

**Before (❌):**

```php
public function index()
{
    // 'tags' is loaded but never accessed in this method
    $posts = Post::with(['author', 'tags'])->paginate(20);

    return Inertia::render('posts/index', ['posts' => $posts]);
}
```

**After (✅):**

```php
public function index()
{
    $posts = Post::with('author')->paginate(20);

    return Inertia::render('posts/index', ['posts' => $posts]);
}
```

### Proper Fix (5 minutes)

Apply the right loading strategy per access pattern and defer relations only needed on some code paths.

**Defer rarely-used relations with lazy eager loading:**

```php
// ❌ Before: 8 subqueries on every request, most unused on any given path
$orders = Order::with([
    'customer', 'items', 'discount', 'tax',
    'shipping', 'invoice', 'notes', 'history',
])->get();

// ✅ After: load common relations upfront, defer the rest
$orders = Order::with(['customer', 'items'])->get();

if ($showInvoice) {
    $orders->load('invoice');
}

$orders->loadMissing(['discount', 'tax']); // safe to call — skips already-loaded relations
```

**Constrain columns on eager-loaded relations to reduce data transfer:**

```php
User::with('team:id,name,slug')->paginate();
```

**Nested relationships:**

```php
Post::with('comments.user')->get();
```

**Eager loading counts (avoids loading the full relation just for a number):**

```php
Post::withCount('comments')->get();
// Access: $post->comments_count
```

## References

- [Laravel Eager Loading](https://laravel.com/docs/eloquent-relationships#eager-loading)
- [Lazy Eager Loading](https://laravel.com/docs/eloquent-relationships#lazy-eager-loading)

## Related Analyzers

- [Eloquent N+1 Analyzer](/analyzers/performance/eloquent-n-plus-one) — detects *missing* eager loading that causes N+1 queries inside loops (free package)
- [Database Query Optimization Analyzer](/analyzers/performance/database-query-optimization) — broader query pattern analysis including SELECT * and count() misuse
