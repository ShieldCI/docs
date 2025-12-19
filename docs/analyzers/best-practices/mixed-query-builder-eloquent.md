---
title: Mixed Query Builder and Eloquent Analyzer
description: Detects inconsistent mixing of Query Builder and Eloquent ORM that bypasses global scopes, relationships, and model events, potentially causing data leaks in multi-tenant applications
icon: shield-alert
outline: [2, 3]
tags: laravel,security,eloquent,query-builder,multi-tenant,data-leak,global-scopes,best-practices,consistency
---

# Mixed Query Builder and Eloquent Analyzer

| Analyzer ID                         | Category           | Severity | Time To Fix |
| ------------------------------------| :----------------: |:--------:| -----------:|
| `mixed-query-builder-eloquent`      | ⚡ Best Practices  | High     | 20 minutes  |

## What This Checks

Detects inconsistent mixing of Query Builder (`DB::table()`) and Eloquent ORM (`Model::where()`) for the same model/table within a single class. Checks:

- **Same-table mixing**: Using both `User::where()` and `DB::table('users')` in the same repository/service
- **QB-via-model patterns**: Converting Eloquent to Query Builder with `toBase()` or `getQuery()`
- **Relationship queries**: Detecting relationship-based queries like `$user->posts()->where()`
- **Method chaining patterns**: Tracking variable assignments like `$query = User::where()` then `$query->get()`
- **Significant mixing**: Classes using Eloquent for some tables and Query Builder for others (3+ QB tables)

## Why It Matters

Mixing Query Builder and Eloquent for the same table **bypasses Eloquent global scopes**, which are critical for:

1. **Multi-tenant isolation** - Prevents Tenant A from seeing Tenant B's data
2. **Soft deletes** - Prevents deleted records from appearing in queries
3. **Permission scopes** - Prevents unauthorized access to restricted records
4. **Published/draft scopes** - Prevents draft content from being publicly visible

**Real-World Security Impact:**

- **Multi-tenant data breach**: Using `DB::table('orders')` instead of `Order::query()` exposes ALL tenants' orders, violating data privacy laws (GDPR, HIPAA)
- **Deleted data exposure**: Bypassing soft deletes with `DB::table('users')` shows deactivated accounts
- **Permission bypass**: Query Builder queries ignore `PublishedScope`, showing draft articles to public users
- **Relationship breaks**: Query Builder doesn't load relationships, causing broken functionality

**Consistency & Maintainability:**

- **Code confusion**: Developers don't know which approach to use, leading to inconsistent patterns
- **Lost features**: Query Builder queries lose Eloquent features (events, accessors, mutators, relationships)
- **Harder refactoring**: Mixed approaches make it difficult to change data access patterns
- **Performance issues**: Can't use Eloquent optimizations like eager loading on QB queries

## How to Fix

### Quick Fix (10 minutes)

**Scenario 1: Convert Query Builder to Eloquent**

```php
// ❌ BAD - Mixing on same table (HIGH SEVERITY)
class UserRepository
{
    public function findActive()
    {
        return User::where('active', true)->get(); // Eloquent
    }

    public function getUserCount()
    {
        return DB::table('users')->count(); // Query Builder - BYPASSES SCOPES!
    }
}

// ✅ GOOD - Use Eloquent consistently
class UserRepository
{
    public function findActive()
    {
        return User::where('active', true)->get();
    }

    public function getUserCount()
    {
        return User::count(); // Uses global scopes ✓
    }
}
```

**Scenario 2: Stop Using toBase() / getQuery()**

```php
// ❌ BAD - Converting to Query Builder bypasses scopes
class OrderService
{
    public function getPendingOrders()
    {
        return Order::where('status', 'pending')->get(); // Eloquent
    }

    public function getOrderCount()
    {
        return Order::query()->toBase()->count(); // Bypasses TenantScope!
    }
}

// ✅ GOOD - Stay with Eloquent
class OrderService
{
    public function getPendingOrders()
    {
        return Order::where('status', 'pending')->get();
    }

    public function getOrderCount()
    {
        return Order::count(); // Respects all scopes ✓
    }
}
```

**Scenario 3: Whitelist Legacy Classes**

For complex analytics that legitimately need raw SQL, publish the config:
```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:
```php
'analyzers' => [
    'best-practices' => [
        'enabled' => true,
        
        'mixed-query-builder-eloquent' => [
            'whitelist' => [
                'LegacyReportRepository',  // Complex joins, raw SQL needed
                'AnalyticsService',         // Performance-critical aggregations
            ],
        ],
    ],
],
```

### Proper Fix (20 minutes)

**1. Audit and Standardize Data Access Patterns**

```php
// ❌ BAD - Inconsistent approach across codebase
class PostRepository
{
    public function findPublished()
    {
        return Post::where('published', true)->get(); // Eloquent
    }

    public function getPostsByCategory($category)
    {
        return DB::table('posts') // Query Builder
            ->where('category', $category)
            ->get();
    }

    public function getRecentPosts()
    {
        return Post::latest()->take(10)->get(); // Eloquent
    }
}

// ✅ GOOD - Consistent Eloquent usage with scopes
class PostRepository
{
    public function findPublished()
    {
        return Post::published()->get(); // Uses PublishedScope
    }

    public function getPostsByCategory($category)
    {
        return Post::published() // Respects global scope
            ->where('category', $category)
            ->get();
    }

    public function getRecentPosts()
    {
        return Post::published()
            ->latest()
            ->limit(10)
            ->get();
    }
}

// Post Model with global scope
class Post extends Model
{
    protected static function booted()
    {
        static::addGlobalScope('published', function ($query) {
            $query->where('published', true);
        });
    }

    public function scopePublished($query)
    {
        return $query; // Already applied via global scope
    }
}
```

**2. Preserve Global Scopes in Multi-Tenant Applications**

```php
// ❌ CRITICAL BUG - Tenant data leak
class DocumentService
{
    public function getUserDocuments($userId)
    {
        // Uses TenantScope ✓
        return Document::where('user_id', $userId)->get();
    }

    public function getDocumentCount()
    {
        // BYPASSES TenantScope - shows ALL tenants' documents! ☠️
        return DB::table('documents')->count();
    }
}

// ✅ SECURE - Respects tenant boundaries
class DocumentService
{
    public function getUserDocuments($userId)
    {
        return Document::where('user_id', $userId)->get();
    }

    public function getDocumentCount()
    {
        return Document::count(); // TenantScope applied ✓
    }
}

// Document Model with tenant scope
class Document extends Model
{
    protected static function booted()
    {
        static::addGlobalScope(new TenantScope);
    }
}

// TenantScope implementation
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        if (auth()->check() && auth()->user()->tenant_id) {
            $builder->where('tenant_id', auth()->user()->tenant_id);
        }
    }
}
```

**3. Use Eloquent for Relationships and Events**

```php
// ❌ BAD - Query Builder loses relationships
class CommentService
{
    public function getCommentsWithUsers()
    {
        $comments = DB::table('comments')->get();

        // Have to manually join users - verbose and error-prone
        foreach ($comments as $comment) {
            $comment->user = DB::table('users')
                ->where('id', $comment->user_id)
                ->first();
        }

        return $comments;
    }
}

// ✅ GOOD - Eloquent handles relationships elegantly
class CommentService
{
    public function getCommentsWithUsers()
    {
        return Comment::with('user')->get(); // Eager loading, 2 queries
    }
}
```

**4. Leverage Model Events and Observers**

```php
// ❌ BAD - Query Builder bypasses model events
class OrderService
{
    public function createOrder($data)
    {
        // Bypasses creating/created events, observers don't fire
        DB::table('orders')->insert($data);
    }
}

// ✅ GOOD - Eloquent fires events
class OrderService
{
    public function createOrder($data)
    {
        // Fires creating/created events, observers run
        return Order::create($data);
    }
}

// OrderObserver gets called
class OrderObserver
{
    public function created(Order $order)
    {
        // Send confirmation email
        // Update inventory
        // Notify admin
    }
}
```

**5. Use Query Builder Only When Necessary**

```php
// ✅ ACCEPTABLE - Complex raw query where Query Builder is appropriate
class ReportService
{
    public function getComplexAnalytics()
    {
        // Complex aggregations with raw SQL - OK to use QB
        return DB::table('orders')
            ->join('products', 'orders.product_id', '=', 'products.id')
            ->join('users', 'orders.user_id', '=', 'users.id')
            ->select(DB::raw('
                DATE(orders.created_at) as date,
                products.category,
                COUNT(*) as order_count,
                SUM(orders.total) as revenue,
                AVG(orders.total) as avg_order_value
            '))
            ->groupBy('date', 'products.category')
            ->get();
    }
}

// But don't mix it with Eloquent in the same class for the same tables!
// If you use QB for orders here, use it everywhere in this class.
```

**6. Document Legitimate Query Builder Usage**

```php
/**
 * Analytics repository using Query Builder for performance.
 *
 * SECURITY NOTE: This repository uses DB::table() for complex analytics
 * queries that don't need model events or global scopes. All queries here
 * are read-only and don't bypass security scopes since they aggregate
 * across all tenants for admin reporting.
 *
 * @shieldci-ignore mixed-query-builder-eloquent
 */
class AnalyticsRepository
{
    public function getTenantStatistics()
    {
        return DB::table('tenants')
            ->select('tenant_id', DB::raw('COUNT(*) as order_count'))
            ->join('orders', 'tenants.id', '=', 'orders.tenant_id')
            ->groupBy('tenant_id')
            ->get();
    }
}
```

## References

- [Laravel Eloquent ORM](https://laravel.com/docs/eloquent) - Official Eloquent documentation
- [Laravel Query Builder](https://laravel.com/docs/queries) - When to use Query Builder
- [Global Scopes](https://laravel.com/docs/eloquent#global-scopes) - Implementing global query scopes
- [Multi-Tenancy in Laravel](https://laravel.com/docs/eloquent#query-scopes) - Building multi-tenant applications
- [Soft Deleting](https://laravel.com/docs/eloquent#soft-deleting) - Using soft deletes properly
- [Model Events](https://laravel.com/docs/eloquent#events) - Eloquent model events

## Related Analyzers

- [Eloquent N+1 Query Analyzer](/analyzers/best-practices/eloquent-n-plus-one) - Detects missing eager loading
- [Raw Eloquent Avoidance Analyzer](/analyzers/best-practices/raw-eloquent-avoidance) - Detects overuse of raw SQL
- [Query Builder in Controller](/analyzers/best-practices/query-builder-in-controller) - Promotes repository pattern
- [Mass Assignment Analyzer](/analyzers/security/mass-assignment) - Prevents mass assignment vulnerabilities
