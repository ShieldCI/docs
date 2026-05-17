---
title: Best Practices Analyzers
description: Analyzers ensuring you follow Laravel ecosystem best practices and framework conventions
tags: best-practices,eloquent,mvc,laravel,patterns,conventions
icon: puzzle
outline: [2, 3]
---

# Best Practices Analyzers

**20 analyzers** ensuring you follow Laravel ecosystem best practices and framework conventions.

## Overview

Best Practices analyzers focus on Laravel-specific patterns, framework conventions, and architectural best practices. These analyzers help ensure your code follows Laravel's intended usage patterns and prevents common mistakes that can lead to maintainability issues or performance problems.

## Key Analyzers

### Laravel Conventions

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Logic in Routes"
  description="Detects business logic in route files"
  severity="high"
  link="/analyzers/best-practices/logic-in-routes"
/>

<AnalyzerCard
  title="Logic in Blade"
  description="Detects complex logic in Blade templates"
  severity="medium"
  link="/analyzers/best-practices/logic-in-blade"
/>

<AnalyzerCard
  title="Hardcoded Configuration"
  description="Detects configuration values outside config files"
  severity="medium"
  link="/analyzers/best-practices/config-outside-config"
/>

</div>

### Eloquent & Database

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Eloquent N+1 Query"
  description="Detects N+1 query problems"
  severity="high"
  link="/analyzers/best-practices/eloquent-n-plus-one"
/>

<AnalyzerCard
  title="Missing Chunk"
  description="Detects missing chunk() calls for large datasets"
  severity="high"
  link="/analyzers/best-practices/chunk-missing"
/>

<AnalyzerCard
  title="Missing Database Transactions"
  description="Detects operations that should use database transactions"
  severity="high"
  link="/analyzers/best-practices/missing-database-transactions"
/>

<AnalyzerCard
  title="Mixed Query Builder and Eloquent"
  description="Detects inconsistent query building patterns"
  severity="medium"
  link="/analyzers/best-practices/mixed-query-builder-eloquent"
/>

</div>

### Code Organization

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Fat Model"
  description="Detects models with too much business logic that violate Single Responsibility Principle"
  severity="medium"
  link="/analyzers/best-practices/fat-model"
/>

<AnalyzerCard
  title="Service Container Resolution"
  description="Detects manual service container resolution and recommends constructor dependency injection"
  severity="medium"
  link="/analyzers/best-practices/service-container-resolution"
/>

</div>

### Error Handling & Logging

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Silent Failure"
  description="Detects empty catch blocks and error suppression that hide failures"
  severity="medium"
  link="/analyzers/best-practices/silent-failure"
/>

<AnalyzerCard
  title="Missing Error Tracking"
  description="Ensures error tracking is configured"
  severity="info"
  link="/analyzers/best-practices/missing-error-tracking"
/>

</div>

### Anti-Patterns

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Helper Function Abuse"
  description="Detects overuse of global helper functions"
  severity="low"
  link="/analyzers/best-practices/helper-function-abuse"
/>

<AnalyzerCard
  title="Hardcoded Storage Paths"
  description="Detects hardcoded file paths"
  severity="medium"
  link="/analyzers/best-practices/hardcoded-storage-paths"
/>

<AnalyzerCard
  title="PHP-Side Data Filtering"
  description="Detects filtering that should be done in database"
  severity="critical"
  link="/analyzers/best-practices/php-side-filtering"
/>

<AnalyzerCard
  title="Framework Override"
  description="Detects dangerous extensions of Laravel core classes that break during framework upgrades"
  severity="high"
  link="/analyzers/best-practices/framework-override"
/>

</div>

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
