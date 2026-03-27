---
title: Security Analyzers
description: Analyzers detecting vulnerabilities like SQL injection, XSS, CSRF, authentication issues, and more
tags: security,sql-injection,xss,csrf,authentication,vulnerabilities,laravel
icon: lock
outline: [2, 3]
---

# Security Analyzers

**22 analyzers** detecting vulnerabilities like SQL injection, XSS, CSRF, authentication issues, and more.

## Overview

Security analyzers focus on identifying and preventing security vulnerabilities in Laravel applications. These analyzers help protect your application from common attacks, ensure secure configuration, validate dependencies, and maintain security best practices throughout your codebase.

## Key Analyzers

### Critical Vulnerabilities

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="SQL Injection"
  description="Detects potential SQL injection vulnerabilities in database queries"
  severity="critical"
  link="/analyzers/security/sql-injection"
/>

<AnalyzerCard
  title="XSS Vulnerabilities"
  description="Detects XSS vulnerabilities via code analysis and HTTP header verification"
  severity="critical"
  link="/analyzers/security/xss-vulnerabilities"
/>

<AnalyzerCard
  title="CSRF Protection"
  description="Detects missing CSRF (Cross-Site Request Forgery) protection"
  severity="critical"
  link="/analyzers/security/csrf-protection"
/>

<AnalyzerCard
  title="Mass Assignment Vulnerabilities"
  description="Detects mass assignment vulnerabilities in Eloquent models and query builders"
  severity="high"
  link="/analyzers/security/mass-assignment-vulnerabilities"
/>

<AnalyzerCard
  title="Unguarded Models"
  description="Detects Model::unguard() usage that disables mass assignment protection"
  severity="high"
  link="/analyzers/security/unguarded-models"
/>

</div>

### Authentication & Authorization

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Authentication & Authorization"
  description="Detects missing authentication and authorization protection on routes and controllers"
  severity="critical"
  link="/analyzers/security/authentication-authorization"
/>

<AnalyzerCard
  title="Login Throttling"
  description="Detects missing rate limiting on authentication endpoints to prevent brute force attacks"
  severity="high"
  link="/analyzers/security/login-throttling"
/>

</div>

### Configuration & Secrets

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Application Key"
  description="Validates that the application encryption key is properly configured and secure"
  severity="critical"
  link="/analyzers/security/app-key-security"
/>

<AnalyzerCard
  title="Environment File"
  description="Validates .env file security, location, and prevents exposure of sensitive data"
  severity="critical"
  link="/analyzers/security/env-file"
/>

<AnalyzerCard
  title="Environment File HTTP Accessibility"
  description="Verifies .env file is not accessible via HTTP requests to the web server"
  severity="critical"
  link="/analyzers/security/env-http-accessibility"
/>

<AnalyzerCard
  title="Debug Mode"
  description="Detects debug mode enabled and debugging functions that expose sensitive information"
  severity="critical"
  link="/analyzers/security/debug-mode"
/>

<AnalyzerCard
  title="PHP Configuration"
  description="Validates that PHP ini settings are configured securely"
  severity="high"
  link="/analyzers/security/php-ini"
/>

</div>

### Data Protection

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Password Security"
  description="Validates password hashing, policy enforcement, plain-text storage, validation rules, and rehash usage"
  severity="critical"
  link="/analyzers/security/password-security"
/>

<AnalyzerCard
  title="Cookie Security"
  description="Validates cookie encryption and security configuration"
  severity="high"
  link="/analyzers/security/cookie"
/>

<AnalyzerCard
  title="Fillable Foreign Key"
  description="Detects foreign keys in fillable arrays that may allow unauthorized relationship manipulation"
  severity="medium"
  link="/analyzers/security/fillable-foreign-key"
/>

</div>

### HTTP Security

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="HSTS Header"
  description="Validates HTTP Strict Transport Security (HSTS) header configuration for HTTPS-only applications"
  severity="high"
  link="/analyzers/security/hsts-header"
/>

</div>

### Dependencies & Updates

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Vulnerable Dependencies"
  description="Scans composer dependencies for known security vulnerabilities"
  severity="critical"
  link="/analyzers/security/vulnerable-dependencies"
/>

<AnalyzerCard
  title="Frontend Vulnerable Dependencies"
  description="Scans npm/yarn dependencies for known security vulnerabilities"
  severity="critical"
  link="/analyzers/security/frontend-vulnerable-dependencies"
/>

<AnalyzerCard
  title="Up-to-Date Dependencies"
  description="Checks if dependencies are up-to-date with available bug fixes and security patches"
  severity="low"
  link="/analyzers/security/up-to-date-dependencies"
/>

<AnalyzerCard
  title="Stable Dependencies"
  description="Validates that all dependencies use stable versions rather than dev/alpha/beta releases"
  severity="low"
  link="/analyzers/security/stable-dependencies"
/>

<AnalyzerCard
  title="License Compliance"
  description="Validates that all dependencies use legally acceptable licenses for your application type"
  severity="medium"
  link="/analyzers/security/license-compliance"
/>

</div>

### File System Security

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="File Permissions"
  description="Validates that project files and directories use secure permissions"
  severity="high"
  link="/analyzers/security/file-permissions"
/>

</div>

## How They Work

Security analyzers use a combination of:

1. **Static Code Analysis:** Parses code to detect vulnerable patterns (SQL injection, XSS, mass assignment)
2. **Configuration Validation:** Checks Laravel configuration for security settings
3. **Dependency Scanning:** Scans Composer and npm/yarn dependencies for known vulnerabilities
4. **File System Checks:** Validates file permissions and .env file security
5. **HTTP Header Analysis:** Verifies security headers are properly configured

## Severity Levels

| Severity | Description | Examples                                                                             |
|----------|-------------|--------------------------------------------------------------------------------------|
| **Critical** | Severe security vulnerabilities that can lead to data breaches | SQL injection, XSS, missing authentication, exposed secrets, vulnerable dependencies |
| **High** | Significant security risks that need immediate attention | Mass assignment, unguarded models                                                    |
| **Low** | Best practice violations and minor security improvements | Up-to-date dependencies                                                              |

## Running Security Analyzers

### Run All Security Analyzers

```bash
php artisan shield:analyze --category=security
```

### Run Specific Analyzer

```bash
php artisan shield:analyze --analyzer=sql-injection
php artisan shield:analyze --analyzer=xss-vulnerabilities
php artisan shield:analyze --analyzer=mass-assignment-vulnerabilities
```

### Run Multiple Analyzers

```bash
php artisan shield:analyze --analyzer=sql-injection,xss-vulnerabilities,csrf-protection
```

## Best Practices

### Development

- Run security analyzers before committing code
- Fix Critical and High severity issues immediately
- Never commit secrets or API keys to version control
- Use environment variables for sensitive configuration

### Code Reviews

- Review security analyzer results in pull requests
- Ensure new code follows security best practices
- Validate that authentication and authorization are properly implemented

### Production

- Run security analyzers regularly in production
- Monitor for new vulnerabilities in dependencies
- Keep dependencies up-to-date with security patches
- Review and rotate secrets regularly

### CI/CD

- Run security analyzers on every pull request
- Fail builds on Critical security issues
- Scan dependencies for vulnerabilities in CI pipeline
- Monitor security posture over time

## Security Checklist

Before deploying to production, ensure:

- ✅ Application key is set and secure
- ✅ Debug mode is disabled
- ✅ .env file is not accessible via HTTP
- ✅ File permissions are secure (644 for files, 755 for directories)
- ✅ All routes have proper authentication/authorization
- ✅ CSRF protection is enabled on all forms
- ✅ SQL injection protection (use Eloquent/parameter binding)
- ✅ XSS protection (escape all user input)
- ✅ Mass assignment protection (use $fillable/$guarded)
- ✅ Password hashing uses strong algorithms (bcrypt 12+ rounds or Argon2id)
- ✅ Dependencies are up-to-date and vulnerability-free
- ✅ HTTPS is enforced (HSTS header configured)
- ✅ Cookies are secure (httpOnly, secure flags)
- ✅ Login throttling is enabled

## Related Categories

- **[Performance Analyzers](/analyzers/performance/)** - Optimize application performance
- **[Reliability Analyzers](/analyzers/reliability/)** - Ensure application stability
- **[Best Practices Analyzers](/analyzers/best-practices/)** - Follow Laravel conventions
- **[Code Quality Analyzers](/analyzers/code-quality/)** - Maintain code quality standards
