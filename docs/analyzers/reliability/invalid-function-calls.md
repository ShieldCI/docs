---
title: Invalid Function Calls Analyzer
description: Detects invalid function calls including undefined functions, wrong parameter types, and incorrect function signatures using PHPStan static analysis
icon: alert-triangle
outline: [2, 3]
---

# Invalid Function Calls Analyzer

| Analyzer ID               | Category       | Severity | Time To Fix |
| --------------------------| :------------: |:--------:| -----------:|
| `invalid-function-calls`  | ✅ Reliability | High     | 20 minutes  |

## What This Checks

- Detects calls to undefined or non-existent functions
- Identifies incorrect number of parameters passed to functions
- Catches type mismatches in function parameters (e.g., passing int when string expected)
- Detects usage of void function return values
- Identifies missing required parameters in function calls
- Catches unknown/invalid parameter names in function calls
- Uses PHPStan Level 5 static analysis to detect issues before runtime
- Reports exact file location and line number of each issue

## Why It Matters

- **Runtime crashes**: Calling undefined functions causes fatal errors: `Fatal error: Call to undefined function`
- **Production outages**: Invalid function calls crash your application immediately, causing downtime and revenue loss
- **Type errors**: Wrong parameter types cause unpredictable behavior and data corruption
- **Silent failures**: Type mismatches may not error immediately but produce incorrect results
- **API integration failures**: External library function calls with wrong signatures break integrations
- **Refactoring risks**: Function signature changes can introduce bugs if call sites aren't updated
- **Developer productivity**: Runtime errors waste debugging time that static analysis prevents
- **Data integrity**: Incorrect parameter types can corrupt data when passed to database functions

## How to Fix

### Quick Fix (5 minutes)

Run locally to see the specific issues:

```bash
vendor/bin/phpstan analyse app --level=5
```

If you have a specific invalid function call error:

```php
// ❌ Before: Undefined function
$result = customFunction($data);

// ✅ After: Define the function or use correct name
$result = custom_function($data); // Fixed typo
```

### Proper Fix (20 minutes)

#### Fix #1: Undefined Function - Check for Typos

```php
// ❌ Before: Typo in function name
function calculateTotal($items) {
    return array_sum($items);
}

$total = calculteTotal($items); // Typo: calculte

// ✅ After: Fix typo
$total = calculateTotal($items);
```

#### Fix #2: Wrong Parameter Count

```php
// ❌ Before: Missing required parameter
$substring = substr('Hello World'); // Missing start parameter

// ✅ After: Provide all required parameters
$substring = substr('Hello World', 0, 5); // 'Hello'
```

#### Fix #3: Wrong Parameter Type

```php
// ❌ Before: Wrong type passed
function processName(string $name): void {
    echo strtoupper($name);
}

processName(123); // Passing int, expects string

// ✅ After: Pass correct type
processName((string) 123); // Cast to string
// Or better:
processName('John'); // Pass string directly
```

#### Fix #4: Void Function Return Usage

```php
// ❌ Before: Using return value from void function
function logMessage(string $message): void {
    error_log($message);
}

$result = logMessage('Error occurred'); // void has no return value

// ✅ After: Don't use return value
logMessage('Error occurred');
$result = null; // Or just remove the assignment
```

#### Fix #5: Missing PHP Extension

```php
// ❌ Before: Function from missing extension
$image = imagecreate(100, 100); // GD extension not installed

// ✅ After: Install required extension
// 1. Check if extension is installed
if (!function_exists('imagecreate')) {
    throw new RuntimeException('GD extension required');
}

// 2. Install extension (composer.json)
{
    "require": {
        "ext-gd": "*"
    }
}
```

## References

- [PHP Function Reference](https://www.php.net/manual/en/funcref.php)
- [PHP Type Declarations](https://www.php.net/manual/en/language.types.declarations.php)
- [PHP Named Arguments](https://www.php.net/manual/en/functions.arguments.php#functions.named-arguments)
- [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)
- [Composer Autoloading](https://getcomposer.org/doc/04-schema.md#autoload)
- [PHP Extensions List](https://www.php.net/manual/en/extensions.php)


## Related Analyzers

- [Invalid Method Calls Analyzer](/analyzers/reliability/invalid-method-calls) - Detects invalid method calls
- [Undefined Variable Usage Analyzer](/analyzers/reliability/undefined-variable) - Detects references to undefined variables
- [Missing Return Statements Analyzer](/analyzers/reliability/missing-return-statement) - Detects missing return statements
- [Invalid Offset Access Analyzer](/analyzers/reliability/invalid-offset-access) - Detects invalid array access
