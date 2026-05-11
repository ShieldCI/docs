---
title: Fortify Security Analyzer
description: Validates Laravel Fortify authentication configuration, two-factor auth, password rules, and security settings
icon: lock
outline: [2, 3]
tags: security,fortify,authentication,two-factor,password
pro: true
---

# Fortify Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `fortify-security` | 🛡️ Security  | High    | 10 minutes   |

## What This Checks

Validates Laravel Fortify authentication configuration. Checks for:

- Two-factor authentication is enabled in Fortify features
- Two-factor authentication has `confirm` and/or `confirmPassword` options set
- Password validation rules are configured (`Features::updatePasswords` or `Password::defaults`)
- Email verification is enabled and User model implements `MustVerifyEmail`
- Password reset routes have rate limiting applied
- Custom `authenticateUsing()` includes rate limiting or lockout checks
- Custom `authenticateThrough()` pipeline includes `EnsureLoginIsNotThrottled`, `AttemptToAuthenticate`, and `PrepareAuthenticatedSession`
- Registration feature has `Fortify::createUsersUsing()` or `CreateNewUser` action configured

## Why It Matters

- **Account Takeover:** Without 2FA, compromised passwords mean compromised accounts
- **Unverified 2FA Setup:** Without `confirm`, 2FA activates immediately — users may lock themselves out if their authenticator is misconfigured
- **Weak Passwords:** Without password validation, users can set trivially guessable passwords
- **Fake Accounts:** Without email verification, bots can register with invalid emails
- **Brute Force:** Unprotected password reset routes allow email flooding attacks
- **Session Fixation:** Custom `authenticateThrough()` pipelines missing `PrepareAuthenticatedSession` do not regenerate the session ID after login, enabling session fixation attacks

## How to Fix

### Quick Fix (5 minutes)

Enable two-factor authentication with both confirmation options:

```php
// config/fortify.php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
    Features::updateProfileInformation(),
    Features::updatePasswords(),
    Features::twoFactorAuthentication([
        'confirm' => true,           // Requires TOTP code confirmation before 2FA activates
        'confirmPassword' => true,   // Requires password re-entry before enabling/disabling 2FA
    ]),
],
```

### Proper Fix (10 minutes)

**1. Configure password defaults:**

```php
// app/Providers/FortifyServiceProvider.php
use Illuminate\Validation\Rules\Password;

public function boot(): void
{
    Password::defaults(function () {
        return Password::min(8)
            ->letters()
            ->mixedCase()
            ->numbers()
            ->uncompromised();
    });
}
```

**2. Implement MustVerifyEmail:**

```php
use Illuminate\Contracts\Auth\MustVerifyEmail;

class User extends Authenticatable implements MustVerifyEmail
{
    // ...
}
```

**3. Add rate limiting to password reset:**

```php
// app/Providers/FortifyServiceProvider.php
RateLimiter::for('password-reset', function (Request $request) {
    return Limit::perMinute(5)->by($request->ip());
});
```

**4. Secure custom `authenticateUsing` pipelines:**

```php
Fortify::authenticateUsing(function (Request $request) {
    // Ensure this includes rate limiting
    RateLimiter::hit('login:' . $request->ip());

    $user = User::where('email', $request->email)->first();

    if ($user && Hash::check($request->password, $user->password)) {
        RateLimiter::clear('login:' . $request->ip());
        return $user;
    }
});
```

**5. Secure custom `authenticateThrough` pipelines:**

Always include all three critical classes to prevent brute force and session fixation:

```php
Fortify::authenticateThrough(function (Request $request) {
    return array_filter([
        EnsureLoginIsNotThrottled::class,   // Brute force protection
        AttemptToAuthenticate::class,        // Credential validation
        PrepareAuthenticatedSession::class,  // Session ID regeneration (prevents session fixation)
    ]);
});
```

**6. Configure registration action:**

```php
// app/Providers/FortifyServiceProvider.php
Fortify::createUsersUsing(CreateNewUser::class);
```

Or create `app/Actions/Fortify/CreateNewUser.php` with validation logic.

## References

- [Laravel Fortify Documentation](https://laravel.com/docs/fortify)
- [Laravel Password Validation](https://laravel.com/docs/validation#validating-passwords)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Related Analyzers

- [Password Security](/analyzers/security/password-security) - Validates password hashing configuration
- [Login Throttling](/analyzers/security/login-throttling) - Detects missing rate limiting on auth
- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
