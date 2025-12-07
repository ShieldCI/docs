---
title: Magic Number Analyzer
description: Detects hard-coded numbers that should be named constants for better maintainability
icon: code
outline: [2, 3]
tags: maintainability,code-quality,readability,constants
---

# Magic Number Analyzer

| Analyzer ID     | Category         | Severity | Time To Fix |
| ----------------| :--------------: |:--------:| -----------:|
| `magic-number`  | ✅ Code Quality  | Low      | 10 minutes  |

## What This Checks

- Detects hard-coded numeric literals that aren't common values (0, 1, -1, 2, 10, 100, 1000)
- Excludes array indices and increment/decrement operations
- Flags numbers used multiple times (higher severity)
- Reports exact file location and line number of each issue
- Identifies numbers that should be named constants

## Why It Matters

- **Maintainability**: Magic numbers make code harder to understand and modify
- **Documentation**: Named constants explain the purpose of values
- **Consistency**: Constants ensure the same value is used throughout the codebase
- **Refactoring safety**: Changing a constant updates all usages automatically
- **Code clarity**: `MAX_LOGIN_ATTEMPTS` is clearer than `3`
- **Testing**: Constants make it easier to test edge cases
- **Configuration**: Constants can be moved to configuration files
- **Bug prevention**: Typing errors in magic numbers are harder to catch

## How to Fix

### Quick Fix (5 minutes)

Replace magic numbers with constants:

```php
// ❌ Before: Magic numbers
if ($age > 18 && $age < 65) {
    // Process
}

// ✅ After: Named constants
const MIN_AGE = 18;
const MAX_AGE = 65;

if ($age > MIN_AGE && $age < MAX_AGE) {
    // Process
}
```

### Proper Fix (10 minutes)

#### Fix #1: Class Constants

```php
// ❌ Before: Magic numbers scattered throughout
class OrderProcessor
{
    public function process(Order $order)
    {
        if ($order->items->count() > 10) {
            $discount = $order->total * 0.15;
        } elseif ($order->items->count() > 5) {
            $discount = $order->total * 0.10;
        }
        
        if ($order->total > 1000) {
            $shipping = 0;
        } else {
            $shipping = 15;
        }
    }
}

// ✅ After: Class constants
class OrderProcessor
{
    private const BULK_DISCOUNT_THRESHOLD_LARGE = 10;
    private const BULK_DISCOUNT_THRESHOLD_MEDIUM = 5;
    private const BULK_DISCOUNT_RATE_LARGE = 0.15;
    private const BULK_DISCOUNT_RATE_MEDIUM = 0.10;
    private const FREE_SHIPPING_THRESHOLD = 1000;
    private const STANDARD_SHIPPING_COST = 15;

    public function process(Order $order)
    {
        $discount = $this->calculateDiscount($order);
        $shipping = $this->calculateShipping($order);
    }

    private function calculateDiscount(Order $order): float
    {
        $itemCount = $order->items->count();
        
        if ($itemCount > self::BULK_DISCOUNT_THRESHOLD_LARGE) {
            return $order->total * self::BULK_DISCOUNT_RATE_LARGE;
        }
        
        if ($itemCount > self::BULK_DISCOUNT_THRESHOLD_MEDIUM) {
            return $order->total * self::BULK_DISCOUNT_RATE_MEDIUM;
        }
        
        return 0;
    }

    private function calculateShipping(Order $order): float
    {
        return $order->total > self::FREE_SHIPPING_THRESHOLD
            ? 0
            : self::STANDARD_SHIPPING_COST;
    }
}
```

#### Fix #2: Configuration Constants

```php
// ❌ Before: Magic numbers in business logic
class AuthenticationService
{
    public function attemptLogin(string $email, string $password)
    {
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            sleep(2); // Rate limiting
            return false;
        }
        
        $attempts = Cache::get("login_attempts_{$user->id}", 0);
        if ($attempts >= 5) {
            throw new TooManyAttemptsException();
        }
        
        if (!Hash::check($password, $user->password)) {
            Cache::put("login_attempts_{$user->id}", $attempts + 1, 900);
            return false;
        }
        
        Cache::forget("login_attempts_{$user->id}");
        return true;
    }
}

// ✅ After: Configuration constants
class AuthenticationService
{
    private const LOGIN_DELAY_SECONDS = 2;
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOCKOUT_DURATION_SECONDS = 900; // 15 minutes

    public function attemptLogin(string $email, string $password)
    {
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            sleep(self::LOGIN_DELAY_SECONDS);
            return false;
        }
        
        $attempts = Cache::get("login_attempts_{$user->id}", 0);
        if ($attempts >= self::MAX_LOGIN_ATTEMPTS) {
            throw new TooManyAttemptsException();
        }
        
        if (!Hash::check($password, $user->password)) {
            Cache::put(
                "login_attempts_{$user->id}",
                $attempts + 1,
                self::LOCKOUT_DURATION_SECONDS
            );
            return false;
        }
        
        Cache::forget("login_attempts_{$user->id}");
        return true;
    }
}
```

#### Fix #3: Status Code Constants

```php
// ❌ Before: Magic numbers for status codes
class OrderStatus
{
    public function markAsCompleted(Order $order)
    {
        $order->status = 1;
        $order->save();
    }
    
    public function markAsCancelled(Order $order)
    {
        $order->status = 2;
        $order->save();
    }
    
    public function isPending(Order $order): bool
    {
        return $order->status === 0;
    }
}

// ✅ After: Status constants
class OrderStatus
{
    public const PENDING = 0;
    public const COMPLETED = 1;
    public const CANCELLED = 2;
    public const REFUNDED = 3;

    public function markAsCompleted(Order $order)
    {
        $order->status = self::COMPLETED;
        $order->save();
    }
    
    public function markAsCancelled(Order $order)
    {
        $order->status = self::CANCELLED;
        $order->save();
    }
    
    public function isPending(Order $order): bool
    {
        return $order->status === self::PENDING;
    }
}
```

#### Fix #4: Time/Duration Constants

```php
// ❌ Before: Magic numbers for time
class CacheService
{
    public function cacheUserData(User $user)
    {
        Cache::put("user_{$user->id}", $user, 3600);
    }
    
    public function cacheSessionData(string $sessionId, array $data)
    {
        Cache::put("session_{$sessionId}", $data, 1800);
    }
}

// ✅ After: Time constants
class CacheService
{
    private const USER_CACHE_TTL_SECONDS = 3600; // 1 hour
    private const SESSION_CACHE_TTL_SECONDS = 1800; // 30 minutes

    public function cacheUserData(User $user)
    {
        Cache::put(
            "user_{$user->id}",
            $user,
            self::USER_CACHE_TTL_SECONDS
        );
    }
    
    public function cacheSessionData(string $sessionId, array $data)
    {
        Cache::put(
            "session_{$sessionId}",
            $data,
            self::SESSION_CACHE_TTL_SECONDS
        );
    }
}
```

## References

- [PHP Constants](https://www.php.net/manual/en/language.constants.php)
- [PSR-12 Coding Standard](https://www.php-fig.org/psr/psr-12/)
- [Refactoring: Replace Magic Number with Symbolic Constant](https://refactoring.com/catalog/replaceMagicNumberWithSymbolicConstant.html)

## Related Analyzers

- [Method Length Analyzer](/analyzers/code-quality/method-length) - Detects methods that are too long
- [Nesting Depth Analyzer](/analyzers/code-quality/nesting-depth) - Detects excessive code nesting
- [Commented Code Analyzer](/analyzers/code-quality/commented-code) - Detects commented-out code
- [Naming Convention Analyzer](/analyzers/code-quality/naming-convention) - Validates naming standards

