---
title: Reliability Analyzers
description: Analyzers ensuring your application handles errors gracefully, maintains uptime, and prevents runtime failures
icon: check-circle
outline: [2, 3]
---

# Reliability Analyzers

**25 analyzers** ensuring your application handles errors gracefully, maintains uptime, and prevents runtime failures.

## Overview

Reliability analyzers focus on preventing runtime errors, ensuring proper configuration, validating dependencies, and maintaining application stability. These analyzers help catch issues before they cause production outages or user-facing errors.

## Key Analyzers

### Configuration & Environment

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Cache Prefix Configuration"
  description="Ensures cache prefix is set to avoid collisions"
  severity="low"
  link="/analyzers/reliability/cache-prefix-configuration"
/>

<AnalyzerCard
  title="Cache Status"
  description="Validates cache connectivity and functionality"
  severity="high"
  link="/analyzers/reliability/cache-status"
/>

<AnalyzerCard
  title="Composer Validation"
  description="Ensures composer.json is valid and follows best practices"
  severity="medium"
  link="/analyzers/reliability/composer-validation"
/>

<AnalyzerCard
  title="Database Status"
  description="Ensures database connections are accessible and functioning"
  severity="critical"
  link="/analyzers/reliability/database-status"
/>

<AnalyzerCard
  title="Environment Example Documentation"
  description="Ensures all environment variables used in .env are documented in .env.example for team collaboration"
  severity="low"
  link="/analyzers/reliability/env-example-documented"
/>

<AnalyzerCard
  title="Environment File Existence"
  description="Ensures .env file exists, is readable, not empty, and checks for broken symlinks"
  severity="critical"
  link="/analyzers/reliability/env-file-exists"
/>

<AnalyzerCard
  title="Environment Variables Complete"
  description="Ensures all required environment variables from .env.example are defined in .env"
  severity="high"
  link="/analyzers/reliability/env-variables-complete"
/>

<AnalyzerCard
  title="Maintenance Mode Status"
  description="Checks if the application is in maintenance mode"
  severity="high"
  link="/analyzers/reliability/maintenance-mode-status"
/>

<AnalyzerCard
  title="Disk Space"
  description="Monitors available disk space and warns when storage is running low"
  severity="medium"
  link="/analyzers/reliability/disk-space"
/>

</div>

### Infrastructure & Permissions

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Custom Error Pages"
  description="Ensures custom error pages are configured to prevent framework fingerprinting"
  severity="low"
  link="/analyzers/reliability/custom-error-pages"
/>

<AnalyzerCard
  title="Directory Write Permissions"
  description="Ensures critical Laravel directories (storage/, bootstrap/cache/) have proper write permissions"
  severity="high"
  link="/analyzers/reliability/directory-write-permissions"
/>

</div>

### Queue & Database

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Queue Timeout Configuration"
  description="Ensures queue timeout and retry_after values are properly configured"
  severity="high"
  link="/analyzers/reliability/queue-timeout-configuration"
/>

<AnalyzerCard
  title="Up-to-Date Migrations"
  description="Ensures all database migrations are up to date and have been executed"
  severity="high"
  link="/analyzers/reliability/up-to-date-migrations"
/>

<AnalyzerCard
  title="Queue Blocking"
  description="Detects blocking operations in queue workers that can cause timeouts"
  severity="high"
  link="/analyzers/reliability/queue-blocking"
/>

<AnalyzerCard
  title="Dead Route"
  description="Detects routes pointing to non-existent controllers or methods"
  severity="medium"
  link="/analyzers/reliability/dead-route"
/>

</div>

### Cache & Redis

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Cache Busting"
  description="Detects cache invalidation issues and stale cache problems"
  severity="medium"
  link="/analyzers/reliability/cache-busting"
/>

<AnalyzerCard
  title="Redis Eviction Policy"
  description="Ensures Redis eviction policy is configured appropriately"
  severity="high"
  link="/analyzers/reliability/redis-eviction-policy"
/>

<AnalyzerCard
  title="Redis Shared Database"
  description="Detects when multiple services share the same Redis database"
  severity="medium"
  link="/analyzers/reliability/redis-shared-database"
/>

<AnalyzerCard
  title="Redis Status"
  description="Validates Redis connectivity and health"
  severity="high"
  link="/analyzers/reliability/redis-status"
/>

</div>

### Horizon

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Horizon Prefix"
  description="Ensures Horizon prefix is configured to avoid job collisions"
  severity="medium"
  link="/analyzers/reliability/horizon-prefix"
/>

<AnalyzerCard
  title="Horizon Provisioning Plan"
  description="Validates Horizon supervisor provisioning configuration"
  severity="high"
  link="/analyzers/reliability/horizon-provisioning-plan"
/>

<AnalyzerCard
  title="Horizon Status"
  description="Checks if Horizon is running and processing jobs"
  severity="high"
  link="/analyzers/reliability/horizon-status"
/>

</div>

### Extensions & Variables

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="PCNTL Extension"
  description="Ensures PCNTL extension is available for queue workers and signal handling"
  severity="medium"
  link="/analyzers/reliability/pcntl"
/>

<AnalyzerCard
  title="Global Variable"
  description="Detects usage of global variables which can cause unpredictable behavior"
  severity="medium"
  link="/analyzers/reliability/global-variable"
/>

</div>

### Static Analysis

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="PHPStan Static Analysis"
  description="Comprehensive static analysis detecting 13 categories of code reliability issues including dead code, undefined variables, invalid method calls, and more"
  severity="critical"
  link="/analyzers/reliability/phpstan"
/>

</div>

::: details PHPStan Detection Categories
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
:::

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

- **[Security Analyzers](/analyzers/security/)** - Prevent security vulnerabilities
- **[Performance Analyzers](/analyzers/performance/)** - Optimize application performance
- **[Code Quality Analyzers](/analyzers/code-quality/)** - Maintain code quality standards
- **[Best Practices Analyzers](/analyzers/best-practices/)** - Follow Laravel conventions
