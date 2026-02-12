---
title: Host Header Injection Analyzer
description: Detects Host header injection vulnerabilities in URL generation and routing
icon: server
outline: [2, 3]
tags: host-injection,header,security,cache-poisoning
pro: true
---

# Host Header Injection Analyzer

| Analyzer ID      | Category      | Severity | Time To Fix |
| ---------------- | :-----------: | :------: | ----------: |
| `host-injection` | 🛡️ Security  | Medium   | 10 minutes  |

## What This Checks

This analyzer detects Host header injection vulnerabilities where the application trusts the HTTP `Host` header without proper validation. It scans for three categories of issues:

**Code-level checks:**
- **Direct `$_SERVER` usage** - Detects `$_SERVER['HTTP_HOST']` and `$_SERVER['SERVER_NAME']` in application code
- **Unvalidated request methods** - Flags `request()->getHost()` and `request()->header('Host')` usage without nearby validation (e.g., `in_array`, `===`, `config('app.url')` checks)
- **Email URL generation** - Detects URLs generated using the Host header near email-sending code (`Mail::to`, `->send()`, `new ...Mail()`), which can lead to password reset poisoning

**Configuration checks (only if unsafe code patterns are found):**
- **APP_URL configuration** - Verifies `.env.example` does not use placeholder values and `config/app.php` references `APP_URL`
- **TrustHosts middleware** - Checks if the `TrustHosts` middleware exists with a properly configured `hosts()` method

::: tip Smart Detection
Configuration checks are only performed when unsafe code patterns are detected. If your application uses safe patterns like `config('app.url')` and `url()` consistently, the analyzer passes without raising configuration warnings.
:::

## Why It Matters

Host header injection allows attackers to manipulate the HTTP `Host` header to exploit applications that trust it:

- **Password reset poisoning** - Attacker changes the Host header so password reset emails contain malicious links pointing to the attacker's domain
- **Cache poisoning** - Manipulated Host headers cause cached pages to contain attacker-controlled URLs
- **SSRF attacks** - Host header manipulation can redirect internal requests to unintended targets
- **Routing attacks** - Applications that use the Host header for routing can be tricked into serving wrong content
- **Phishing** - Emails generated with untrusted Host values can be used for phishing attacks

## How to Fix

### Quick Fix

Replace direct Host header usage with `config('app.url')`:

**Before (❌):**
```php
// Vulnerable: trusting Host header for URL generation
$host = $_SERVER['HTTP_HOST'];
$resetUrl = "https://{$host}/password/reset/{$token}";

Mail::to($user)->send(new ResetPasswordMail($resetUrl));
```

**After (✅):**
```php
// Safe: using configured application URL
$resetUrl = config('app.url') . "/password/reset/{$token}";

Mail::to($user)->send(new ResetPasswordMail($resetUrl));
```

### Proper Fix

1. **Use Laravel's URL generation helpers** instead of manual Host header access:

**Before (❌):**
```php
// Vulnerable: request()->getHost() without validation
$host = request()->getHost();
$callbackUrl = "https://{$host}/api/webhook/callback";

// Vulnerable: $_SERVER['SERVER_NAME'] directly
$domain = $_SERVER['SERVER_NAME'];
$link = "https://{$domain}/verify/{$token}";
```

**After (✅):**
```php
// Safe: use Laravel's url() helper (reads from config)
$callbackUrl = url('/api/webhook/callback');

// Safe: use route() helper for named routes
$link = route('verification.verify', ['token' => $token]);

// Safe: use config('app.url') for absolute URLs
$domain = config('app.url');
```

2. **Configure the TrustHosts middleware** (Laravel 9+):

```php
// app/Http/Middleware/TrustHosts.php
namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustHosts as Middleware;

class TrustHosts extends Middleware
{
    public function hosts(): array
    {
        return [
            $this->allSubdomainsOfApplicationUrl(),
            'yourdomain.com',
            '*.yourdomain.com',
        ];
    }
}
```

3. **Set APP_URL in production `.env`**:

```ini
# .env (production)
APP_URL=https://yourdomain.com
```


## References

- [OWASP Host Header Injection](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/17-Testing_for_Host_Header_Injection)
- [Laravel TrustHosts Middleware](https://laravel.com/docs/requests#configuring-trusted-hosts)
- [CWE-644: Improper Neutralization of HTTP Headers](https://cwe.mitre.org/data/definitions/644.html)
- [Password Reset Poisoning (PortSwigger)](https://portswigger.net/web-security/host-header/exploiting/password-reset-poisoning)

## Related Analyzers

- [CSRF Protection Analyzer](/analyzers/security/csrf-protection) - Ensures CSRF tokens are properly configured
- [HSTS Header Analyzer](/analyzers/security/hsts-header) - Validates HTTP Strict Transport Security header
- [Cookie Domain Analyzer](/analyzers/security/cookie-domain) - Checks cookie domain configuration for security

---
