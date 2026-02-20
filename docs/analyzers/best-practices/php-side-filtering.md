---
title: PHP-Side Collection Filtering Analyzer
description: Detects filter(), reject(), whereIn(), and whereNotIn() usage after database fetch - patterns not covered by Larastan that cause memory issues on large datasets
icon: shield-alert
outline: [2, 3]
tags: laravel,performance,database,memory,optimization,collections,best-practices
---

# PHP-Side Collection Filtering Analyzer

| Analyzer ID           |      Category      | Severity | Time To Fix |
| ----------------------|:------------------:|:--------:| -----------:|
| `php-side-filtering`  | 🏅 Best Practices   | Critical | 15 minutes  |

## What This Checks

Detects PHP-side filtering patterns that should be performed at the database level. This analyzer **complements** the [Collection Call Optimization Analyzer](/analyzers/performance/collection-call-optimization) by detecting **unique patterns NOT covered by Larastan**:

- **`filter()` after fetch**: `->all()->filter()` or `->get()->filter()` - Custom filtering logic with closures
- **`reject()` after fetch**: `->all()->reject()` or `->get()->reject()` - Inverse filtering
- **`whereIn()` after fetch**: `->all()->whereIn()` or `->get()->whereIn()` - Array-based filtering
- **`whereNotIn()` after fetch**: `->all()->whereNotIn()` or `->get()->whereNotIn()` - Inverse array filtering

**Note:** Common patterns like `->get()->where()`, `->get()->first()`, `->get()->last()`, `->get()->take()`, and `->get()->skip()` are detected by the [Collection Call Optimization Analyzer](/analyzers/performance/collection-call-optimization) (via Larastan's `noUnnecessaryCollectionCall` rule) and are **not** checked by this analyzer to avoid duplication.

## Why It Matters

Loading all records into memory then filtering in PHP is **extremely inefficient** and can cause:

1. **Memory exhaustion** - 100,000 users loaded into memory uses ~500MB+
2. **Slow response times** - PHP filtering is 10-100x slower than database filtering
3. **Database load** - Fetching unnecessary data wastes database resources
4. **Application crashes** - Memory limit exceeded errors in production

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: Replace `filter()` with `where()`**

```php
// ❌ BAD - Loads all users, filters in PHP
class UserRepository
{
    public function getActiveUsers()
    {
        return User::all()->filter(function($user) {
            return $user->status === 'active';
        });
    }
}

// ✅ GOOD - Filters at database level
class UserRepository
{
    public function getActiveUsers()
    {
        return User::where('status', 'active')->get();
    }
}
```

**Scenario 2: Replace `reject()` with `where()` or `whereNot()`**

```php
// ❌ BAD - Loads all products, rejects in PHP
class ProductService
{
    public function getAvailableProducts()
    {
        return Product::all()->reject(function($product) {
            return $product->stock === 0;
        });
    }
}

// ✅ GOOD - Filters at database level (Laravel 9+)
class ProductService
{
    public function getAvailableProducts()
    {
        return Product::whereNot('stock', 0)->get();
        // Or: Product::where('stock', '>', 0)->get()
    }
}
```

**Scenario 3: Replace `whereIn()` with query builder `whereIn()`**

```php
// ❌ BAD - Loads all orders, filters in PHP
class OrderService
{
    public function getOrdersByIds(array $ids)
    {
        return Order::all()->whereIn('id', $ids);
    }
}

// ✅ GOOD - Filters at database level
class OrderService
{
    public function getOrdersByIds(array $ids)
    {
        return Order::whereIn('id', $ids)->get();
    }
}
```

**Scenario 4: Replace `whereNotIn()` with query builder `whereNotIn()`**

```php
// ❌ BAD - Loads all products, excludes in PHP
class ProductService
{
    public function getProductsExcluding(array $excludeIds)
    {
        return Product::get()->whereNotIn('id', $excludeIds);
    }
}

// ✅ GOOD - Filters at database level
class ProductService
{
    public function getProductsExcluding(array $excludeIds)
    {
        return Product::whereNotIn('id', $excludeIds)->get();
    }
}
```

### Proper Fix (15 minutes)

**1. Convert Complex `filter()` Logic to Database Queries**

```php
// ❌ BAD - Complex filtering in PHP
class OrderService
{
    public function getHighValueOrders()
    {
        return Order::all()->filter(function($order) {
            return $order->total > 1000 &&
                   $order->status === 'completed' &&
                   $order->created_at->isToday();
        });
    }
}

// ✅ GOOD - Express complex logic in database query
class OrderService
{
    public function getHighValueOrders()
    {
        return Order::where('total', '>', 1000)
            ->where('status', 'completed')
            ->whereDate('created_at', today())
            ->get();
    }
}
```

**2. Use Database Computed Columns for Complex Filtering**

```php
// ❌ BAD - Filtering on computed attributes
class UserService
{
    public function getPremiumUsers()
    {
        // Loads ALL users to check computed attribute
        return User::all()->filter(fn($u) => $u->is_premium);
    }
}

// User Model
class User extends Model
{
    protected $appends = ['is_premium'];

    public function getIsPremiumAttribute()
    {
        return $this->subscription_tier === 'premium' &&
               $this->subscription_expires_at > now();
    }
}

// ✅ GOOD - Filter on actual database columns
class UserService
{
    public function getPremiumUsers()
    {
        return User::where('subscription_tier', 'premium')
            ->where('subscription_expires_at', '>', now())
            ->get();
    }
}

// Even better: Add a database column
// Migration:
Schema::table('users', function (Blueprint $table) {
    $table->boolean('is_premium')->storedAs(
        "subscription_tier = 'premium' AND subscription_expires_at > NOW()"
    );
    $table->index('is_premium');
});

// Then:
class UserService
{
    public function getPremiumUsers()
    {
        return User::where('is_premium', true)->get();
    }
}
```

**3. Whitelist Legacy Code or Complex Analytics**

For legitimate cases where PHP-side filtering is unavoidable (e.g., filtering on third-party API data merged with DB data), publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'best-practices' => [
        'enabled' => true,

        'php-side-filtering' => [
            'whitelist' => [
                'LegacyReportService',      // Complex analytics with external data
                'DataSyncService',           // Merges API data with DB data
                'MigrationValidator',        // Validates data before batch insert
            ],
        ],
    ],
],
```

**4. Optimize When Database Filtering Isn't Possible**

```php
// Sometimes you need PHP filtering (e.g., filtering on external API data)
class ProductService
{
    public function getProductsWithStockFromApi()
    {
        $products = Product::all(); // Need all products
        $stockData = $this->externalApi->getStock(); // External API

        // ⚠️ PHP filtering is necessary here
        return $products->filter(function($product) use ($stockData) {
            return isset($stockData[$product->sku]) &&
                   $stockData[$product->sku] > 0;
        });
    }
}

// ✅ BETTER - Minimize records before filtering
class ProductService
{
    public function getProductsWithStockFromApi()
    {
        // Only fetch active products first
        $products = Product::where('active', true)->get();
        $stockData = $this->externalApi->getStock();

        return $products->filter(function($product) use ($stockData) {
            return isset($stockData[$product->sku]) &&
                   $stockData[$product->sku] > 0;
        });
    }
}

// ✅ BEST - Cache external data in database
class ProductService
{
    public function getProductsWithStock()
    {
        // Sync stock data to database (via scheduled job)
        return Product::where('active', true)
            ->where('stock', '>', 0)
            ->get();
    }
}
```

Files matching any whitelist pattern will be skipped.

## References

- [Laravel Collections](https://laravel.com/docs/collections) - Collection methods documentation
- [Laravel Query Builder](https://laravel.com/docs/queries) - Database query building
- [Eloquent Where Clauses](https://laravel.com/docs/eloquent#where-clauses) - Eloquent filtering
- [Database Indexing](https://laravel.com/docs/migrations#indexes) - Optimizing database queries
- [Larastan noUnnecessaryCollectionCall](https://github.com/larastan/larastan/blob/master/docs/rules.md#no-unnecessary-collection-call) - Complementary rule

## Related Analyzers

- [Collection Call Optimization Analyzer](/analyzers/performance/collection-call-optimization) - Detects common collection anti-patterns via Larastan
- [Eloquent N+1 Query Analyzer](/analyzers/best-practices/eloquent-n-plus-one) - Detects missing eager loading
