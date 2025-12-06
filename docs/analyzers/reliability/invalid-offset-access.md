---
title: Invalid Offset Access Analyzer
description: Detects invalid array offset access including non-existent keys, wrong offset types, offset access on non-arrays, and type mismatches using PHPStan static analysis
icon: alert-triangle
outline: [2, 3]
---

# Invalid Offset Access Analyzer

| Analyzer ID               | Category       | Severity | Time To Fix |
| --------------------------| :------------: |:--------:| -----------:|
| `invalid-offset-access`   | ✅ Reliability | High     | 15 minutes  |

## What This Checks

- Detects access to non-existent array keys/offsets
- Identifies attempts to use array offset syntax on non-array types (strings, objects, etc.)
- Catches offset types that don't match expected types (e.g., using string offset on int-indexed array)
- Detects offsets that might not exist (conditional array keys)
- Identifies attempts to assign values using invalid offset syntax
- Catches attempts to unset offsets on non-array types
- Detects type mismatches in ArrayAccess implementations
- Uses PHPStan Level 5 static analysis to detect issues before runtime
- Reports exact file location and line number of each invalid offset access
- Validates all array operations throughout your application

## Why It Matters

- **Runtime fatal errors**: Invalid offset access causes crashes: `Trying to access array offset on value of type null`
- **Production outages**: Array offset errors are among the most common PHP crashes in production
- **Data corruption**: Wrong offset types can silently fail or corrupt data structures
- **Undefined index warnings**: Accessing non-existent keys generates warnings that clutter logs
- **Type safety breakdown**: Incorrect offset usage breaks type contracts and expectations
- **Silent failures**: Some offset errors don't throw exceptions but produce incorrect results
- **Security vulnerabilities**: Invalid array access can expose sensitive data or cause injection attacks
- **Framework integration issues**: Many frameworks rely on array offsets (routing, middleware, config)
- **API contract violations**: Invalid offsets break contracts with code expecting specific array structures
- **Debugging nightmares**: Offset errors are hard to trace when they occur deep in call stacks

## How to Fix

### Quick Fix (5 minutes)

Run locally to see the specific issues:

```bash
vendor/bin/phpstan analyse app --level=5
```

If you have a specific invalid offset access error:

```php
// ❌ Before: Accessing non-existent offset
$user = ['name' => 'John'];
$email = $user['email'];  // Undefined array key "email"

// ✅ After: Check if offset exists
$email = $user['email'] ?? 'no-email@example.com';
// Or use isset()
$email = isset($user['email']) ? $user['email'] : 'no-email@example.com';
```

### Proper Fix (15 minutes)

#### Fix #1: Access to Non-Existent Array Keys

Always check if array keys exist before accessing them:

```php
// ❌ Before: Direct access without checking
$config = ['database' => 'mysql'];
$cache = $config['cache'];  // Undefined array key "cache"

// ✅ After: Use null coalescing operator
$cache = $config['cache'] ?? 'redis';

// ✅ After: Use isset() for boolean check
if (isset($config['cache'])) {
    $cache = $config['cache'];
}

// ✅ After: Use array_key_exists() for strict checking
if (array_key_exists('cache', $config)) {
    $cache = $config['cache'];  // Includes null values
}
```

#### Fix #2: Offset Access on Non-Array Types

Ensure you're using array offset syntax only on arrays or ArrayAccess objects:

```php
// ❌ Before: Using array syntax on string
$name = "John Doe";
$firstChar = $name[0];  // This works but PHPStan warns about it
$middle = $name['middle'];  // Cannot access offset 'middle' on string

// ✅ After: Use proper string functions
$firstChar = substr($name, 0, 1);
// Or use mb_substr for multibyte strings
$firstChar = mb_substr($name, 0, 1);

// ❌ Before: Using array syntax on object
$user = new stdClass();
$user->name = 'John';
$name = $user['name'];  // Cannot access offset 'name' on stdClass

// ✅ After: Use object property access
$name = $user->name;
```

#### Fix #3: Wrong Offset Types

Ensure offset types match the array structure:

```php
// ❌ Before: Using string key on numeric array
$items = ['apple', 'banana', 'orange'];
$fruit = $items['first'];  // Offset 'first' does not exist

// ✅ After: Use numeric index
$fruit = $items[0];  // 'apple'

// ❌ Before: Using numeric key on associative array
$user = ['name' => 'John', 'email' => 'john@example.com'];
$name = $user[0];  // Offset 0 does not exist

// ✅ After: Use string key
$name = $user['name'];
```

#### Fix #4: Offsets That Might Not Exist

Handle conditional array keys properly:

```php
// ❌ Before: Assuming key exists
function processUser(array $data): void
{
    $email = $data['email'];  // Offset 'email' might not exist
    sendEmail($email);
}

// ✅ After: Validate and provide default
function processUser(array $data): void
{
    if (!isset($data['email'])) {
        throw new InvalidArgumentException('Email is required');
    }

    sendEmail($data['email']);
}

// ✅ After: Use null coalescing with validation
function processUser(array $data): void
{
    $email = $data['email'] ?? null;

    if ($email === null) {
        return;  // Skip processing if no email
    }

    sendEmail($email);
}
```

#### Fix #5: Cannot Assign Offset

Only assign offsets to arrays or ArrayAccess objects:

```php
// ❌ Before: Assigning to non-array
$config = null;
$config['database'] = 'mysql';  // Cannot assign offset 'database' to null

// ✅ After: Initialize as array first
$config = [];
$config['database'] = 'mysql';

// ❌ Before: Assigning to string
$text = "Hello";
$text[0] = 'J';  // Cannot assign string offset

// ✅ After: Build new string
$text = 'J' . substr($text, 1);  // "Jello"
```

#### Fix #6: ArrayAccess Type Mismatches

Ensure offset types match ArrayAccess expectations:

```php
// ❌ Before: Wrong offset type for ArrayAccess
class StringKeyedCollection implements ArrayAccess
{
    public function offsetGet(mixed $offset): mixed
    {
        if (!is_string($offset)) {
            throw new InvalidArgumentException('Offset must be string');
        }
        return $this->data[$offset];
    }
    // ... other methods
}

$collection = new StringKeyedCollection();
$item = $collection[0];  // Offset int does not accept type int (expects string)

// ✅ After: Use correct offset type
$item = $collection['key'];
```

## References

- [PHP Arrays](https://www.php.net/manual/en/language.types.array.php)
- [ArrayAccess Interface](https://www.php.net/manual/en/class.arrayaccess.php)
- [PHP Type Declarations](https://www.php.net/manual/en/language.types.declarations.php)
- [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)
- [Null Coalescing Operator](https://www.php.net/manual/en/language.operators.comparison.php#language.operators.comparison.coalesce)
- [Laravel Helpers](https://laravel.com/docs/helpers#arrays-and-objects-method-list)

## Related Analyzers

- [Invalid Method Calls Analyzer](/analyzers/reliability/invalid-method-calls) - Detects invalid method calls
- [Invalid Function Calls Analyzer](/analyzers/reliability/invalid-function-calls) - Detects invalid function calls
- [Undefined Variable Usage Analyzer](/analyzers/reliability/undefined-variable) - Detects references to undefined variables
- [Invalid Property Access Analyzer](/analyzers/reliability/invalid-property-access) - Detects invalid property access
