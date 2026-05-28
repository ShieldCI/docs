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
| `cryptographic-weakness` | 🛡️ Security  | Critical   | 30 minutes   |

## What This Checks

Detects weak cryptographic algorithms, insecure cipher usage, and unsafe implementations in PHP code. Checks for:

- Direct use of `md5()` or `sha1()` when a **security signal is present** — the result is assigned to a security-named variable (`$password`, `$token`, `$secret`…), the argument being hashed is a security-named variable (`md5($password)`), the call is passed to a security-named function, or it appears inside a security-named method such as `authenticate()` or `login()`.
- `hash()` or `hash_hmac()` called with a weak first-argument algorithm: `md5`, `md4`, `md2`, `sha1`, `crc32`, `crc32b` — flagged regardless of context because specifying a weak algorithm string is an explicit cryptographic decision. Direct `crc32()` calls are not flagged; CRC32 is a checksum, not a cryptographic hash.
- Weak ciphers in `openssl_encrypt()` / `openssl_decrypt()`: `DES`, `3DES`, `RC2`, `RC4`, `BF-*` (Blowfish)
- `ECB` mode in any cipher string - identical plaintext blocks produce identical ciphertext
- Hardcoded string literal as the IV (5th argument) in `openssl_encrypt()` - IVs must be random per encryption
- Deprecated `mcrypt_*` functions (`mcrypt_encrypt`, `mcrypt_decrypt`, `mcrypt_cbc`, `mcrypt_cfb`, `mcrypt_ecb`, `mcrypt_ofb`) removed in PHP 7.2
- Weak token generation patterns: `md5(uniqid(...))`, `sha1(uniqid(...))`, and `str_shuffle()` - none provide cryptographic randomness
- `===`, `!==`, `==`, `!=` comparison of hash or HMAC output - vulnerable to timing side-channel attacks
- Non-cryptographic random functions: `rand()`, `mt_rand()`, `srand()`, `mt_srand()`

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

**Fix timing-unsafe hash comparisons:**

**Before (❌):**
```php
// VULNERABLE: === short-circuits on first differing byte, leaking timing information
if ($provided === hash_hmac('sha256', $payload, $secret)) {
    // verified
}

// VULNERABLE: != has the same problem
if (sha1($token) != $storedHash) {
    abort(403);
}
```

**After (✅):**
```php
// SAFE: hash_equals() always compares every byte regardless of where they differ
if (hash_equals(hash_hmac('sha256', $payload, $secret), $provided)) {
    // verified
}

if (! hash_equals($storedHash, hash('sha256', $token))) {
    abort(403);
}
```

**Fix general-purpose hashing (URL parameters, fingerprints, checksums):**

Not every hash is a password or a MAC. When binding a known value into a URL parameter or generating a deterministic fingerprint, use `hash('sha256', ...)` — never `sha1()` or `md5()`.

**Before (❌):**
```php
// VULNERABLE: SHA1 is deprecated and has known collision vulnerabilities
$url = URL::temporarySignedRoute('verify', $expiry, [
    'hash' => sha1($user->email),
]);
```

**After (✅):**
```php
// SAFE: SHA-256 for deterministic URL parameter binding
$url = URL::temporarySignedRoute('verify', $expiry, [
    'hash' => hash('sha256', $user->email),
]);

// Verify it server-side with the same algorithm
if (! hash_equals(hash('sha256', $user->email), $request->hash)) {
    abort(403);
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
