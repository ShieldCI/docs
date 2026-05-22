---
title: Database Query Optimization Analyzer
description: Detects inefficient database query patterns — SELECT *, N+1 loops, existence count-scans, and WHERE/ORDER BY on columns not indexed in your migrations
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

Scans application code for common inefficient database query patterns and cross-references `database/migrations/` to determine which columns are actually indexed before flagging. Checks for:

- `SELECT *` queries fetching all columns when only a subset is needed
- Eloquent query calls inside `foreach`, `for`, and `while` loop bodies (N+1 problem)
- `DB::` static calls inside loops creating one round-trip per iteration
- `->count() > 0` existence checks that scan every matching row
- `WHERE`, `ORDER BY`, and `GROUP BY` on columns with no index in your migrations

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
// Migration — status column has no index
$table->string('status');

// Query — full scan on every request
$users = User::where('status', 'active')->orderBy('created_at', 'desc')->paginate(20);
```

**After (✅):**

```php
// Migration — composite covers WHERE + ORDER BY in one index
$table->index(['status', 'created_at']);
```

**Pattern 5: Chain ->constrained() on foreign keys**

**Before (❌):**

```php
// No FK constraint → no automatic index
$table->foreignId('project_id');
```

**After (✅):**

```php
// FK constraint forces MySQL to create an index on the child column
$table->foreignId('project_id')->constrained()->cascadeOnDelete();
```

### Proper Fix (15 minutes)

Apply all five patterns and add guardrails to prevent regressions.

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

**Use composite indexes to cover polymorphic queries:**

```php
// morphs()/nullableMorphs() already create a composite index automatically
$table->nullableMorphs('subject'); // indexes (subject_type, subject_id) together

// For manual polymorphic columns, add a composite index explicitly
$table->index(['commentable_type', 'commentable_id']);
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
- [Laravel Migrations — Available Index Types](https://laravel.com/docs/migrations#available-index-types)

## Related Analyzers

- [Eager Loading Analyzer](/analyzers/performance/eager-loading) - Focused N+1 detection via relationship access patterns
- [Database Connection Optimization](/analyzers/performance/mysql-single-server-optimization) - Optimizes MySQL connection settings
