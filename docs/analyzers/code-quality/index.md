---
title: Code Quality Analyzers
description: 15 analyzers maintaining clean, maintainable code following Laravel conventions and PSR standards
icon: code
outline: [2, 3]
---

# Code Quality Analyzers

**15 analyzers** maintaining clean, maintainable code following Laravel conventions and PSR standards.

## Overview

Code Quality analyzers focus on maintaining high code standards, reducing complexity, improving readability, and ensuring code follows best practices. These analyzers help teams write consistent, maintainable code that's easier to understand and modify.

## Key Analyzers

### Complexity Analysis

- **[Cognitive Complexity](/analyzers/code-quality/cognitive-complexity)** - Measures how difficult code is to understand mentally
- **[Cyclomatic Complexity](/analyzers/code-quality/cyclomatic-complexity)** - Measures the number of linearly independent paths through code
- **[Complex Conditional](/analyzers/code-quality/complex-conditional)** - Detects overly complex conditional statements
- **[Nesting Depth](/analyzers/code-quality/nesting-depth)** - Detects excessive code nesting levels

### Code Structure

- **[Class Length](/analyzers/code-quality/class-length)** - Detects classes that exceed recommended length limits
- **[Method Length](/analyzers/code-quality/method-length)** - Detects methods that exceed recommended length limits
- **[Long Parameter List](/analyzers/code-quality/long-parameter-list)** - Detects methods with too many parameters
- **[Parameter Count](/analyzers/code-quality/parameter-count)** - Validates parameter count against best practices

### Code Smells

- **[Commented Code](/analyzers/code-quality/commented-code)** - Detects commented-out code that should be removed
- **[Duplicate Code](/analyzers/code-quality/duplicate-code)** - Detects code duplication that should be refactored
- **[Magic Number](/analyzers/code-quality/magic-number)** - Detects magic numbers that should be constants
- **[Todo Comment](/analyzers/code-quality/todo-comment)** - Tracks TODO comments that need attention

### Documentation & Naming

- **[Missing DocBlock](/analyzers/code-quality/missing-docblock)** - Ensures methods and classes have proper documentation
- **[Naming Convention](/analyzers/code-quality/naming-convention)** - Validates naming follows PSR and Laravel conventions
- **[Inconsistent Naming](/analyzers/code-quality/inconsistent-naming)** - Detects inconsistent naming patterns across codebase

## How They Work

Code Quality analyzers use:

1. **AST Parsing:** Analyzes code structure to measure complexity and detect patterns
2. **Pattern Matching:** Identifies code smells and anti-patterns
3. **Metrics Calculation:** Computes complexity metrics (cyclomatic, cognitive)
4. **Convention Validation:** Checks code against PSR standards and Laravel conventions

## Severity Levels

| Severity | Description | Examples |
|----------|-------------|----------|
| **High** | Issues that significantly impact maintainability | Excessive complexity, very long methods, deep nesting |
| **Medium** | Issues that reduce code quality | Code duplication, magic numbers, missing documentation |
| **Low** | Best practice violations | TODO comments, naming inconsistencies |

## Common Issues

### Complexity Issues

**High Cyclomatic Complexity:**
```php
// ❌ BAD - Too many decision points
function calculatePrice($user, $product, $quantity, $discount) {
    if ($user->isPremium()) {
        if ($quantity > 10) {
            if ($discount > 0) {
                // ... many more nested conditions
            }
        }
    }
    // ... 50+ lines of complex logic
}

// ✅ GOOD - Simplified with early returns and extracted methods
function calculatePrice($user, $product, $quantity, $discount) {
    if (!$user->isPremium()) {
        return $this->calculateStandardPrice($product, $quantity);
    }
    
    return $this->calculatePremiumPrice($product, $quantity, $discount);
}
```

**Deep Nesting:**
```php
// ❌ BAD - Too many nested levels
if ($user) {
    if ($user->isActive()) {
        if ($user->hasPermission()) {
            if ($user->canAccess($resource)) {
                // ... actual logic
            }
        }
    }
}

// ✅ GOOD - Early returns reduce nesting
if (!$user || !$user->isActive()) {
    return;
}

if (!$user->hasPermission()) {
    return;
}

if (!$user->canAccess($resource)) {
    return;
}

// ... actual logic
```

### Code Smells

**Magic Numbers:**
```php
// ❌ BAD - Magic numbers
if ($age > 18 && $age < 65) {
    // ...
}

// ✅ GOOD - Named constants
const MIN_AGE = 18;
const MAX_AGE = 65;

if ($age > MIN_AGE && $age < MAX_AGE) {
    // ...
}
```

**Commented Code:**
```php
// ❌ BAD - Dead code
// function oldCalculatePrice($product) {
//     return $product->price * 1.2;
// }

// ✅ GOOD - Remove commented code, use version control
function calculatePrice($product) {
    return $product->price * $this->getTaxRate();
}
```

**Code Duplication:**
```php
// ❌ BAD - Duplicated logic
function processOrder($order) {
    $order->status = 'processing';
    $order->save();
    // ... 20 lines of processing
    $order->status = 'completed';
    $order->save();
}

function processRefund($refund) {
    $refund->status = 'processing';
    $refund->save();
    // ... 20 lines of processing (duplicated)
    $refund->status = 'completed';
    $refund->save();
}

// ✅ GOOD - Extracted common logic
function processOrder($order) {
    $this->processTransaction($order, 'order');
}

function processRefund($refund) {
    $this->processTransaction($refund, 'refund');
}

private function processTransaction($transaction, $type) {
    $transaction->status = 'processing';
    $transaction->save();
    // ... shared processing logic
    $transaction->status = 'completed';
    $transaction->save();
}
```

### Documentation Issues

**Missing DocBlocks:**
```php
// ❌ BAD - No documentation
function calculatePrice($product, $quantity) {
    return $product->price * $quantity;
}

// ✅ GOOD - Proper documentation
/**
 * Calculate the total price for a product and quantity.
 *
 * @param  \App\Models\Product  $product
 * @param  int  $quantity
 * @return float
 */
function calculatePrice($product, $quantity): float {
    return $product->price * $quantity;
}
```

### Naming Issues

**Inconsistent Naming:**
```php
// ❌ BAD - Inconsistent naming
function getUserName() { }
function get_user_email() { }
function GetUserPhone() { }

// ✅ GOOD - Consistent naming (PSR-1)
function getUserName() { }
function getUserEmail() { }
function getUserPhone() { }
```

## Running Code Quality Analyzers

### Run All Code Quality Analyzers

```bash
php artisan shield:analyze --category=code-quality
```

### Run Specific Analyzer

```bash
php artisan shield:analyze --analyzer=cognitive-complexity
php artisan shield:analyze --analyzer=duplicate-code
php artisan shield:analyze --analyzer=missing-docblock
```

### Run Multiple Analyzers

```bash
php artisan shield:analyze --analyzer=cognitive-complexity,cyclomatic-complexity,method-length
```

## Best Practices

### Development

- Run code quality analyzers regularly during development
- Set complexity thresholds appropriate for your team
- Refactor complex code before it becomes unmaintainable

### Code Reviews

- Review code quality metrics in pull requests
- Use complexity metrics to guide refactoring decisions
- Ensure new code follows established patterns

### Team Standards

- Agree on complexity thresholds as a team
- Document naming conventions and coding standards
- Use code quality metrics to track improvement over time

## Configuration

Configure code quality thresholds in `config/shieldci.php`:

```php
return [
    'analyzers' => [
        'code-quality' => [
            'max_complexity' => 10,
            'max_method_length' => 50,
            'max_class_length' => 500,
            'max_nesting_depth' => 4,
        ],
    ],
];
```

## Related Categories

- **[Reliability Analyzers](/analyzers/reliability/overview)** - Prevent runtime errors
- **[Best Practices Analyzers](/analyzers/best-practices/overview)** - Follow Laravel conventions
- **[Performance Analyzers](/analyzers/performance/overview)** - Optimize application performance
