---
title: Naming Convention Analyzer
description: Validates PSR naming standards for better code consistency
icon: code
outline: [2, 3]
tags: conventions,psr,code-quality,readability
---

# Naming Convention Analyzer

| Analyzer ID          | Category         | Severity | Time To Fix |
| --------------------| :--------------: |:--------:| -----------:|
| `naming-convention` | 💻 Code Quality  | Low      | 20 minutes  |

## What This Checks

- Validates class, interface, trait, and enum names follow PascalCase (e.g., `UserController`, `OrderService`)
- Ensures method names follow camelCase (e.g., `getUserById`, `processPayment`)
- Validates property names follow camelCase (e.g., `firstName`, `isActive`)
- Checks public constant names follow SCREAMING_SNAKE_CASE (e.g., `MAX_LOGIN_ATTEMPTS`)
- Allows private/protected constants to use camelCase (modern PHP convention)
- Skips magic methods (e.g., `__construct`, `__toString`)
- Reports exact file location and line number of each violation
- Provides suggestions for correct naming

**What's NOT Checked** (to avoid excessive noise):
- Local variables (e.g., `$user_id`, `$is_active`)
- Function parameters (e.g., `function process($user_name)`)
- Closure variables

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
// ❌ BAD - Wrong naming
class user_controller {
    public function get_user($id) {
        // ...
    }
}

// ✅ GOOD - Correct naming
class UserController {
    public function getUser(int $id) {
        // ...
    }
}
```

### Proper Fix (20 minutes)

#### 1: Class Names (PascalCase)

```php
// ❌ BAD - Wrong class naming
class user_service {}
class OrderProcessor {}
class payment_gateway {}

// ✅ GOOD - PascalCase
class UserService {}
class OrderProcessor {}
class PaymentGateway {}
```

#### 2: Method Names (camelCase)

```php
// ❌ BAD - Wrong method naming
class UserController {
    public function get_user_by_id() {}
    public function ProcessPayment() {}
    public function send_email_notification() {}
}

// ✅ GOOD - camelCase
class UserController {
    public function getUserById() {}
    public function processPayment() {}
    public function sendEmailNotification() {}
}
```

#### 3: Property Names (camelCase)

```php
// ❌ BAD - Wrong property naming
class User {
    public $first_name;
    public $Last_Name;
    public $is_active;
}

// ✅ GOOD - camelCase
class User {
    public $firstName;
    public $lastName;
    public $isActive;
}
```

#### 4: Constant Names

**PSR-12 Convention**: Only public constants require SCREAMING_SNAKE_CASE. Private and protected constants may use camelCase (modern PHP convention).

```php
// ❌ BAD - Wrong public constant naming
class Config {
    public const maxLoginAttempts = 5;  // Public must be SCREAMING_SNAKE_CASE
    public const api_key = 'secret';    // Public must be SCREAMING_SNAKE_CASE
}

// ✅ GOOD - Correct public constant naming
class Config {
    public const MAX_LOGIN_ATTEMPTS = 5;
    public const API_KEY = 'secret';

    // Private/protected constants can use camelCase (modern PHP)
    private const maxRetries = 3;
    protected const defaultTimeout = 30;
    private const cachePrefix = 'app_';
}
```

**Why the difference?**
- Public constants are part of the public API and should follow strict PSR-12 conventions
- Private/protected constants are internal implementation details
- Modern PHP codebases often use camelCase for internal constants for consistency with properties

#### 5: Interface and Trait Naming

```php
// ❌ BAD - Wrong naming
interface user_repository {}
trait has_timestamps {}

// ✅ GOOD - PascalCase
interface UserRepository {}
trait HasTimestamps {}
```

#### 6: Enum Naming (PHP 8.1+)

```php
// ❌ BAD - Wrong enum naming
enum user_status {
    case ACTIVE;
    case INACTIVE;
}

// ✅ GOOD - PascalCase
enum UserStatus {
    case ACTIVE;
    case INACTIVE;
}
```

#### 7: Boolean Method Names

```php
// ❌ BAD - Wrong boolean naming
class User {
    public function active() {} // Should be isActive
    public function hasPermission() {} // Good
    public function CanEdit() {} // Wrong case
}

// ✅ GOOD - Boolean conventions
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

