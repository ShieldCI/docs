---
title: Best Practices Analyzers
description: 23 analyzers ensuring you follow Laravel ecosystem best practices and framework conventions
icon: puzzle
outline: [2, 3]
---

# Best Practices Analyzers

**23 analyzers** ensuring you follow Laravel ecosystem best practices and framework conventions.

## Overview

Best Practices analyzers focus on Laravel-specific patterns, framework conventions, and architectural best practices. These analyzers help ensure your code follows Laravel's intended usage patterns and prevents common mistakes that can lead to maintainability issues or performance problems.

## Key Analyzers

### Laravel Conventions

- **[MVC Structure Violation Detector](/analyzers/best-practices/mvc-structure-violation)** - Ensures code follows MVC architecture patterns
- **[Logic in Routes Detector](/analyzers/best-practices/logic-in-routes)** - Detects business logic in route files
- **[Logic in Blade Detector](/analyzers/best-practices/logic-in-blade)** - Detects complex logic in Blade templates
- **[Query Builder in Controller](/analyzers/best-practices/query-builder-in-controller)** - Detects query builder usage in controllers
- **[Hardcoded Configuration Detector](/analyzers/best-practices/config-outside-config)** - Detects configuration values outside config files

### Eloquent & Database

- **[Eloquent N+1 Query](/analyzers/best-practices/eloquent-n-plus-one)** - Detects N+1 query problems
- **[Missing Chunk Detector](/analyzers/best-practices/chunk-missing)** - Detects missing chunk() calls for large datasets
- **[Missing Database Transactions Detector](/analyzers/best-practices/missing-database-transactions)** - Detects operations that should use database transactions
- **[Select Asterisk Detector](/analyzers/best-practices/select-asterisk)** - Detects SELECT * queries
- **[Unnecessary Raw SQL Detector](/analyzers/best-practices/raw-eloquent-avoidance)** - Detects raw SQL that could use Eloquent
- **[Mixed Query Builder and Eloquent Detector](/analyzers/best-practices/mixed-query-builder-eloquent)** - Detects inconsistent query building patterns

### Code Organization

- **[Fat Model Detector](/analyzers/best-practices/fat-model)** - Detects models with too much responsibility
- **[Missing Model Scope Detector](/analyzers/best-practices/missing-model-scope)** - Suggests using model scopes for common queries
- **[Facade Usage](/analyzers/best-practices/facade-usage)** - Validates appropriate facade usage
- **[Service Container Resolution](/analyzers/best-practices/service-container-resolution)** - Ensures proper dependency injection

### Error Handling & Logging

- **[Generic Exception Catch Detector](/analyzers/best-practices/generic-exception-catch)** - Detects overly broad exception catching
- **[Silent Failure Detector](/analyzers/best-practices/silent-failure)** - Detects operations that fail silently
- **[Missing Error Tracking Detector](/analyzers/best-practices/missing-error-tracking)** - Ensures error tracking is configured

### Anti-Patterns

- **[Helper Function Abuse](/analyzers/best-practices/helper-function-abuse)** - Detects overuse of global helper functions
- **[Hardcoded Storage Paths Detector](/analyzers/best-practices/hardcoded-storage-paths)** - Detects hardcoded file paths
- **[PHP-Side Data Filtering Detector](/analyzers/best-practices/php-side-filtering)** - Detects filtering that should be done in database
- **[Environment Check Code Smell Detector](/analyzers/best-practices/environment-check-smell)** - Detects environment checks in business logic
- **[Framework Override Detector](/analyzers/best-practices/framework-override)** - Detects unnecessary framework overrides

## How They Work

Best Practices analyzers use:

1. **Pattern Matching:** Identifies Laravel-specific patterns and conventions
2. **AST Analysis:** Analyzes code structure to detect architectural violations
3. **Query Analysis:** Examines database queries for optimization opportunities
4. **Convention Validation:** Checks code against Laravel best practices

## Severity Levels

| Severity | Description | Examples |
|----------|-------------|----------|
| **High** | Issues that violate core Laravel principles | Logic in routes, N+1 queries, missing transactions |
| **Medium** | Issues that reduce maintainability | Fat models, hardcoded paths, generic exception catching |
| **Low** | Best practice violations | Helper function abuse, missing scopes, environment checks |

## Common Issues

### MVC Violations

**Logic in Routes:**
```php
// ❌ BAD - Business logic in routes
Route::post('/users', function (Request $request) {
    $user = User::create($request->all());
    $user->sendWelcomeEmail();
    $user->assignDefaultRole();
    return response()->json($user);
});

// ✅ GOOD - Logic in controller
Route::post('/users', [UserController::class, 'store']);

class UserController {
    public function store(CreateUserRequest $request) {
        $user = $this->userService->create($request->validated());
        return response()->json($user);
    }
}
```

**Logic in Blade:**
```blade
{{-- ❌ BAD - Complex logic in Blade --}}
@foreach($users as $user)
    @if($user->orders->sum('total') > 1000 && $user->isActive() && $user->subscription->isValid())
        <div class="vip">{{ $user->name }}</div>
    @endif
@endforeach

{{-- ✅ GOOD - Logic in controller/service --}}
@foreach($vipUsers as $user)
    <div class="vip">{{ $user->name }}</div>
@endforeach
```

### Database Issues

**N+1 Query Problem:**
```php
// ❌ BAD - N+1 queries
$users = User::all();
foreach ($users as $user) {
    echo $user->profile->name;  // Query for each user
}

// ✅ GOOD - Eager loading
$users = User::with('profile')->get();
foreach ($users as $user) {
    echo $user->profile->name;  // No additional queries
}
```

**Missing Chunking:**
```php
// ❌ BAD - Loads all records into memory
$users = User::all();
foreach ($users as $user) {
    $this->processUser($user);
}

// ✅ GOOD - Processes in chunks
User::chunk(100, function ($users) {
    foreach ($users as $user) {
        $this->processUser($user);
    }
});
```

**Missing Transactions:**
```php
// ❌ BAD - No transaction, partial updates possible
$order->update(['status' => 'completed']);
$inventory->decrement('quantity', $order->quantity);
$payment->process($order->total);

// ✅ GOOD - Atomic operation
DB::transaction(function () use ($order, $inventory, $payment) {
    $order->update(['status' => 'completed']);
    $inventory->decrement('quantity', $order->quantity);
    $payment->process($order->total);
});
```

**SELECT * Queries:**
```php
// ❌ BAD - Selects all columns
$users = DB::table('users')->get();

// ✅ GOOD - Select only needed columns
$users = DB::table('users')
    ->select('id', 'name', 'email')
    ->get();
```

### Code Organization

**Fat Model:**
```php
// ❌ BAD - Model does too much
class User extends Model {
    public function sendWelcomeEmail() { }
    public function calculateLifetimeValue() { }
    public function generateReport() { }
    public function processPayment() { }
    // ... 50+ methods
}

// ✅ GOOD - Extract to services
class User extends Model {
    // Only model-related methods
}

class UserService {
    public function sendWelcomeEmail(User $user) { }
    public function calculateLifetimeValue(User $user) { }
}
```

**Missing Model Scopes:**
```php
// ❌ BAD - Repeated query logic
$activeUsers = User::where('status', 'active')->where('verified', true)->get();
$activeAdmins = User::where('status', 'active')->where('verified', true)->where('role', 'admin')->get();

// ✅ GOOD - Use scopes
class User extends Model {
    public function scopeActive($query) {
        return $query->where('status', 'active')->where('verified', true);
    }
}

$activeUsers = User::active()->get();
$activeAdmins = User::active()->where('role', 'admin')->get();
```

### Error Handling

**Generic Exception Catching:**
```php
// ❌ BAD - Catches everything
try {
    $this->processOrder($order);
} catch (\Exception $e) {
    Log::error('Error processing order');
}

// ✅ GOOD - Catch specific exceptions
try {
    $this->processOrder($order);
} catch (PaymentException $e) {
    return $this->handlePaymentError($e);
} catch (InventoryException $e) {
    return $this->handleInventoryError($e);
}
```

**Silent Failures:**
```php
// ❌ BAD - Fails silently
@file_put_contents($path, $content);

// ✅ GOOD - Handle errors explicitly
if (file_put_contents($path, $content) === false) {
    throw new FileWriteException("Failed to write to {$path}");
}
```

## Running Best Practices Analyzers

### Run All Best Practices Analyzers

```bash
php artisan shield:analyze --category=best-practices
```

### Run Specific Analyzer

```bash
php artisan shield:analyze --analyzer=eloquent-n-plus-one
php artisan shield:analyze --analyzer=missing-database-transactions
php artisan shield:analyze --analyzer=fat-model
```

### Run Multiple Analyzers

```bash
php artisan shield:analyze --analyzer=eloquent-n-plus-one,missing-database-transactions,chunk-missing
```

## Best Practices

### Development

- Run best practices analyzers during code reviews
- Fix High severity issues before merging
- Use analyzers to learn Laravel conventions

### Code Reviews

- Review best practices violations in pull requests
- Use violations as teaching opportunities
- Ensure new code follows Laravel patterns

### Team Standards

- Agree on which best practices are mandatory
- Document team-specific conventions
- Use analyzers to maintain consistency across codebase

## Related Categories

- **[Code Quality Analyzers](/analyzers/code-quality/overview)** - Maintain code quality standards
- **[Reliability Analyzers](/analyzers/reliability/overview)** - Prevent runtime errors
- **[Performance Analyzers](/analyzers/performance/overview)** - Optimize application performance

## Next Steps

- [View all Best Practices Analyzers](#all-analyzers)
- [Code Quality Analyzers](/analyzers/code-quality/overview)
- [Reliability Analyzers](/analyzers/reliability/overview)
- [Getting Started Guide](/getting-started/installation)

