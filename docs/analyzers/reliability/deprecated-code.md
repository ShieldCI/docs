---
title: Deprecated Code Analyzer
description: Detect usage of deprecated methods, classes, functions, and constants using PHPStan static analysis
icon: alert-triangle
outline: [2, 3]
---

# Deprecated Code Analyzer

| Analyzer ID        | Category       | Severity | Time To Fix  |
| -------------------| :------------: |:--------:| ------------:|
| `deprecated-code`  | ✅ Reliability | High     | 15 minutes   |

## What This Checks

- Runs PHPStan at level 5 on your `app/` directory to detect deprecated code usage
- Identifies calls to deprecated methods and functions
- Detects instantiation of deprecated classes and interfaces
- Finds usage of deprecated constants
- Catches access to deprecated properties
- Analyzes both your code and third-party library usage
- Limits output to first 50 issues to prevent overwhelming reports
- Automatically skips when PHPStan is not installed

## Why It Matters

- **Breaking changes**: Deprecated code is marked for removal in future versions, leading to breaking changes when you upgrade dependencies
- **Security vulnerabilities**: Deprecated features often have known security issues that are fixed in newer alternatives
- **Performance degradation**: Deprecated code may use outdated, slower approaches compared to modern replacements
- **Maintenance burden**: Code using deprecated APIs becomes harder to maintain as documentation and support disappear
- **Technical debt**: Delaying migration from deprecated code compounds the work required for future upgrades
- **Library compatibility**: Using deprecated features can prevent upgrading to newer versions of Laravel or packages

## How to Fix

### Proper Fix (15 minutes)

1. Run PHPStan locally to see the specific deprecated code issues:

```bash
vendor/bin/phpstan analyse app --level=5
```

2. For each deprecated code issue, apply the appropriate fix:

**Deprecated methods** - Replace with recommended alternative:

```php
// Before - Using deprecated method
public function sendEmail(): void
{
    Mail::sendNow($this->message); // ❌ Deprecated in Laravel 9
}

// After - Use modern alternative
public function sendEmail(): void
{
    Mail::send($this->message); // ✅ Current method
}
```

**Deprecated classes** - Migrate to replacement class:

```php
// Before - Instantiating deprecated class
use Illuminate\Support\Facades\Input; // ❌ Removed in Laravel 6

public function getData(): array
{
    return Input::all();
}

// After - Use Request facade instead
use Illuminate\Support\Facades\Request;

public function getData(): array
{
    return Request::all(); // ✅ Modern replacement
}
```

**Deprecated functions** - Switch to modern equivalent:

```php
// Before - Using deprecated function
public function getUser(): User
{
    return auth()->user(); // If deprecated
}

// After - Use current alternative
public function getUser(): User
{
    return request()->user(); // ✅ Current approach
}
```

**Deprecated constants** - Replace with new constant:

```php
// Before - Using deprecated constant
public function getStatus(): string
{
    return User::STATUS_PENDING; // ❌ Deprecated
}

// After - Use new constant name
public function getStatus(): string
{
    return User::PENDING; // ✅ New constant
}
```

**Deprecated properties** - Migrate to new property:

```php
// Before - Accessing deprecated property
public function isActive(): bool
{
    return $this->model->isActive; // ❌ Deprecated property
}

// After - Use new property or method
public function isActive(): bool
{
    return $this->model->active; // ✅ New property name
}
```

**Set up automated migration checklist**:
   - Identify all deprecated code in your codebase
   - Prioritize by deprecation timeline (what's being removed soonest)
   - Check library changelogs for migration guides
   - Test each migration thoroughly with feature tests
   - Update documentation to reflect new APIs

**Systematic refactoring approach**:
   - Start with deprecated constants (easiest to find/replace)
   - Move to deprecated functions (may need signature updates)
   - Address deprecated methods (might require logic changes)
   - Tackle deprecated classes (often requires architectural changes)
   - Remove deprecated property access (may need data migration)

## References

- [PHPStan Deprecation Rules](https://phpstan.org/blog/detecting-deprecated-code)
- [Laravel Upgrade Guide](https://laravel.com/docs/upgrade)
- [PHP Deprecation Notices](https://www.php.net/manual/en/migration80.deprecated.php)
- [Rector - Automated Refactoring](https://getrector.org/)
- [Laravel Shift - Automated Upgrades](https://laravelshift.com/)

## Related Analyzers

- [Dead Code Analyzer](/analyzers/reliability/dead-code) - Detects unreachable code, unused variables, and statements with no effect
- [Invalid Function Calls Analyzer](/analyzers/reliability/invalid-function-calls) - Detects invalid function calls
- [Undefined Variable Usage Analyzer](/analyzers/reliability/undefined-variable) - Detects references to undefined variables
- [Missing Return Statements Analyzer](/analyzers/reliability/missing-return-statement) - Detects missing return statements
