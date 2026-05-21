---
title: Missing Chunk Analyzer
description: Detects queries on large datasets without chunk() or cursor() for memory efficiency, preventing out-of-memory errors
icon: database
outline: [2, 3]
tags: laravel,performance,memory,eloquent,optimization,best-practices
---

# Missing Chunk Analyzer

| Analyzer ID      | Category           | Severity | Time To Fix |
| -----------------| :----------------: |:--------:| -----------:|
| `chunk-missing`  | 🏅 Best Practices  | High     | 15 minutes  |

## What This Checks

Detects queries on large datasets that load all records into memory using `->all()` or `->get()` without chunking. Checks:

- **Foreach loops**: Iterating over `Model::all()` or `Model::get()` results
- **Variable assignments**: Variables assigned with `->all()` or `->get()` then looped over
- **Missing chunking methods**: Queries that should use `chunk()`, `cursor()`, `lazy()`, or `lazyById()`
- **Memory-safe patterns**: Validates that large dataset queries use memory-efficient iteration

**Smart Detection**: The analyzer ignores queries with explicit limits (`->limit()`, `->take()`, `->first()`) since these are small datasets.

## Why It Matters

- **Memory Exhaustion:** Loading thousands of records with `->all()` or `->get()` loads the entire result set into memory, causing out-of-memory errors
- **Performance Impact:** Large datasets can consume hundreds of megabytes or gigabytes of memory
- **Application Crashes:** PHP's memory limit (typically 128MB-512MB) will be exceeded, crashing your application
- **Database Load:** Fetching all records at once puts unnecessary load on your database server
- **Scalability Issues:** Code works fine with 100 records but fails catastrophically with 10,000+

**Real-world impact:**
- A query returning 50,000 users with `User::all()` can consume 500MB+ of memory
- Using `User::chunk(200, ...)` processes the same data with only ~2MB peak memory usage
- Production crashes from memory exhaustion are often traced back to missing chunking

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: Replace ->all() with chunk()**

```php
// ❌ BAD - Loads all records into memory
$users = User::all();
foreach ($users as $user) {
    $this->processUser($user);
}

// ✅ GOOD - Process in chunks of 200
User::chunk(200, function ($users) {
    foreach ($users as $user) {
        $this->processUser($user);
    }
});
```

**Scenario 2: Replace ->get() with cursor()**

```php
// ❌ BAD - Loads all matching records into memory
$activeUsers = User::where('status', 'active')->get();
foreach ($activeUsers as $user) {
    $user->sendNotification();
}

// ✅ GOOD - Use cursor for generator-based iteration
foreach (User::where('status', 'active')->cursor() as $user) {
    $user->sendNotification();
}
```

**Scenario 3: Use lazy() for Laravel 9+**

```php
// ❌ BAD - Fetches all records at once
$orders = Order::where('status', 'pending')->get();
foreach ($orders as $order) {
    $this->processOrder($order);
}

// ✅ GOOD - Use lazy() which returns a generator
foreach (Order::where('status', 'pending')->lazy() as $order) {
    $this->processOrder($order);
}
```

### Proper Fix (15 minutes)

Implement memory-efficient iteration patterns across your codebase:

**1. Use chunk() for Batch Processing**

```php
// ❌ BAD - Memory intensive
$users = User::all();
foreach ($users as $user) {
    $user->update(['last_login' => now()]);
}

// ✅ GOOD - Process in batches
User::chunk(200, function ($users) {
    foreach ($users as $user) {
        $user->update(['last_login' => now()]);
    }
});

// ✅ BETTER - Use chunkById for better performance
User::chunkById(200, function ($users) {
    foreach ($users as $user) {
        $user->update(['last_login' => now()]);
    }
});
```

**2. Use cursor() for Generator-Based Iteration**

```php
// ❌ BAD - Loads all records
$products = Product::where('stock', '>', 0)->get();
foreach ($products as $product) {
    echo $product->name;
}

// ✅ GOOD - Generator-based iteration (single query, minimal memory)
foreach (Product::where('stock', '>', 0)->cursor() as $product) {
    echo $product->name;
}
```

**3. Use lazy() for Laravel 9+ (Recommended)**

```php
// ❌ BAD - Memory intensive for large datasets
$invoices = Invoice::where('status', 'unpaid')->get();
foreach ($invoices as $invoice) {
    $this->sendReminder($invoice);
}

// ✅ GOOD - lazy() chunks internally and returns a generator
foreach (Invoice::where('status', 'unpaid')->lazy() as $invoice) {
    $this->sendReminder($invoice);
}

// ✅ ADVANCED - Control chunk size
foreach (Invoice::where('status', 'unpaid')->lazy(500) as $invoice) {
    $this->sendReminder($invoice);
}
```

**4. Use lazyById() for ID-Based Chunking**

```php
// ❌ BAD - Inefficient for very large datasets
User::chunk(1000, function ($users) {
    foreach ($users as $user) {
        $this->archiveUser($user);
    }
});

// ✅ BETTER - ID-based chunking (more efficient for massive datasets)
foreach (User::lazyById() as $user) {
    $this->archiveUser($user);
}

// ✅ BEST - Specify chunk size
foreach (User::lazyById(500) as $user) {
    $this->archiveUser($user);
}
```

**5. When Small Datasets Are Guaranteed**

```php
// ✅ OK - Explicit limit means small dataset
$recentUsers = User::latest()->limit(10)->get();
foreach ($recentUsers as $user) {
    echo $user->name;
}

// ✅ OK - take() limits the results
$topProducts = Product::orderBy('sales', 'desc')->take(20)->get();

// ✅ OK - first() returns single record
$admin = User::where('role', 'admin')->first();
```

## References

- [Laravel Eloquent Chunking](https://laravel.com/docs/eloquent#chunking-results) - Official Laravel documentation
- [Laravel Query Builder Chunking](https://laravel.com/docs/queries#chunking-results) - Query builder chunking methods
- [Laravel Lazy Collections](https://laravel.com/docs/collections#lazy-collections) - Lazy collection documentation
- [PHP Memory Management](https://www.php.net/manual/en/features.gc.php) - Understanding PHP memory limits

## Related Analyzers

- [Eloquent N+1 Query Analyzer](/analyzers/best-practices/eloquent-n-plus-one) - Detects missing eager loading
- [PHP Side Filtering Analyzer](/analyzers/best-practices/php-side-filtering) - Detects filtering done in PHP vs database
