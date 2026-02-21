---
title: Cryptographic Weakness Analyzer
description: Detects use of weak or deprecated cryptographic algorithms including MD5, SHA1, DES, RC4, ECB mode, and insecure random number generators
icon: lock
outline: [2, 3]
tags: cryptography,encryption,hashing,weak-algorithms,security
pro: true
---

# Cryptographic Weakness Analyzer

| Analyzer ID              | Category     | Severity   | Time To Fix  |
| ------------------------ | :----------: |:----------:| ------------:|
| `cryptographic-weakness` | 🛡️ Security  | High       | 30 minutes   |

## What This Checks

This analyzer detects weak cryptographic algorithms, insecure encryption ciphers, dangerous block cipher modes, and non-cryptographic random number generators in your Laravel application.

**Detected Vulnerable Patterns:**

#### Weak Hash Functions (3)
- `md5()` - MD5 is cryptographically broken (collision attacks demonstrated)
- `sha1()` - SHA1 is deprecated and vulnerable to collision attacks
- `crc32()` - CRC32 is a checksum, not cryptographically secure

#### Weak Encryption Ciphers (5)
- `DES` / `3DES` - Data Encryption Standard is obsolete and easily cracked
- `RC2` - Vulnerable to related-key attacks
- `RC4` - Multiple known vulnerabilities, prohibited in TLS
- `BLOWFISH` - Block size too small for modern security requirements

#### Insecure Block Cipher Modes (1)
- `ECB` (Electronic Codebook) - Identical plaintext blocks produce identical ciphertext (pattern leakage)

#### Weak Random Number Generators (4)
- `rand()` - Predictable pseudo-random number generator
- `mt_rand()` - Mersenne Twister is not cryptographically secure
- `srand()` - Seeding non-cryptographic PRNG
- `mt_srand()` - Seeding Mersenne Twister PRNG

::: tip What's NOT Flagged
The analyzer correctly recognizes these as **safe**:
- `password_hash()` / `password_verify()` with bcrypt or Argon2
- `hash_hmac()` with SHA-256 or stronger algorithms
- `openssl_encrypt()` with AES-256-GCM or ChaCha20-Poly1305
- `random_bytes()` / `random_int()` for cryptographically secure random numbers
- Laravel's `Hash::make()` and `Crypt::encrypt()` facades
:::

## Why It Matters

Using weak cryptographic algorithms puts your application and users at risk:

- **Password Compromise** - MD5/SHA1 hashes can be reversed with rainbow tables in seconds
- **Data Decryption** - Weak ciphers like DES/RC4 can be broken with modern computing power
- **Token Prediction** - Non-cryptographic random generators produce predictable tokens
- **Pattern Leakage** - ECB mode reveals patterns in encrypted data (e.g., the famous "ECB penguin")
- **Compliance Violations** - PCI-DSS, HIPAA, and GDPR require strong cryptography
- **Integrity Attacks** - MD5/SHA1 collision attacks allow forging digital signatures

A single weak algorithm can undermine the entire security of your application's data protection.

## How to Fix

### Quick Fix (10 minutes)

Replace weak hash functions with secure alternatives:

**Before (❌):**
```php
public function hashPassword(string $password): string
{
    // VULNERABLE: MD5 is cryptographically broken
    return md5($password);
}

public function generateToken(): string
{
    // VULNERABLE: mt_rand is predictable
    return md5(mt_rand());
}
```

**After (✅):**
```php
public function hashPassword(string $password): string
{
    // SAFE: bcrypt with automatic salting
    return password_hash($password, PASSWORD_BCRYPT);
}

public function generateToken(): string
{
    // SAFE: Cryptographically secure random bytes
    return bin2hex(random_bytes(32));
}
```

### Proper Fix (30 minutes)

**Replace weak encryption ciphers:**

**Before (❌):**
```php
public function encryptData(string $data, string $key): string
{
    // VULNERABLE: DES is obsolete, ECB mode leaks patterns
    return openssl_encrypt($data, 'DES-ECB', $key);
}
```

**After (✅):**
```php
public function encryptData(string $data, string $key): string
{
    // SAFE: AES-256-GCM provides authenticated encryption
    $iv = random_bytes(openssl_cipher_iv_length('aes-256-gcm'));
    $tag = '';

    $encrypted = openssl_encrypt(
        $data,
        'aes-256-gcm',
        $key,
        OPENSSL_RAW_DATA,
        $iv,
        $tag
    );

    // Store IV and tag alongside ciphertext
    return base64_encode($iv . $tag . $encrypted);
}
```

**Best Practice: Use Laravel's Encryption (✅✅):**

```php
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;

class UserService
{
    // For passwords: use Laravel's Hash facade
    public function updatePassword(User $user, string $password): void
    {
        $user->update([
            'password' => Hash::make($password), // bcrypt by default
        ]);
    }

    // For data encryption: use Laravel's Crypt facade
    public function storeSecret(string $secret): string
    {
        return Crypt::encryptString($secret); // AES-256-CBC with HMAC
    }

    // For tokens: use Laravel's Str helper
    public function generateApiToken(): string
    {
        return Str::random(64); // Uses random_bytes() internally
    }

    // For HMAC: use hash_hmac with SHA-256+
    public function signPayload(string $payload, string $key): string
    {
        return hash_hmac('sha256', $payload, $key);
    }
}
```

**Replace weak random number generators:**

**Before (❌):**
```php
// VULNERABLE: Predictable verification codes
$code = mt_rand(100000, 999999);

// VULNERABLE: Predictable CSRF token
$token = sha1(rand());
```

**After (✅):**
```php
// SAFE: Cryptographically secure verification code
$code = random_int(100000, 999999);

// SAFE: Cryptographically secure token
$token = bin2hex(random_bytes(32));
```


## References

- [OWASP Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [CWE-327: Use of a Broken or Risky Cryptographic Algorithm](https://cwe.mitre.org/data/definitions/327.html)
- [CWE-328: Use of Weak Hash](https://cwe.mitre.org/data/definitions/328.html)
- [CWE-330: Use of Insufficiently Random Values](https://cwe.mitre.org/data/definitions/330.html)
- [PHP password_hash Documentation](https://www.php.net/manual/en/function.password-hash.php)
- [PHP random_bytes Documentation](https://www.php.net/manual/en/function.random-bytes.php)
- [PHP openssl_encrypt Documentation](https://www.php.net/manual/en/function.openssl-encrypt.php)
- [Laravel Encryption Documentation](https://laravel.com/docs/encryption)

## Related Analyzers

- [Password Security Analyzer](/analyzers/security/password-security) - Validates password hashing configuration
- [App Key Analyzer](/analyzers/security/app-key-security) - Checks application encryption key
- [Cookie Analyzer](/analyzers/security/cookie) - Checks cookie encryption settings
- [CSRF Protection Analyzer](/analyzers/security/csrf-protection) - Validates CSRF token security

---
