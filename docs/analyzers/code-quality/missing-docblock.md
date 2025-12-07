---
title: Missing DocBlock Analyzer
description: Flags public methods without proper PHPDoc documentation for better code maintainability
icon: code
outline: [2, 3]
tags: documentation,maintainability,code-quality,readability
---

# Missing DocBlock Analyzer

| Analyzer ID         | Category         | Severity | Time To Fix |
| -------------------| :--------------: |:--------:| -----------:|
| `missing-docblock` | ✅ Code Quality  | Low      | 15 minutes  |

## What This Checks

- Detects public methods missing PHPDoc comments
- Requires `@param` tags for all parameters
- Requires `@return` tag for return values
- Requires `@throws` tags for exceptions (when applicable)
- Excludes simple getter/setter methods (get*, set*, is*, has*)
- Reports exact file location and line number of each issue

## Why It Matters

- **Code documentation**: DocBlocks explain what methods do and how to use them
- **IDE support**: IDEs use DocBlocks for autocomplete and type hints
- **API documentation**: DocBlocks generate API documentation automatically
- **Team collaboration**: New team members understand code faster
- **Type safety**: DocBlocks help catch type mismatches
- **Maintenance**: Well-documented code is easier to modify
- **Best practices**: PSR-5 standardizes DocBlock format
- **Code quality**: Documentation is a sign of professional code

## How to Fix

### Quick Fix (5 minutes)

Add basic DocBlock to public methods:

```php
// ❌ Before: Missing DocBlock
public function calculateTotal($items)
{
    return array_sum(array_column($items, 'price'));
}

// ✅ After: Basic DocBlock
/**
 * Calculate the total price of items.
 *
 * @param  array  $items
 * @return float
 */
public function calculateTotal(array $items): float
{
    return array_sum(array_column($items, 'price'));
}
```

### Proper Fix (15 minutes)

#### Fix #1: Complete DocBlock with Parameters

```php
// ❌ Before: Missing or incomplete DocBlock
public function processOrder(Order $order, User $user, bool $sendEmail)
{
    // Implementation
}

// ✅ After: Complete DocBlock
/**
 * Process an order for a user.
 *
 * @param  \App\Models\Order  $order  The order to process
 * @param  \App\Models\User  $user  The user placing the order
 * @param  bool  $sendEmail  Whether to send confirmation email
 * @return \App\Models\Order
 * @throws \App\Exceptions\InvalidOrderException
 * @throws \App\Exceptions\PaymentFailedException
 */
public function processOrder(Order $order, User $user, bool $sendEmail): Order
{
    // Implementation
}
```

#### Fix #2: Document Return Types

```php
// ❌ Before: Missing return documentation
public function getUserOrders(int $userId)
{
    return User::find($userId)->orders;
}

// ✅ After: Document return type
/**
 * Get all orders for a user.
 *
 * @param  int  $userId
 * @return \Illuminate\Database\Eloquent\Collection<\App\Models\Order>
 */
public function getUserOrders(int $userId)
{
    return User::find($userId)->orders;
}
```

#### Fix #3: Document Exceptions

```php
// ❌ Before: Missing exception documentation
public function chargePayment(Order $order, float $amount)
{
    if ($amount <= 0) {
        throw new InvalidAmountException();
    }
    
    if (!$order->canBeCharged()) {
        throw new PaymentFailedException();
    }
    
    // Charge payment
}

// ✅ After: Document all exceptions
/**
 * Charge a payment for an order.
 *
 * @param  \App\Models\Order  $order
 * @param  float  $amount
 * @return void
 * @throws \App\Exceptions\InvalidAmountException  When amount is invalid
 * @throws \App\Exceptions\PaymentFailedException  When payment cannot be processed
 */
public function chargePayment(Order $order, float $amount): void
{
    if ($amount <= 0) {
        throw new InvalidAmountException();
    }
    
    if (!$order->canBeCharged()) {
        throw new PaymentFailedException();
    }
    
    // Charge payment
}
```

#### Fix #4: Document Complex Parameters

```php
// ❌ Before: Unclear parameter documentation
public function searchUsers(array $filters, int $limit = 10)
{
    // Implementation
}

// ✅ After: Detailed parameter documentation
/**
 * Search users with filters.
 *
 * @param  array<string, mixed>  $filters  Search filters (e.g., ['name' => 'John', 'status' => 'active'])
 * @param  int  $limit  Maximum number of results (default: 10)
 * @return \Illuminate\Database\Eloquent\Collection<\App\Models\User>
 */
public function searchUsers(array $filters, int $limit = 10)
{
    // Implementation
}
```

#### Fix #5: Document Nullable Returns

```php
// ❌ Before: Missing nullable documentation
public function findUserByEmail(string $email)
{
    return User::where('email', $email)->first();
}

// ✅ After: Document nullable return
/**
 * Find a user by email address.
 *
 * @param  string  $email
 * @return \App\Models\User|null
 */
public function findUserByEmail(string $email): ?User
{
    return User::where('email', $email)->first();
}
```

#### Fix #6: Document Array Shapes

```php
// ❌ Before: Unclear array structure
public function getUserStats(int $userId)
{
    return [
        'total_orders' => 10,
        'total_spent' => 1000.00,
        'last_order_date' => '2024-01-15',
    ];
}

// ✅ After: Document array shape
/**
 * Get user statistics.
 *
 * @param  int  $userId
 * @return array{total_orders: int, total_spent: float, last_order_date: string|null}
 */
public function getUserStats(int $userId): array
{
    return [
        'total_orders' => 10,
        'total_spent' => 1000.00,
        'last_order_date' => '2024-01-15',
    ];
}
```

## References

- [PSR-5 PHPDoc Standard](https://github.com/php-fig/fig-standards/blob/master/proposed/phpdoc.md)
- [PHP DocBlock Documentation](https://docs.phpdoc.org/3.0/guide/getting-started/what-is-a-docblock.html)
- [PHPDoc Types](https://docs.phpdoc.org/3.0/guide/guides/types.html)

## Related Analyzers

- [Naming Convention Analyzer](/analyzers/code-quality/naming-convention) - Validates naming standards
- [Method Length Analyzer](/analyzers/code-quality/method-length) - Detects methods that are too long
- [Todo Comment Analyzer](/analyzers/code-quality/todo-comment) - Detects TODO/FIXME comments
- [Commented Code Analyzer](/analyzers/code-quality/commented-code) - Detects commented-out code

