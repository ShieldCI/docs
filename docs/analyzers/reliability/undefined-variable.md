---
title: Undefined Variable Usage Analyzer
description: Detects references to undefined variables, variables that might not be defined in all code paths, and unnecessary isset() checks using PHPStan Level 5 static analysis
icon: alert-triangle
outline: [2, 3]
tags: phpstan,static-analysis,variables,type-safety
---

# Undefined Variable Usage Analyzer

| Analyzer ID         | Category       | Severity | Time To Fix |
| --------------------| :------------: |:--------:| -----------:|
| `undefined-variable`| ✅ Reliability | High     | 10 minutes  |

## What This Checks

- Detects references to undefined variables
- Identifies variables that might not be defined in all code paths
- Catches unnecessary isset() checks on variables guaranteed to exist
- Detects potential typos in variable names
- Validates variable initialization across control flow branches
- Uses PHPStan Level 5 static analysis for comprehensive detection
- Reports exact file location and line number of each issue

## Why It Matters

- **Runtime crashes**: Undefined variables cause notices and warnings that break applications
- **Production bugs**: Variable errors often slip through tests if not all code paths are covered
- **Data corruption**: Using undefined variables can lead to unexpected null values and logic errors
- **Security risks**: Undefined variables in security checks (e.g., `if ($isAdmin)`) create vulnerabilities
- **Silent failures**: PHP notices for undefined variables may be suppressed, hiding critical bugs
- **Type errors**: Missing variables break type declarations and lead to unexpected behavior
- **Control flow bugs**: Variables undefined in certain branches cause inconsistent application behavior
- **Debugging difficulty**: Variable errors create intermittent bugs that are hard to reproduce
- **Code quality**: Undefined variables indicate poor code structure and missing validation
- **Maintenance burden**: Variable errors make refactoring dangerous and error-prone

## How to Fix

### Quick Fix (5 minutes)

Run locally to see the specific issues:

```bash
vendor/bin/phpstan analyse app --level=5
```

If you have a specific undefined variable error:

```php
// ❌ Before: Using undefined variable
if ($isAuthenticated) {
    // PHP Notice: Undefined variable $isAuthenticated
}

// ✅ After: Initialize the variable
$isAuthenticated = auth()->check();

if ($isAuthenticated) {
    // Works correctly
}
```

### Proper Fix (10 minutes)

#### 1: Initialize Variables Before Use

Always define variables before using them:

```php
// ❌ Before: Undefined variable
function calculateTotal($items)
{
    foreach ($items as $item) {
        $total += $item->price; // Undefined variable: $total
    }
    return $total;
}

// ✅ After: Initialize before use
function calculateTotal($items)
{
    $total = 0; // Initialize first

    foreach ($items as $item) {
        $total += $item->price;
    }

    return $total;
}

// ✅ Better: Use array functions
function calculateTotal($items)
{
    return array_sum(array_column($items, 'price'));
}
```

#### 2: Define Variables in All Code Paths

Ensure variables are defined in all possible execution paths:

```php
// ❌ Before: Variable might not be defined
function getUserRole($user)
{
    if ($user->isAdmin()) {
        $role = 'admin';
    } elseif ($user->isEditor()) {
        $role = 'editor';
    }
    // If neither condition is true, $role is undefined!

    return $role; // Variable $role might not be defined
}

// ✅ After: Initialize with default value
function getUserRole($user)
{
    $role = 'viewer'; // Default value

    if ($user->isAdmin()) {
        $role = 'admin';
    } elseif ($user->isEditor()) {
        $role = 'editor';
    }

    return $role; // Always defined
}

// ✅ Better: Use match expression (PHP 8.0+)
function getUserRole($user)
{
    return match(true) {
        $user->isAdmin() => 'admin',
        $user->isEditor() => 'editor',
        default => 'viewer',
    };
}
```

#### 3: Handle Optional Variables Properly

Use null coalescing or conditional checks for optional variables:

```php
// ❌ Before: Optional variable not initialized
function processOrder($orderId, $couponCode = null)
{
    $order = Order::find($orderId);

    if ($couponCode) {
        $discount = Coupon::find($couponCode)->amount;
    }

    $total = $order->total - $discount; // $discount might not be defined

    return $total;
}

// ✅ After: Initialize optional variable
function processOrder($orderId, $couponCode = null)
{
    $order = Order::find($orderId);
    $discount = 0; // Initialize with default

    if ($couponCode) {
        $coupon = Coupon::find($couponCode);
        $discount = $coupon ? $coupon->amount : 0;
    }

    $total = $order->total - $discount;

    return $total;
}

// ✅ Better: Use null coalescing
function processOrder($orderId, $couponCode = null)
{
    $order = Order::find($orderId);

    $discount = $couponCode
        ? (Coupon::find($couponCode)->amount ?? 0)
        : 0;

    return $order->total - $discount;
}
```

#### 4: Fix Loop Variable Issues

Initialize accumulator variables before loops:

```php
// ❌ Before: Undefined accumulator
foreach ($users as $user) {
    if ($user->isActive()) {
        $activeCount++; // Undefined variable: $activeCount
    }
}

// ✅ After: Initialize before loop
$activeCount = 0;

foreach ($users as $user) {
    if ($user->isActive()) {
        $activeCount++;
    }
}

// ✅ Better: Use array filtering
$activeCount = count(array_filter($users, fn($user) => $user->isActive()));

// ✅ Best: Use collection methods
$activeCount = collect($users)->filter(fn($user) => $user->isActive())->count();
```

#### 5: Handle Try-Catch Variable Scope

Ensure variables defined in try blocks are accessible:

```php
// ❌ Before: Variable only defined in try block
try {
    $result = $api->call();
} catch (Exception $e) {
    Log::error($e->getMessage());
}

return $result; // Variable $result might not be defined

// ✅ After: Initialize before try block
$result = null;

try {
    $result = $api->call();
} catch (Exception $e) {
    Log::error($e->getMessage());
}

return $result ?? []; // Safe even if exception occurred

// ✅ Better: Handle both success and failure
try {
    return $api->call();
} catch (Exception $e) {
    Log::error($e->getMessage());
    return [];
}
```

#### 6: Remove Unnecessary isset() Checks

Remove redundant isset() checks on variables guaranteed to exist:

```php
// ❌ Before: Unnecessary isset() check
function processUser(User $user)
{
    $name = $user->name;

    // Variable $name always exists at this point
    if (isset($name)) { // Unnecessary check
        return strtoupper($name);
    }
}

// ✅ After: Remove redundant check
function processUser(User $user)
{
    $name = $user->name;

    // Direct use - isset() is not needed
    return strtoupper($name);
}

// ✅ Alternative: Check for null if needed
function processUser(User $user)
{
    $name = $user->name;

    if ($name !== null) {
        return strtoupper($name);
    }

    return 'N/A';
}

// ✅ Better: Use null coalescing
function processUser(User $user)
{
    return strtoupper($user->name ?? 'N/A');
}
```

#### 7: Fix Variable Typos

Check for typos in variable names:

```php
// ❌ Before: Variable name typo
function calculatePrice($quantity, $unitPrice)
{
    $subtotal = $quantity * $unitPrice;
    $tax = $subtotal * 0.1;

    return $subTotal + $tax; // Typo: $subTotal vs $subtotal
}

// ✅ After: Fix typo
function calculatePrice($quantity, $unitPrice)
{
    $subtotal = $quantity * $unitPrice;
    $tax = $subtotal * 0.1;

    return $subtotal + $tax; // Correct variable name
}

// ✅ Tip: Use IDE auto-completion to prevent typos
// Most IDEs will suggest existing variable names
```

#### 8: Handle Conditional Assignments

Ensure variables assigned conditionally are always defined:

```php
// ❌ Before: Conditional assignment without default
if ($user->hasDiscount()) {
    $discountRate = $user->getDiscountRate();
}

$finalPrice = $basePrice * (1 - $discountRate); // $discountRate might not be defined

// ✅ After: Provide default value
$discountRate = 0; // Default for no discount

if ($user->hasDiscount()) {
    $discountRate = $user->getDiscountRate();
}

$finalPrice = $basePrice * (1 - $discountRate);

// ✅ Better: Use ternary operator
$discountRate = $user->hasDiscount()
    ? $user->getDiscountRate()
    : 0;

$finalPrice = $basePrice * (1 - $discountRate);

// ✅ Best: Inline the logic
$finalPrice = $basePrice * (1 - ($user->hasDiscount() ? $user->getDiscountRate() : 0));
```

#### 9: Fix Extract Variable Issues

Be careful with extract() - it can create undefined variable situations:

```php
// ❌ Before: Using extract() creates unpredictable variables
function renderTemplate($data)
{
    extract($data); // Creates variables from array keys

    // These variables might not exist if not in $data
    return "$title - $description by $author";
}

// ✅ After: Access array directly
function renderTemplate($data)
{
    $title = $data['title'] ?? 'Untitled';
    $description = $data['description'] ?? '';
    $author = $data['author'] ?? 'Unknown';

    return "$title - $description by $author";
}

// ✅ Better: Use null coalescing in template
function renderTemplate($data)
{
    return sprintf(
        '%s - %s by %s',
        $data['title'] ?? 'Untitled',
        $data['description'] ?? '',
        $data['author'] ?? 'Unknown'
    );
}

// ✅ Best: Use a proper template engine (Blade)
// resources/views/template.blade.php
// {{ $title ?? 'Untitled' }} - {{ $description ?? '' }} by {{ $author ?? 'Unknown' }}
```

#### 10: Use Strict Variable Checking

Enable strict checking and fix all warnings:

```php
// config/app.php - Enable error reporting in development
'debug' => env('APP_DEBUG', false),

// .env
APP_DEBUG=true

// ❌ Before: Suppressing errors hides problems
error_reporting(E_ALL & ~E_NOTICE); // Hides undefined variable notices

// ✅ After: Show all errors and fix them
error_reporting(E_ALL);

// ✅ In Laravel, use logging
Log::channel('daily')->info('Variable state', [
    'defined_vars' => get_defined_vars(),
]);

// ✅ Use static analysis
// Run PHPStan to catch undefined variables before runtime
vendor/bin/phpstan analyse app --level=5
```

## References

- [PHP Variables](https://www.php.net/manual/en/language.variables.php)
- [PHP Error Handling](https://www.php.net/manual/en/errorfunc.configuration.php)
- [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)
- [Laravel Debugging](https://laravel.com/docs/debugging)
- [PHP Type Declarations](https://www.php.net/manual/en/language.types.declarations.php)

## Related Analyzers

- [Undefined Constant Usage Analyzer](/analyzers/reliability/undefined-constant) - Detects undefined constants
- [Invalid Method Calls Analyzer](/analyzers/reliability/invalid-method-calls) - Detects invalid method calls
- [Invalid Property Access Analyzer](/analyzers/reliability/invalid-property-access) - Detects invalid property access
- [Missing Return Statements Analyzer](/analyzers/reliability/missing-return-statement) - Detects missing return statements
