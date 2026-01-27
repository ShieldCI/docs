---
title: What is ShieldCI?
description: Overview of ShieldCI - a comprehensive Laravel code analysis and security auditing platform
icon: shield
outline: [2, 3]
---

# What is ShieldCI?

ShieldCI is a comprehensive AI-powered Laravel code analysis and security auditing platform designed to help developers maintain secure, high-performance, and high-quality Laravel applications. It provides automated static analysis, security scanning, and best practice enforcement for Laravel versions 9-12.

## Overview

ShieldCI analyzes your Laravel codebase to identify:
- **Security vulnerabilities** - SQL injection, XSS, CSRF, authentication issues
- **Performance bottlenecks** - N+1 queries, inefficient caching, unoptimized configurations
- **Code quality issues** - Deprecated code, Laravel anti-patterns, maintainability concerns
- **Reliability problems** - Error handling gaps, session configuration issues, deployment risks
- **Best practice violations** - Laravel conventions, framework misuse, outdated patterns

## Why ShieldCI?

### Built for Laravel
ShieldCI is purpose-built for Laravel applications, understanding Laravel's conventions, patterns, and best practices. Unlike generic static analysis tools, ShieldCI knows:
- How Laravel's authentication system should be configured
- Which Eloquent patterns lead to N+1 queries
- How to properly secure Laravel applications
- What deployment configurations optimize performance

### Successor to Laravel Enlightn
ShieldCI is the modern successor to the abandoned Laravel Enlightn project, providing:
- **Modern Laravel support** - Full compatibility with Laravel 9, 10, 11, and 12
- **73 analyzers** - Comprehensive coverage across 5 categories
- **Active development** - Regular updates and new analyzers
- **Better performance** - Optimized analysis engine
- **Enhanced reporting** - Beautiful, actionable insights

### Comprehensive Analysis

**73 Analyzers Across 5 Categories:**

1. **Security** (22 analyzers)
   - OWASP Top 10 2021 coverage
   - SQL injection, XSS, CSRF protection
   - Authentication & authorization checks
   - HTTP security headers
   - License compliance

2. **Performance** (18 analyzers)
   - Database query optimization
   - Caching configuration
   - Autoloader optimization
   - OPcache settings
   - Route and config caching

3. **Reliability** (13 analyzers)
   - Error handling & logging
   - Queue configuration
   - Session management
   - Environment configuration
   - Deployment readiness

4. **Code Quality** (5 analyzers)
   - Laravel best practices
   - Code duplication
   - Deprecated API usage
   - Maintainability metrics
   - Code complexity

5. **Best Practices** (15 analyzers)
   - Laravel conventions
   - Framework patterns
   - Testing practices
   - Documentation standards
   - Development environment

## Key Features

### Static Code Analysis
- **AST-based analysis** - Deep code inspection using PHP-Parser
- **Pattern detection** - Identifies Laravel anti-patterns and vulnerabilities
- **Contextual understanding** - Knows Laravel framework internals
- **Zero false positives** - Intelligent analysis reduces noise

### Security Scanning
- **OWASP coverage** - Comprehensive security vulnerability detection
- **Dependency scanning** - Identifies vulnerable packages (Composer + NPM)
- **License compliance** - Flags GPL/AGPL licenses in commercial apps
- **HTTP security** - Validates security headers and configurations

### Performance Optimization
- **N+1 query detection** - Identifies inefficient database queries
- **Caching analysis** - Ensures proper cache configuration
- **Optimization recommendations** - Actionable performance improvements
- **Production readiness** - Validates deployment configurations

### Flexible Deployment

**Three Ways to Run:**

1. **Manual Analysis** - Run on-demand via Artisan command
   ```bash
   php artisan shield:analyze
   ```

2. **Scheduled Analysis** - Automatic daily/weekly scans
   ```php
   Schedule::command('shield:analyze')->daily();
   ```

3. **CI/CD Integration** - Automated checks on every commit
   ```yaml
   # GitHub Actions
   - run: php artisan shield:analyze --format=json
   ```

### Beautiful Reporting

- **Console output** - Color-coded, formatted results in terminal
- **JSON export** - Machine-readable results for automation
- **HTML reports** - Shareable reports with charts and trends
- **Detailed recommendations** - Step-by-step fix instructions

## How It Works

### 1. Install Package
```bash
composer require shieldci/laravel
```

### 2. Configure
```bash
php artisan vendor:publish --tag=shieldci-config
```

### 3. Analyze
```bash
php artisan shield:analyze
```

### 4. Fix Issues
ShieldCI provides:
- Detailed descriptions of each issue
- Severity ratings (Critical, High, Medium, Low)
- Code examples showing the problem
- Step-by-step fix instructions
- Links to documentation

### 5. Track Progress
- **Baseline support** - Track improvements over time
- **Historical trends** - See quality metrics evolving
- **CI/CD gates** - Enforce quality standards
- **Team dashboards** - Shared visibility (Pro feature)

## Privacy & Security

**Your Code Never Leaves Your Server**

ShieldCI performs all analysis locally:
- ✅ No code uploaded to external services
- ✅ No network requests during analysis (except dependency checks)
- ✅ All data stored locally
- ✅ GDPR compliant
- ✅ SOC 2 compliant (Pro version)

## Package Structure

### Free Package (Open Source)
- **73 analyzers** - Core security, performance, reliability, best practices and quality checks
- **Local analysis** - Run anywhere via Artisan command
- **JSON/Console reporting** - Export and view results
- **Community support** - GitHub issues and discussions

::: tip Coming Soon
### :soon: Pro Package (Commercial) :bell:
- **100+ analyzers** - Advanced security, compliance, and enterprise features
- **Team collaboration** - Multi-user dashboards
- **Historical trends** - Track quality over time
- **CI/CD integration** - GitHub, GitLab, Bitbucket
- **Priority support** - Direct support channel
- **Custom analyzers** - Enterprise-specific checks
:::

## Laravel Version Support

ShieldCI supports all modern Laravel versions:

| Laravel Version | Support Status | PHP Version |
|----------------|----------------|-------------|
| Laravel 12.x   | ✅ Fully Supported | PHP 8.2+    |
| Laravel 11.x   | ✅ Fully Supported | PHP 8.2+    |
| Laravel 10.x   | ✅ Fully Supported | PHP 8.1+    |
| Laravel 9.x    | ✅ Fully Supported | PHP 8.1+    |

## Use Cases

### Solo Developers
- Quick security audits before deployment
- Performance optimization guidance
- Learning Laravel best practices
- Maintaining code quality across projects

### Development Agencies
- Client project auditing
- Pre-deployment checklists
- Code review automation
- Quality assurance standardization

### Enterprise Teams
- Security compliance verification
- Multi-application monitoring
- Team collaboration and reporting
- Custom policy enforcement

## Getting Started

Ready to improve your Laravel application's security and quality?

1. [Installation Guide](/getting-started/installation) - Get ShieldCI up and running
2. [Configuration](/getting-started/configuration) - Customize analyzers for your needs
3. [First Analysis](/getting-started/first-analysis) - Run your first security scan

## Community & Support

- **Documentation** - docs.shieldci.com
- **GitHub** - github.com/shieldci/laravel

## Comparison

### vs Laravel Enlightn
- ✅ Active development (Enlightn abandoned)
- ✅ Laravel 12 support
- ✅ More analyzers (150+ vs 131)
- ✅ Better performance
- ✅ Modern architecture

### vs PHPStan/Larastan
- ✅ Laravel-specific checks (not just type safety)
- ✅ Security scanning
- ✅ Performance analysis
- ✅ Deployment readiness
- ✅ Best practice enforcement

### vs Generic Security Scanners
- ✅ Laravel framework knowledge
- ✅ Context-aware analysis
- ✅ Fewer false positives
- ✅ Actionable recommendations
- ✅ Performance + security
