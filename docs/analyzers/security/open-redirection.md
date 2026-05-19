---
title: Open Redirection Analyzer
description: Detects open redirect vulnerabilities where user input controls redirect destinations, enabling phishing attacks and security filter bypasses
icon: external-link
outline: [2, 3]
tags: open-redirect,redirect,phishing,security
pro: true
---

# Open Redirection Analyzer

| Analyzer ID       | Category     | Severity   | Time To Fix  |
| ----------------- | :----------: |:----------:| ------------:|
| `open-redirection`| 🛡️ Security  | High       | 10 minutes   |

## What This Checks

This analyzer detects open redirection vulnerabilities where user-controlled input determines redirect destinations, allowing attackers to redirect users to malicious websites. Checks for:

- **`redirect()` helpers with user input** - `redirect($input)`, `redirect()->to()`, `->away()`, `->guest()`, `->secure()`, and the `Redirect` facade equivalents (`Redirect::to()`, `::away()`, `::guest()`, `::secure()`) when the URL argument is user-supplied or a tainted variable
- **Raw `header('Location:')` calls** with user input - flagged as Critical; bypasses Laravel's response pipeline entirely
- **`new RedirectResponse()`** constructed directly with user input (both short and fully-qualified Symfony/Illuminate forms)
- **`redirect()->intended()`** with a user-controlled fallback argument instead of a hardcoded route
- **Referer-based redirects** - `$_SERVER['HTTP_REFERER']`, `$request->header('Referer')`, or `$request->headers->get('referer')` used as redirect targets
- **`url()->previous()` / `URL::previous()`** in redirect context - both helpers derive their value from the Referer header, not session history, making them attacker-influenced

All checks also perform simple variable taint tracking (e.g. `$url = $request->input('next'); redirect($url)`) and recognise validation guards such as `Str::startsWith($url, '/')` or a `parse_url` host comparison as safe.

## Why It Matters

Open redirection vulnerabilities allow attackers to abuse your application's trust to redirect users to malicious destinations:

- **Phishing Attacks** - Redirect users to fake login pages that steal credentials (e.g., `yourapp.com/login?next=evil.com/login`)
- **Malware Distribution** - Send users to sites that deliver malware through drive-by downloads
- **Security Filter Bypass** - Circumvent URL-based security filters and firewalls
- **Social Engineering** - Exploit user trust in your domain for convincing scam campaigns
- **OAuth Token Theft** - Steal authorization codes by redirecting OAuth callbacks
- **SEO Spam** - Abuse your domain authority to redirect search engines to spam sites

Because the initial URL appears legitimate (it starts with your domain), users and email filters are more likely to trust and click the link.

## How to Fix

### Quick Fix (5 minutes)

Use named routes instead of user-supplied URLs:

**Before (❌):**
```php
public function login(Request $request)
{
    // Authenticate user...

    // VULNERABLE: Attacker sends ?redirect=https://evil.com/steal-cookies
    return redirect($request->input('redirect'));
}
```

**After (✅):**
```php
public function login(Request $request)
{
    // Authenticate user...

    // SAFE: Always redirect to a named route
    return redirect()->route('dashboard');
}
```

### Proper Fix (10 minutes)

**Validate redirect URLs against allowed domains:**

**Before (❌):**
```php
public function callback(Request $request)
{
    $returnUrl = $request->input('return_url');

    // VULNERABLE: No validation on redirect target
    return redirect()->to($returnUrl);
}
```

**After (✅):**
```php
public function callback(Request $request)
{
    $returnUrl = $request->input('return_url', '/');

    // SAFE: Validate URL is internal (same domain)
    if (!$this->isInternalUrl($returnUrl)) {
        return redirect()->route('home');
    }

    return redirect()->to($returnUrl);
}

private function isInternalUrl(string $url): bool
{
    // Only allow relative URLs or same-domain URLs
    if (str_starts_with($url, '/') && !str_starts_with($url, '//')) {
        return true;
    }

    $parsed = parse_url($url);
    $appHost = parse_url(config('app.url'), PHP_URL_HOST);

    return isset($parsed['host']) && $parsed['host'] === $appHost;
}
```

**Replace raw Location headers with Laravel redirects:**

**Before (❌):**
```php
public function legacyRedirect(Request $request)
{
    $url = $request->input('url');

    // VULNERABLE: Raw header with user input
    header('Location: ' . $url);
    exit;
}
```

**After (✅):**
```php
public function legacyRedirect(Request $request)
{
    $url = $request->input('url', '/');

    // SAFE: Validate and use Laravel's redirect
    if (!$this->isInternalUrl($url)) {
        return redirect()->route('home');
    }

    return redirect($url);
}
```

**Best Practice: Whitelist Approach with Signed URLs (✅✅):**

```php
use Illuminate\Support\Facades\URL;

class RedirectController extends Controller
{
    // Generate signed redirect URLs
    public function generateLink(string $destination): string
    {
        $allowedDestinations = [
            'dashboard' => route('dashboard'),
            'profile' => route('profile'),
            'settings' => route('settings'),
        ];

        if (!isset($allowedDestinations[$destination])) {
            abort(400, 'Invalid destination');
        }

        // Signed URL prevents tampering
        return URL::signedRoute('safe-redirect', [
            'destination' => $destination,
        ]);
    }

    // Handle signed redirect
    public function handleRedirect(Request $request, string $destination)
    {
        // Laravel automatically validates the signature
        if (!$request->hasValidSignature()) {
            abort(403);
        }

        $allowedDestinations = [
            'dashboard' => route('dashboard'),
            'profile' => route('profile'),
            'settings' => route('settings'),
        ];

        $url = $allowedDestinations[$destination] ?? route('home');

        return redirect($url);
    }
}
```

**Secure intended() fallback:**

**Before (❌):**
```php
public function postLogin(Request $request)
{
    // VULNERABLE: User-controlled fallback
    return redirect()->intended($request->input('fallback'));
}
```

**After (✅):**
```php
public function postLogin(Request $request)
{
    // SAFE: Hardcoded fallback route
    return redirect()->intended(route('dashboard'));
}
```

**Replace new RedirectResponse() with validated redirect:**

**Before (❌):**
```php
use Illuminate\Http\RedirectResponse;

public function go(Request $request): RedirectResponse
{
    // VULNERABLE: Direct constructor with user input
    return new RedirectResponse($request->input('url'));
}
```

**After (✅):**
```php
public function go(Request $request): RedirectResponse
{
    $url = $request->input('url', '/');

    if (!$this->isInternalUrl($url)) {
        return redirect()->route('home');
    }

    // SAFE: use redirect() helper with validated URL
    return redirect($url);
}
```

**Avoid redirecting to the Referer header:**

**Before (❌):**
```php
public function back(Request $request)
{
    // VULNERABLE: Referer is attacker-controlled via a crafted link
    return redirect($_SERVER['HTTP_REFERER']);
}
```

**After (✅):**
```php
public function back(Request $request)
{
    // SAFE: Laravel's back() validates against your session history
    return redirect()->back();

    // OR if you must use Referer, validate it:
    // $referer = $request->header('Referer', '/');
    // return $this->isInternalUrl($referer) ? redirect($referer) : redirect('/');
}
```

**Replace url()->previous() with redirect()->back():**

**Before (❌):**
```php
public function cancel()
{
    // VULNERABLE: url()->previous() reads the Referer header directly
    return redirect(url()->previous());
}
```

**After (✅):**
```php
public function cancel()
{
    // SAFE: redirect()->back() uses the session-stored previous URL
    return redirect()->back();
}
```

## References

- [OWASP Unvalidated Redirects and Forwards](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
- [CWE-601: URL Redirection to Untrusted Site](https://cwe.mitre.org/data/definitions/601.html)
- [OWASP Top 10 - A01:2021 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [Laravel Redirects Documentation](https://laravel.com/docs/redirects)
- [Laravel Signed URLs Documentation](https://laravel.com/docs/urls#signed-urls)
- [PHP parse_url Documentation](https://www.php.net/manual/en/function.parse-url.php)

## Related Analyzers

- [CSRF Protection Analyzer](/analyzers/security/csrf-protection) - Protects forms from cross-site request forgery
- [XSS Vulnerabilities Analyzer](/analyzers/security/xss-vulnerabilities) - Detects cross-site scripting vulnerabilities
- [Authentication Authorization Analyzer](/analyzers/security/authentication-authorization) - Validates authentication patterns
- [Clickjacking Analyzer](/analyzers/security/clickjacking) - Prevents UI redress attacks

---
