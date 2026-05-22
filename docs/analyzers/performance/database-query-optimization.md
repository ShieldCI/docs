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

Scans application code for common inefficient database query patterns including SELECT *, queries inside loops, and unnecessary count operations.

## Why It Matters

- **SELECT \*:** Fetches all columns when only a few are needed, wasting memory and bandwidth
- **Queries in Loops:** Each iteration executes a separate query (N+1 problem), turning 1 query into hundreds
- **count() for Existence:** `->count() > 0` scans entire table when `->exists()` stops at first match
- **Cumulative Impact:** These patterns compound: a page with multiple N+1 issues can execute thousands of queries

Even moderate traffic can bring a server to its knees when these patterns are present.

## How to Fix

### 1. Replace SELECT * with Specific Columns

**Before (❌):**

```php
// Fetches ALL columns
$users = DB::select('SELECT * FROM users WHERE active = 1');
$posts = Post::all();
```

**After (✅):**

```php
// Fetch only needed columns
$users = DB::select('SELECT id, name, email FROM users WHERE active = 1');
$posts = Post::select(['id', 'title', 'slug'])->get();

// Or pass columns to get()
$posts = Post::where('published', true)->get(['id', 'title']);
```

### 2. Fix N+1 Query Problems

**Before (❌):**

```php
$posts = Post::all();

foreach ($posts as $post) {
    // Each iteration executes a query!
    echo $post->author->name;
}
// 1 query for posts + N queries for authors = N+1
```

**After (✅):**

```php
// 2 queries total, regardless of how many posts
$posts = Post::with('author')->get();

foreach ($posts as $post) {
    echo $post->author->name; // No additional query
}
```

**Nested Relationships:**

```php
// Eager load multiple levels
$posts = Post::with(['author', 'comments.user'])->get();

// Constrained eager loading
$posts = Post::with(['comments' => function ($query) {
    $query->where('approved', true)->latest();
}])->get();
```

### 3. Use exists() Instead of count()

**Before (❌):**

```php
if (User::where('email', $email)->count() > 0) {
    // User exists
}
```

**After (✅):**

```php
if (User::where('email', $email)->exists()) {
    // Stops at first match — much faster
}

// Or the inverse
if (User::where('email', $email)->doesntExist()) {
    // No user found
}
```

### Preventing N+1 in Development

**Enable strict mode in development:**

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Database\Eloquent\Model;

public function boot(): void
{
    Model::preventLazyLoading(! app()->isProduction());
}
```

This throws an exception when lazy loading occurs, helping catch N+1 issues during development.

## ShieldCI Configuration

This analyzer:
- Scans PHP files in your application for query patterns
- Detects `DB::select()` / `->selectRaw()` with `SELECT *`
- Identifies database calls inside `foreach`, `for`, and `while` loops
- Flags `->count() > 0` patterns that should use `->exists()`

## Verification

```bash
# Use Laravel Debugbar or Telescope to count queries per request
# Before optimization:
# Total Queries: 152 (N+1 on posts.author)

# After eager loading:
# Total Queries: 3
```

## References

- [Laravel Eager Loading](https://laravel.com/docs/eloquent-relationships#eager-loading)
- [Laravel Query Builder](https://laravel.com/docs/queries#select-statements)
- [Preventing Lazy Loading](https://laravel.com/docs/eloquent-relationships#preventing-lazy-loading)

## Related Analyzers

- [Eager Loading Analyzer](/analyzers/performance/eager-loading) - Focused N+1 detection via relationship access patterns
- [Database Connection Optimization](/analyzers/performance/mysql-single-server-optimization) - Optimizes MySQL connection settings
