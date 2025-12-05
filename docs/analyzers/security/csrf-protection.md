---
title: CSRF Protection Analyzer
description: Detects missing or weak Cross-Site Request Forgery (CSRF) protection in Laravel applications
icon: shield-alert
outline: [2, 3]
---

# CSRF Protection Analyzer

| Analyzer ID       | Category     | Severity   | Time To Fix  |
| ------------------| :----------: |:----------:| ------------:|
| `csrf-protection` | 🛡️ Security  | High       | 20 minutes   |

## What This Checks

Detects missing or weak Cross-Site Request Forgery (CSRF) protection in Laravel applications. Validates that forms include `@csrf` directives, AJAX requests use CSRF tokens, VerifyCsrfToken middleware is properly registered, middleware exception patterns aren't overly broad, and state-changing routes have appropriate protection.

## Why It Matters

- **Session Hijacking**: Attackers can trick authenticated users into performing unwanted actions
- **Financial Loss**: CSRF attacks can trigger unauthorized money transfers, purchases, or account changes
- **Data Modification**: Unprotected forms allow attackers to modify user data, settings, or passwords
- **Account Takeover**: CSRF can change email addresses, passwords, or security settings

Without CSRF protection, an attacker can create a malicious website that submits forms to your application using the victim's authenticated session. When a logged-in user visits the attacker's site, their browser automatically sends their session cookie, allowing the attacker to perform actions as that user without their knowledge or consent.

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: Form Missing CSRF Token**

```blade
<!-- BEFORE - Vulnerable -->
<form method="POST" action="/update-profile">
    <input type="text" name="email">
    <button type="submit">Update</button>
</form>

<!-- AFTER - Protected -->
<form method="POST" action="/update-profile">
    @csrf
    <input type="text" name="email">
    <button type="submit">Update</button>
</form>
```

**Scenario 2: AJAX Request Without Token**

```blade
<!-- Add meta tag to layout -->
<head>
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>

<!-- Update AJAX call -->
<script>
$.ajax({
    url: '/api/users',
    method: 'POST',
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    },
    data: { name: 'John' }
});
</script>
```

**Scenario 3: Middleware Not Registered**

```php
// app/Http/Kernel.php - Add to 'web' middleware group
protected $middlewareGroups = [
    'web' => [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \App\Http\Middleware\VerifyCsrfToken::class,  // ✅ Add this
    ],
];
```

### Proper Fix (20 minutes)

Implement comprehensive CSRF protection across your application:

**1. Add CSRF Meta Tag to Layout**

```blade
<!-- resources/views/layouts/app.blade.php -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title')</title>
</head>
<body>
    @yield('content')
</body>
</html>
```

**2. Protect All Forms**

```blade
<!-- All POST/PUT/PATCH/DELETE forms need @csrf -->
<form method="POST" action="/profile">
    @csrf
    <!-- form fields -->
</form>

<!-- Forms with method spoofing -->
<form method="POST" action="/resource/1">
    @csrf
    @method('PUT')
    <!-- form fields -->
</form>

<!-- Delete forms -->
<form method="POST" action="/resource/1">
    @csrf
    @method('DELETE')
    <button type="submit">Delete</button>
</form>
```

**3. Configure AJAX Globally**

```javascript
// resources/js/bootstrap.js
import axios from 'axios';

// Configure axios (if using Axios)
let token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found');
}

// Configure jQuery (if using jQuery)
$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': token ? token.content : ''
    }
});
```

**4. Fetch API Implementation**

```javascript
// resources/js/app.js
function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]').content;
}

// Use in fetch requests
fetch('/api/users', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken()
    },
    body: JSON.stringify({ name: 'John' })
});
```

**5. Configure Middleware Exceptions Carefully**

```php
// app/Http/Middleware/VerifyCsrfToken.php
class VerifyCsrfToken extends Middleware
{
    protected $except = [
        // ✅ GOOD - Specific webhook endpoints
        'webhooks/stripe',
        'webhooks/github',

        // ✅ GOOD - API routes (use token auth instead)
        'api/*',

        // ❌ BAD - Never use wildcards
        // '*',
        // '/*',

        // ❌ BAD - Too broad
        // 'admin/*',
    ];
}
```

**6. Verify Middleware Registration**

```php
// Laravel 10 and below - app/Http/Kernel.php
protected $middlewareGroups = [
    'web' => [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \App\Http\Middleware\VerifyCsrfToken::class,  // ✓ Must be present
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
];

// Laravel 11+ - bootstrap/app.php
// CSRF protection enabled by default, don't disable it
return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        // CSRF protection is automatic
    })
    ->create();
```

**7. Test Protection Works**

```bash
# Create test route
# routes/web.php
Route::post('/test-csrf', function () {
    return 'CSRF protection working';
});

# Test without token (should fail with 419)
curl -X POST https://yourapp.com/test-csrf

# Test with token (should succeed)
# Get token from browser console:
# document.querySelector('meta[name="csrf-token"]').content
curl -X POST https://yourapp.com/test-csrf \
  -H "X-CSRF-TOKEN: your-token-here"
```

**8. Handle Token Expiration**

```javascript
// Handle 419 errors gracefully
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response.status === 419) {
            alert('Your session has expired. Please refresh the page.');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);
```

## References

- [Laravel CSRF Protection Documentation](https://laravel.com/docs/csrf)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: CSRF](https://developer.mozilla.org/en-US/docs/Glossary/CSRF)
- [SameSite Cookies Explained](https://web.dev/samesite-cookies-explained/)

## Related Analyzers

- [Cookie Analyzer](/analyzers/security/cookie) - Validates session cookie security configuration
- [XSS Vulnerabilities Analyzer](/analyzers/security/xss-vulnerabilities) - Prevents cross-site scripting
- [Application Key Analyzer](/analyzers/security/app-key) - Validates encryption key security
- [Authentication & Authorization Analyzer](/analyzers/security/authentication-authorization) - Validates authentication implementation
