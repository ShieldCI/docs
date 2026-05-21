---
title: Security Analyzers
description: Analyzers detecting vulnerabilities like SQL injection, XSS, CSRF, authentication issues, and more
tags: security,sql-injection,xss,csrf,authentication,vulnerabilities,laravel
icon: lock
outline: [2, 3]
---

# Security Analyzers

**67 analyzers** detecting vulnerabilities like SQL injection, XSS, CSRF, command injection, and more.

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
  title="Column Name SQL Injection"
  description="Detects SQL injection vulnerabilities where user input controls column names"
  severity="critical"
  link="/analyzers/security/column-name-sql-injection"
  pro
/>

<AnalyzerCard
  title="Validation SQL Injection"
  description="Detects SQL injection vulnerabilities in validation rules"
  severity="critical"
  link="/analyzers/security/validation-sql-injection"
  pro
/>

<AnalyzerCard
  title="Command Injection"
  description="Detects command injection vulnerabilities where user input is passed to shell execution functions"
  severity="critical"
  link="/analyzers/security/command-injection"
  pro
/>

<AnalyzerCard
  title="Directory Traversal"
  description="Detects path traversal vulnerabilities that allow accessing files outside intended directories"
  severity="critical"
  link="/analyzers/security/directory-traversal"
  pro
/>

<AnalyzerCard
  title="Remote Code Execution (RCE)"
  description="Detects code execution vulnerabilities that allow arbitrary code execution"
  severity="critical"
  link="/analyzers/security/rce"
  pro
/>

<AnalyzerCard
  title="Object Injection"
  description="Detects unsafe deserialization that can lead to object injection attacks"
  severity="critical"
  link="/analyzers/security/object-injection"
  pro
/>

<AnalyzerCard
  title="Server-Side Request Forgery (SSRF)"
  description="Detects SSRF vulnerabilities where user input controls server-side requests"
  severity="critical"
  link="/analyzers/security/ssrf"
  pro
/>

<AnalyzerCard
  title="Eval Usage"
  description="Detects dangerous eval usage that can execute arbitrary code"
  severity="critical"
  link="/analyzers/security/eval"
  pro
/>

<AnalyzerCard
  title="Extract Function"
  description="Detects unsafe extract usage that can overwrite variables"
  severity="high"
  link="/analyzers/security/extract"
  pro
/>

<AnalyzerCard
  title="XXE Injection Vulnerabilities"
  description="Detects XML External Entity injection vulnerabilities"
  severity="critical"
  link="/analyzers/security/xxe-vulnerabilities"
  pro
/>

<AnalyzerCard
  title="Regular Expression DoS"
  description="Detects ReDoS vulnerabilities from catastrophic backtracking in regex patterns"
  severity="high"
  link="/analyzers/security/regex-dos"
  pro
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
  title="Arbitrary File Upload"
  description="Detects file upload vulnerabilities that could lead to remote code execution"
  severity="critical"
  link="/analyzers/security/arbitrary-file-upload"
  pro
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

<AnalyzerCard
  title="Session Timeout"
  description="Ensures session lifetime is configured appropriately for security"
  severity="medium"
  link="/analyzers/security/session-timeout"
  pro
/>

<AnalyzerCard
  title="Fortify Security"
  description="Validates Laravel Fortify authentication configuration, two-factor auth, password rules, and security settings"
  severity="high"
  link="/analyzers/security/fortify-security"
  pro
/>

<AnalyzerCard
  title="Passport Security"
  description="Validates Laravel Passport OAuth2 configuration, token lifetimes, encryption keys, and security settings"
  severity="high"
  link="/analyzers/security/passport-security"
  pro
/>

<AnalyzerCard
  title="Sanctum Security"
  description="Validates Laravel Sanctum token configuration, expiration settings, and SPA middleware setup"
  severity="high"
  link="/analyzers/security/sanctum-security"
  pro
/>

<AnalyzerCard
  title="Socialite Security"
  description="Validates Laravel Socialite OAuth configuration, credential security, and callback handling"
  severity="high"
  link="/analyzers/security/socialite-security"
  pro
/>

</div>

### Filament Security

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Filament Panel Security"
  description="Validates Filament admin panel security including authentication, middleware, and access restrictions"
  severity="high"
  link="/analyzers/security/filament-panel-security"
  pro
/>

<AnalyzerCard
  title="Filament Resource Authorization"
  description="Validates that Filament resources have proper policy bindings for authorization on CRUD operations"
  severity="high"
  link="/analyzers/security/filament-resource-authorization"
  pro
/>

<AnalyzerCard
  title="Filament Tenancy"
  description="Validates multi-tenancy scope enforcement in Filament panels to prevent cross-tenant data leakage"
  severity="high"
  link="/analyzers/security/filament-tenancy"
  pro
/>

<AnalyzerCard
  title="Filament Custom Pages"
  description="Validates that custom Filament pages have proper authorization to prevent unauthorized access"
  severity="medium"
  link="/analyzers/security/filament-custom-pages"
  pro
/>

<AnalyzerCard
  title="Filament Form Validation"
  description="Validates that Filament form fields have proper validation rules to prevent invalid or malicious input"
  severity="medium"
  link="/analyzers/security/filament-form-validation"
  pro
/>

<AnalyzerCard
  title="Filament Navigation"
  description="Validates that Filament navigation groups and items have proper permission gates for visibility control"
  severity="medium"
  link="/analyzers/security/filament-navigation"
  pro
/>

<AnalyzerCard
  title="Filament Widget Security"
  description="Validates that Filament widgets have proper authorization and don't expose sensitive data to unauthorized users"
  severity="medium"
  link="/analyzers/security/filament-widget-security"
  pro
/>

</div>

### Payment Security

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Cashier Security (Stripe)"
  description="Validates Laravel Cashier Stripe webhook verification, key exposure, and payment handling security"
  severity="high"
  link="/analyzers/security/cashier-security"
  pro
/>

<AnalyzerCard
  title="Cashier Paddle"
  description="Validates Laravel Cashier Paddle webhook verification, sandbox detection, and configuration security"
  severity="high"
  link="/analyzers/security/cashier-paddle"
  pro
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
  title="Hardcoded Credentials"
  description="Detects hardcoded passwords, API keys, and secrets in source code"
  severity="critical"
  link="/analyzers/security/hardcoded-credentials"
  pro
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

<AnalyzerCard
  title="Telescope Security"
  description="Ensures Laravel Telescope is properly secured in production"
  severity="high"
  link="/analyzers/security/telescope-security"
  pro
/>

<AnalyzerCard
  title="Nova Security"
  description="Ensures Laravel Nova admin panel is properly secured"
  severity="high"
  link="/analyzers/security/nova-security"
  pro
/>

<AnalyzerCard
  title="Horizon Security"
  description="Ensures Laravel Horizon dashboard is properly secured"
  severity="high"
  link="/analyzers/security/horizon-security"
  pro
/>

<AnalyzerCard
  title="Pulse Security"
  description="Validates Laravel Pulse dashboard authorization, data retention, and security settings"
  severity="high"
  link="/analyzers/security/pulse-security"
  pro
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
  severity="critical"
  link="/analyzers/security/cookie"
/>

<AnalyzerCard
  title="Cookie Domain"
  description="Detects unnecessary cookie domain configuration that makes cookies less restrictive"
  severity="medium"
  link="/analyzers/security/cookie-domain"
  pro
/>

<AnalyzerCard
  title="Fillable Foreign Key"
  description="Detects foreign keys in fillable arrays that may allow unauthorized relationship manipulation"
  severity="high"
  link="/analyzers/security/fillable-foreign-key"
/>

<AnalyzerCard
  title="Cryptographic Weakness"
  description="Detects weak cryptographic algorithms and insecure random number generation"
  severity="high"
  link="/analyzers/security/cryptographic-weakness"
  pro
/>

</div>

### Compliance & Audit

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Audit Logging"
  description="Validates that security-sensitive operations have proper audit logging for compliance and incident response"
  severity="medium"
  link="/analyzers/security/audit-logging"
  pro
/>

<AnalyzerCard
  title="GDPR Compliance"
  description="Validates basic GDPR compliance patterns including data deletion, consent tracking, and encryption at rest"
  severity="medium"
  link="/analyzers/security/gdpr-compliance"
  pro
/>

</div>

### HTTP Security

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Clickjacking Protection"
  description="Detects missing clickjacking protection via X-Frame-Options or CSP frame-ancestors"
  severity="high"
  link="/analyzers/security/clickjacking"
  pro
/>

<AnalyzerCard
  title="HSTS Header"
  description="Validates HTTP Strict Transport Security (HSTS) header configuration for HTTPS-only applications"
  severity="high"
  link="/analyzers/security/hsts-header"
/>

<AnalyzerCard
  title="MIME Sniffing Protection"
  description="Ensures X-Content-Type-Options header prevents MIME type sniffing"
  severity="medium"
  link="/analyzers/security/mime-sniffing"
  pro
/>

<AnalyzerCard
  title="Web Server Fingerprinting"
  description="Detects server information leakage through HTTP headers"
  severity="low"
  link="/analyzers/security/web-server-fingerprinting"
  pro
/>

<AnalyzerCard
  title="Host Header Injection"
  description="Detects host header injection vulnerabilities that can lead to cache poisoning or password reset attacks"
  severity="high"
  link="/analyzers/security/host-injection"
  pro
/>

<AnalyzerCard
  title="CORS Configuration"
  description="Validates Cross-Origin Resource Sharing configuration for security, preventing overly permissive API access"
  severity="high"
  link="/analyzers/security/cors-config"
  pro
/>

<AnalyzerCard
  title="Route Rate Limiting"
  description="Validates that public API endpoints have rate limiting configured to prevent abuse and brute force attacks"
  severity="medium"
  link="/analyzers/security/route-rate-limiting"
  pro
/>

<AnalyzerCard
  title="Open Redirection"
  description="Detects open redirect vulnerabilities that can be used for phishing attacks"
  severity="medium"
  link="/analyzers/security/open-redirection"
  pro
/>

</div>

### Frontend & API Security

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Livewire Security"
  description="Validates Livewire component security including property exposure, authorization checks, and file uploads"
  severity="high"
  link="/analyzers/security/livewire-security"
  pro
/>

<AnalyzerCard
  title="Reverb Security"
  description="Validates Laravel Reverb WebSocket configuration, channel authorization, and SSL/TLS settings"
  severity="high"
  link="/analyzers/security/reverb-security"
  pro
/>

<AnalyzerCard
  title="Inertia Security"
  description="Validates Inertia.js shared data exposure and middleware configuration to prevent sensitive data leakage"
  severity="medium"
  link="/analyzers/security/inertia-security"
  pro
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
  severity="medium"
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
  severity="high"
  link="/analyzers/security/license-compliance"
/>

</div>

### File System Security

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="File Permissions"
  description="Validates that project files and directories use secure permissions"
  severity="critical"
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
- ✅ Clickjacking protection enabled (X-Frame-Options or CSP frame-ancestors)
- ✅ SQL injection protection (use Eloquent/parameter binding)
- ✅ XSS protection (escape all user input)
- ✅ File uploads have MIME type, extension, and size validation
- ✅ Uploaded files stored in private directories (not publicly executable)
- ✅ Mass assignment protection (use $fillable/$guarded)
- ✅ Password hashing uses strong algorithms (bcrypt 12+ rounds or Argon2id)
- ✅ Dependencies are up-to-date and vulnerability-free
- ✅ HTTPS is enforced (HSTS header configured)
- ✅ Cookies are secure (httpOnly, secure flags)
- ✅ Cookie domain is only set when using subdomain routing
- ✅ Login throttling is enabled

## Related Categories

- **[Performance Analyzers](/analyzers/performance/)** - Optimize application performance
- **[Reliability Analyzers](/analyzers/reliability/)** - Ensure application stability
- **[Best Practices Analyzers](/analyzers/best-practices/)** - Follow Laravel conventions
- **[Code Quality Analyzers](/analyzers/code-quality/)** - Maintain code quality standards
