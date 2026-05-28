---
title: PHPStan Static Analyzer
description: Comprehensive static analysis detecting 13 categories of type errors, undefined references, and code quality issues
icon: shield-check
outline: [2, 3]
tags: phpstan,static-analysis,type-safety,reliability,code-quality
---

# PHPStan Static Analyzer

| Analyzer ID | Category       | Severity | Time To Fix |
| ----------- | :------------: |:--------:|------------:|
| `phpstan`   | ✅ Reliability | High     | 120 minutes |

## What This Checks

The PHPStan analyzer is a **consolidated analyzer**. It runs PHPStan once and categorizes issues into 13 distinct categories:

- **Dead Code** - Unreachable statements, unused variables, and code with no effect
- **Deprecated Code** - Usage of deprecated methods, classes, and functions
- **Foreach Iterable** - Invalid foreach usage with non-iterable values
- **Invalid Function Calls** - Calls to undefined or incorrectly parameterized functions
- **Invalid Imports** - Invalid use statements for non-existent classes
- **Invalid Method Calls** - Calls to undefined or incorrectly parameterized methods
- **Invalid Method Overrides** - Incompatible method signature overrides
- **Invalid Offset Access** - Invalid array offset access and type mismatches
- **Invalid Property Access** - Access to undefined or inaccessible properties
- **Missing Model Relations** - References to non-existent Eloquent relations
- **Missing Return Statements** - Methods with missing return statements
- **Undefined Constants** - References to undefined constants
- **Undefined Variables** - References to undefined variables

Each issue is automatically categorized and reported with category-specific recommendations.

## Why It Matters

- **Type safety** - Catches type errors before they cause runtime failures
- **Early detection** - Finds bugs during development, not in production
- **Comprehensive coverage** - Detects 13 categories of reliability issues in one analyzer
- **Cleaner codebase** - Removes dead code and unused variables
- **Better maintainability** - Ensures deprecated code is updated
- **Laravel-specific** - Detects issues with Eloquent relations and Laravel patterns

## How to Fix

### Quick Fix (45 minutes)

Run PHPStan to see all issues:

```bash
php artisan shield:analyze --analyzer=phpstan
```

Review the categorized issues and fix the most critical ones first:

```php
// ❌ BAD - Undefined variable
public function process()
{
    return $undefinedVariable; // Critical issue
}

// ✅ GOOD - Variable defined
public function process()
{
    $result = 'processed';
    return $result;
}
```

### Proper Fix (120 minutes)

1. **Configure PHPStan level** - Publish the config:
```bash
php artisan vendor:publish --tag=shieldci-config
```

Then start with level 5, increase gradually in `config/shieldci.php`: 

```php
'analyzers' => [
    'reliability' => [
        'enabled' => true,

        'phpstan' => [
            'level' => 5, // 0-9, higher is stricter

            // Optional: Override global paths (uses 'paths.analyze' by default)
            // 'paths' => ['app', 'routes'],

            'categories' => [
                'dead-code',
                'deprecated-code',
                'foreach-iterable',
                'invalid-function-calls',
                'invalid-imports',
                'invalid-method-calls',
                'invalid-method-overrides',
                'invalid-offset-access',
                'invalid-property-access',
                'missing-model-relation',
                'missing-return-statement',
                'undefined-constant',
                'undefined-variable',
            ],
            'disabled_categories' => [
                // Optionally disable specific categories
            ],
        ],
    ],
],
```

2. **Fix issues by category** - Address high-severity issues first:

```php
// Invalid Method Call
// ❌ Before
$user->undefinedMethod();

// ✅ After
$user->existingMethod();

// Missing Return Statement
// ❌ Before
public function calculate(int $a, int $b): int
{
    $result = $a + $b;
    // Missing return!
}

// ✅ After
public function calculate(int $a, int $b): int
{
    $result = $a + $b;
    return $result;
}

// Undefined Variable
// ❌ Before
if ($condition) {
    $value = 'something';
}
return $value; // $value might not be defined

// ✅ After
$value = null; // Initialize first
if ($condition) {
    $value = 'something';
}
return $value;
```

3. **Enable/disable categories** - Focus on specific issue types:

```php
// Disable less critical categories temporarily
'disabled_categories' => [
    'dead-code', // Fix later
],
```

4. **Adjust PHPStan level** - Increase strictness over time:

```php
// Start with level 5 (balanced)
'level' => 5,

// Gradually increase to 6, 7, 8 as you fix issues
'level' => 8, // Maximum strictness
```

**PHPStan Levels:**

- **Level 0-2**: Very lenient, good for legacy code
- **Level 3-5**: Balanced, recommended for most projects
- **Level 6-8**: Strict, ideal for new projects
- **Level 9**: Maximum (Larastan max), catches everything

## ShieldCI Configuration

This analyzer runs in all environments. Customize which categories to enable and which paths to analyze:

### Available Categories

You can enable/disable specific categories:

```php
'categories' => [
    'dead-code',              // Medium severity
    'deprecated-code',        // High severity
    'foreach-iterable',       // High severity
    'invalid-function-calls', // High severity
    'invalid-imports',        // Critical severity
    'invalid-method-calls',   // Critical severity
    'invalid-method-overrides', // High severity
    'invalid-offset-access',  // High severity
    'invalid-property-access', // High severity
    'missing-model-relation', // High severity
    'missing-return-statement', // High severity
    'undefined-constant',     // High severity
    'undefined-variable',     // High severity
],
```

### Disable Specific Categories

```php
'disabled_categories' => [
    'dead-code', // Temporarily ignore dead code
],
```

### Custom Paths

**By default**, PHPStan uses the global paths from `config/shieldci.php`:

```php
'paths' => [
    'analyze' => ['app', 'config', 'database', 'routes', 'resources/views'],
],
```

**Override only if needed** - Specify PHPStan-specific paths:

```php
'analyzers' => [
    'reliability' => [
        'enabled' => true,
        
        'phpstan' => [
            'paths' => ['app', 'routes'], // Only analyze these directories
        ],
    ],
],
```

**Why you might override:**
- PHPStan is slower than other analyzers - limit to critical paths
- Some paths (like `config/`) may have intentional dynamic code
- Focus on application code (`app/`) for faster feedback



## References

- [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)
- [PHPStan Rule Levels](https://phpstan.org/user-guide/rule-levels)
- [Larastan (Laravel-specific PHPStan)](https://github.com/larastan/larastan)
- [Laravel Type Safety Best Practices](https://laravel.com/docs/validation)

## Related Analyzers

- [Composer Validation Analyzer](/analyzers/reliability/composer-validation) - Ensures composer.json integrity
- [Database Status Analyzer](/analyzers/reliability/database-status) - Validates database connectivity
- [Env File Analyzer](/analyzers/reliability/env-file-exists) - Checks environment configuration
