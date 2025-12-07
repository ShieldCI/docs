---
title: Analyzers Overview
description: Comprehensive overview of ShieldCI's 95 analyzers across 5 categories
icon: shield-check
outline: [2, 3]
---

# Analyzers Overview

ShieldCI includes comprehensive analyzers organized into five categories. The free package includes 95 analyzers across all categories.

## Categories

### [Security](/analyzers/security)
**22 analyzers** detecting vulnerabilities like SQL injection, XSS, CSRF, authentication issues, and more.

**Critical Analyzers:**
- SQL Injection Detection 
- Cross-Site Scripting (XSS) Prevention
- CSRF Protection Validation
- Authentication & Authorization Issues
- Sensitive Data Exposure
- Application Key Security
- Environment File Security

### [Performance](/analyzers/performance)
**18 analyzers** identifying bottlenecks and optimization opportunities in Laravel applications.

**Key Analyzers:**
- Autoloader Optimization
- Configuration Caching
- OPcache Configuration
- Cache Driver Selection
- Database Query Optimization
- View Compilation

### [Reliability](/analyzers/reliability)
**25 analyzers** ensuring your application handles errors gracefully and maintains uptime.

**Key Analyzers:**
- Error Handling Patterns
- Logging Configuration
- Queue Reliability
- Backup Strategy
- Monitoring Setup

### [Code Quality](/analyzers/code-quality)
**7 analyzers** maintaining clean, maintainable code following Laravel conventions.

**Key Analyzers:**
- Nesting Depth
- Method Length
- Naming Conventions
- Magic Numbers
- Todo Comments
- Commented Code
- Missing DocBlocks

### [Best Practices](/analyzers/best-practices)
**23 analyzers** ensuring you follow Laravel ecosystem best practices and framework conventions.

**Key Analyzers:**
- Laravel Conventions
- Framework Usage Patterns
- Third-Party Integration Best Practices

## Analyzer Package

### Free Package (95 Analyzers)
The open-source package includes comprehensive analyzers across all categories:

- ✅ All 22 security analyzers
- ✅ All 18 performance analyzers
- ✅ All 25 reliability analyzers
- ✅ All 7 code quality analyzers
- ✅ All 23 best practices analyzers

All analyzers are available in the free package.

## How Analyzers Work

### Analysis Process

1. **File Discovery:** ShieldCI scans your project for relevant files
2. **AST Parsing:** Code is parsed into Abstract Syntax Trees for deep analysis
3. **Pattern Matching:** Each analyzer looks for specific patterns or anti-patterns
4. **Issue Creation:** Violations are collected with severity, location, and fix recommendations
5. **Reporting:** Results are formatted for terminal output or sent to platform

### Severity Levels

| Severity | Description | Action Required |
|----------|-------------|-----------------|
| **Critical** | Severe security vulnerabilities or data loss risks | Fix immediately before deployment |
| **High** | Significant performance issues or security concerns | Fix before next release |
| **Medium** | Code quality issues or minor performance problems | Address in upcoming sprint |
| **Low** | Best practice violations or optimization opportunities | Fix when convenient |

### Environment Awareness

Many analyzers are environment-aware and only run when relevant:

```php
// Production/Staging only
- Asset Cache Headers Analyzer
- Asset Minification Analyzer
- Composer Autoloader Optimization Analyzer
- Dev Dependencies in Production Analyzer
- Missing Error Tracking Analyzer
- MySQL Single Server Optimization Analyzer
- OPcache Configuration Analyzer
- PHP Configuration Security Analyzer
- View Caching Analyzer
```

**Environment Mapping:**
If you use custom environment names (e.g., `production-us`, `production-blue`, `staging-preview`), configure environment mapping in `config/shieldci.php`:

```php
'environment_mapping' => [
    'production-us' => 'production',
    'production-blue' => 'production',
    'staging-preview' => 'staging',
],
```

Analyzers use standard environment names (`production`, `staging`) in their configuration, and custom environment names are automatically mapped via the `environment_mapping` configuration.

## Configuring Analyzers

### Enable/Disable Analyzers

Configure which analyzers to run in `config/shieldci.php`:

```php
return [
    'analyzers' => [
        // Enable/disable categories
        'security' => [
            'enabled' => true,
        ],
        'performance' => [
            'enabled' => true,
        ],
        'reliability' => [
            'enabled' => true,
        ],
        'code_quality' => [
            'enabled' => true,
        ],
        'best_practices' => [
            'enabled' => true,
        ],
    ],

    // Disable specific analyzers
    'disabled_analyzers' => [
        'debug-mode', // Keep debug on in development
    ],
];
```

### Failure Threshold

Configure when CI/CD should fail:

```php
return [
    // Fail CI/CD on issues of this severity or higher
    'fail_on' => 'critical',  // Options: never, critical, high, medium, low
];
```

### Custom Analyzers

Custom analyzers placed in `app/Analyzers` are automatically discovered and loaded during analysis.

## Running Specific Analyzers

### By Category

```bash
# Run only security analyzers
php artisan shield:analyze --category=security
```

### By Specific Analyzer

```bash
# Run single analyzer
php artisan shield:analyze --analyzer=sql-injection

# Multiple analyzers (run separately)
php artisan shield:analyze --analyzer=sql-injection
php artisan shield:analyze --analyzer=xss-vulnerabilities
```

## Understanding Results

### Terminal Output

```bash
$ php artisan shield:analyze

🛡️  ShieldCI Analysis Starting...

Security Issues (2):
  ✗ CRITICAL: SQL Injection vulnerability
    File: app/Http/Controllers/UserController.php:45
    Fix: Use parameter binding instead of raw SQL

  ✗ HIGH: CSRF protection disabled
    File: app/Http/Middleware/VerifyCsrfToken.php:12
    Fix: Remove route from $except array

Performance Issues (1):
  ⚠ HIGH: Configuration not cached
    Fix: Run "php artisan config:cache" in deployment

Found 3 issues (1 critical, 2 high)
Time: 2.1 seconds
```

### JSON Output

For CI/CD integration:

```bash
php artisan shield:analyze --format=json --output=results.json
```

### Platform Dashboard

View rich visualizations, trends, and team collaboration at:
https://app.shieldci.com

## Best Practices

### Local Development
- Run analysis before committing code
- Address Critical and High issues immediately
- Run specific categories for faster checks

```bash
# Quick security scan before commit
php artisan shield:analyze --category=security
```

### CI/CD Pipeline
- Run full analysis on every pull request
- Fail builds on Critical severity issues
- Track metrics over time

```bash
# GitHub Actions example
php artisan shield:analyze --format=json
```

### Production Monitoring
- Schedule periodic analyses to catch configuration drift
- Monitor for new vulnerabilities in dependencies
- Track security posture over time
