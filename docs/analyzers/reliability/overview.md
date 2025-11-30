---
title: Reliability Analyzers
description: 24 analyzers ensuring your application handles errors gracefully, maintains uptime, and prevents runtime failures
icon: check-circle
outline: [2, 3]
---

# Reliability Analyzers

**24 analyzers** ensuring your application handles errors gracefully, maintains uptime, and prevents runtime failures.

## Overview

Reliability analyzers focus on preventing runtime errors, ensuring proper configuration, validating dependencies, and maintaining application stability. These analyzers help catch issues before they cause production outages or user-facing errors.

## Key Analyzers

### Configuration & Environment

- **[Cache Prefix Configuration](/analyzers/reliability/cache-prefix-configuration)** - Ensures cache prefix is set to avoid collisions
- **[Cache Status](/analyzers/reliability/cache-status)** - Validates cache connectivity and functionality
- **[Composer Validation](/analyzers/reliability/composer-validation)** - Ensures composer.json is valid and follows best practices
- **[Database Status](/analyzers/reliability/database-status)** - Ensures database connections are accessible and functioning
- **[Environment File Existence](/analyzers/reliability/env-file-exists)** - Ensures .env file exists for application configuration
- **[Environment Variables Complete](/analyzers/reliability/env-variables-complete)** - Ensures all required environment variables are defined
- **[Maintenance Mode Status](/analyzers/reliability/maintenance-mode-status)** - Checks if the application is in maintenance mode

### Code Quality & Static Analysis

- **[Dead Code Detection](/analyzers/reliability/dead-code)** - Detects unreachable code, unused variables, and statements with no effect
- **[Deprecated Code Usage](/analyzers/reliability/deprecated-code)** - Detects usage of deprecated methods, classes, and functions
- **[Foreach Iterable Validation](/analyzers/reliability/foreach-iterable)** - Detects invalid foreach usage with non-iterable values
- **[Invalid Function Calls](/analyzers/reliability/invalid-function-calls)** - Detects invalid function calls in application code
- **[Invalid Imports](/analyzers/reliability/invalid-imports)** - Detects invalid imports and use statements for non-existent classes
- **[Invalid Method Calls](/analyzers/reliability/invalid-method-calls)** - Detects invalid method calls in application code
- **[Invalid Method Overrides](/analyzers/reliability/invalid-method-overrides)** - Detects incompatible method overrides with incorrect signatures
- **[Invalid Offset Access](/analyzers/reliability/invalid-offset-access)** - Detects invalid array offset access and type mismatches
- **[Invalid Property Access](/analyzers/reliability/invalid-property-access)** - Detects invalid property access and visibility violations
- **[Missing Model Relations](/analyzers/reliability/missing-model-relation)** - Detects references to non-existent Eloquent model relations
- **[Missing Return Statements](/analyzers/reliability/missing-return-statement)** - Detects missing return statements in methods and functions
- **[Undefined Constant Usage](/analyzers/reliability/undefined-constant)** - Detects references to undefined constants
- **[Undefined Variable Usage](/analyzers/reliability/undefined-variable)** - Detects references to undefined variables

### Infrastructure & Permissions

- **[Custom Error Pages](/analyzers/reliability/custom-error-pages)** - Ensures custom error pages are configured to prevent framework fingerprinting
- **[Directory Write Permissions](/analyzers/reliability/directory-write-permissions)** - Ensures critical Laravel directories have proper write permissions

### Queue & Database

- **[Queue Timeout Configuration](/analyzers/reliability/queue-timeout-configuration)** - Ensures queue timeout and retry_after values are properly configured
- **[Up-to-Date Migrations](/analyzers/reliability/up-to-date-migrations)** - Ensures all database migrations are up to date and have been executed

## How They Work

Reliability analyzers use a combination of:

1. **Static Analysis (PHPStan):** Detects code-level issues like undefined variables, invalid method calls, and type mismatches
2. **Configuration Validation:** Checks Laravel configuration files, environment variables, and Composer dependencies
3. **Runtime Checks:** Validates that services (cache, database) are accessible and functioning
4. **File System Analysis:** Verifies file permissions, existence of required files, and directory structure

## Severity Levels

| Severity | Description | Examples |
|----------|-------------|----------|
| **Critical** | Issues that will cause immediate runtime failures | Undefined variables, invalid method calls, missing environment files |
| **High** | Issues that may cause failures under certain conditions | Missing migrations, invalid queue configuration, cache connectivity issues |
| **Medium** | Issues that reduce reliability or maintainability | Deprecated code usage, dead code, missing return statements |
| **Low** | Best practice violations that don't directly impact reliability | Custom error pages, cache prefix configuration |

## Common Issues

### Runtime Errors

**Undefined Variables:**
```php
// ❌ BAD - Variable may not be defined
function processUser($id) {
    return $user->name;  // $user not defined
}

// ✅ GOOD - Variable is properly initialized
function processUser($id) {
    $user = User::find($id);
    return $user?->name ?? 'Unknown';
}
```

**Invalid Method Calls:**
```php
// ❌ BAD - Method doesn't exist
$user->getFullName();  // Method not defined in User model

// ✅ GOOD - Use existing method or define it
$user->name;  // Or add getFullName() method to User model
```

### Configuration Issues

**Missing Environment Variables:**
```env
# ❌ BAD - Required variable missing
# APP_KEY is not defined

# ✅ GOOD - All required variables defined
APP_KEY=base64:...
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
```

**Cache Not Working:**
```php
// ❌ BAD - Cache may not be accessible
Cache::put('key', 'value');  // Fails silently if cache driver not configured

// ✅ GOOD - Verify cache is working
if (Cache::has('test')) {
    // Cache is working
}
```

### Database Issues

**Pending Migrations:**
```bash
# ❌ BAD - Migrations not run
php artisan migrate:status
# Shows pending migrations

# ✅ GOOD - All migrations executed
php artisan migrate
php artisan migrate:status
# All migrations up to date
```

## Running Reliability Analyzers

### Run All Reliability Analyzers

```bash
php artisan shield:analyze --category=reliability
```

### Run Specific Analyzer

```bash
php artisan shield:analyze --analyzer=undefined-variable
php artisan shield:analyze --analyzer=up-to-date-migrations
php artisan shield:analyze --analyzer=cache-status
```

### Run Multiple Analyzers

```bash
php artisan shield:analyze --analyzer=undefined-variable,undefined-constant,invalid-method-calls
```

## Best Practices

### Development

- Run reliability analyzers before committing code
- Fix Critical and High severity issues immediately
- Use static analysis (PHPStan) to catch issues early

### CI/CD

- Run reliability analyzers on every pull request
- Fail builds on Critical severity issues
- Monitor reliability metrics over time

### Production

- Schedule periodic reliability checks
- Monitor for configuration drift
- Validate environment variables on deployment

## Related Categories

- **[Security Analyzers](/analyzers/security/overview)** - Prevent security vulnerabilities
- **[Performance Analyzers](/analyzers/performance/overview)** - Optimize application performance
- **[Code Quality Analyzers](/analyzers/code-quality/overview)** - Maintain code quality standards

## Next Steps

- [View all Reliability Analyzers](#all-analyzers)
- [Security Analyzers](/analyzers/security/overview)
- [Performance Analyzers](/analyzers/performance/overview)
- [Getting Started Guide](/getting-started/installation)

