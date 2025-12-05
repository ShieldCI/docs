---
title: Password Hashing Strength
description: Validates that your Laravel application uses secure password hashing algorithms with appropriate security parameters
icon: lock
outline: [2, 3]
---

# Password Hashing Strength

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `hashing-strength` | 🛡️ Security  | Critical   | 15 minutes   |

## What This Checks

Validates that your Laravel application uses secure password hashing algorithms with appropriate security parameters. Checks for weak hashing drivers (MD5, SHA1, SHA256), insufficient bcrypt rounds, weak Argon2 parameters, and code-level vulnerabilities like md5() or sha1() usage for passwords.

## Why It Matters

- **Critical Security Risk**: Weak password hashing allows attackers to crack passwords in seconds instead of years
- **Real-World Breaches**: LinkedIn (2012) - 90% of 6.5M passwords cracked in hours using weak SHA1
- **Data Exposure**: When databases are breached, weak hashing provides no protection against password cracking
- **Compliance Violations**: OWASP, PCI DSS, and NIST standards require strong password hashing

Weak password hashing is one of the most critical security vulnerabilities. Modern GPUs can crack billions of MD5/SHA1 hashes per second, making weak algorithms essentially equivalent to storing passwords in plain text. Strong algorithms like bcrypt (12+ rounds) or Argon2id make password cracking computationally infeasible, protecting users even after database breaches.

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: Weak Bcrypt Rounds**

```php
// config/hashing.php - Update rounds
'bcrypt' => [
    'rounds' => 12,  // Increase from default 10 to minimum 12
]
```

**Scenario 2: Using MD5/SHA1 in Code**

```php
// BEFORE - Insecure
$user->password = md5($request->password);

// AFTER - Secure
use Illuminate\Support\Facades\Hash;
$user->password = Hash::make($request->password);
```

**Scenario 3: Weak Argon2 Parameters**

```php
// config/hashing.php - Strengthen parameters
'argon' => [
    'memory' => 65536,  // Increase from 1024 to 64 MB
    'time' => 2,        // Increase from 1
    'threads' => 2,     // Increase from 1
]
```

### Proper Fix (15 minutes)

Implement comprehensive password hashing security across your application:

**1. Configure Strong Hashing**

```php
// config/hashing.php
return [
    // Argon2id is recommended for new projects
    'driver' => 'argon2id',  // Or 'bcrypt' for compatibility

    'bcrypt' => [
        'rounds' => env('BCRYPT_ROUNDS', 12),  // 2024 minimum
    ],

    'argon' => [
        'memory' => 65536,  // 64 MB - resists GPU attacks
        'time' => 2,        // Iterations
        'threads' => 2,     // Parallel processing
    ],
];

// .env
BCRYPT_ROUNDS=12  # Production
```

**2. Replace All Weak Hashing Functions**

```php
// Find all instances of weak hashing
// grep -r "md5(" app/
// grep -r "sha1(" app/

// Replace with Hash facade
use Illuminate\Support\Facades\Hash;

// Registration/Password Updates
public function register(Request $request)
{
    User::create([
        'email' => $request->email,
        'password' => Hash::make($request->password),  // ✅ Secure
    ]);
}

// Password verification
if (Hash::check($request->password, $user->password)) {
    // Authenticated
}
```

**3. Migrate Existing Users Gradually**

```php
// Migration strategy - rehash passwords on login
public function login(Request $request)
{
    $user = User::where('email', $request->email)->first();

    // Check if using old md5 format
    if (md5($request->password) === $user->password) {
        // Rehash with bcrypt and save
        $user->password = Hash::make($request->password);
        $user->save();
    }

    // Normal authentication
    if (Hash::check($request->password, $user->password)) {
        // Rehash if rounds increased
        if (Hash::needsRehash($user->password)) {
            $user->password = Hash::make($request->password);
            $user->save();
        }

        Auth::login($user);
    }
}
```

**4. Use Environment-Specific Settings**

```php
// .env.testing - Fast hashing for tests
BCRYPT_ROUNDS=4

// .env.staging - Match production
BCRYPT_ROUNDS=12

// .env.production - Secure settings
BCRYPT_ROUNDS=12
```

**5. Verify Configuration**

```bash
# Test hashing works correctly
php artisan tinker
>>> Hash::make('test-password')
>>> Hash::check('test-password', Hash::make('test-password'))
# Should return true

# Measure hashing time (target: 200-500ms)
>>> $start = microtime(true);
>>> Hash::make('test');
>>> echo (microtime(true) - $start) * 1000 . ' ms';
```

**6. Configure Legitimate MD5 Usage**

```php
// config/shieldci.php - Allow non-password MD5 usage
'hashing_strength' => [
    'allowed_weak_hash_patterns' => [
        'cache',        // md5($data . '_cache')
        'fingerprint',  // md5($file . '_fingerprint')
        'checksum',     // md5($data . '_checksum')
        'etag',         // md5($content . '_etag')
    ],
    'ignored_paths' => [
        'app/Utilities/CacheKeyGenerator.php',
    ],
],
```

## Common Mistakes to Avoid

1. **Using MD5, SHA1, or SHA256 for passwords:**
   ```php
   // ❌ BAD - Broken algorithms
   $password = md5($request->password);
   $password = sha1($request->password);
   $password = hash('sha256', $request->password);

   // ✅ GOOD - Password-specific algorithms
   $password = Hash::make($request->password);
   ```

2. **Weak bcrypt rounds (10 or less):**
   ```php
   // ❌ BAD - Vulnerable to GPU attacks
   'bcrypt' => ['rounds' => 10]  // Laravel default

   // ✅ GOOD - Secure minimum
   'bcrypt' => ['rounds' => 12]  // 2024 standard
   ```

3. **Insufficient Argon2 memory:**
   ```php
   // ❌ BAD - Vulnerable to GPU/ASIC attacks
   'argon' => ['memory' => 1024]  // Only 1 MB

   // ✅ GOOD - Resists hardware attacks
   'argon' => ['memory' => 65536]  // 64 MB
   ```

4. **Storing passwords without hashing:**
   ```php
   // ❌ BAD - Plain text storage
   $user->password = $request->password;

   // ✅ GOOD - Always hash before storage
   $user->password = Hash::make($request->password);
   ```

5. **Using the same salt for all users:**
   ```php
   // ❌ BAD - Custom salting (don't do this!)
   define('PASSWORD_SALT', 'my-secret-salt');
   $hash = md5($password . PASSWORD_SALT);

   // ✅ GOOD - bcrypt/Argon2 handle salts automatically
   $hash = Hash::make($password);  // Unique salt per password
   ```

6. **Implementing custom password hashing:**
   ```php
   // ❌ BAD - Custom algorithms always fail
   function myCustomHash($password) {
       return md5($password . SALT);
   }

   // ✅ GOOD - Use Laravel's tested implementation
   Hash::make($password);
   ```

## References

- [Laravel Hashing Documentation](https://laravel.com/docs/hashing)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [PHP password_hash() Manual](https://www.php.net/manual/en/function.password-hash.php)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
- [Argon2 Specification](https://github.com/P-H-C/phc-winner-argon2)
- [Password Hashing Competition](https://password-hashing.net/)

## Related Analyzers

- [Authentication](/analyzers/security/authentication) - Validates authentication implementation
- [Debug Mode](/analyzers/security/debug-mode) - Ensures debug mode disabled in production
- [Env File Security](/analyzers/security/env-file-security) - Protects sensitive configuration
- [Session Security](/analyzers/security/session-security) - Validates session configuration
