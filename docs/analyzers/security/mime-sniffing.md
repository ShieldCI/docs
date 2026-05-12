---
title: MIME Sniffing Protection Analyzer
description: Validates X-Content-Type-Options header to prevent browser MIME sniffing attacks
icon: file
outline: [2, 3]
tags: mime-sniffing,headers,content-type,security
pro: true
---

# MIME Sniffing Protection Analyzer

| Analyzer ID     | Category      | Severity | Time To Fix |
| --------------- | :-----------: | :------: | ----------: |
| `mime-sniffing` | 🛡️ Security  | High     | 5 minutes   |

## What This Checks

This analyzer validates that your application sends the `X-Content-Type-Options: nosniff` header to prevent browsers from performing MIME type sniffing on responses:

- **Missing header** - Checks if the `X-Content-Type-Options` header is present in HTTP responses
- **Invalid value** - Verifies the header is set to `nosniff` (the only valid value)
- **Live HTTP check** - Makes an actual HTTP request to a guest route (login page or homepage) to verify server-level headers
- **Environment awareness** - Only runs in production/staging environments (skips local and testing)

## Why It Matters

MIME sniffing (content sniffing) occurs when browsers ignore the declared `Content-Type` header and try to guess the actual content type by examining the file's content. This can lead to:

- **XSS attacks** - An attacker uploads an HTML file disguised as an image; the browser executes it as HTML with scripts
- **Content type confusion** - Files served with one type get interpreted as another, bypassing security controls
- **User-uploaded content execution** - PDFs, images, or documents containing embedded scripts get executed
- **Drive-by downloads** - Browser vulnerabilities can be exploited through MIME type confusion

This is especially critical for applications that allow user file uploads or serve user-generated content.

## How to Fix

### Quick Fix

Add the header via Laravel middleware:

**Before (❌):**
```php
// No X-Content-Type-Options header in responses
```

**After (✅):**
```php
// app/Http/Middleware/SecurityHeaders.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');

        return $response;
    }
}
```

Register in your `bootstrap/app.php` or `app/Http/Kernel.php`:

```php
// bootstrap/app.php (Laravel 11+)
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
})
```

### Proper Fix

Configure the header at the web server level for all responses:

**Nginx:**
```nginx
server {
    # Add to all responses
    add_header X-Content-Type-Options "nosniff" always;
}
```

**Apache (.htaccess):**
```apache
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
</IfModule>
```

**Combined approach (recommended):**
```php
// Set at both web server AND application level for defense in depth
// app/Http/Middleware/SecurityHeaders.php
class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        return $response;
    }
}
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments and only runs in production and staging.

**When to run this analyzer:**
- ✅ **Production servers**: Confirms MIME sniffing protection is active
- ✅ **Staging servers**: Validates header configuration before production deploy
- ❌ **Local development**: Skipped (localhost URLs not tested)
- ❌ **CI/CD pipelines**: Skipped automatically

## References

- [MDN: X-Content-Type-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options)
- [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)
- [CWE-16: Configuration](https://cwe.mitre.org/data/definitions/16.html)
- [RFC 6838: Media Type Specifications](https://tools.ietf.org/html/rfc6838)

## Related Analyzers

- [HSTS Header Analyzer](/analyzers/security/hsts-header) - Validates HTTP Strict Transport Security header
- [Clickjacking Analyzer](/analyzers/security/clickjacking) - Checks X-Frame-Options header configuration
- [Web Server Fingerprinting Analyzer](/analyzers/security/web-server-fingerprinting) - Detects server version disclosure headers

---
