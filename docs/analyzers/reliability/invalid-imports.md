---
title: Invalid Imports Analyzer
description: Detects invalid imports and use statements for non-existent classes using PHPStan static analysis
icon: alert-triangle
outline: [2, 3]
tags: phpstan,static-analysis,imports,autoloading
---

# Invalid Imports Analyzer

| Analyzer ID          | Category       | Severity | Time To Fix |
| ---------------------| :------------: |:--------:| -----------:|
| `invalid-imports`    | ✅ Reliability | Critical | 10 minutes  |

## What This Checks

- Detects imports of non-existent classes, interfaces, and traits
- Identifies incorrect namespace paths in use statements
- Catches typos in class/interface/trait names
- Detects missing package dependencies
- Identifies classes used in reflection that don't exist
- Validates that all imported classes are autoloadable
- Uses PHPStan Level 5 static analysis to detect issues before runtime
- Reports exact file location and line number of each issue

## Why It Matters

- **Runtime crashes**: Importing non-existent classes causes fatal errors: `Fatal error: Class 'ClassName' not found`
- **Production outages**: Invalid imports crash your application immediately, causing downtime and revenue loss
- **Autoloading failures**: Missing classes break Composer autoloading and prevent application startup
- **Package dependencies**: Undetected missing dependencies cause deployment failures
- **Refactoring risks**: Namespace changes can break imports if not updated across the codebase
- **Developer productivity**: Runtime errors waste debugging time that static analysis prevents
- **Type safety**: Invalid imports break type declarations and lead to unexpected behavior
- **IDE support**: Missing imports break IDE autocomplete and type checking
- **Code quality**: Invalid imports indicate poor dependency management and missing packages

## How to Fix

### Quick Fix (5 minutes)

Run locally to see the specific issues:

```bash
vendor/bin/phpstan analyse app --level=5
```

If you have a specific invalid import error:

```php
// ❌ Before: Non-existent class import
use App\Services\NonExistentService;

// ✅ After: Fix the namespace or install the package
use App\Services\ExistingService;
```

### Proper Fix (10 minutes)

#### Fix #1: Typo in Class Name

```php
// ❌ Before: Typo in class name
use App\Models\Usr; // Should be User

class UserController {
    public function index() {
        return Usr::all(); // Class not found
    }
}

// ✅ After: Fix the typo
use App\Models\User;

class UserController {
    public function index() {
        return User::all();
    }
}
```

#### Fix #2: Wrong Namespace Path

```php
// ❌ Before: Incorrect namespace
use App\Services\Payment\PaymentProcessor; // Class is actually in App\Services\PaymentProcessor

// ✅ After: Correct namespace
use App\Services\PaymentProcessor;

class OrderController {
    public function process(Order $order) {
        $processor = new PaymentProcessor();
        $processor->charge($order);
    }
}
```

#### Fix #3: Missing Package Dependency

```php
// ❌ Before: Using class from uninstalled package
use Spatie\Permission\Models\Role; // Package not installed

// ✅ After: Install the required package
// 1. Install package
composer require spatie/laravel-permission

// 2. Now the import works
use Spatie\Permission\Models\Role;

class UserController {
    public function assignRole(User $user, Role $role) {
        $user->assignRole($role);
    }
}
```

#### Fix #4: Outdated Autoloader

```php
// ❌ Before: New class not found after creation
// You just created: app/Services/NewService.php
use App\Services\NewService; // Class not found

// ✅ After: Regenerate autoloader
composer dump-autoload

// Now the import works
use App\Services\NewService;
```

#### Fix #5: Reflection Class Not Found

```php
// ❌ Before: Using non-existent class in reflection
$className = 'App\Services\NonExistentService';
$reflection = new ReflectionClass($className); // Class does not exist

// ✅ After: Verify class exists before reflection
$className = 'App\Services\PaymentService';

if (class_exists($className)) {
    $reflection = new ReflectionClass($className);
    // Use reflection
} else {
    throw new RuntimeException("Class {$className} not found");
}
```

#### Fix #6: Missing Use Statement

```php
// ❌ Before: Using fully qualified name instead of import
class UserController {
    public function index() {
        return \App\Models\User::all(); // Works but verbose
    }
}

// ✅ After: Add use statement at top
use App\Models\User;

class UserController {
    public function index() {
        return User::all(); // Cleaner and type-safe
    }
}
```

#### Fix #7: Case Sensitivity Issues

```php
// ❌ Before: Wrong case in namespace (Linux is case-sensitive)
use app\models\user; // Should be App\Models\User

// ✅ After: Correct case
use App\Models\User;

class UserController {
    public function index() {
        return User::all();
    }
}
```

## References

- [PHP Namespaces](https://www.php.net/manual/en/language.namespaces.php)
- [PHP Use Statements](https://www.php.net/manual/en/language.namespaces.importing.php)
- [Composer Autoloading](https://getcomposer.org/doc/04-schema.md#autoload)
- [PHP Reflection](https://www.php.net/manual/en/book.reflection.php)
- [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)
- [PSR-4 Autoloading Standard](https://www.php-fig.org/psr/psr-4/)

## Related Analyzers

- [Invalid Method Calls Analyzer](/analyzers/reliability/invalid-method-calls) - Detects invalid method calls
- [Invalid Function Calls Analyzer](/analyzers/reliability/invalid-function-calls) - Detects invalid function calls
- [Undefined Variable Usage Analyzer](/analyzers/reliability/undefined-variable) - Detects references to undefined variables
- [Missing Return Statements Analyzer](/analyzers/reliability/missing-return-statement) - Detects missing return statements

