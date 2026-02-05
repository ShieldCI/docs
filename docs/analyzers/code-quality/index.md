---
title: Code Quality Analyzers
description: Analyzers maintaining clean, maintainable code following Laravel conventions and PSR standards
icon: code
outline: [2, 3]
---

# Code Quality Analyzers

**5 analyzers** maintaining clean, maintainable code following Laravel conventions and PSR standards.

## Overview

Code Quality analyzers focus on maintaining high code standards, reducing complexity, improving readability, and ensuring code follows best practices. These analyzers help teams write consistent, maintainable code that's easier to understand and modify.

## Key Analyzers

### Complexity & Structure

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Nesting Depth"
  description="Detects excessive code nesting levels that reduce readability"
  severity="high"
  link="/analyzers/code-quality/nesting-depth"
/>

<AnalyzerCard
  title="Method Length"
  description="Flags methods exceeding recommended line count for better maintainability"
  severity="medium"
  link="/analyzers/code-quality/method-length"
/>

</div>

### Code Smells

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Commented Code"
  description="Detects commented-out code that should be removed in favor of version control"
  severity="low"
  link="/analyzers/code-quality/commented-code"
/>

</div>

### Documentation & Naming

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Missing DocBlock"
  description="Flags public methods without proper PHPDoc documentation"
  severity="medium"
  link="/analyzers/code-quality/missing-docblock"
/>

<AnalyzerCard
  title="Naming Convention"
  description="Validates PSR and Laravel naming standards for better code consistency"
  severity="low"
  link="/analyzers/code-quality/naming-convention"
/>

</div>

## How They Work

Code Quality analyzers use:

1. **AST Parsing:** Analyzes code structure to measure complexity and detect patterns
2. **Pattern Matching:** Identifies code smells and anti-patterns
3. **Metrics Calculation:** Computes complexity metrics (cyclomatic, cognitive)
4. **Convention Validation:** Checks code against PSR standards and Laravel conventions

## Severity Levels

| Severity | Description | Examples |
|----------|-------------|----------|
| **High** | Issues that significantly impact maintainability | Excessive complexity, very long methods, deep nesting |
| **Medium** | Issues that reduce code quality | Code duplication, magic numbers, missing documentation |
| **Low** | Best practice violations | TODO comments, naming inconsistencies |

## Running Code Quality Analyzers

### Run All Code Quality Analyzers

```bash
php artisan shield:analyze --category=code-quality
```

### Run Specific Analyzer

```bash
php artisan shield:analyze --analyzer=nesting-depth
php artisan shield:analyze --analyzer=method-length
php artisan shield:analyze --analyzer=missing-docblock
```

### Run Multiple Analyzers

```bash
php artisan shield:analyze --analyzer=nesting-depth,method-length
```

## Best Practices

### Development

- Run code quality analyzers regularly during development
- Set complexity thresholds appropriate for your team
- Refactor complex code before it becomes unmaintainable

### Code Reviews

- Review code quality metrics in pull requests
- Use complexity metrics to guide refactoring decisions
- Ensure new code follows established patterns

### Team Standards

- Agree on complexity thresholds as a team
- Document naming conventions and coding standards
- Use code quality metrics to track improvement over time


## Related Categories

- **[Security Analyzers](/analyzers/security/)** - Prevent security vulnerabilities
- **[Reliability Analyzers](/analyzers/reliability/)** - Prevent runtime errors
- **[Best Practices Analyzers](/analyzers/best-practices/)** - Follow Laravel conventions
- **[Performance Analyzers](/analyzers/performance/)** - Optimize application performance
