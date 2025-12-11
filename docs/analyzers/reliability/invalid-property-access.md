---
title: Invalid Property Access Analyzer
description: Detects invalid property access including undefined properties, visibility violations, property access on non-objects, and type mismatches using PHPStan static analysis
icon: alert-triangle
outline: [2, 3]
tags: phpstan,static-analysis,properties,type-safety
---

# Invalid Property Access Analyzer

| Analyzer ID                | Category       | Severity | Time To Fix |
| ---------------------------| :------------: |:--------:| -----------:|
| `invalid-property-access`  | ✅ Reliability | High     | 15 minutes  |

## What This Checks

- Detects access to undefined properties on classes
- Identifies attempts to access private/protected properties from wrong scope
- Catches property access on non-object types (strings, arrays, null, etc.)
- Detects type mismatches when assigning values to typed properties
- Identifies access to non-existent static properties
- Catches attempts to read write-only properties
- Detects attempts to write to read-only properties
- Validates property visibility violations across inheritance hierarchies
- Uses PHPStan Level 5 static analysis to detect issues before runtime
- Reports exact file location and line number of each invalid property access

## Why It Matters

- **Runtime fatal errors**: Invalid property access causes crashes: `Attempt to read property "X" on null`
- **Production outages**: Property access errors are among the most common PHP crashes
- **Type safety violations**: Wrong property types break type contracts and cause unpredictable behavior
- **Encapsulation breaches**: Accessing private/protected properties violates OOP principles and encapsulation
- **Silent failures**: Some property access errors don't throw exceptions but produce incorrect results
- **Security vulnerabilities**: Visibility violations can expose sensitive internal state
- **Maintenance nightmares**: Dynamic property access makes refactoring dangerous and error-prone
- **API contract violations**: Property type mismatches break contracts with code expecting specific types
- **Framework integration issues**: Many frameworks rely on magic properties and property access patterns
- **Debugging difficulties**: Property access errors are hard to trace when they occur deep in call stacks

## How to Fix

### Quick Fix (5 minutes)

Run locally to see the specific issues:

```bash
vendor/bin/phpstan analyse app --level=5
```

If you have a specific invalid property access error:

```php
// ❌ Before: Accessing undefined property
$user = new User();
$email = $user->email;  // Undefined property

// ✅ After: Check if property exists or use getter
$email = $user->getEmail();
// Or define the property
class User {
    public string $email;
}
```

### Proper Fix (15 minutes)

#### 1: Access to Undefined Properties

Always ensure properties are defined before accessing them:

```php
// ❌ Before: Undefined property
class User {
    public string $name;
}

$user = new User();
$email = $user->email;  // Undefined property

// ✅ After: Define the property
class User {
    public string $name;
    public string $email;
}

$user = new User();
$email = $user->email;

// ✅ After: Use magic __get() for dynamic properties
class User {
    private array $attributes = [];

    public function __get(string $name): mixed
    {
        return $this->attributes[$name] ?? null;
    }

    public function __set(string $name, mixed $value): void
    {
        $this->attributes[$name] = $value;
    }

    public function __isset(string $name): bool
    {
        return isset($this->attributes[$name]);
    }
}
```

#### 2: Visibility Violations (Private/Protected Access)

Respect property visibility or provide public accessors:

```php
// ❌ Before: Accessing private property from outside
class User {
    private string $password;

    public function __construct(string $password) {
        $this->password = password_hash($password, PASSWORD_DEFAULT);
    }
}

$user = new User('secret');
echo $user->password;  // Cannot access private property

// ✅ After: Use getter method
class User {
    private string $password;

    public function __construct(string $password) {
        $this->password = password_hash($password, PASSWORD_DEFAULT);
    }

    public function verifyPassword(string $password): bool {
        return password_verify($password, $this->password);
    }
}

$user = new User('secret');
$isValid = $user->verifyPassword('secret');

// ✅ After: Make property public if appropriate
class User {
    public string $name;
    private string $password;  // Keep sensitive data private
}
```

#### 3: Property Access on Non-Objects

Ensure variables are objects before accessing properties:

```php
// ❌ Before: Accessing property on null
function getUserEmail(?User $user): string
{
    return $user->email;  // $user might be null
}

// ✅ After: Check for null first
function getUserEmail(?User $user): string
{
    if ($user === null) {
        return 'guest@example.com';
    }

    return $user->email;
}

// ✅ After: Use nullsafe operator (PHP 8.0+)
function getUserEmail(?User $user): ?string
{
    return $user?->email;
}

// ❌ Before: Accessing property on non-object type
$data = "not an object";
echo $data->property;  // Cannot access property on string

// ✅ After: Ensure correct type
$data = new stdClass();
$data->property = "value";
echo $data->property;
```

#### 4: Property Type Mismatches

Ensure assigned values match property types:

```php
// ❌ Before: Type mismatch in assignment
class User {
    public int $age;
}

$user = new User();
$user->age = "25";  // String assigned to int property

// ✅ After: Assign correct type
$user->age = 25;

// ✅ After: Cast if necessary
$user->age = (int) "25";

// ❌ Before: Complex type mismatch
class Order {
    public User $customer;
}

$order = new Order();
$order->customer = "John Doe";  // String assigned to User property

// ✅ After: Assign correct object type
$order->customer = new User('John Doe');
```

#### 5: Static Property Access Issues

Ensure static properties exist and are accessed correctly:

```php
// ❌ Before: Accessing non-existent static property
class Config {
    public static string $appName = 'MyApp';
}

echo Config::$version;  // Undefined static property

// ✅ After: Define the static property
class Config {
    public static string $appName = 'MyApp';
    public static string $version = '1.0.0';
}

echo Config::$version;

// ❌ Before: Accessing instance property as static
class User {
    public string $name;
}

echo User::$name;  // Not a static property

// ✅ After: Access as instance property
$user = new User();
echo $user->name;
```

#### 6: Read-Only and Write-Only Properties

Respect property access modes:

```php
// ❌ Before: Writing to read-only property (PHP 8.1+)
class User {
    public readonly string $id;

    public function __construct(string $id) {
        $this->id = $id;
    }
}

$user = new User('123');
$user->id = '456';  // Cannot modify readonly property

// ✅ After: Don't modify readonly properties
$user = new User('123');
// Create new instance if different value needed
$newUser = new User('456');

// ❌ Before: Reading write-only property (rare but possible with __set)
class Logger {
    public function __set(string $name, mixed $value): void {
        $this->log($name, $value);
    }
}

$logger = new Logger();
$logger->message = 'Error occurred';
echo $logger->message;  // Property not readable

// ✅ After: Don't read write-only properties
$logger->message = 'Error occurred';  // Just set it
```

## References

- [PHP Properties](https://www.php.net/manual/en/language.oop5.properties.php)
- [PHP Visibility](https://www.php.net/manual/en/language.oop5.visibility.php)
- [PHP Magic Methods](https://www.php.net/manual/en/language.oop5.magic.php)
- [PHP Readonly Properties](https://www.php.net/manual/en/language.oop5.properties.php#language.oop5.properties.readonly-properties)
- [PHP Nullsafe Operator](https://www.php.net/manual/en/language.oop5.basic.php#language.oop5.basic.nullsafe)
- [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)

## Related Analyzers

- [Invalid Method Calls Analyzer](/analyzers/reliability/invalid-method-calls) - Detects invalid method calls
- [Invalid Offset Access Analyzer](/analyzers/reliability/invalid-offset-access) - Detects invalid array offset access
- [Undefined Variable Usage Analyzer](/analyzers/reliability/undefined-variable) - Detects references to undefined variables
- [Invalid Method Overrides Analyzer](/analyzers/reliability/invalid-method-overrides) - Detects invalid method overrides
