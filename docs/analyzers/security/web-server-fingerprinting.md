---
title: Web Server Fingerprinting Analyzer
description: Detects information disclosure via Server HTTP header that aids attackers in fingerprinting
icon: fingerprint
outline: [2, 3]
tags: fingerprinting,headers,server,information-disclosure,security
---

# Web Server Fingerprinting Analyzer

| Analyzer ID                 | Category      | Severity | Time To Fix |
| --------------------------- | :-----------: | :------: | ----------: |
| `web-server-fingerprinting` | 🛡️ Security  | Medium   | 5 minutes   |

## What This Checks

This analyzer detects web server information disclosure through the `Server` HTTP response header by making a live HTTP request and inspecting the response:

- **Server software and version** - Detects Apache, Nginx, IIS, Lighttpd, LiteSpeed, and Caddy version numbers (e.g., `Apache/2.4.41`, `nginx/1.18.0`)
- **Operating system disclosure** - Flags OS information like Ubuntu, Debian, CentOS, Red Hat, Fedora, Windows
- **PHP version disclosure** - Detects `PHP/` version strings in headers
- **Module disclosure** - Flags OpenSSL and mod_ssl version information
- **Multiple exposures** - Reports all exposed information from a single response

The analyzer makes a real HTTP request to a guest route (login page or homepage) and examines the `Server` header in the response.

::: tip When This Analyzer Runs
This analyzer only runs in production/staging environments and is automatically skipped in:
- Local development environments
- CI/CD pipelines (`$runInCI = false`)
- When no accessible route is found
- When the application URL points to localhost
:::

## Why It Matters

The `Server` header reveals information that helps attackers plan targeted attacks:

- **Targeted exploit selection** - Knowing the exact server version allows attackers to use known CVEs (e.g., Apache 2.4.49 path traversal CVE-2021-41773, nginx DNS resolver vulnerability CVE-2021-23017)
- **Automated vulnerability scanning** - Tools like Shodan, Censys, and Nmap use server headers to build vulnerability databases
- **Reconnaissance efficiency** - Reduces attacker effort by eliminating guesswork about the server stack
- **Information leakage (CWE-200)** - Server headers can reveal the full stack: web server, OS, PHP version, and SSL implementation
- **Attack surface mapping** - Combined with other headers, attackers can build a complete profile of your infrastructure

While security through obscurity is not a standalone defense, removing version information raises the cost of attacks and reduces automated scanning effectiveness.

## How to Fix

### Quick Fix

Configure your web server to suppress version information:

**Nginx:**
```nginx
# /etc/nginx/nginx.conf
http {
    # Remove version number from Server header
    server_tokens off;
}
```

**Apache:**
```apache
# /etc/apache2/conf-enabled/security.conf
# Only show "Apache" without version or OS
ServerTokens Prod

# Remove server version from error pages
ServerSignature Off
```

### Proper Fix

Remove or obfuscate the `Server` header entirely and suppress related headers:

**Nginx (complete removal):**
```nginx
# /etc/nginx/nginx.conf
http {
    server_tokens off;

    # Requires headers-more-nginx-module
    more_clear_headers Server;
}
```

**Apache (complete removal):**
```apache
# Requires mod_headers
<IfModule mod_headers.c>
    Header unset Server
    Header always unset X-Powered-By
</IfModule>

ServerTokens Prod
ServerSignature Off
```

**PHP - Remove X-Powered-By:**
```ini
; php.ini
expose_php = Off
```

**Laravel middleware (defense in depth):**
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

        // Remove version disclosure headers
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }
}
```

**Caddy:**
```txt
yourdomain.com {
    header -Server
    header -X-Powered-By
}
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments and only runs in production and staging.

**When to run this analyzer:**
- ✅ **Production servers**: Confirms server version information is hidden
- ✅ **Staging servers**: Validates header configuration before production deploy
- ❌ **Local development**: Skipped (fingerprinting checks require production URL)
- ❌ **CI/CD pipelines**: Skipped automatically

## References

- [OWASP Fingerprint Web Server](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/02-Fingerprint_Web_Server)
- [CWE-200: Exposure of Sensitive Information](https://cwe.mitre.org/data/definitions/200.html)
- [Nginx server_tokens Directive](https://nginx.org/en/docs/http/ngx_http_core_module.html#server_tokens)
- [Apache ServerTokens Directive](https://httpd.apache.org/docs/current/mod/core.html#servertokens)

## Related Analyzers

- [MIME Sniffing Analyzer](/analyzers/security/mime-sniffing) - Checks X-Content-Type-Options header
- [HSTS Header Analyzer](/analyzers/security/hsts-header) - Validates HTTP Strict Transport Security header
- [PHP INI Analyzer](/analyzers/security/php-ini) - Checks PHP configuration including expose_php
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Ensures debug mode is disabled in production

---
