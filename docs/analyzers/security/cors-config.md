---
title: CORS Configuration Analyzer
description: Validates Cross-Origin Resource Sharing configuration for security, preventing overly permissive API access
icon: lock
outline: [2, 3]
tags: security,cors,cross-origin,headers,api
pro: true
---

# CORS Configuration Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `cors-config` | 🛡️ Security  | High    | 10 minutes   |

## What This Checks

Validates Cross-Origin Resource Sharing configuration for security. Checks for:

- Missing CORS configuration file (`config/cors.php`)
- Wildcard `allowed_origins` permitting any domain
- Wildcard `allowed_methods` exposing all HTTP methods
- Wildcard `allowed_headers` permitting any custom header
- `supports_credentials` enabled with wildcard origins (browser-blocked but misconfigured)
- CORS `max_age` set to 0 (no preflight caching) or excessively high values
- Sensitive headers exposed cross-origin (Authorization, Set-Cookie)

## Why It Matters

- **API Abuse:** Wildcard origins allow any website to make API requests on behalf of your users
- **Credential Theft:** Combined with `supports_credentials`, attackers can steal session cookies
- **Performance:** Without preflight caching, every cross-origin request triggers an extra OPTIONS request
- **Data Leakage:** Exposed sensitive headers can leak authentication tokens to malicious origins

## How to Fix

### Quick Fix (5 minutes)

Publish and configure CORS:

```bash
php artisan vendor:publish --tag=cors
```

### Proper Fix (10 minutes)

**Restrict origins, methods, and headers:**

**Before (❌):**
```php
// config/cors.php
return [
    'allowed_origins' => ['*'],
    'allowed_methods' => ['*'],
    'allowed_headers' => ['*'],
    'supports_credentials' => true,
];
```

**After (✅):**
```php
// config/cors.php
return [
    'paths' => ['api/*'],
    'allowed_origins' => [
        'https://app.example.com',
        'https://admin.example.com',
    ],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE'],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
    'exposed_headers' => ['X-Request-Id'],
    'max_age' => 3600, // Cache preflight for 1 hour
    'supports_credentials' => true,
];
```

## References

- [Laravel CORS Configuration](https://laravel.com/docs/routing#cors)
- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [OWASP CORS Misconfiguration](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/07-Testing_Cross_Origin_Resource_Sharing)

## Related Analyzers

- [CSRF Protection](/analyzers/security/csrf-protection) - Validates CSRF token configuration
- [Cookie](/analyzers/security/cookie) - Checks cookie security settings
- [HSTS Header](/analyzers/security/hsts-header) - Validates HTTPS enforcement
