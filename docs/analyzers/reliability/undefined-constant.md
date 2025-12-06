---
title: Undefined Constant Usage Analyzer
description: Detects references to undefined constants including global constants, class constants used outside scope, and constants on unknown classes using PHPStan Level 5 static analysis
icon: alert-triangle
outline: [2, 3]
---

# Undefined Constant Usage Analyzer

| Analyzer ID         | Category       | Severity | Time To Fix |
| --------------------| :------------: |:--------:| -----------:|
| `undefined-constant`| ✅ Reliability | High     | 10 minutes  |

## What This Checks

- Detects references to undefined global constants
- Identifies class constants used outside their scope
- Catches attempts to access constants on unknown classes
- Validates constant existence on specified classes
- Detects missing class constants
- Uses PHPStan Level 5 static analysis for comprehensive detection
- Reports exact file location and line number of each issue

## Why It Matters

- **Runtime crashes**: Undefined constants cause fatal errors: `Error: Undefined constant CONSTANT_NAME`
- **Production outages**: Accessing undefined constants is a common source of application crashes
- **Silent failures**: PHP may interpret undefined constants as strings, causing logic errors
- **Scope violations**: Using `self::CONSTANT` outside class scope causes fatal errors
- **Refactoring risks**: Renaming or removing constants without updating all references causes breakage
- **Type safety issues**: Missing constants break type declarations and contract expectations
- **Configuration errors**: Undefined config constants lead to incorrect application behavior
- **Testing gaps**: Constant errors often slip through tests if not all code paths are covered
- **Namespace pollution**: Typos in constant names can accidentally create new constants
- **Code maintenance**: Tracking constant usage becomes difficult with undefined references

## How to Fix

### Quick Fix (5 minutes)

Run locally to see the specific issues:

```bash
vendor/bin/phpstan analyse app --level=5
```

If you have a specific undefined constant error:

```php
// ❌ Before: Using undefined constant
if (APP_DEBUG) {
    // Error: Undefined constant APP_DEBUG
}

// ✅ After: Define the constant
define('APP_DEBUG', env('APP_DEBUG', false));

if (APP_DEBUG) {
    // Works correctly
}
```

### Proper Fix (10 minutes)

#### Fix #1: Define Missing Global Constants

Always define constants before use:

```php
// ❌ Before: Undefined constant
if (API_VERSION === 2) {
    // Error: Undefined constant API_VERSION
}

// ✅ After: Define in bootstrap or config
// config/app.php
return [
    'api_version' => 2,
];

// Or use define()
define('API_VERSION', 2);

// Or use const
const API_VERSION = 2;

// Better: Use config helper
if (config('app.api_version') === 2) {
    // Recommended Laravel approach
}
```

#### Fix #2: Fix Class Constant Scope Issues

Use fully qualified class name when accessing constants outside class:

```php
// ❌ Before: Using self outside class scope
class UserRole
{
    public const ADMIN = 'admin';
    public const USER = 'user';
}

// In a different file
if ($role === self::ADMIN) {
    // Error: Using self:: outside of class scope
}

// ✅ After: Use fully qualified class name
if ($role === UserRole::ADMIN) {
    // Correct
}

// ✅ Alternative: Import the class
use App\Enums\UserRole;

if ($role === UserRole::ADMIN) {
    // Correct
}
```

#### Fix #3: Define Missing Class Constants

Ensure all class constants are defined:

```php
// ❌ Before: Missing class constant
class Order
{
    // Missing STATUS_PENDING constant
}

$order->status = Order::STATUS_PENDING;
// Error: Constant Order::STATUS_PENDING does not exist

// ✅ After: Define the constant
class Order
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
}

$order->status = Order::STATUS_PENDING; // Works

// ✅ Better: Use PHP 8.1 enums
enum OrderStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
}

$order->status = OrderStatus::PENDING->value;
```

#### Fix #4: Fix Constants on Unknown Classes

Ensure classes exist before accessing their constants:

```php
// ❌ Before: Class doesn't exist
use App\Config\Settings;

$timeout = Settings::API_TIMEOUT;
// Error: Access to constant API_TIMEOUT on an unknown class App\Config\Settings

// ✅ After: Create the class
<?php

namespace App\Config;

class Settings
{
    public const API_TIMEOUT = 30;
    public const MAX_RETRIES = 3;
    public const CACHE_TTL = 3600;
}

// ✅ Alternative: Check class exists
if (class_exists(Settings::class)) {
    $timeout = Settings::API_TIMEOUT;
} else {
    $timeout = 30; // Default value
}

// ✅ Better: Use config files
// config/api.php
return [
    'timeout' => 30,
    'max_retries' => 3,
    'cache_ttl' => 3600,
];

// Usage
$timeout = config('api.timeout');
```

#### Fix #5: Use Laravel Config Instead of Constants

Prefer Laravel's config system over global constants:

```php
// ❌ Before: Global constants everywhere
define('MAX_UPLOAD_SIZE', 10485760);
define('ALLOWED_EXTENSIONS', ['jpg', 'png', 'pdf']);
define('DEFAULT_LOCALE', 'en');

if (filesize($file) > MAX_UPLOAD_SIZE) {
    throw new Exception('File too large');
}

// ✅ After: Use config files
// config/uploads.php
return [
    'max_size' => 10 * 1024 * 1024, // 10MB
    'allowed_extensions' => ['jpg', 'png', 'pdf'],
    'default_locale' => 'en',
];

// Usage
if (filesize($file) > config('uploads.max_size')) {
    throw new Exception('File too large');
}

// ✅ Benefits:
// - Environment-specific values
// - Caching support
// - Better organization
// - IDE autocomplete
```

#### Fix #6: Convert to PHP 8.1 Enums

Use enums for better type safety:

```php
// ❌ Before: String constants prone to typos
class User
{
    public const ROLE_ADMIN = 'admin';
    public const ROLE_EDITOR = 'editor';
    public const ROLE_VIEWER = 'viewer';
}

// Easy to make typos
$user->role = 'admon'; // Typo, no error until runtime

// ✅ After: Use enums (PHP 8.1+)
enum UserRole: string
{
    case ADMIN = 'admin';
    case EDITOR = 'editor';
    case VIEWER = 'viewer';
}

class User
{
    public UserRole $role;
}

$user->role = UserRole::ADMIN; // Type-safe
// $user->role = 'admon'; // Type error caught immediately

// ✅ Enum benefits:
// - Type safety
// - IDE autocomplete
// - Impossible to use invalid values
// - Built-in methods
```

#### Fix #7: Fix Visibility and Access Issues

Ensure constants have correct visibility:

```php
// ❌ Before: Private constant accessed from outside
class ApiClient
{
    private const BASE_URL = 'https://api.example.com';
}

// Different class
$url = ApiClient::BASE_URL;
// Error: Cannot access private constant ApiClient::BASE_URL

// ✅ After: Use public visibility
class ApiClient
{
    public const BASE_URL = 'https://api.example.com';
    private const API_KEY_LENGTH = 32; // Internal only
}

$url = ApiClient::BASE_URL; // Works

// ✅ Alternative: Use getter method
class ApiClient
{
    private const BASE_URL = 'https://api.example.com';

    public static function getBaseUrl(): string
    {
        return self::BASE_URL;
    }
}

$url = ApiClient::getBaseUrl();
```

## References

- [PHP Constants](https://www.php.net/manual/en/language.constants.php)
- [PHP 8.1 Enumerations](https://www.php.net/manual/en/language.enumerations.php)
- [Laravel Configuration](https://laravel.com/docs/configuration)
- [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)
- [Class Constants](https://www.php.net/manual/en/language.oop5.constants.php)

## Related Analyzers

- [Missing Return Statements Analyzer](/analyzers/reliability/missing-return-statement) - Detects missing return statements
- [Invalid Method Calls Analyzer](/analyzers/reliability/invalid-method-calls) - Detects invalid method calls
- [Invalid Property Access Analyzer](/analyzers/reliability/invalid-property-access) - Detects invalid property access
- [Undefined Variable Usage Analyzer](/analyzers/reliability/undefined-variable) - Detects references to undefined variables
