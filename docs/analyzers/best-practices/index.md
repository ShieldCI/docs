---
title: Best Practices Analyzers
description: Analyzers ensuring you follow Laravel ecosystem best practices and framework conventions
icon: puzzle
outline: [2, 3]
---

# Best Practices Analyzers

**15 analyzers** ensuring you follow Laravel ecosystem best practices and framework conventions.

## Overview

Best Practices analyzers focus on Laravel-specific patterns, framework conventions, and architectural best practices. These analyzers help ensure your code follows Laravel's intended usage patterns and prevents common mistakes that can lead to maintainability issues or performance problems.

## Key Analyzers

### Laravel Conventions

- **[Logic in Routes Analyzer](/analyzers/best-practices/logic-in-routes)** - Detects business logic in route files
- **[Logic in Blade Analyzer](/analyzers/best-practices/logic-in-blade)** - Detects complex logic in Blade templates
- **[Hardcoded Configuration Analyzer](/analyzers/best-practices/config-outside-config)** - Detects configuration values outside config files

### Eloquent & Database

- **[Eloquent N+1 Query Analyzer](/analyzers/best-practices/eloquent-n-plus-one)** - Detects N+1 query problems
- **[Missing Chunk Analyzer](/analyzers/best-practices/chunk-missing)** - Detects missing chunk() calls for large datasets
- **[Missing Database Transactions Analyzer](/analyzers/best-practices/missing-database-transactions)** - Detects operations that should use database transactions
- **[Mixed Query Builder and Eloquent Analyzer](/analyzers/best-practices/mixed-query-builder-eloquent)** - Detects inconsistent query building patterns

### Code Organization

- **[Fat Model Analyzer](/analyzers/best-practices/fat-model)** - Detects models with too much business logic that violate Single Responsibility Principle
- **[Service Container Resolution Analyzer](/analyzers/best-practices/service-container-resolution)** - Detects manual service container resolution and recommends constructor dependency injection

### Error Handling & Logging

- **[Silent Failure Analyzer](/analyzers/best-practices/silent-failure)** - Detects empty catch blocks and error suppression that hide failures
- **[Missing Error Tracking Analyzer](/analyzers/best-practices/missing-error-tracking)** - Ensures error tracking is configured

### Anti-Patterns

- **[Helper Function Abuse Analyzer](/analyzers/best-practices/helper-function-abuse)** - Detects overuse of global helper functions
- **[Hardcoded Storage Paths Analyzer](/analyzers/best-practices/hardcoded-storage-paths)** - Detects hardcoded file paths
- **[PHP-Side Data Filtering Analyzer](/analyzers/best-practices/php-side-filtering)** - Detects filtering that should be done in database
- **[Framework Override Analyzer](/analyzers/best-practices/framework-override)** - Detects dangerous extensions of Laravel core classes that break during framework upgrades

## How They Work

Best Practices analyzers use:

1. **Pattern Matching:** Identifies Laravel-specific patterns and conventions
2. **AST Analysis:** Analyzes code structure to detect architectural violations
3. **Query Analysis:** Examines database queries for optimization opportunities
4. **Convention Validation:** Checks code against Laravel best practices

## Severity Levels

| Severity | Description | Examples |
|----------|-------------|----------|
| **High** | Issues that violate core Laravel principles | Logic in routes, N+1 queries, missing transactions |
| **Medium** | Issues that reduce maintainability | Fat models, hardcoded paths |
| **Low** | Best practice violations | Helper function abuse |

## Running Best Practices Analyzers

### Run All Best Practices Analyzers

```bash
php artisan shield:analyze --category=best-practices
```

### Run Specific Analyzer

```bash
php artisan shield:analyze --analyzer=eloquent-n-plus-one
php artisan shield:analyze --analyzer=missing-database-transactions
php artisan shield:analyze --analyzer=fat-model
```

### Run Multiple Analyzers

```bash
php artisan shield:analyze --analyzer=eloquent-n-plus-one,missing-database-transactions,chunk-missing
```

## Best Practices

### Development

- Run best practices analyzers during code reviews
- Fix High severity issues before merging
- Use analyzers to learn Laravel conventions

### Code Reviews

- Review best practices violations in pull requests
- Use violations as teaching opportunities
- Ensure new code follows Laravel patterns

### Team Standards

- Agree on which best practices are mandatory
- Document team-specific conventions
- Use analyzers to maintain consistency across codebase

## Related Categories

- **[Security Analyzers](/analyzers/security/)** - Prevent security vulnerabilities
- **[Code Quality Analyzers](/analyzers/code-quality/)** - Maintain code quality standards
- **[Reliability Analyzers](/analyzers/reliability/)** - Prevent runtime errors
- **[Performance Analyzers](/analyzers/performance/)** - Optimize application performance
