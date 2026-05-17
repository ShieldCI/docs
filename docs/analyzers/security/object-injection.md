---
title: Object Injection Analyzer
description: Detects PHP object injection vulnerabilities through unsafe deserialization with unserialize() and exploitable magic methods
icon: box
outline: [2, 3]
tags: object-injection,unserialize,deserialization,security
pro: true
---

# Object Injection Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| ------------------ | :----------: |:----------:| ------------:|
| `object-injection` | 🛡️ Security  | Critical   | 25 minutes   |

## What This Checks

Detects PHP object injection vulnerabilities through unsafe deserialization patterns and exploitable magic methods used in Property-Oriented Programming (POP) gadget chains:

- `unserialize()` with user input — Critical without `allowed_classes` restriction; Medium when `allowed_classes => false` is present; High when input source is unknown
- `call_user_func('unserialize', ...)` / `call_user_func_array('unserialize', ...)` — High; indirect deserialization via dynamic dispatch
- Magic methods (`__wakeup`, `__unserialize`, `__destruct`, `__toString`, `__call`, `__callStatic`, `__get`, `__set`, `__isset`, `__unset`, `__invoke`) containing dangerous file, exec, eval, or database operations — High when sinks consume `$this->` properties, Medium otherwise
- Filesystem functions (`file_get_contents`, `fopen`, `getimagesize`, `md5_file`, etc.) with user-controlled paths — High; vulnerable to `phar://` stream wrapper deserialization

## Why It Matters

PHP object injection is a critical vulnerability that allows attackers to manipulate application objects and exploit magic methods for arbitrary code execution:

- **Remote Code Execution** - By chaining magic methods (POP chains), attackers can execute arbitrary PHP code on the server
- **File System Manipulation** - Reading, writing, or deleting arbitrary files through exploited `__destruct()` or `__wakeup()` methods
- **SQL Injection** - Triggering database queries through magic methods that interact with the database
- **Authentication Bypass** - Manipulating session or user objects to escalate privileges
- **Denial of Service** - Crafting objects that consume excessive resources during deserialization

Object injection attacks are particularly dangerous because the vulnerability exists at deserialization time -- before any application logic can validate the data.

## How to Fix

### Quick Fix (5 minutes)

Replace `unserialize()` with JSON:

**Before (❌):**
```php
public function loadPreferences(Request $request)
{
    $data = $request->input('preferences');

    // VULNERABLE: User input passed to unserialize()
    $preferences = unserialize($data);

    return view('settings', ['preferences' => $preferences]);
}
```

**After (✅):**
```php
public function loadPreferences(Request $request)
{
    $data = $request->input('preferences');

    // SAFE: JSON does not instantiate objects
    $preferences = json_decode($data, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        abort(400, 'Invalid preferences format');
    }

    return view('settings', ['preferences' => $preferences]);
}
```

### Proper Fix (25 minutes)

**If you must use `unserialize()`, restrict allowed classes:**

**Before (❌):**
```php
public function restoreSession(string $sessionData)
{
    // VULNERABLE: Any class can be instantiated
    $session = unserialize($sessionData);

    return $session;
}
```

**After (✅):**
```php
public function restoreSession(string $sessionData)
{
    // SAFE: Only allow specific classes to be unserialized
    $session = unserialize($sessionData, [
        'allowed_classes' => [
            \App\ValueObjects\SessionData::class,
            \App\ValueObjects\UserPreference::class,
        ],
    ]);

    if ($session === false) {
        throw new \RuntimeException('Failed to deserialize session data');
    }

    return $session;
}
```

**Prevent phar:// deserialization attacks:**

**Before (❌):**
```php
public function downloadFile(Request $request)
{
    $path = $request->input('path');

    // VULNERABLE: User can provide phar:// path to trigger deserialization
    $contents = file_get_contents($path);

    return response($contents);
}
```

**After (✅):**
```php
public function downloadFile(Request $request)
{
    $validated = $request->validate([
        'path' => 'required|string|max:255',
    ]);

    // SAFE: Validate and sanitize the file path
    $path = realpath(storage_path('app/downloads/' . basename($validated['path'])));

    if (!$path || !str_starts_with($path, storage_path('app/downloads'))) {
        abort(403, 'Invalid file path');
    }

    return response()->download($path);
}
```

**Audit magic methods for dangerous operations:**

**Before (❌):**
```php
class CacheItem
{
    private string $filePath;

    // DANGEROUS: __destruct with file operations - POP gadget
    public function __destruct()
    {
        // If an attacker controls $filePath, they can delete arbitrary files
        if (file_exists($this->filePath)) {
            unlink($this->filePath);
        }
    }
}
```

**After (✅):**
```php
class CacheItem
{
    private string $filePath;
    private string $basePath;

    public function __construct(string $filePath)
    {
        $this->basePath = storage_path('cache');
        $this->filePath = $this->validatePath($filePath);
    }

    public function __destruct()
    {
        // SAFE: Path validated and restricted to cache directory
        if (file_exists($this->filePath)) {
            unlink($this->filePath);
        }
    }

    private function validatePath(string $path): string
    {
        $resolved = realpath($this->basePath . '/' . basename($path));

        if (!$resolved || !str_starts_with($resolved, $this->basePath)) {
            throw new \InvalidArgumentException('Invalid cache file path');
        }

        return $resolved;
    }

    // Prevent unserialization entirely
    public function __wakeup(): void
    {
        throw new \RuntimeException('Unserialization is not allowed');
    }
}
```


## References

- [OWASP Deserialization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html)
- [CWE-502: Deserialization of Untrusted Data](https://cwe.mitre.org/data/definitions/502.html)
- [CWE-915: Improperly Controlled Modification of Dynamically-Determined Object Attributes](https://cwe.mitre.org/data/definitions/915.html)
- [PHP unserialize() Documentation](https://www.php.net/manual/en/function.unserialize.php)
- [PHP Magic Methods Documentation](https://www.php.net/manual/en/language.oop5.magic.php)
- [OWASP Top 10 - Insecure Deserialization](https://owasp.org/www-project-top-ten/)
- [Phar Deserialization Attack](https://blog.ripstech.com/2018/new-php-exploitation-technique/)

## Related Analyzers

- [Eval Usage Analyzer](/analyzers/security/eval) - Detects dynamic code execution functions
- [RCE Analyzer](/analyzers/security/rce) - Detects remote code execution via variable functions
- [Command Injection Analyzer](/analyzers/security/command-injection) - Detects shell command injection
- [Arbitrary File Upload Analyzer](/analyzers/security/arbitrary-file-upload) - Detects unsafe file upload handling

---
