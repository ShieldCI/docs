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
| `missing-docblock` | 💻 Code Quality  | Low      | 15 minutes  |

## What This Checks

- Detects public methods missing PHPDoc comments
- Requires `@param` tags for parameters with **generic types** (array, iterable, object, mixed, callable) or no type hints
- Requires `@return` tag for **generic return types** or class names (not needed for scalar types like void, string, int, bool, float)
- Requires `@throws` tags for exceptions (when applicable)
- Excludes simple getter/setter methods (get*, set*, is*, has*)
- Reports exact file location and line number of each issue

**Follows PSR-2 conventions**: `@param` and `@return` tags are redundant for non-generic native types but required for generic types to specify their structure.

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

// ✅ After: DocBlock with generic type documentation
/**
 * Calculate the total price of items.
 *
 * @param  array<int, array{price: float}>  $items  Array of items with price field
 */
public function calculateTotal(array $items): float
{
    return array_sum(array_column($items, 'price'));
}
```

**Note**: The `@return float` tag is omitted because `float` is a scalar type (self-documenting). The `@param` tag is required because `array` is a generic type that needs structure specification.

### Proper Fix (15 minutes)

#### 1: Complete DocBlock with Parameters

```php
// ❌ Before: Missing or incomplete DocBlock
public function processOrder(Order $order, User $user, bool $sendEmail)
{
    // Implementation
}

// ✅ After: Complete DocBlock (class types documented, scalar types omitted)
/**
 * Process an order for a user.
 *
 * @param  \App\Models\Order  $order  The order to process
 * @param  \App\Models\User  $user  The user placing the order
 * @return \App\Models\Order
 * @throws \App\Exceptions\InvalidOrderException
 * @throws \App\Exceptions\PaymentFailedException
 */
public function processOrder(Order $order, User $user, bool $sendEmail): Order
{
    // Implementation
}
```

**Note**: The `bool $sendEmail` parameter doesn't need a `@param` tag because `bool` is a scalar type (self-documenting). If you want to document what it does, you can optionally include it, but it's not required by this analyzer.

#### 2: Document Generic Return Types

```php
// ❌ Before: Missing return documentation for Collection (generic type)
public function getUserOrders(int $userId)
{
    return User::find($userId)->orders;
}

// ✅ After: Document generic collection return type
/**
 * Get all orders for a user.
 *
 * @return \Illuminate\Database\Eloquent\Collection<\App\Models\Order>
 */
public function getUserOrders(int $userId)
{
    return User::find($userId)->orders;
}
```

**Note**: The `int $userId` parameter doesn't need a `@param` tag because `int` is a scalar type (self-documenting). The `@return` tag IS required because `Collection` is a generic type that needs to specify what it contains.

#### 3: Document Exceptions

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

// ✅ After: Document all exceptions (class param and exceptions only)
/**
 * Charge a payment for an order.
 *
 * @param  \App\Models\Order  $order  The order to charge
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

**Note**: Both `float $amount` and `: void` don't need documentation because they're scalar types (self-documenting).

#### 4: Document Complex Parameters

```php
// ❌ Before: Missing documentation for array parameter (generic type)
public function searchUsers(array $filters, int $limit = 10)
{
    // Implementation
}

// ✅ After: Document array structure and generic return type
/**
 * Search users with filters.
 *
 * @param  array<string, mixed>  $filters  Search filters (e.g., ['name' => 'John', 'status' => 'active'])
 * @return \Illuminate\Database\Eloquent\Collection<\App\Models\User>
 */
public function searchUsers(array $filters, int $limit = 10)
{
    // Implementation
}
```

**Note**: The `int $limit` parameter doesn't need a `@param` tag because `int` is a scalar type. The `array $filters` parameter DOES need documentation because `array` is a generic type that needs structure specification.

#### 5: Document Nullable Class Returns

```php
// ❌ Before: Missing documentation for nullable class return
public function findUserByEmail(string $email)
{
    return User::where('email', $email)->first();
}

// ✅ After: Document nullable class return type
/**
 * Find a user by email address.
 *
 * @return \App\Models\User|null
 */
public function findUserByEmail(string $email): ?User
{
    return User::where('email', $email)->first();
}
```

**Note**: The `string $email` parameter doesn't need a `@param` tag because `string` is a scalar type. The `@return` tag IS required because `User` is a class name (even when nullable).

#### 6: Document Array Shapes

```php
// ❌ Before: Missing documentation for array return (generic type)
public function getUserStats(int $userId): array
{
    return [
        'total_orders' => 10,
        'total_spent' => 1000.00,
        'last_order_date' => '2024-01-15',
    ];
}

// ✅ After: Document array shape with precise structure
/**
 * Get user statistics.
 *
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

**Note**: The `int $userId` parameter doesn't need a `@param` tag because `int` is a scalar type. The `@return` tag IS required because `array` is a generic type that needs its shape documented.

## References

- [PSR-2 Coding Style Guide](https://www.php-fig.org/psr/psr-2/) - Laravel follows PSR-2 conventions
- [PSR-5 PHPDoc Standard](https://github.com/php-fig/fig-standards/blob/master/proposed/phpdoc.md) - PHPDoc documentation standard
- [PHP DocBlock Documentation](https://docs.phpdoc.org/3.0/guide/getting-started/what-is-a-docblock.html) - Complete DocBlock guide
- [PHPDoc Types](https://docs.phpdoc.org/3.0/guide/guides/types.html) - Type annotation reference

## Related Analyzers

- [Naming Convention Analyzer](/analyzers/code-quality/naming-convention) - Validates naming standards
- [Method Length Analyzer](/analyzers/code-quality/method-length) - Detects methods that are too long
- [Commented Code Analyzer](/analyzers/code-quality/commented-code) - Detects commented-out code

