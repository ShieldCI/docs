---
title: Lazy Collection Opportunity Analyzer
description: Detects large collection operations that could benefit from lazy loading to reduce memory usage
icon: zap
outline: [2, 3]
tags: performance,collections,lazy-loading,memory,optimization
pro: true
---

# Lazy Collection Opportunity Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `lazy-collection-opportunity` | ⚡ Performance  | Low    | 10 minutes   |

## What This Checks

Identifies collection operations that load all records into memory when lazy alternatives exist. Checks for:

- `Model::all()` loading entire tables into memory
- `Model::all()` chained with collection processing (filter, map, etc.)
- `->get()->count()` fetching all records just to count them
- Large chunk sizes that could use `->lazy()` instead
- `->get()` without pagination or limiting on potentially large datasets

## Why It Matters

- **Memory Usage:** `Model::all()` loads every row into PHP memory, causing out-of-memory errors on large tables
- **Performance:** Processing collections in PHP is orders of magnitude slower than database-level operations
- **Scalability:** Code that works with 100 records may fail with 100,000 records
- **Server Stability:** Memory spikes can affect other processes on the same server

## How to Fix

### Quick Fix (2 minutes)

Replace `all()` with memory-efficient alternatives:

**Before (❌):**
```php
$users = User::all();
foreach ($users as $user) {
    $user->sendNewsletter();
}
```

**After (✅):**
```php
User::cursor()->each(function ($user) {
    $user->sendNewsletter();
});
```

### Proper Fix (10 minutes)

**1. Use `cursor()` for iteration:**

```php
// Instead of loading all records at once
foreach (User::cursor() as $user) {
    // Process one at a time, constant memory
}
```

**2. Use `lazy()` for collection methods:**

```php
// Before: loads all records then filters in PHP
$active = User::all()->filter(fn ($u) => $u->isActive());

// After: lazy collection with constant memory
$active = User::lazy()->filter(fn ($u) => $u->isActive());
```

**3. Use query builder for counting:**

```php
// Before: fetches all records just to count
$count = User::get()->count();

// After: database-level COUNT query
$count = User::count();
```

**4. Replace large chunks with lazy:**

```php
// Before: chunk processes 5000 at a time
User::chunk(5000, function ($users) { /* ... */ });

// After: lazy processes one at a time
User::lazy()->each(function ($user) { /* ... */ });
```

## References

- [Laravel Lazy Collections](https://laravel.com/docs/collections#lazy-collections)
- [Laravel Eloquent Cursors](https://laravel.com/docs/eloquent#cursors)
- [Laravel Chunking Results](https://laravel.com/docs/eloquent#chunking-results)

## Related Analyzers

- [Collection Optimization](/analyzers/performance/collection-call-optimization) - Detects inefficient collection operations
- [Database Query Optimization](/analyzers/performance/database-query-optimization) - Detects inefficient query patterns
- [Missing Chunk](/analyzers/best-practices/chunk-missing) - Detects queries on large datasets without chunking
