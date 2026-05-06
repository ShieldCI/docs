---
title: Password Security Analyzer
description: Validates password hashing configuration, password policy enforcement, plain-text storage detection, validation rules, confirmation timeout, and rehash usage in Laravel applications
icon: lock
outline: [2, 3]
tags: password,hashing,bcrypt,argon2,security,policy,validation,rehash
---

# Password Security Analyzer

| Analyzer ID         | Category     | Severity   | Time To Fix  |
| --------------------| :----------: |:----------:| ------------:|
| `password-security` | 🛡️ Security  | Critical   | 20 minutes   |

## What This Checks

Validates password hashing configuration, code-level hashing practices, password policy enforcement, and rehash usage across your Laravel application:

- **Weak hashing drivers** - MD5, SHA1, or SHA256 configured in `config/hashing.php`
- **Insufficient bcrypt/Argon2 parameters** - bcrypt rounds below 12, weak Argon2 memory/time/threads
- **Weak hashing in code** - `md5()`, `sha1()`, `hash()`, or `password_hash()` with weak algorithms on password arguments
- **Plain-text password storage** - password assignments and Eloquent/DB calls that store unhashed input
- **Missing password policy** - no `Password::defaults()` in service providers, or missing length/complexity/breach checks
- **Weak validation rules** - password fields with minimum length below 8 in Form Requests or Controllers
- **Long confirmation timeout** - `password_timeout` in `config/auth.php` exceeding 3 hours
- **Missing rehash on login** - no `Hash::needsRehash()` usage or `rehash_on_login` disabled in hashing config

## Why It Matters

- **Breach Impact**: Weak hashing lets attackers crack passwords in seconds. LinkedIn (2012) saw 90% of 6.5 M SHA1 hashes cracked in hours
- **Plain-Text Catastrophe**: Storing raw passwords means a single database leak exposes every credential with zero effort
- **Weak Policies**: Short or simple passwords are the first to fall in credential-stuffing and dictionary attacks
- **Compliance**: OWASP, PCI DSS, and NIST SP 800-63B all mandate strong hashing (bcrypt 12+/Argon2id) and minimum password complexity
- **Rehash Gap**: When you increase bcrypt rounds from 10 to 12, existing users keep the weaker hash unless passwords are rehashed on login

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: Weak Bcrypt Rounds**

```php
// config/hashing.php
'bcrypt' => [
    'rounds' => 12,  // Minimum recommended; default 10 is weak
],
```

**Scenario 2: Using MD5/SHA1 in Code**

```php
// BEFORE
$user->password = md5($request->password);

// AFTER
use Illuminate\Support\Facades\Hash;
$user->password = Hash::make($request->password);
```

**Scenario 3: Plain-Text Storage in Eloquent Calls**

```php
// BEFORE
User::create([
    'password' => $request->password,  // plain text!
]);

// AFTER
User::create([
    'password' => Hash::make($request->password),
]);
```

**Scenario 4: No Password Policy**

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Validation\Rules\Password;

public function boot(): void
{
    Password::defaults(function () {
        return Password::min(8)
            ->letters()
            ->mixedCase()
            ->numbers()
            ->symbols()
            ->uncompromised();
    });
}
```

**Scenario 5: Weak Validation Rules**

```php
// BEFORE
'password' => 'required|min:4'

// AFTER
'password' => ['required', Password::defaults()]
```

**Scenario 6: Enable Rehash on Login (Laravel 11+)**

```php
// config/hashing.php
'rehash_on_login' => true,
```

### Proper Fix (20 minutes)

Implement comprehensive password security across your application:

**1. Configure Strong Hashing**

```php
// config/hashing.php
return [
    'driver' => 'argon2id',  // Or 'bcrypt' for broader compatibility

    'bcrypt' => [
        'rounds' => env('BCRYPT_ROUNDS', 12),
    ],

    'argon' => [
        'memory' => 65536,  // 64 MB - resists GPU attacks
        'time' => 2,
        'threads' => 2,
    ],

    'rehash_on_login' => true,  // Laravel 11+
];
```

**2. Replace All Weak Hashing**

```php
use Illuminate\Support\Facades\Hash;

// Registration / password updates
$user->password = Hash::make($request->password);

// Verification
if (Hash::check($request->password, $user->password)) {
    // Authenticated
}
```

**3. Set Password Defaults**

```php
// app/Providers/AppServiceProvider.php
Password::defaults(function () {
    return Password::min(8)
        ->letters()
        ->mixedCase()
        ->numbers()
        ->symbols()
        ->uncompromised();
});
```

**4. Use Defaults in Validation**

```php
// In Form Requests or Controllers
'password' => ['required', 'confirmed', Password::defaults()],
```

**5. Reduce Confirmation Timeout**

```php
// config/auth.php
'password_timeout' => 10800,  // 3 hours (default); reduce if appropriate
```

**6. Rehash on Login (Pre-Laravel 11)**

```php
if (Hash::check($request->password, $user->password)) {
    if (Hash::needsRehash($user->password)) {
        $user->password = Hash::make($request->password);
        $user->save();
    }

    Auth::login($user);
}
```

**7. Configure Legitimate MD5 Usage**

If you use MD5/SHA1 for non-password purposes (cache keys, checksums, ETags):

```php
// config/shieldci.php
'analyzers' => [
    'security' => [
        'enabled' => true,
        
        'password-security' => [
            'allowed_weak_hash_patterns' => [
                'cache',
                'fingerprint',
                'checksum',
                'etag',
            ],
        ],
    ],
],
```

::: tip
MD5 and SHA1 are acceptable for non-cryptographic purposes like cache keys and checksums. The analyzer only flags them when used on password-related arguments.
:::

## ShieldCI Configuration

This analyzer is automatically **skipped in CI** environments (`$runInCI = false`) because hashing configuration is environment-specific.

Configuration is read from `analyzers.security.password-security` in `config/shieldci.php`.

```php
// config/shieldci.php
'analyzers' => [
    'security' => [
        'enabled' => true,
        
        'password-security' => [
            // Hashing thresholds
            'bcrypt_min_rounds' => 12,
            'argon2_min_memory' => 65536,
            'argon2_min_time' => 2,
            'argon2_min_threads' => 2,

            // Confirmation timeout ceiling (seconds)
            'password_confirmation_max_timeout' => 10800,  // 3 hours

            // Allow weak hashing for non-password use cases
            'allowed_weak_hash_patterns' => [
                'cache',
                'fingerprint',
                'checksum',
                'etag',
            ],

            // Ignore specific files from code scanning
            'ignored_paths' => [
                'app/Utilities/CacheKeyGenerator.php',
            ],
        ],
    ],
],
```

## References

- [Laravel Hashing Documentation](https://laravel.com/docs/hashing)
- [Laravel Password Validation](https://laravel.com/docs/validation#validating-passwords)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines (SP 800-63B)](https://pages.nist.gov/800-63-3/)
- [PHP password_hash() Manual](https://www.php.net/manual/en/function.password-hash.php)

## Related Analyzers

- [Authentication & Authorization Analyzer](/analyzers/security/authentication-authorization) - Validates authentication implementation
- [Login Throttling Analyzer](/analyzers/security/login-throttling) - Prevents brute force attacks on login endpoints
- [Cookie Analyzer](/analyzers/security/cookie) - Validates session cookie security configuration
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Ensures debug mode disabled in production
