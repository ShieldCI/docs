---
title: Reliability Analyzers
description: 25 analyzers ensuring your application handles errors gracefully, maintains uptime, and prevents runtime failures
icon: check-circle
outline: [2, 3]
---

# Reliability Analyzers

**25 analyzers** ensuring your application handles errors gracefully, maintains uptime, and prevents runtime failures.

## Overview

Reliability analyzers focus on preventing runtime errors, ensuring proper configuration, validating dependencies, and maintaining application stability. These analyzers help catch issues before they cause production outages or user-facing errors.

## Key Analyzers

### Configuration & Environment

- **[Cache Prefix Configuration Analyzer](/analyzers/reliability/cache-prefix-configuration)** - Ensures cache prefix is set to avoid collisions
- **[Cache Status Analyzer](/analyzers/reliability/cache-status)** - Validates cache connectivity and functionality
- **[Composer Validation Analyzer](/analyzers/reliability/composer-validation)** - Ensures composer.json is valid and follows best practices
- **[Database Status Analyzer](/analyzers/reliability/database-status)** - Ensures database connections are accessible and functioning
- **[Directory Write Permissions Analyzer](/analyzers/reliability/directory-write-permissions)** - Ensures critical Laravel directories (storage/, bootstrap/cache/) have proper write permissions
- **[Environment File Existence Analyzer](/analyzers/reliability/env-file-exists)** - Ensures .env file exists, is readable, not empty, and checks for broken symlinks
- **[Environment Variables Complete Analyzer](/analyzers/reliability/env-variables-complete)** - Ensures all required environment variables from .env.example are defined in .env
- **[Environment Example Documentation Analyzer](/analyzers/reliability/env-example-documented)** - Ensures all environment variables used in .env are documented in .env.example for team collaboration
- **[Maintenance Mode Status Analyzer](/analyzers/reliability/maintenance-mode-status)** - Checks if the application is in maintenance mode

### Code Quality & Static Analysis

- **[Dead Code Analyzer](/analyzers/reliability/dead-code)** - Detects unreachable code, unused variables, and statements with no effect
- **[Deprecated Code Analyzer](/analyzers/reliability/deprecated-code)** - Detects usage of deprecated methods, classes, and functions
- **[Foreach Iterable Analyzer](/analyzers/reliability/foreach-iterable)** - Detects invalid foreach usage with non-iterable values
- **[Invalid Function Calls Analyzer](/analyzers/reliability/invalid-function-calls)** - Detects invalid function calls in application code
- **[Invalid Method Calls Analyzer](/analyzers/reliability/invalid-method-calls)** - Detects invalid method calls in application code
- **[Invalid Method Overrides Analyzer](/analyzers/reliability/invalid-method-overrides)** - Detects incompatible method overrides with incorrect signatures
- **[Invalid Offset Access Analyzer](/analyzers/reliability/invalid-offset-access)** - Detects invalid array offset access and type mismatches
- **[Invalid Property Access Analyzer](/analyzers/reliability/invalid-property-access)** - Detects invalid property access and visibility violations
- **[Missing Model Relations Analyzer](/analyzers/reliability/missing-model-relation)** - Detects references to non-existent Eloquent model relations
- **[Missing Return Statements Analyzer](/analyzers/reliability/missing-return-statement)** - Detects missing return statements in methods and functions
- **[Undefined Constant Usage Analyzer](/analyzers/reliability/undefined-constant)** - Detects references to undefined constants
- **[Undefined Variable Usage Analyzer](/analyzers/reliability/undefined-variable)** - Detects references to undefined variables

### Infrastructure & Permissions

- **[Custom Error Pages Analyzer](/analyzers/reliability/custom-error-pages)** - Ensures custom error pages are configured to prevent framework fingerprinting
- **[Directory Write Permissions Analyzer](/analyzers/reliability/directory-write-permissions)** - Ensures critical Laravel directories have proper write permissions

### Queue & Database

- **[Queue Timeout Configuration Analyzer](/analyzers/reliability/queue-timeout-configuration)** - Ensures queue timeout and retry_after values are properly configured
- **[Up-to-Date Migrations Analyzer](/analyzers/reliability/up-to-date-migrations)** - Ensures all database migrations are up to date and have been executed

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

- **[Security Analyzers](/analyzers/security)** - Prevent security vulnerabilities
- **[Performance Analyzers](/analyzers/performance)** - Optimize application performance
- **[Code Quality Analyzers](/analyzers/code-quality)** - Maintain code quality standards
- **[Best Practices Analyzers](/analyzers/best-practices)** - Follow Laravel conventions
