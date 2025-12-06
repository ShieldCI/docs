---
title: Invalid Method Overrides Analyzer
description: Detects incompatible method overrides with incorrect signatures, return type mismatches, parameter type violations, and visibility issues using PHPStan static analysis
icon: alert-triangle
outline: [2, 3]
---

# Invalid Method Overrides Analyzer

| Analyzer ID                  | Category       | Severity | Time To Fix |
| -----------------------------| :------------: |:--------:| -----------:|
| `invalid-method-overrides`   | ✅ Reliability | High     | 20 minutes  |

## What This Checks

- Detects return type mismatches when overriding parent methods (non-covariant return types)
- Identifies parameter type mismatches in method overrides (non-contravariant parameters)
- Catches missing parameters when overriding parent methods
- Detects visibility violations (narrowing visibility from public to protected/private)
- Identifies overrides of deprecated methods
- Catches incompatible method signatures between parent and child classes
- Detects parameter type declarations missing in overridden methods
- Uses PHPStan Level 5 static analysis to detect issues before runtime
- Reports exact file location and line number of each invalid override
- Validates all inheritance hierarchies in your application code

## Why It Matters

- **Runtime type errors**: Invalid method overrides cause fatal errors when called with parent class type hints
- **Liskov Substitution Principle violations**: Child classes must be substitutable for parent classes without breaking code
- **Type safety breakdown**: Incorrect return types break type contracts and cause unexpected behavior
- **API contract violations**: Method signature changes break contracts with calling code expecting parent behavior
- **Polymorphism failures**: Invalid overrides prevent proper object-oriented design and polymorphic behavior
- **Refactoring risks**: Changing parent methods can silently break child implementations
- **Visibility violations**: Narrowing method visibility breaks existing code that relies on accessibility
- **Maintenance nightmares**: Incompatible signatures create hidden bugs that are hard to trace
- **Framework integration issues**: Many frameworks rely on method overriding (Laravel events, middleware, etc.)
- **Testing difficulties**: Invalid overrides make it impossible to properly mock and test classes

## How to Fix

### Quick Fix (5 minutes)

Run locally to see the specific issues:

```bash
vendor/bin/phpstan analyse app --level=5
```

If you have a specific invalid method override error:

```php
// ❌ Before: Invalid return type
class User extends Model
{
    public function save(): bool  // Parent returns Model
    {
        return parent::save();
    }
}

// ✅ After: Fix return type to match parent
class User extends Model
{
    public function save(): Model  // Now matches parent
    {
        return parent::save();
    }
}
```

### Proper Fix (20 minutes)

#### Fix #1: Non-Covariant Return Type

Return types must be covariant - the child method's return type must be the same as or more specific than the parent's:

```php
// ❌ Before: Child returns less specific type
class Animal {
    public function reproduce(): Dog {
        return new Dog();
    }
}

class Dog extends Animal {
    public function reproduce(): Animal {  // Too broad!
        return new Dog();
    }
}

// ✅ After: Child returns same or more specific type
class Animal {
    public function reproduce(): Animal {
        return new Dog();
    }
}

class Dog extends Animal {
    public function reproduce(): Dog {  // More specific is OK
        return new Dog();
    }
}
```

#### Fix #2: Non-Contravariant Parameter Type

Parameter types must be contravariant - the child method's parameter types must be the same as or less specific than the parent's:

```php
// ❌ Before: Child requires more specific parameter
class BaseController {
    public function handle(Request $request): void {
        // Handle request
    }
}

class UserController extends BaseController {
    public function handle(FormRequest $request): void {  // Too specific!
        // Handle request
    }
}

// ✅ After: Child accepts same or less specific parameter
class BaseController {
    public function handle(FormRequest $request): void {
        // Handle request
    }
}

class UserController extends BaseController {
    public function handle(FormRequest $request): void {  // Same type is OK
        // Handle request
    }
}
```

#### Fix #3: Missing Parameter in Override

Overridden methods must include all required parameters from the parent:

```php
// ❌ Before: Missing required parameter
class BaseService {
    public function process(array $data, bool $validate = true): void {
        // Process data
    }
}

class UserService extends BaseService {
    public function process(array $data): void {  // Missing $validate parameter!
        parent::process($data);
    }
}

// ✅ After: Include all parent parameters
class UserService extends BaseService {
    public function process(array $data, bool $validate = true): void {
        parent::process($data, $validate);
    }
}
```

#### Fix #4: Visibility Violation (Narrowing)

You cannot narrow visibility when overriding (public → protected → private):

```php
// ❌ Before: Narrowing visibility from public to protected
class BaseController {
    public function authorize(): bool {
        return true;
    }
}

class AdminController extends BaseController {
    protected function authorize(): bool {  // Can't narrow from public!
        return $this->user->isAdmin();
    }
}

// ✅ After: Keep same or wider visibility
class AdminController extends BaseController {
    public function authorize(): bool {  // Maintain public visibility
        return $this->user->isAdmin();
    }
}
```

#### Fix #5: Deprecated Method Override

Avoid overriding deprecated parent methods - update to new methods instead:

```php
// ❌ Before: Overriding deprecated method
class BaseModel {
    /**
     * @deprecated Use findById() instead
     */
    public function find(int $id): ?self {
        return $this->findById($id);
    }

    public function findById(int $id): ?self {
        return static::query()->find($id);
    }
}

class User extends BaseModel {
    public function find(int $id): ?self {  // Overriding deprecated!
        return parent::find($id);
    }
}

// ✅ After: Override the new method instead
class User extends BaseModel {
    public function findById(int $id): ?self {  // Use current method
        // Add user-specific logic
        return parent::findById($id);
    }
}
```

#### Fix #6: Incompatible Method Signature

Ensure the entire method signature is compatible:

```php
// ❌ Before: Incompatible signature (different parameter types)
class PaymentProcessor {
    public function charge(float $amount, string $currency = 'USD'): bool {
        return true;
    }
}

class StripeProcessor extends PaymentProcessor {
    public function charge(int $amount, string $currency = 'USD'): bool {  // int vs float!
        return parent::charge($amount, $currency);
    }
}

// ✅ After: Match parent signature exactly
class StripeProcessor extends PaymentProcessor {
    public function charge(float $amount, string $currency = 'USD'): bool {
        // Convert to cents for Stripe
        $amountInCents = (int) ($amount * 100);
        return parent::charge($amount, $currency);
    }
}
```

## References

- [PHP Method Overriding](https://www.php.net/manual/en/language.oop5.basic.php#language.oop5.basic.extends)
- [PHP Type Variance](https://www.php.net/manual/en/language.oop5.variance.php)
- [Liskov Substitution Principle](https://en.wikipedia.org/wiki/Liskov_substitution_principle)
- [PHPStan Covariance Rules](https://phpstan.org/blog/whats-up-with-template-covariant)
- [PHP Visibility](https://www.php.net/manual/en/language.oop5.visibility.php)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

## Related Analyzers

- [Invalid Method Calls Analyzer](/analyzers/reliability/invalid-method-calls) - Detects invalid method calls
- [Invalid Function Calls Analyzer](/analyzers/reliability/invalid-function-calls) - Detects invalid function calls
- [Missing Return Statements Analyzer](/analyzers/reliability/missing-return-statement) - Detects missing return statements
- [Undefined Variable Usage Analyzer](/analyzers/reliability/undefined-variable) - Detects references to undefined variables
