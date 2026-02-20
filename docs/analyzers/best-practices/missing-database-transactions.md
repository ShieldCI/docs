---
title: Missing Database Transactions Analyzer
description: Detects multiple database write operations without transaction protection, ensuring ACID compliance and data integrity
icon: database
outline: [2, 3]
tags: laravel,database,transactions,data-integrity,acid,best-practices,eloquent,query-builder
---

# Missing Database Transactions Analyzer

| Analyzer ID                           | Category           | Severity | Time To Fix |
| ------------------------------------- | :----------------: |:--------:| -----------:|
| `missing-database-transactions`       | 🏅 Best Practices  | High     | 25 minutes  |

## What This Checks

Detects methods that perform multiple database write operations without transaction protection. Checks:

- **Multiple write operations**: Methods with 2+ database writes (create, update, delete, increment, etc.)
- **Missing transaction wrapper**: No `DB::transaction()` or `DB::beginTransaction()` protection
- **Scope validation**: Writes occurring outside transaction closures or try-catch blocks
- **Mixed protection**: Some writes protected while others are not

**Smart Detection Features:**
- ✅ Tracks transaction scope depth (closures and try-catch blocks)
- ✅ Detects Eloquent model operations (static and instance methods)
- ✅ Detects query builder operations (`DB::table()->update()`)
- ✅ Detects relationship operations (sync, attach, detach)
- ✅ Distinguishes protected vs unprotected writes
- ✅ Configurable threshold (default: 2 writes)

**Detected Write Operations:**
- Eloquent: `create()`, `insert()`, `update()`, `delete()`, `save()`, `forceDelete()`, `upsert()`, `updateOrCreate()`, `increment()`, `decrement()`, `touch()`
- Query Builder: `DB::insert()`, `DB::update()`, `DB::delete()`, `DB::statement()`, `DB::table()->insert()`
- Relationships: `sync()`, `attach()`, `detach()`, `toggle()`, `syncWithoutDetaching()`

## Why It Matters

Without transaction protection, multiple database operations can fail partially, leaving your database in an inconsistent state:

- **Data Inconsistency**: If one operation succeeds but a later operation fails, your database ends up in an inconsistent state
- **Partial Updates**: Users may see incomplete data changes (user without profile, order without items)
- **Race Conditions**: Concurrent requests can interleave operations, causing data corruption
- **Difficult Recovery**: No automatic rollback means manual data cleanup is required
- **Lost Data**: Failed operations may leave orphaned records or missing relationships
- **Compliance Risk**: ACID violations may breach regulatory requirements for data integrity

## How to Fix

### Quick Fix (5 minutes)

Wrap your multiple write operations in `DB::transaction()`:

**Before:**
```php
public function createOrder(array $data)
{
    $order = Order::create($data['order']);
    OrderItem::create(['order_id' => $order->id, 'product_id' => 1]);
    Inventory::where('product_id', 1)->decrement('stock');
}
```

**After:**
```php
public function createOrder(array $data)
{
    return DB::transaction(function () use ($data) {
        $order = Order::create($data['order']);
        OrderItem::create(['order_id' => $order->id, 'product_id' => 1]);
        Inventory::where('product_id', 1)->decrement('stock');

        return $order;
    });
}
```

### Proper Fix (25 minutes)

Implement comprehensive transaction handling with error recovery:

**1. Service Layer Pattern with Transactions**

```php
class UserRegistrationService
{
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            // All operations succeed or all fail together
            $user = User::create($data['user']);
            $user->profile()->create($data['profile']);
            $user->sendEmailVerificationNotification();

            ActivityLog::create([
                'action' => 'user_registered',
                'user_id' => $user->id,
            ]);

            return $user;
        });
    }
}
```

**2. Manual Transaction Control for Complex Logic**

```php
class OrderService
{
    public function processOrder(Order $order)
    {
        DB::beginTransaction();

        try {
            // Update order status
            $order->update(['status' => 'processing']);

            // Reduce inventory for each item
            foreach ($order->items as $item) {
                Inventory::where('product_id', $item->product_id)
                    ->decrement('stock', $item->quantity);
            }

            // Process payment
            $payment = $this->paymentGateway->charge($order->total);
            Payment::create([
                'order_id' => $order->id,
                'transaction_id' => $payment->id,
                'amount' => $order->total,
            ]);

            // Mark order as complete
            $order->update(['status' => 'completed']);

            DB::commit();
            return $order;

        } catch (\Exception $e) {
            DB::rollBack();

            // Log the error
            \Log::error('Order processing failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
```

**3. Nested Transactions with Savepoints**

Laravel automatically uses database savepoints for nested transactions:

```php
public function importUsers(array $users)
{
    DB::transaction(function () use ($users) {
        foreach ($users as $userData) {
            // Each iteration can have its own transaction
            // Laravel uses savepoints internally
            DB::transaction(function () use ($userData) {
                $user = User::create($userData);
                $user->profile()->create($userData['profile']);
                $user->assignRole($userData['role']);
            });
        }
    });
}
```

**4. Retry Failed Transactions**

```php
use Illuminate\Support\Facades\DB;

public function createUserWithRetry(array $data): User
{
    $attempts = 0;
    $maxAttempts = 3;

    while ($attempts < $maxAttempts) {
        try {
            return DB::transaction(function () use ($data) {
                $user = User::create($data['user']);
                $user->profile()->create($data['profile']);

                return $user;
            });
        } catch (\Illuminate\Database\QueryException $e) {
            $attempts++;

            // Only retry on deadlock or lock timeout
            if ($e->getCode() === '40001' && $attempts < $maxAttempts) {
                // Wait before retrying (exponential backoff)
                usleep(100000 * $attempts); // 100ms, 200ms, 300ms
                continue;
            }

            throw $e;
        }
    }
}
```

**5. Conditional Transactions (Advanced)**

```php
public function updateUser(User $user, array $data, bool $sendNotifications = false)
{
    return DB::transaction(function () use ($user, $data, $sendNotifications) {
        // Update user
        $user->update($data);

        // Log the change
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'profile_updated',
            'changes' => $data,
        ]);

        // Conditional operation inside same transaction
        if ($sendNotifications) {
            Notification::create([
                'user_id' => $user->id,
                'type' => 'profile_updated',
            ]);
        }

        return $user;
    });
}
```

**6. Transaction Isolation Levels (Advanced)**

```php
use Illuminate\Support\Facades\DB;

public function transferFunds(User $from, User $to, float $amount)
{
    // Use serializable isolation for financial transactions
    DB::statement('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    return DB::transaction(function () use ($from, $to, $amount) {
        // Read current balances
        $from->refresh();
        $to->refresh();

        // Validate sufficient funds
        if ($from->balance < $amount) {
            throw new \Exception('Insufficient funds');
        }

        // Perform transfer
        $from->decrement('balance', $amount);
        $to->increment('balance', $amount);

        // Log transaction
        Transaction::create([
            'from_user_id' => $from->id,
            'to_user_id' => $to->id,
            'amount' => $amount,
        ]);

        return true;
    });
}
```

**7. Audit Logging Outside Transactions**

Some operations should persist even if the main transaction fails:

```php
public function deleteUser(User $user)
{
    // Log deletion attempt BEFORE transaction
    // This persists even if deletion fails
    $auditLog = ActivityLog::create([
        'action' => 'user_deletion_attempted',
        'user_id' => $user->id,
        'timestamp' => now(),
    ]);

    try {
        DB::transaction(function () use ($user) {
            // Delete related records
            $user->profile()->delete();
            $user->posts()->delete();
            $user->comments()->delete();

            // Delete user
            $user->delete();
        });

        // Update audit log on success
        $auditLog->update(['status' => 'success']);

    } catch (\Exception $e) {
        // Update audit log on failure
        $auditLog->update([
            'status' => 'failed',
            'error' => $e->getMessage(),
        ]);

        throw $e;
    }
}
```

**8. Configuration and Customization**

Customize the analyzer for your project, publish the config:
```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'best-practices' => [
        'enabled' => true,
        
        'missing-database-transactions' => [
            // Minimum number of writes to require a transaction
            // Default: 2
            'threshold' => 2,
        ],
    ],
],
```

## References

- [Laravel Database Transactions Documentation](https://laravel.com/docs/database#database-transactions)
- [ACID Properties (Wikipedia)](https://en.wikipedia.org/wiki/ACID)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [MySQL InnoDB Locking](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html)
- [Database Transaction Best Practices](https://use-the-index-luke.com/sql/dml/insert)

## Related Analyzers

- [SQL Injection Analyzer](/analyzers/security/sql-injection) - Detects unsafe SQL query construction
- [Eloquent N+1 Query Analyzer](/analyzers/best-practices/eloquent-n-plus-one) - Detects relationship loading without eager loading
