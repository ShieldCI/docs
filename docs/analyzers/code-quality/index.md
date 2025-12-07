---
title: Code Quality Analyzers
description: 7 analyzers maintaining clean, maintainable code following Laravel conventions and PSR standards
icon: code
outline: [2, 3]
---

# Code Quality Analyzers

**7 analyzers** maintaining clean, maintainable code following Laravel conventions and PSR standards.

## Overview

Code Quality analyzers focus on maintaining high code standards, reducing complexity, improving readability, and ensuring code follows best practices. These analyzers help teams write consistent, maintainable code that's easier to understand and modify.

## Key Analyzers

### Complexity & Structure

- **[Nesting Depth Analyzer](/analyzers/code-quality/nesting-depth)** - Detects excessive code nesting levels that reduce readability
- **[Method Length Analyzer](/analyzers/code-quality/method-length)** - Flags methods exceeding recommended line count for better maintainability

### Code Smells

- **[Commented Code Analyzer](/analyzers/code-quality/commented-code)** - Detects commented-out code that should be removed in favor of version control
- **[Magic Number Analyzer](/analyzers/code-quality/magic-number)** - Detects hard-coded numbers that should be named constants
- **[Todo Comment Analyzer](/analyzers/code-quality/todo-comment)** - Finds TODO/FIXME/HACK comments that should be addressed or tracked in issue tracker

### Documentation & Naming

- **[Missing DocBlock Analyzer](/analyzers/code-quality/missing-docblock)** - Flags public methods without proper PHPDoc documentation
- **[Naming Convention Analyzer](/analyzers/code-quality/naming-convention)** - Validates PSR and Laravel naming standards for better code consistency

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
php artisan shield:analyze --analyzer=nesting-depth
php artisan shield:analyze --analyzer=method-length
php artisan shield:analyze --analyzer=missing-docblock
```

### Run Multiple Analyzers

```bash
php artisan shield:analyze --analyzer=nesting-depth,method-length,magic-number
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


## Related Categories

- **[Security Analyzers](/analyzers/security)** - Prevent security vulnerabilities
- **[Reliability Analyzers](/analyzers/reliability)** - Prevent runtime errors
- **[Best Practices Analyzers](/analyzers/best-practices)** - Follow Laravel conventions
- **[Performance Analyzers](/analyzers/performance)** - Optimize application performance
