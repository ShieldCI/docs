---
title: Commented Code Analyzer
description: Detects commented-out code that should be removed in favor of version control
icon: code
outline: [2, 3]
tags: maintainability,code-quality,comments,dead-code,version-control
---

# Commented Code Analyzer

| Analyzer ID        | Category         | Severity | Time To Fix |
| ------------------| :--------------: |:--------:| -----------:|
| `commented-code`  | 💻 Code Quality  | Low      | 5 minutes   |

## What This Checks

- Detects commented-out code blocks (minimum 3 consecutive lines)
- Identifies code-like patterns in comments (variables, functions, classes, control structures)
- Flags common code indicators (function calls, assignments, method calls, etc.)
- Excludes genuine documentation comments
- Reports exact file location and line number of each issue

## Why It Matters

- **Code clarity**: Commented code reduces readability and confuses developers
- **Version control**: Git history preserves old code, so commented code is redundant
- **Maintenance burden**: Commented code makes files longer and harder to navigate
- **Confusion**: Developers may wonder if commented code should be uncommented
- **Dead code**: Commented code is dead code that serves no purpose
- **Code review**: Reviewers waste time reviewing commented-out code
- **File size**: Commented code increases file size unnecessarily
- **Best practices**: Clean code should not contain commented-out code

## How to Fix

### Quick Fix (2 minutes)

Remove commented code and rely on version control:

```php
// ❌ BAD - Commented code
// function oldCalculatePrice($product) {
//     return $product->price * 1.2;
// }

function calculatePrice($product)
{
    return $product->price * $this->getTaxRate();
}

// ✅ GOOD - Remove commented code
function calculatePrice($product)
{
    return $product->price * $this->getTaxRate();
}
```

### Proper Fix (5 minutes)

#### 1: Remove Old Implementation

```php
// ❌ BAD - Old implementation commented out
// public function processOrder(Order $order)
// {
//     $order->status = 'processing';
//     $order->save();
//     // ... 20 lines of old code
// }

public function processOrder(Order $order)
{
    $this->orderService->process($order);
}

// ✅ GOOD - Remove commented code
public function processOrder(Order $order)
{
    $this->orderService->process($order);
}
```

#### 2: Use Git for History

```php
// ❌ BAD - Keeping old code for reference
// Old validation logic:
// if (strlen($email) < 5) {
//     throw new ValidationException('Email too short');
// }
// if (!str_contains($email, '@')) {
//     throw new ValidationException('Invalid email');
// }

// Current validation
$request->validate(['email' => 'required|email']);

// ✅ GOOD - Remove and use git log if needed
$request->validate(['email' => 'required|email']);

// If you need to see old code:
// git log -p app/Http/Controllers/UserController.php
```

#### 3: Extract to Documentation

```php
// ❌ BAD - Commented code with explanation
// This was the old way to calculate discounts:
// $discount = 0;
// if ($order->total > 100) {
//     $discount = $order->total * 0.1;
// }
// if ($order->user->isPremium()) {
//     $discount += $order->total * 0.05;
// }

// Current implementation
$discount = $this->discountCalculator->calculate($order);

// ✅ GOOD - Move to documentation
// See docs/discount-calculation.md for historical context
$discount = $this->discountCalculator->calculate($order);
```

#### 4: Remove Debug Code

```php
// ❌ BAD - Commented debug code
// var_dump($user);
// print_r($order->toArray());
// die('Debug point');

public function processOrder(Order $order)
{
    // Actual code
}

// ✅ GOOD - Use proper logging
public function processOrder(Order $order)
{
    Log::debug('Processing order', ['order_id' => $order->id]);
    // Actual code
}
```

#### 5: Remove Alternative Implementations

```php
// ❌ BAD - Multiple commented alternatives
// Option 1: Direct database query
// $users = DB::table('users')->where('active', 1)->get();

// Option 2: Eloquent query
// $users = User::where('active', 1)->get();

// Option 3: Using repository
$users = $this->userRepository->getActiveUsers();

// ✅ GOOD - Keep only the chosen implementation
$users = $this->userRepository->getActiveUsers();
```

#### 6: Remove Conditional Code Blocks

```php
// ❌ BAD - Commented conditional logic
// if ($feature->isEnabled('new-payment')) {
//     return $this->processNewPayment($order);
// } else {
//     return $this->processOldPayment($order);
// }

return $this->paymentProcessor->process($order);

// ✅ GOOD - Remove commented code
return $this->paymentProcessor->process($order);
```

#### 7: Customize ShieldCI Settings (Optional)

To customize the commented code detection sensitivity, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'code-quality' => [
        'enabled' => true,
        
        'commented-code' => [
            // Minimum consecutive commented lines to flag
            'min_consecutive_lines' => 3,  // Default: 3 lines

            // Maximum neutral lines (blank comments) allowed within a block
            'max_neutral_lines' => 2,      // Default: 2 lines

            // Minimum score threshold to classify content as code
            'code_score_threshold' => 2,   // Default: 2 points
        ],
    ],
],
```

::: tip Configuration Guide

**min_consecutive_lines**: Controls the minimum number of lines required to flag a block
- **Strict** (2): Catch even small commented blocks
- **Balanced** (3): Standard detection (recommended)
- **Lenient** (5-10): Focus on large commented sections
- **Legacy** (10+): Only flag massive dead code sections

**max_neutral_lines**: Controls spacing tolerance within comment blocks
- **Dense** (0-1): Minimal spacing, any blank line may break the block
- **Standard** (2): Reasonable spacing tolerance (recommended)
- **Spaced** (3-5): For teams that add blank comment lines for readability

**code_score_threshold**: Controls what counts as "code" vs documentation
- **Strict** (1): Any code pattern triggers detection (may increase false positives)
- **Balanced** (2): Filters weak signals like lone `$variable` mentions (recommended)
- **Lenient** (3-4): Only structural code like `function`, `class`, `if` statements

:::

## References

- [Git Documentation](https://git-scm.com/doc)
- [PSR-12 Coding Standard](https://www.php-fig.org/psr/psr-12/)
- [Refactoring: Remove Dead Code](https://refactoring.com/catalog/removeDeadCode.html)

## Related Analyzers

- [Method Length Analyzer](/analyzers/code-quality/method-length) - Detects methods that are too long
- [Missing DocBlock Analyzer](/analyzers/code-quality/missing-docblock) - Ensures proper documentation

