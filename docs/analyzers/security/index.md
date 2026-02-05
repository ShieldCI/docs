---
title: Security Analyzers
description: Analyzers detecting vulnerabilities like SQL injection, XSS, CSRF, authentication issues, and more
icon: lock
outline: [2, 3]
---

# Security Analyzers

**22 analyzers** detecting vulnerabilities like SQL injection, XSS, CSRF, authentication issues, and more.

## Overview

Security analyzers focus on identifying and preventing security vulnerabilities in Laravel applications. These analyzers help protect your application from common attacks, ensure secure configuration, validate dependencies, and maintain security best practices throughout your codebase.

## Key Analyzers

### Critical Vulnerabilities

- **[SQL Injection Analyzer](/analyzers/security/sql-injection)** - Detects potential SQL injection vulnerabilities in database queries
- **[XSS Vulnerabilities Analyzer](/analyzers/security/xss-vulnerabilities)** - Detects XSS vulnerabilities via code analysis and HTTP header verification
- **[CSRF Protection Analyzer](/analyzers/security/csrf-protection)** - Detects missing CSRF (Cross-Site Request Forgery) protection
- **[Mass Assignment Vulnerabilities Analyzer](/analyzers/security/mass-assignment-vulnerabilities)** - Detects mass assignment vulnerabilities in Eloquent models and query builders
- **[Unguarded Models Analyzer](/analyzers/security/unguarded-models)** - Detects Model::unguard() usage that disables mass assignment protection

### Authentication & Authorization

- **[Authentication & Authorization Analyzer](/analyzers/security/authentication-authorization)** - Detects missing authentication and authorization protection on routes and controllers
- **[Login Throttling Analyzer](/analyzers/security/login-throttling)** - Detects missing rate limiting on authentication endpoints to prevent brute force attacks

### Configuration & Secrets

- **[Application Key Analyzer](/analyzers/security/app-key)** - Validates that the application encryption key is properly configured and secure
- **[Environment File Analyzer](/analyzers/security/env-file)** - Validates .env file security, location, and prevents exposure of sensitive data
- **[Environment File HTTP Accessibility Analyzer](/analyzers/security/env-http-accessibility)** - Verifies .env file is not accessible via HTTP requests to the web server
- **[Debug Mode Analyzer](/analyzers/security/debug-mode)** - Detects debug mode enabled and debugging functions that expose sensitive information
- **[PHP Configuration Analyzer](/analyzers/security/php-ini)** - Validates that PHP ini settings are configured securely

### Data Protection

- **[Password Hashing Strength Analyzer](/analyzers/security/hashing-strength)** - Validates that password hashing configuration uses secure parameters
- **[Cookie Analyzer](/analyzers/security/cookie)** - Validates cookie encryption and security configuration
- **[Fillable Foreign Key Analyzer](/analyzers/security/fillable-foreign-key)** - Detects foreign keys in fillable arrays that may allow unauthorized relationship manipulation

### HTTP Security

- **[HSTS Header Analyzer](/analyzers/security/hsts-header)** - Validates HTTP Strict Transport Security (HSTS) header configuration for HTTPS-only applications

### Dependencies & Updates

- **[Vulnerable Dependencies Analyzer](/analyzers/security/vulnerable-dependencies)** - Scans composer dependencies for known security vulnerabilities
- **[Frontend Vulnerable Dependencies Analyzer](/analyzers/security/frontend-vulnerable-dependencies)** - Scans npm/yarn dependencies for known security vulnerabilities
- **[Up-to-Date Dependencies Analyzer](/analyzers/security/up-to-date-dependencies)** - Checks if dependencies are up-to-date with available bug fixes and security patches
- **[Stable Dependencies Analyzer](/analyzers/security/stable-dependencies)** - Validates that all dependencies use stable versions rather than dev/alpha/beta releases
- **[Dependency License Compliance Analyzer](/analyzers/security/license-compliance)** - Validates that all dependencies use legally acceptable licenses for your application type

### File System Security

- **[File Permissions Security Analyzer](/analyzers/security/file-permissions)** - Validates that project files and directories use secure permissions

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
