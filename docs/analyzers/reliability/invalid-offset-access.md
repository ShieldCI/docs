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

## Common Scenarios

### Scenario 1: Laravel Request Data Access

```php
// ❌ Before: Direct access without validation
public function store(Request $request)
{
    $email = $request->input()['email'];  // Offset might not exist
    $user = User::create([
        'email' => $email,
    ]);
}

// ✅ After: Use Laravel's input methods with defaults
public function store(Request $request)
{
    $request->validate([
        'email' => 'required|email',
    ]);

    $user = User::create([
        'email' => $request->input('email'),  // Validated
    ]);
}

// ✅ After: Use null coalescing for optional fields
public function update(Request $request, User $user)
{
    $user->update([
        'name' => $request->input('name') ?? $user->name,
        'bio' => $request->input('bio') ?? '',
    ]);
}
```

### Scenario 2: Configuration Array Access

```php
// ❌ Before: Assuming config keys exist
class DatabaseConnection
{
    public function __construct(array $config)
    {
        $this->host = $config['host'];  // Might not exist
        $this->port = $config['port'];  // Might not exist
    }
}

// ✅ After: Provide defaults and validation
class DatabaseConnection
{
    public function __construct(array $config)
    {
        $this->host = $config['host'] ?? 'localhost';
        $this->port = $config['port'] ?? 3306;
        $this->database = $config['database'] ?? throw new InvalidArgumentException('Database name required');
    }
}
```

### Scenario 3: API Response Handling

```php
// ❌ Before: Direct access to API response
function getUserData(int $userId): array
{
    $response = Http::get("/api/users/{$userId}")->json();

    return [
        'name' => $response['data']['name'],  // Offsets might not exist
        'email' => $response['data']['email'],
    ];
}

// ✅ After: Validate structure before access
function getUserData(int $userId): array
{
    $response = Http::get("/api/users/{$userId}")->json();

    if (!isset($response['data']['name'], $response['data']['email'])) {
        throw new RuntimeException('Invalid API response structure');
    }

    return [
        'name' => $response['data']['name'],
        'email' => $response['data']['email'],
    ];
}

// ✅ After: Use data_get() helper for nested access
function getUserData(int $userId): array
{
    $response = Http::get("/api/users/{$userId}")->json();

    return [
        'name' => data_get($response, 'data.name', 'Unknown'),
        'email' => data_get($response, 'data.email'),
    ];
}
```

## Advanced Patterns

### Pattern 1: Safe Nested Array Access

```php
// ❌ Before: Nested access without checks
$city = $user['address']['city'];  // Multiple offsets might not exist

// ✅ After: Check each level
$city = null;
if (isset($user['address']['city'])) {
    $city = $user['address']['city'];
}

// ✅ After: Use null coalescing chain
$city = $user['address']['city'] ?? null;

// ✅ After: Use data_get() helper (Laravel)
$city = data_get($user, 'address.city');

// ✅ After: Custom helper function
function array_get_nested(array $array, string $path, mixed $default = null): mixed
{
    $keys = explode('.', $path);

    foreach ($keys as $key) {
        if (!is_array($array) || !array_key_exists($key, $array)) {
            return $default;
        }
        $array = $array[$key];
    }

    return $array;
}

$city = array_get_nested($user, 'address.city', 'Unknown');
```

### Pattern 2: Type-Safe ArrayAccess Implementation

```php
// ✅ Proper ArrayAccess implementation with type safety
class TypedCollection implements ArrayAccess
{
    private array $items = [];

    public function offsetExists(mixed $offset): bool
    {
        return is_string($offset) && array_key_exists($offset, $this->items);
    }

    public function offsetGet(mixed $offset): mixed
    {
        if (!is_string($offset)) {
            throw new InvalidArgumentException('Offset must be string');
        }

        if (!$this->offsetExists($offset)) {
            throw new OutOfBoundsException("Offset '{$offset}' does not exist");
        }

        return $this->items[$offset];
    }

    public function offsetSet(mixed $offset, mixed $value): void
    {
        if (!is_string($offset)) {
            throw new InvalidArgumentException('Offset must be string');
        }

        $this->items[$offset] = $value;
    }

    public function offsetUnset(mixed $offset): void
    {
        if (!is_string($offset)) {
            throw new InvalidArgumentException('Offset must be string');
        }

        unset($this->items[$offset]);
    }
}
```

### Pattern 3: Array Shape Validation

```php
// ✅ Validate array structure before processing
function validateUserData(array $data): void
{
    $required = ['name', 'email', 'password'];
    $missing = array_diff($required, array_keys($data));

    if (!empty($missing)) {
        throw new InvalidArgumentException(
            'Missing required fields: ' . implode(', ', $missing)
        );
    }
}

function createUser(array $data): User
{
    validateUserData($data);

    // Now safe to access these offsets
    return User::create([
        'name' => $data['name'],
        'email' => $data['email'],
        'password' => bcrypt($data['password']),
    ]);
}
```

## PHPStan Integration

This analyzer uses PHPStan Level 5 (included with ShieldCI) to detect invalid offset access:

```bash
# Run ShieldCI analysis
php artisan shield:analyze --analyzer=invalid-offset-access

# Or run all reliability analyzers
php artisan shield:analyze --category=reliability
```

### PHPStan Configuration

PHPStan is included as a required dependency in ShieldCI. If you want to run PHPStan directly:

```bash
# Check for invalid offset access
vendor/bin/phpstan analyse app --level=5
```

## Common Patterns to Avoid

### Anti-Pattern 1: Suppressing Warnings

```php
// ❌ Don't suppress the warning
@$email = $user['email'];  // Still undefined if key missing

// ✅ Handle properly
$email = $user['email'] ?? null;
```

### Anti-Pattern 2: Empty String Defaults Everywhere

```php
// ❌ Don't use empty string for everything
$name = $user['name'] ?? '';
$age = $user['age'] ?? '';  // Age should be int or null, not string
$active = $user['active'] ?? '';  // Boolean should not be string

// ✅ Use appropriate type defaults
$name = $user['name'] ?? 'Guest';
$age = $user['age'] ?? null;
$active = $user['active'] ?? false;
```

### Anti-Pattern 3: Silent Failures

```php
// ❌ Don't silently ignore missing required data
function processOrder(array $data): void
{
    $userId = $data['user_id'] ?? null;
    if ($userId) {
        // Process order... but what if user_id is actually required?
    }
}

// ✅ Fail fast for required data
function processOrder(array $data): void
{
    if (!isset($data['user_id'])) {
        throw new InvalidArgumentException('user_id is required');
    }

    $userId = $data['user_id'];
    // Process order with confidence
}
```

## Related Analyzers

- [Invalid Method Calls Analyzer](/analyzers/reliability/invalid-method-calls) - Detects invalid method calls
- [Invalid Function Calls Analyzer](/analyzers/reliability/invalid-function-calls) - Detects invalid function calls
- [Undefined Variable Usage Analyzer](/analyzers/reliability/undefined-variable) - Detects undefined variables
- [Invalid Property Access Analyzer](/analyzers/reliability/invalid-property-access) - Detects invalid property access

## References

- [PHP Arrays](https://www.php.net/manual/en/language.types.array.php)
- [ArrayAccess Interface](https://www.php.net/manual/en/class.arrayaccess.php)
- [PHP Type Declarations](https://www.php.net/manual/en/language.types.declarations.php)
- [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)
- [Null Coalescing Operator](https://www.php.net/manual/en/language.operators.comparison.php#language.operators.comparison.coalesce)
- [Laravel Helpers](https://laravel.com/docs/helpers#arrays-and-objects-method-list)
