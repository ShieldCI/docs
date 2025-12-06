---
title: Invalid Method Calls Analyzer
description: Detects invalid method calls including undefined methods, wrong parameter types, visibility violations, and incorrect method signatures using PHPStan static analysis
icon: alert-triangle
outline: [2, 3]
---

# Invalid Method Calls Analyzer

| Analyzer ID               | Category       | Severity | Time To Fix |
| --------------------------| :------------: |:--------:| -----------:|
| `invalid-method-calls`    | ✅ Reliability | Critical | 20 minutes  |

## What This Checks

- Detects calls to undefined or non-existent methods
- Identifies incorrect number of parameters passed to methods
- Catches type mismatches in method parameters (e.g., passing int when string expected)
- Detects visibility violations (calling private/protected methods outside scope)
- Identifies static calls to instance methods and vice versa
- Catches usage of void method return values
- Detects missing required parameters in method calls
- Identifies unknown/invalid parameter names in method calls
- Uses PHPStan Level 5 static analysis to detect issues before runtime
- Reports exact file location and line number of each issue

## Why It Matters

- **Runtime crashes**: Calling undefined methods causes fatal errors: `Fatal error: Call to undefined method`
- **Production outages**: Invalid method calls crash your application immediately, causing downtime and revenue loss
- **Type errors**: Wrong parameter types cause unpredictable behavior and data corruption
- **Silent failures**: Type mismatches may not error immediately but produce incorrect results
- **Security vulnerabilities**: Visibility violations can expose private methods and internal state
- **API contract violations**: Method signature changes break contracts with calling code
- **Refactoring risks**: Method signature changes can introduce bugs if call sites aren't updated
- **Developer productivity**: Runtime errors waste debugging time that static analysis prevents
- **Data integrity**: Incorrect parameter types can corrupt data when passed to database methods
- **OOP violations**: Static/instance method confusion breaks object-oriented design principles

## How to Fix

### Quick Fix (5 minutes)

Run locally to see the specific issues:

```bash
vendor/bin/phpstan analyse app --level=5
```

If you have a specific invalid method call error:

```php
// ❌ Before: Undefined method
$user = new User();
$name = $user->getFullName();

// ✅ After: Use correct method name
$name = $user->getName(); // Fixed method name
```

### Proper Fix (20 minutes)

#### Fix #1: Undefined Method - Check for Typos

```php
// ❌ Before: Typo in method name
class User {
    public function getName(): string {
        return $this->name;
    }
}

$user = new User();
$name = $user->getname(); // Wrong case

// ✅ After: Fix method name case
$name = $user->getName();
```

#### Fix #2: Wrong Parameter Count

```php
// ❌ Before: Missing required parameter
class OrderService {
    public function processOrder(Order $order, User $user): void {
        // Process order
    }
}

$service = new OrderService();
$service->processOrder($order); // Missing $user parameter

// ✅ After: Provide all required parameters
$service->processOrder($order, $currentUser);
```

#### Fix #3: Wrong Parameter Type

```php
// ❌ Before: Wrong type passed
class PaymentService {
    public function charge(float $amount): void {
        // Charge customer
    }
}

$service = new PaymentService();
$service->charge(100); // Passing int, expects float

// ✅ After: Pass correct type
$service->charge(100.00); // Float
// Or cast explicitly:
$service->charge((float) $amount);
```

#### Fix #4: Visibility Violation - Private Method

```php
// ❌ Before: Calling private method outside class
class BaseController {
    private function validate(array $data): bool {
        return true;
    }
}

class UserController extends BaseController {
    public function store(Request $request) {
        $this->validate($request->all()); // Can't call private method
    }
}

// ✅ After: Change visibility to protected
class BaseController {
    protected function validate(array $data): bool {
        return true;
    }
}

class UserController extends BaseController {
    public function store(Request $request) {
        $this->validate($request->all()); // Now accessible
    }
}
```

#### Fix #5: Static Call to Instance Method

```php
// ❌ Before: Calling instance method statically
class UserService {
    public function getUser(int $id): User {
        return User::find($id);
    }
}

// Calling instance method as static
$user = UserService::getUser(1);

// ✅ After: Create instance first
$service = new UserService();
$user = $service->getUser(1);

// Or make the method static if appropriate:
class UserService {
    public static function getUser(int $id): User {
        return User::find($id);
    }
}

$user = UserService::getUser(1);
```

#### Fix #6: Using Void Method Return Value

```php
// ❌ Before: Using return value from void method
class Logger {
    public function log(string $message): void {
        error_log($message);
    }
}

$logger = new Logger();
$result = $logger->log('Error occurred'); // void has no return value

// ✅ After: Don't use return value
$logger->log('Error occurred');
// Or change method to return a value:
class Logger {
    public function log(string $message): bool {
        return error_log($message);
    }
}

$success = $logger->log('Error occurred');
```

## References

- [PHP Method Visibility](https://www.php.net/manual/en/language.oop5.visibility.php)
- [PHP Type Declarations](https://www.php.net/manual/en/language.types.declarations.php)
- [PHP Method Overriding](https://www.php.net/manual/en/language.oop5.basic.php#language.oop5.basic.extends)
- [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)
- [Static vs Instance Methods](https://www.php.net/manual/en/language.oop5.static.php)
- [Magic Methods](https://www.php.net/manual/en/language.oop5.magic.php)

## Related Analyzers

- [Invalid Function Calls Analyzer](/analyzers/reliability/invalid-function-calls) - Detects invalid function calls
- [Undefined Variable Usage Analyzer](/analyzers/reliability/undefined-variable) - Detects references to undefined variables
- [Missing Return Statements Analyzer](/analyzers/reliability/missing-return-statement) - Detects missing return statements
- [Invalid Property Access Analyzer](/analyzers/reliability/invalid-property-access) - Detects invalid property access
