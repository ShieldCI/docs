---
title: Missing Return Statements Analyzer
description: Detects methods and functions with return types that don't return values in all code paths using PHPStan Level 5 static analysis
icon: alert-triangle
outline: [2, 3]
---

# Missing Return Statements Analyzer

| Analyzer ID               | Category       | Severity | Time To Fix |
| --------------------------| :------------: |:--------:| -----------:|
| `missing-return-statement`| ✅ Reliability | High     | 10 minutes  |

## What This Checks

- Detects methods with return types that don't return values in all code paths
- Identifies functions missing return statements despite declaring return types
- Catches incomplete if/else branches that don't return expected values
- Validates all code paths return the declared type
- Uses PHPStan Level 5 static analysis for comprehensive detection
- Reports exact file location and line number of each missing return
- Identifies both explicit return type declarations and docblock types

## Why It Matters

- **Runtime crashes**: Missing return statements cause fatal errors when the code expects a value
- **Type safety violations**: PHP 7.0+ strict return types crash when no value is returned
- **Null pointer exceptions**: Code expecting an object receives null, causing cascading failures
- **Silent bugs**: Missing returns in conditional branches create unpredictable behavior
- **Data corruption**: Functions returning incomplete data lead to database integrity issues
- **API contract violations**: REST endpoints returning null break client applications
- **Testing gaps**: Missing returns often slip through tests if not all paths are covered
- **Production errors**: Common source of "Return value must be of type X, null returned" errors
- **Debugging difficulty**: Missing returns create hard-to-trace bugs in complex logic
- **Code maintenance**: Incomplete functions make refactoring risky and error-prone

## How to Fix

### Quick Fix (5 minutes)

Run locally to see the specific issues:

```bash
vendor/bin/phpstan analyse app --level=5
```

If you have a specific missing return error:

```php
// ❌ Before: Missing return in conditional branch
public function getStatus(): string
{
    if ($this->isActive) {
        return 'active';
    }
    // Missing return for inactive case!
}

// ✅ After: All code paths return a value
public function getStatus(): string
{
    if ($this->isActive) {
        return 'active';
    }

    return 'inactive';
}
```

### Proper Fix (10 minutes)

#### Fix #1: Complete All Conditional Branches

Ensure every if/else branch returns a value:

```php
// ❌ Before: Missing return in else branch
public function calculateDiscount(User $user): float
{
    if ($user->isPremium()) {
        return 0.20;
    } elseif ($user->isRegistered()) {
        return 0.10;
    }
    // Missing return for non-registered users
}

// ✅ After: All branches return a value
public function calculateDiscount(User $user): float
{
    if ($user->isPremium()) {
        return 0.20;
    } elseif ($user->isRegistered()) {
        return 0.10;
    }

    return 0.0; // Default: no discount
}

// ✅ Better: Use early returns for clarity
public function calculateDiscount(User $user): float
{
    if ($user->isPremium()) {
        return 0.20;
    }

    if ($user->isRegistered()) {
        return 0.10;
    }

    return 0.0;
}

// ✅ Best: Use match expression (PHP 8.0+)
public function calculateDiscount(User $user): float
{
    return match (true) {
        $user->isPremium() => 0.20,
        $user->isRegistered() => 0.10,
        default => 0.0,
    };
}
```

#### Fix #2: Handle All Switch Cases

Ensure switch statements have default cases or return in all cases:

```php
// ❌ Before: Missing return for unhandled cases
public function getStatusColor(string $status): string
{
    switch ($status) {
        case 'active':
            return 'green';
        case 'pending':
            return 'yellow';
        case 'inactive':
            return 'red';
    }
    // Missing return for unknown statuses
}

// ✅ After: Default case handles all possibilities
public function getStatusColor(string $status): string
{
    switch ($status) {
        case 'active':
            return 'green';
        case 'pending':
            return 'yellow';
        case 'inactive':
            return 'red';
        default:
            return 'gray'; // Handle unknown statuses
    }
}

// ✅ Better: Use match expression (PHP 8.0+)
public function getStatusColor(string $status): string
{
    return match ($status) {
        'active' => 'green',
        'pending' => 'yellow',
        'inactive' => 'red',
        default => 'gray',
    };
}

// ✅ Alternative: Throw exception for invalid input
public function getStatusColor(string $status): string
{
    return match ($status) {
        'active' => 'green',
        'pending' => 'yellow',
        'inactive' => 'red',
        default => throw new \InvalidArgumentException("Unknown status: {$status}"),
    };
}
```

#### Fix #3: Return After Exceptions

If code throws exceptions, ensure returns exist for non-exception paths:

```php
// ❌ Before: Missing return after exception check
public function processPayment(Order $order): PaymentResult
{
    if ($order->total <= 0) {
        throw new InvalidOrderException('Order total must be positive');
    }

    if ($order->isPaid()) {
        throw new AlreadyPaidException('Order is already paid');
    }

    // Missing return statement!
}

// ✅ After: Always return when not throwing
public function processPayment(Order $order): PaymentResult
{
    if ($order->total <= 0) {
        throw new InvalidOrderException('Order total must be positive');
    }

    if ($order->isPaid()) {
        throw new AlreadyPaidException('Order is already paid');
    }

    // Process payment and return result
    $gateway = PaymentGateway::create();
    $result = $gateway->charge($order->total);

    return new PaymentResult($result);
}
```

#### Fix #4: Early Returns in Complex Logic

Use early returns to simplify logic and ensure all paths return:

```php
// ❌ Before: Complex nested conditions
public function getUserDiscount(User $user, Product $product): float
{
    if ($user->isLoggedIn()) {
        if ($product->isOnSale()) {
            if ($user->isPremium()) {
                return 0.30;
            } else {
                return 0.15;
            }
        }
    }
    // Missing return for non-logged-in or non-sale cases
}

// ✅ After: Early returns make logic clear
public function getUserDiscount(User $user, Product $product): float
{
    // Guard clauses
    if (!$user->isLoggedIn()) {
        return 0.0;
    }

    if (!$product->isOnSale()) {
        return 0.0;
    }

    // Main logic
    if ($user->isPremium()) {
        return 0.30;
    }

    return 0.15;
}

// ✅ Better: Extract to separate methods
public function getUserDiscount(User $user, Product $product): float
{
    if (!$this->isEligibleForDiscount($user, $product)) {
        return 0.0;
    }

    return $this->calculateDiscount($user);
}

private function isEligibleForDiscount(User $user, Product $product): bool
{
    return $user->isLoggedIn() && $product->isOnSale();
}

private function calculateDiscount(User $user): float
{
    return $user->isPremium() ? 0.30 : 0.15;
}
```

#### Fix #5: Null Object Pattern

Instead of returning null, return a null object:

```php
// ❌ Before: Mixing null and objects
public function findUser(int $id): User
{
    $user = DB::table('users')->find($id);

    if ($user) {
        return new User($user);
    }
    // Missing return - implicitly returns null
}

// ✅ After: Always return the expected type
public function findUser(int $id): User
{
    $user = DB::table('users')->find($id);

    if ($user) {
        return new User($user);
    }

    return new GuestUser(); // Null object pattern
}

// ✅ Alternative: Use nullable return type
public function findUser(int $id): ?User
{
    $user = DB::table('users')->find($id);

    if ($user) {
        return new User($user);
    }

    return null; // Explicitly return null
}

// ✅ Better: Throw exception for not found
public function findUser(int $id): User
{
    $user = DB::table('users')->find($id);

    if (!$user) {
        throw new UserNotFoundException("User {$id} not found");
    }

    return new User($user);
}
```

#### Fix #6: Try-Catch Blocks

Ensure try-catch blocks return in all scenarios:

```php
// ❌ Before: Missing return in catch block
public function fetchUserData(int $userId): array
{
    try {
        $response = Http::get("/api/users/{$userId}");
        return $response->json();
    } catch (RequestException $e) {
        Log::error('Failed to fetch user data', ['error' => $e->getMessage()]);
        // Missing return in catch block
    }
}

// ✅ After: Return in all blocks
public function fetchUserData(int $userId): array
{
    try {
        $response = Http::get("/api/users/{$userId}");
        return $response->json();
    } catch (RequestException $e) {
        Log::error('Failed to fetch user data', ['error' => $e->getMessage()]);
        return []; // Return empty array on error
    }
}

// ✅ Alternative: Re-throw exception
public function fetchUserData(int $userId): array
{
    try {
        $response = Http::get("/api/users/{$userId}");
        return $response->json();
    } catch (RequestException $e) {
        Log::error('Failed to fetch user data', ['error' => $e->getMessage()]);
        throw new DataFetchException('Unable to fetch user data', 0, $e);
    }
}
```

#### Fix #7: Change Return Type to Void

If a method shouldn't return a value, declare it void:

```php
// ❌ Before: Declares return type but doesn't need one
public function logActivity(User $user, string $action): bool
{
    ActivityLog::create([
        'user_id' => $user->id,
        'action' => $action,
        'timestamp' => now(),
    ]);
    // Missing return statement
}

// ✅ After: Use void return type
public function logActivity(User $user, string $action): void
{
    ActivityLog::create([
        'user_id' => $user->id,
        'action' => $action,
        'timestamp' => now(),
    ]);
    // No return needed with void
}

// ✅ Alternative: Return boolean for success
public function logActivity(User $user, string $action): bool
{
    try {
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => $action,
            'timestamp' => now(),
        ]);
        return true;
    } catch (\Exception $e) {
        Log::error('Failed to log activity', ['error' => $e->getMessage()]);
        return false;
    }
}
```

## References

- [PHP Return Type Declarations](https://www.php.net/manual/en/functions.returning-values.php)
- [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)
- [Laravel Collections](https://laravel.com/docs/collections)
- [PHP 8 Match Expression](https://www.php.net/manual/en/control-structures.match.php)
- [Clean Code: Functions](https://github.com/ryanmcdermott/clean-code-javascript#functions)

## Related Analyzers

- [Invalid Method Calls Analyzer](/analyzers/reliability/invalid-method-calls) - Detects invalid method calls
- [Invalid Property Access Analyzer](/analyzers/reliability/invalid-property-access) - Detects invalid property access
- [Undefined Variable Usage Analyzer](/analyzers/reliability/undefined-variable) - Detects references to undefined variables
- [Missing Model Relations Analyzer](/analyzers/reliability/missing-model-relation) - Detects missing Eloquent relations
