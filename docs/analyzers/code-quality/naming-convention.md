---
title: Naming Convention Analyzer
description: Validates PSR and Laravel naming standards for better code consistency
icon: code
outline: [2, 3]
tags: conventions,psr,code-quality,readability
---

# Naming Convention Analyzer

| Analyzer ID          | Category         | Severity | Time To Fix |
| --------------------| :--------------: |:--------:| -----------:|
| `naming-convention` | ✅ Code Quality  | Low      | 20 minutes  |

## What This Checks

- Validates class names follow PascalCase (e.g., `UserController`, `OrderService`)
- Ensures method names follow camelCase (e.g., `getUserById`, `processPayment`)
- Validates property names follow camelCase (e.g., `firstName`, `isActive`)
- Checks constant names follow SCREAMING_SNAKE_CASE (e.g., `MAX_LOGIN_ATTEMPTS`)
- Verifies Laravel conventions (e.g., table names plural, model names singular)
- Reports exact file location and line number of each violation
- Provides suggestions for correct naming

## Why It Matters

- **Code consistency**: Consistent naming makes code easier to read and understand
- **Team collaboration**: Standard naming helps team members understand code faster
- **PSR compliance**: Following PSR standards ensures compatibility with Laravel ecosystem
- **IDE support**: Proper naming conventions improve IDE autocomplete and navigation
- **Code reviews**: Consistent naming makes reviews faster and more effective
- **Maintainability**: Well-named code is easier to modify and extend
- **Documentation**: Good names reduce the need for comments
- **Professional standards**: Following conventions shows code quality

## How to Fix

### Quick Fix (5 minutes)

Rename to follow conventions:

```php
// ❌ Before: Wrong naming
class user_controller {
    public function get_user($id) {
        // ...
    }
}

// ✅ After: Correct naming
class UserController {
    public function getUser(int $id) {
        // ...
    }
}
```

### Proper Fix (20 minutes)

#### 1: Class Names (PascalCase)

```php
// ❌ Before: Wrong class naming
class user_service {}
class OrderProcessor {}
class payment_gateway {}

// ✅ After: PascalCase
class UserService {}
class OrderProcessor {}
class PaymentGateway {}
```

#### 2: Method Names (camelCase)

```php
// ❌ Before: Wrong method naming
class UserController {
    public function get_user_by_id() {}
    public function ProcessPayment() {}
    public function send_email_notification() {}
}

// ✅ After: camelCase
class UserController {
    public function getUserById() {}
    public function processPayment() {}
    public function sendEmailNotification() {}
}
```

#### 3: Property Names (camelCase)

```php
// ❌ Before: Wrong property naming
class User {
    public $first_name;
    public $Last_Name;
    public $is_active;
}

// ✅ After: camelCase
class User {
    public $firstName;
    public $lastName;
    public $isActive;
}
```

#### 4: Constant Names (SCREAMING_SNAKE_CASE)

```php
// ❌ Before: Wrong constant naming
class Config {
    const maxLoginAttempts = 5;
    const DEFAULT_TIMEOUT = 30;
    const api_key = 'secret';
}

// ✅ After: SCREAMING_SNAKE_CASE
class Config {
    const MAX_LOGIN_ATTEMPTS = 5;
    const DEFAULT_TIMEOUT = 30;
    const API_KEY = 'secret';
}
```

#### 5: Laravel Model Conventions

```php
// ❌ Before: Wrong model/table naming
class Users extends Model {
    protected $table = 'user'; // Should be plural
}

// ✅ After: Laravel conventions
class User extends Model {
    // Table name automatically inferred as 'users' (plural)
    // Model name is singular
}
```

#### 6: Controller Naming

```php
// ❌ Before: Wrong controller naming
class UsersController extends Controller {
    // Should be UserController (singular model name)
}

// ✅ After: Laravel conventions
class UserController extends Controller {
    // Controller for User model
}
```

#### 7: Service Class Naming

```php
// ❌ Before: Inconsistent service naming
class order_processing_service {}
class PaymentService {}
class user_management {}

// ✅ After: Consistent PascalCase
class OrderProcessingService {}
class PaymentService {}
class UserManagement {}
```

#### 8: Boolean Method Names

```php
// ❌ Before: Wrong boolean naming
class User {
    public function active() {} // Should be isActive
    public function hasPermission() {} // Good
    public function CanEdit() {} // Wrong case
}

// ✅ After: Boolean conventions
class User {
    public function isActive(): bool {}
    public function hasPermission(): bool {}
    public function canEdit(): bool {}
}
```

## References

- [PSR-1 Basic Coding Standard](https://www.php-fig.org/psr/psr-1/)
- [PSR-12 Extended Coding Style Guide](https://www.php-fig.org/psr/psr-12/)
- [Laravel Naming Conventions](https://laravel.com/docs/eloquent#conventions)

## Related Analyzers

- [Missing DocBlock Analyzer](/analyzers/code-quality/missing-docblock) - Ensures proper documentation
- [Method Length Analyzer](/analyzers/code-quality/method-length) - Detects methods that are too long
- [Nesting Depth Analyzer](/analyzers/code-quality/nesting-depth) - Detects excessive code nesting

