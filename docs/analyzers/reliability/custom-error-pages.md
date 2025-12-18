---
title: Custom Error Pages Analyzer
description: Ensure user-friendly, non-fingerprinting error pages are in place
icon: alert-triangle
outline: [2, 3]
tags: errors,ux,reliability,security,fingerprinting
---

# Custom Error Pages Analyzer

| Analyzer ID          |    Category    | Severity | Time To Fix |
| ---------------------|:--------------:|:--------:|------------:|
| `custom-error-pages` | ✅ Reliability |  Medium  |  30 minutes |

## What This Checks

- Verifies that 404, 500, and 503 templates exist under `resources/views/errors` (or the `errors` namespace)
- Detects missing templates that would fall back to Laravel’s default branding
- Skips stateless/API-only apps (no session middleware) where HTML error pages aren’t relevant
- Skips automatically in CI (where web server may not be available)
- Reports which templates are missing and which view paths were inspected

## Why It Matters

- **Framework fingerprinting**: Default error pages advertise “Laravel”, helping attackers tailor exploits
- **User experience**: Users prefer branded error pages with recovery instructions (contact support, try again)
- **Consistency**: Custom maintenance/500 pages prevent sudden theme changes when outages occur

## How to Fix

### Quick Fix (5 minutes)

1. Publish the default error views:

```bash
php artisan vendor:publish --tag=laravel-errors
```

2. Customize `resources/views/errors/404.blade.php`, `500.blade.php`, and `503.blade.php` to match your brand.

### Proper Fix (30 minutes)

1. **Add helpful CTAs**: Link to support, status pages, or self-service instructions
2. **Log correlation IDs**: Display a request ID so ops can trace the failure
3. **Localize**: Provide translated error messages if your app is multilingual
4. **Automate tests**: Write feature tests to assert the custom templates render for 404/500 responses
5. **Namespace sharing**: If you ship a design system package, register an `errors` view namespace and keep templates centralized

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`) and for stateless/API-only applications.

**Why skip in CI?**
- Custom error page checks require a web server context
- CI environments may not have full web rendering available
- Error page rendering is a deployment/runtime concern, not a code quality check
- Prevents false failures in headless CI environments

**Why skip for stateless/API-only apps?**
- API-only applications return JSON error responses, not HTML pages
- Stateless apps (no session middleware) don't serve traditional web pages
- Custom HTML error pages aren't relevant for pure API applications

**When to run this analyzer:**
- ✅ **Web applications with sessions**: Full-stack Laravel apps serving HTML
- ✅ **Hybrid apps**: Applications with both web and API routes
- ✅ **Local development**: Ensures error pages are configured before deployment
- ✅ **Staging/Production servers**: Validates custom error pages are in place
- ❌ **CI/CD pipelines**: Skipped automatically (no web server context)
- ❌ **API-only applications**: Skipped automatically (no session middleware detected)

## References

- [Laravel Error Pages](https://laravel.com/docs/errors)
- [HTTP Status Codes](https://developer.mozilla.org/docs/Web/HTTP/Status)

## Related Analyzers

- [Cache Status Analyzer](/analyzers/reliability/cache-status) - Validates cache connectivity and functionality
- [Cache Prefix Configuration Analyzer](/analyzers/reliability/cache-prefix-configuration) - Ensures cache prefix is set to avoid collisions
- [Maintenance Mode Status Analyzer](/analyzers/reliability/maintenance-mode-status) - Checks if the application is in maintenance mode
