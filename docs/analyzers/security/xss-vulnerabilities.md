---
title: XSS Vulnerabilities Analyzer
description: Detects Cross-Site Scripting (XSS) vulnerabilities in PHP controllers, Blade views, and HTTP responses by checking for unescaped output, dangerous HTML attribute contexts, and missing Content-Security-Policy headers
icon: shield-alert
outline: [2, 3]
tags: xss,cross-site-scripting,security,blade,csp,headers
---

# XSS Vulnerabilities Analyzer

| Analyzer ID           | Category     | Severity | Time To Fix  |
| ----------------------| :----------: |:--------:| ------------:|
| `xss-vulnerabilities` | 🛡️ Security  | Critical | 30 minutes   |


## What This Checks

- Scans PHP controllers and Blade views for patterns such as <code v-pre>{!! !!}</code> output, direct `echo $_GET`/`request()` calls, unescaped `Response::make()`, and unsafe values inside `<script>` tags. Ternary expressions where both branches are literals (e.g. <code v-pre>{{ $check ? 'true' : 'false' }}</code>) are recognised as safe even when the condition references user input.
- **Detects dangerous HTML attribute contexts** including:
  - `javascript:` protocol in `href`, `src`, `action`, `formaction` attributes (flagged for any usage)
  - `data:` protocol combined with user input in URL attributes
  - Event handler attributes (`onclick`, `onerror`, `onload`, `onmouseover`, etc.) with dynamic values
  - Unvalidated/unescaped URLs in `href` and `src` attributes
  - Unescaped output in `data-*` attributes that may be consumed by JavaScript
- Verifies HTTP responses (non-CI environments, non-localhost) to ensure `Content-Security-Policy` headers exist and forbid `unsafe-inline`/`unsafe-eval`; falls back to meta tags when necessary.
- Uses router/guest-route discovery to probe a publicly accessible page and confirm CSP enforcement.

## Why It Matters

- **Cross-Site Scripting (XSS)** remains in OWASP Top 10; a single missing escape allows attackers to hijack sessions, steal CSRF tokens, or pivot into RCE.
- **Defense in depth**: Even if code is sanitized, CSP headers offer a safety net against inline script injection. Conversely, a strong CSP cannot protect an unescaped Blade template.
- **Regulatory pressure**: PCI DSS, SOC2, and bug bounty programs require evidence you audit XSS risks.

## How to Fix

### Quick Fix (5 minutes)

1. Replace unescaped Blade output <code v-pre>{!! $var !!}</code> with escaped <code v-pre>{{ $var }}</code> or explicitly sanitize via `e($var)` / Purifier.
2. Wrap `$_GET`, `request()` or other user input in `htmlspecialchars()` / `e()` before echoing or returning from `Response::make()`.
3. Add a baseline CSP header (preferably via middleware):

```php
return response($html)->header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'nonce-...'");
```

### Proper Fix (30 minutes)

1. **Audit templates**: Identify components, slots, and Livewire views that use <code v-pre>{!! !!}</code> or raw echoes—replace with escaped output or whitelist sanitized HTML only where required.
2. **Centralize escaping**: Use form requests or DTOs to normalize/sanitize inputs before they hit the view layer.
3. **Enforce CSP**: Add a middleware (e.g., `SetSecurityHeaders`) that sets `Content-Security-Policy` without `unsafe-inline`/`unsafe-eval`; use nonces or hashes for required inline scripts.
4. **Add tests**: Write feature tests ensuring responses include the CSP header and that critical templates escape user-controlled content.
5. **Automate**: Run this analyzer (or similar static analysis) in CI to block regressions.

## References

- [Laravel Blade & XSS](https://laravel.com/docs/blade#displaying-data)
- [OWASP XSS Prevention Cheat Sheet](https://owasp.org/www-community/xss-prevention)
- [Content Security Policy (MDN)](https://developer.mozilla.org/docs/Web/HTTP/CSP)

## Related Analyzers

- [Cookie Analyzer](/analyzers/security/cookie) - Validates secure cookie configuration
- [HSTS Header Analyzer](/analyzers/security/hsts-header) - Validates HSTS header configuration
- [Up-to-Date Dependencies Analyzer](/analyzers/security/up-to-date-dependencies) - Checks for dependency updates
