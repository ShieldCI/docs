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
- **[Environment Example Documentation Analyzer](/analyzers/reliability/env-example-documented)** - Ensures all environment variables used in .env are documented in .env.example for team collaboration
- **[Environment File Existence Analyzer](/analyzers/reliability/env-file-exists)** - Ensures .env file exists, is readable, not empty, and checks for broken symlinks
- **[Environment Variables Complete Analyzer](/analyzers/reliability/env-variables-complete)** - Ensures all required environment variables from .env.example are defined in .env
- **[Maintenance Mode Status Analyzer](/analyzers/reliability/maintenance-mode-status)** - Checks if the application is in maintenance mode
- **[Disk Space Analyzer](/analyzers/reliability/disk-space)** - Monitors available disk space and warns when storage is running low

### Infrastructure & Permissions

- **[Custom Error Pages Analyzer](/analyzers/reliability/custom-error-pages)** - Ensures custom error pages are configured to prevent framework fingerprinting
- **[Directory Write Permissions Analyzer](/analyzers/reliability/directory-write-permissions)** - Ensures critical Laravel directories (storage/, bootstrap/cache/) have proper write permissions

### Queue & Database

- **[Queue Timeout Configuration Analyzer](/analyzers/reliability/queue-timeout-configuration)** - Ensures queue timeout and retry_after values are properly configured
- **[Queue Blocking Analyzer](/analyzers/reliability/queue-blocking)** - Detects blocking operations in queue workers that can cause timeouts
- **[Dead Route Analyzer](/analyzers/reliability/dead-route)** - Detects routes pointing to non-existent controllers or methods
- **[Up-to-Date Migrations Analyzer](/analyzers/reliability/up-to-date-migrations)** - Ensures all database migrations are up to date and have been executed

### Cache & Redis

- **[Cache Busting Analyzer](/analyzers/reliability/cache-busting)** - Detects cache invalidation issues and stale cache problems
- **[Redis Eviction Policy Analyzer](/analyzers/reliability/redis-eviction-policy)** - Ensures Redis eviction policy is configured appropriately
- **[Redis Shared Database Analyzer](/analyzers/reliability/redis-shared-database)** - Detects when multiple services share the same Redis database
- **[Redis Status Analyzer](/analyzers/reliability/redis-status)** - Validates Redis connectivity and health

### Horizon

- **[Horizon Prefix Analyzer](/analyzers/reliability/horizon-prefix)** - Ensures Horizon prefix is configured to avoid job collisions
- **[Horizon Provisioning Plan Analyzer](/analyzers/reliability/horizon-provisioning-plan)** - Validates Horizon supervisor provisioning configuration
- **[Horizon Status Analyzer](/analyzers/reliability/horizon-status)** - Checks if Horizon is running and processing jobs

### Extensions & Variables

- **[PCNTL Extension Analyzer](/analyzers/reliability/pcntl)** - Ensures PCNTL extension is available for queue workers and signal handling
- **[Global Variable Analyzer](/analyzers/reliability/global-variable)** - Detects usage of global variables which can cause unpredictable behavior

### Static Analysis

- **[PHPStan Static Analysis Analyzer](/analyzers/reliability/phpstan)** - Comprehensive static analysis detecting 13 categories of code reliability issues:
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
php artisan shield:analyze --analyzer=database-status
php artisan shield:analyze --analyzer=up-to-date-migrations
php artisan shield:analyze --analyzer=cache-status
```

### Run Multiple Analyzers

```bash
php artisan shield:analyze --analyzer=composer-validation,queue-timeout-configuration,maintenance-mode-status
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
