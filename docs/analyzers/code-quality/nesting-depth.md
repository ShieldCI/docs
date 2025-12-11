---
title: Nesting Depth Analyzer
description: Identifies deeply nested code blocks that reduce readability and maintainability
icon: code
outline: [2, 3]
tags: complexity,maintainability,code-quality,readability
---

# Nesting Depth Analyzer

| Analyzer ID      | Category         | Severity | Time To Fix |
| -----------------| :--------------: |:--------:| -----------:|
| `nesting-depth`  | ✅ Code Quality  | Medium   | 20 minutes  |

## What This Checks

- Detects code blocks with excessive nesting levels (default threshold: 4)
- Identifies deeply nested if/else statements
- Flags nested loops (for, foreach, while)
- Detects nested try/catch blocks
- Tracks maximum nesting depth per method
- Reports exact file location and line number of each issue

## Why It Matters

- **Reduced readability**: Deeply nested code is difficult to understand and follow
- **Maintenance burden**: Complex nesting makes code harder to modify and debug
- **Cognitive load**: Developers spend more mental energy understanding nested logic
- **Testing difficulty**: Deep nesting makes it harder to test all code paths
- **Bug risk**: Complex nested conditions increase the likelihood of logic errors
- **Code review challenges**: Reviewers struggle to understand deeply nested code
- **Refactoring resistance**: Developers avoid touching complex nested code
- **Performance impact**: Deep nesting can indicate inefficient algorithms

## How to Fix

### Quick Fix (5 minutes)

Use early returns to reduce nesting:

```php
// ❌ Before: Deep nesting
if ($user) {
    if ($user->isActive()) {
        if ($user->hasPermission()) {
            if ($user->canAccess($resource)) {
                // Actual logic here
                return $resource->process();
            }
        }
    }
}

// ✅ After: Early returns
if (!$user || !$user->isActive()) {
    return;
}

if (!$user->hasPermission()) {
    return;
}

if (!$user->canAccess($resource)) {
    return;
}

// Actual logic here
return $resource->process();
```

### Proper Fix (20 minutes)

#### 1: Extract Methods

```php
// ❌ Before: Deep nesting in single method
public function processOrder(Order $order, User $user)
{
    if ($order) {
        if ($order->isValid()) {
            if ($user->canProcess($order)) {
                if ($order->hasItems()) {
                    foreach ($order->items as $item) {
                        if ($item->isAvailable()) {
                            // Process item
                        }
                    }
                }
            }
        }
    }
}

// ✅ After: Extract methods to reduce nesting
public function processOrder(Order $order, User $user)
{
    if (!$this->canProcessOrder($order, $user)) {
        return;
    }

    $this->processOrderItems($order);
}

private function canProcessOrder(Order $order, User $user): bool
{
    return $order
        && $order->isValid()
        && $user->canProcess($order);
}

private function processOrderItems(Order $order): void
{
    if (!$order->hasItems()) {
        return;
    }

    foreach ($order->items as $item) {
        if ($item->isAvailable()) {
            $this->processItem($item);
        }
    }
}
```

#### 2: Use Guard Clauses

```php
// ❌ Before: Nested conditions
public function calculatePrice(Product $product, User $user, int $quantity)
{
    if ($product) {
        if ($product->isActive()) {
            if ($quantity > 0) {
                if ($user->isPremium()) {
                    return $product->price * $quantity * 0.9;
                } else {
                    return $product->price * $quantity;
                }
            }
        }
    }
    return 0;
}

// ✅ After: Guard clauses
public function calculatePrice(Product $product, User $user, int $quantity): float
{
    if (!$product || !$product->isActive() || $quantity <= 0) {
        return 0.0;
    }

    $basePrice = $product->price * $quantity;

    return $user->isPremium()
        ? $basePrice * 0.9
        : $basePrice;
}
```

#### 3: Use Strategy Pattern for Complex Conditions

```php
// ❌ Before: Deep nesting with multiple conditions
public function processPayment(Order $order, PaymentMethod $method)
{
    if ($method->isCreditCard()) {
        if ($order->amount > 1000) {
            if ($order->user->isVerified()) {
                // Process credit card
            } else {
                // Require verification
            }
        } else {
            // Process normally
        }
    } elseif ($method->isPayPal()) {
        if ($order->amount > 500) {
            // Process PayPal
        }
    }
}

// ✅ After: Strategy pattern
public function processPayment(Order $order, PaymentMethod $method)
{
    $processor = $this->getPaymentProcessor($method);
    return $processor->process($order);
}

private function getPaymentProcessor(PaymentMethod $method): PaymentProcessor
{
    return match (true) {
        $method->isCreditCard() => new CreditCardProcessor(),
        $method->isPayPal() => new PayPalProcessor(),
        default => new DefaultProcessor(),
    };
}
```

#### 4: Combine Conditions

```php
// ❌ Before: Multiple nested ifs
if ($user) {
    if ($user->isActive()) {
        if ($user->hasRole('admin')) {
            // Admin logic
        }
    }
}

// ✅ After: Combined conditions
if ($user?->isActive() && $user->hasRole('admin')) {
    // Admin logic
}
```

#### 5: Customize ShieldCI Custom Settings (Optional)

To customize the nesting depth threshold, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'code_quality' => [
        'enabled' => true,
        
        'nesting-depth' => [
            'threshold' => 4,  // Default: 4 levels
        ],
    ],
],
```

::: tip
The default threshold of 4 is based on industry best practices. Code with deeper nesting becomes significantly harder to understand and maintain.
:::

## References

- [Clean Code: Reducing Nesting](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Refactoring: Extract Method](https://refactoring.com/catalog/extractMethod.html)
- [PHP Early Returns](https://www.php.net/manual/en/language.control-structures.php)
- [PSR-12 Coding Standard](https://www.php-fig.org/psr/psr-12/)

## Related Analyzers

- [Method Length Analyzer](/analyzers/code-quality/method-length) - Detects methods that are too long
- [Commented Code Analyzer](/analyzers/code-quality/commented-code) - Detects commented-out code
- [Missing DocBlock Analyzer](/analyzers/code-quality/missing-docblock) - Ensures proper documentation

