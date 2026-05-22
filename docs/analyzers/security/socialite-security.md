---
title: Socialite Security Analyzer
description: Validates Laravel Socialite OAuth configuration, credential security, and callback handling
icon: lock
outline: [2, 3]
tags: security,socialite,oauth,authentication,social-login
pro: true
---

# Socialite Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `socialite-security` | 🛡️ Security  | High    | 10 minutes   |

## What This Checks

Validates Laravel Socialite OAuth configuration. Checks for:

- Provider credentials use `env()` instead of hardcoded values
- Redirect URLs use HTTPS for production security
- Stateless mode usage is flagged for CSRF risk awareness
- Callback handlers include proper error handling for denied authorizations

## Why It Matters

- **Credential Exposure:** Hardcoded client secrets in config files end up in version control
- **Token Interception:** HTTP redirect URLs allow OAuth tokens to be intercepted during the callback
- **CSRF Attacks:** Stateless mode disables the OAuth state parameter that prevents CSRF
- **Poor UX:** Missing error handling causes crashes when users deny authorization

## How to Fix

### Quick Fix (5 minutes)

Use environment variables for credentials:

```php
// config/services.php
'github' => [
    'client_id' => env('GITHUB_CLIENT_ID'),
    'client_secret' => env('GITHUB_CLIENT_SECRET'),
    'redirect' => env('GITHUB_REDIRECT_URL'),
],
```

### Proper Fix (10 minutes)

**1. Use HTTPS redirect URLs:**

```ini
# .env
GITHUB_REDIRECT_URL=https://app.example.com/auth/github/callback
GOOGLE_REDIRECT_URL=https://app.example.com/auth/google/callback
```

**2. Avoid stateless mode for web apps:**

```php
// Only use stateless() for stateless APIs, not web apps
// Web apps should use the default stateful flow:
return Socialite::driver('github')->redirect();
```

**3. Handle denied authorization:**

```php
// app/Http/Controllers/SocialiteController.php
public function callback(string $provider)
{
    try {
        $socialUser = Socialite::driver($provider)->user();
    } catch (\Laravel\Socialite\Two\InvalidStateException $e) {
        return redirect()->route('login')
            ->with('error', 'Authentication expired. Please try again.');
    } catch (\Exception $e) {
        return redirect()->route('login')
            ->with('error', 'Authentication was cancelled or failed.');
    }

    $user = User::updateOrCreate(
        ['provider_id' => $socialUser->getId(), 'provider' => $provider],
        ['name' => $socialUser->getName(), 'email' => $socialUser->getEmail()]
    );

    Auth::login($user);

    return redirect()->intended('/dashboard');
}
```

## References

- [Laravel Socialite Documentation](https://laravel.com/docs/socialite)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OWASP OAuth Security](https://cheatsheetseries.owasp.org/cheatsheets/OAuth_Cheat_Sheet.html)

## Related Analyzers

- [Hardcoded Credentials](/analyzers/security/hardcoded-credentials) - Detects hardcoded secrets
- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
- [CSRF Protection](/analyzers/security/csrf-protection) - Validates CSRF configuration
