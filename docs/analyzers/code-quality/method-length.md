---
title: Method Length Analyzer
description: Flags methods exceeding recommended line count thresholds to encourage smaller, single-responsibility functions and better maintainability
icon: code
outline: [2, 3]
tags: complexity,maintainability,code-quality,readability
---

# Method Length Analyzer

| Analyzer ID      | Category         | Severity | Time To Fix |
| -----------------| :--------------: |:--------:| -----------:|
| `method-length`  | 💻 Code Quality  | Low      | 30 minutes  |

## What This Checks

- Detects methods and functions exceeding recommended line count (default threshold: 50 lines)
- Counts physical lines (from declaration to closing brace)
- Excludes **only simple** getter/setter methods (get*, set*, is*, has*) that are ≤ 10 lines
- Large methods matching exclude patterns are still flagged (prevents hiding real problems)
- Reports exact file location and line number of each issue

## Why It Matters

- **Maintainability**: Long methods are harder to understand and modify
- **Testing difficulty**: Long methods are difficult to test comprehensively
- **Single Responsibility**: Long methods often violate the Single Responsibility Principle
- **Code reuse**: Long methods prevent code reuse and extraction
- **Debugging complexity**: Bugs in long methods are harder to locate
- **Code review challenges**: Reviewers struggle to understand long methods
- **Refactoring resistance**: Developers avoid modifying long, complex methods
- **Cognitive load**: Long methods require more mental effort to understand

## How to Fix

### Quick Fix (5 minutes)

Extract a small portion of logic into a separate method:

```php
// ❌ BAD - Long method
public function processOrder(Order $order)
{
    // 60+ lines of code
    $order->status = 'processing';
    $order->save();
    // ... many more lines
}

// ✅ GOOD - Extract one piece
public function processOrder(Order $order)
{
    $this->updateOrderStatus($order, 'processing');
    // ... rest of logic
}

private function updateOrderStatus(Order $order, string $status): void
{
    $order->status = $status;
    $order->save();
}
```

### Proper Fix (30 minutes)

#### 1: Extract Related Logic

```php
// ❌ BAD - Long method with multiple responsibilities
public function processPayment(Order $order, PaymentMethod $method)
{
    // Validate order (10 lines)
    if (!$order->isValid()) {
        throw new InvalidOrderException();
    }
    if ($order->amount <= 0) {
        throw new InvalidAmountException();
    }
    // ... more validation

    // Process payment (20 lines)
    $transaction = new Transaction();
    $transaction->order_id = $order->id;
    $transaction->amount = $order->amount;
    // ... more processing

    // Send notifications (15 lines)
    Mail::to($order->user)->send(new OrderConfirmation($order));
    // ... more notifications

    // Update order status (10 lines)
    $order->status = 'completed';
    $order->save();
    // ... more updates
}

// ✅ GOOD - Extract into focused methods
public function processPayment(Order $order, PaymentMethod $method)
{
    $this->validateOrder($order);
    $transaction = $this->createTransaction($order, $method);
    $this->sendNotifications($order);
    $this->updateOrderStatus($order, 'completed');
}

private function validateOrder(Order $order): void
{
    if (!$order->isValid()) {
        throw new InvalidOrderException();
    }
    if ($order->amount <= 0) {
        throw new InvalidAmountException();
    }
}

private function createTransaction(Order $order, PaymentMethod $method): Transaction
{
    $transaction = new Transaction();
    $transaction->order_id = $order->id;
    $transaction->amount = $order->amount;
    $transaction->method = $method->type;
    $transaction->save();
    return $transaction;
}

private function sendNotifications(Order $order): void
{
    Mail::to($order->user)->send(new OrderConfirmation($order));
    // Additional notifications
}

private function updateOrderStatus(Order $order, string $status): void
{
    $order->status = $status;
    $order->save();
}
```

#### 2: Extract Complex Algorithms

```php
// ❌ BAD - Long method with complex calculation
public function calculateShippingCost(Order $order): float
{
    $baseCost = 10.0;
    $weight = 0;
    foreach ($order->items as $item) {
        $weight += $item->weight * $item->quantity;
    }
    if ($weight > 10) {
        $baseCost += ($weight - 10) * 2;
    }
    if ($order->isExpress()) {
        $baseCost *= 1.5;
    }
    if ($order->user->isPremium()) {
        $baseCost *= 0.9;
    }
    // ... 30 more lines of calculations
    return $baseCost;
}

// ✅ GOOD - Extract calculation logic
public function calculateShippingCost(Order $order): float
{
    $baseCost = $this->getBaseShippingCost();
    $weightCost = $this->calculateWeightCost($order);
    $expressMultiplier = $this->getExpressMultiplier($order);
    $discountMultiplier = $this->getDiscountMultiplier($order);

    return ($baseCost + $weightCost) * $expressMultiplier * $discountMultiplier;
}

private function getBaseShippingCost(): float
{
    return 10.0;
}

private function calculateWeightCost(Order $order): float
{
    $weight = $this->getTotalWeight($order);
    return $weight > 10 ? ($weight - 10) * 2 : 0;
}

private function getTotalWeight(Order $order): float
{
    return $order->items->sum(fn($item) => $item->weight * $item->quantity);
}

private function getExpressMultiplier(Order $order): float
{
    return $order->isExpress() ? 1.5 : 1.0;
}

private function getDiscountMultiplier(Order $order): float
{
    return $order->user->isPremium() ? 0.9 : 1.0;
}
```

#### 3: Use Service Classes

```php
// ❌ BAD - Long controller method
public function store(Request $request)
{
    // Validation (15 lines)
    $validated = $request->validate([...]);
    
    // Business logic (30 lines)
    $order = new Order();
    $order->user_id = auth()->id();
    // ... many more lines
    
    // Database operations (10 lines)
    $order->save();
    // ... more operations
    
    // Response (5 lines)
    return response()->json($order);
}

// ✅ GOOD - Extract to service class
public function store(StoreOrderRequest $request, OrderService $service)
{
    $order = $service->createOrder($request->validated());
    return response()->json($order);
}

// OrderService.php
class OrderService
{
    public function createOrder(array $data): Order
    {
        $order = $this->buildOrder($data);
        $this->saveOrder($order);
        $this->attachItems($order, $data['items']);
        return $order;
    }

    private function buildOrder(array $data): Order
    {
        // Build order logic
    }

    private function saveOrder(Order $order): void
    {
        // Save logic
    }

    private function attachItems(Order $order, array $items): void
    {
        // Attach items logic
    }
}
```

#### 4: Extract Conditional Logic

```php
// ❌ BAD - Long method with many conditionals
public function processUser(User $user)
{
    if ($user->isNew()) {
        // 20 lines of new user logic
    } elseif ($user->isReturning()) {
        // 20 lines of returning user logic
    } elseif ($user->isPremium()) {
        // 20 lines of premium user logic
    }
}

// ✅ GOOD - Strategy pattern or separate methods
public function processUser(User $user)
{
    $processor = $this->getUserProcessor($user);
    return $processor->process($user);
}

private function getUserProcessor(User $user): UserProcessor
{
    return match (true) {
        $user->isNew() => new NewUserProcessor(),
        $user->isReturning() => new ReturningUserProcessor(),
        $user->isPremium() => new PremiumUserProcessor(),
        default => new DefaultUserProcessor(),
    };
}
```

## ShieldCI Configuration

To customize the method length threshold and excluded patterns, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'code-quality' => [
        'enabled' => true,
        
        'method-length' => [
            'threshold' => 50,  // Default: 50 physical lines (method declaration to closing brace)
            'exclude_patterns' => ['get*', 'set*', 'is*', 'has*'],  // Patterns to exclude
            'simple_accessor_max_lines' => 10,  // Default: 10 lines - max size for simple accessors
            'ignore_fluent_chains' => true,  // Default: true - skip declarative fluent-builder methods (control flow inside callback closures is ignored)
        ],
    ],
],
```

::: tip Line Counting Method
The analyzer counts **physical lines** - the actual number of lines you see in your editor from the method declaration to the closing brace. This includes blank lines, comments, and code within the method body. The default threshold of 50 lines is based on industry best practices. Methods longer than this become harder to test and understand. Consider extracting logic into smaller, focused methods.
:::

::: info Smart Getter/Setter Exclusion

ShieldCI uses **smart exclusion** to prevent false positives while catching real problems:

**✅ Excluded (Simple Accessors ≤ 10 lines):**
```php
public function getUser() {
    return $this->user;
}

public function setEmail($email) {
    $this->email = $email;
}

public function isActive() {
    return $this->status === 'active';
}
```

**❌ NOT Excluded (Large Methods > 10 lines):**
```php
public function getUsersWithComplexFiltering() {
    // ... 60 lines of filtering logic ...
    // This WILL be flagged even though it starts with "get"
}

public function setConfigurationFromMultipleSources($sources) {
    // ... 50 lines of configuration logic ...
    // This WILL be flagged even though it starts with "set"
}
```

This prevents hiding legitimate problems behind broad pattern matching. You can customize:
- **excluded patterns** (`exclude_patterns`) - Which method name patterns to check (default: `get*`, `set*`, `is*`, `has*`)
- **simple accessor threshold** (`simple_accessor_max_lines`) - Maximum lines for a method to be considered "simple" (default: 10 lines)

For example, if your team considers accessors up to 15 lines as "simple", you can increase the threshold:

```php
'method-length' => [
    'simple_accessor_max_lines' => 15,  // More lenient: allow larger accessors
],
```

Or make it stricter:

```php
'method-length' => [
    'simple_accessor_max_lines' => 5,  // Stricter: only very small accessors excluded
],
```
:::

## References

- [Refactoring: Extract Method](https://refactoring.com/catalog/extractMethod.html)
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
- [PSR-12 Coding Standard](https://www.php-fig.org/psr/psr-12/)

## Related Analyzers

- [Nesting Depth Analyzer](/analyzers/code-quality/nesting-depth) - Detects excessive code nesting
- [Missing DocBlock Analyzer](/analyzers/code-quality/missing-docblock) - Ensures proper documentation
- [Commented Code Analyzer](/analyzers/code-quality/commented-code) - Detects commented-out code

