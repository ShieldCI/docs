---
title: Database Query Optimization Analyzer
description: Detects inefficient database query patterns — unindexed columns, SELECT *, repeated queries — that degrade performance as your Laravel app scales
icon: database
outline: [2, 3]
tags: database,queries,performance,optimization,n+1
pro: true
---

# Database Query Optimization Analyzer

| Analyzer ID                      | Category       | Severity   | Time To Fix  |
| ---------------------------------| :------------: |:----------:| ------------:|
| `database-query-optimization`    | ⚡ Performance  | Medium     | 15 minutes   |

## What This Checks

Scans application code for common inefficient database query patterns that degrade performance as your app scales. Checks for:

- `SELECT *` queries fetching all columns when only a subset is needed
- Eloquent relationship access inside `foreach` loops (N+1 problem)
- `DB::` calls inside loops creating one round-trip per iteration
- `->count() > 0` existence checks that scan every matching row
- `orderBy()` and `groupBy()` calls on potentially unindexed columns

## Why It Matters

- **Memory & Bandwidth Waste:** `SELECT *` transfers every column for every row even when your code uses one or two — multiplying data between database and PHP on each request
- **Exponential Query Count:** Queries inside loops execute once per record — 100 orders means 100 extra queries, 1,000 orders means 1,000 extra queries
- **Full Table Scans for Existence Checks:** `count() > 0` counts every matching row before returning; `exists()` stops at the first match
- **Slow Sort and Filter Operations:** `orderBy()` and `groupBy()` on unindexed columns force a full table scan on every request
- **Cumulative Collapse:** These patterns compound — a page with `SELECT *` and two N+1 loops can execute thousands of queries and transfer megabytes per request

## How to Fix

### Quick Fix (5 minutes)

**Pattern 1: Replace SELECT \* with specific columns**

**Before (❌):**

```php
$users = DB::select('SELECT * FROM users WHERE active = 1');
$posts = Post::all();
```

**After (✅):**

```php
$users = DB::select('SELECT id, name, email FROM users WHERE active = 1');
$posts = Post::select(['id', 'title', 'slug'])->get();
```

**Pattern 2: Move queries out of loops**

**Before (❌):**

```php
$posts = Post::all();

foreach ($posts as $post) {
    echo $post->author->name; // query per iteration
}
```

**After (✅):**

```php
$posts = Post::with('author')->get();

foreach ($posts as $post) {
    echo $post->author->name; // already loaded
}
```

**Pattern 3: Use exists() instead of count()**

**Before (❌):**

```php
if (User::where('email', $email)->count() > 0) {
    // ...
}
```

**After (✅):**

```php
if (User::where('email', $email)->exists()) {
    // stops at first match
}
```

**Pattern 4: Add indexes for sort and filter columns**

**Before (❌):**

```php
$users = User::orderBy('created_at', 'desc')->paginate(20);
$posts = Post::where('status', 'published')->orderBy('published_at')->get();
```

**After (✅):**

```php
// Create a migration to add the missing indexes
Schema::table('users', function (Blueprint $table) {
    $table->index('created_at');
});

Schema::table('posts', function (Blueprint $table) {
    $table->index(['status', 'published_at']); // composite covers WHERE + ORDER BY
});
```

### Proper Fix (15 minutes)

Apply all four patterns and add guardrails to prevent regressions.

**Eager load multiple and nested relationships:**

```php
// Multiple relationships — 3 queries total regardless of collection size
$posts = Post::with(['author', 'tags', 'comments'])->get();

// Nested relationships
$posts = Post::with('comments.user')->get();

// Constrained eager loading
$posts = Post::with(['comments' => function ($query) {
    $query->where('approved', true)->latest()->limit(5);
}])->get();
```

**Prefer `get()` column selection over `all()`:**

```php
// Pass columns directly to get() when you don't need select()
$posts = Post::where('published', true)->get(['id', 'title', 'slug']);
```

**Use `doesntExist()` for the inverse check:**

```php
if (User::where('email', $email)->doesntExist()) {
    // no user found — no count scan
}
```

**Enable strict mode to catch N+1 during development:**

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Database\Eloquent\Model;

public function boot(): void
{
    Model::preventLazyLoading(! app()->isProduction());
}
```

This throws an exception on lazy loading in non-production environments, catching N+1 issues before they reach production.

## References

- [Laravel Eager Loading](https://laravel.com/docs/eloquent-relationships#eager-loading)
- [Laravel Query Builder](https://laravel.com/docs/queries#select-statements)
- [Preventing Lazy Loading](https://laravel.com/docs/eloquent-relationships#preventing-lazy-loading)

## Related Analyzers

- [Eager Loading Analyzer](/analyzers/performance/eager-loading) - Focused N+1 detection via relationship access patterns
- [Database Connection Optimization](/analyzers/performance/mysql-single-server-optimization) - Optimizes MySQL connection settings
