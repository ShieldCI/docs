---
title: Directory Traversal Analyzer
description: Detects path traversal vulnerabilities where user input can access files outside intended directories via file operations, includes, and Laravel Storage
icon: folder-open
outline: [2, 3]
tags: directory-traversal,path-traversal,file-access,security,lfi,file-inclusion
pro: true
---

# Directory Traversal Analyzer

| Analyzer ID          | Category     | Severity   | Time To Fix  |
| -------------------- | :----------: |:----------:| ------------:|
| `directory-traversal`| 🛡️ Security  | High       | 25 minutes   |

## What This Checks

This analyzer detects path traversal vulnerabilities where user input constructs file paths without proper validation, allowing attackers to escape intended directories using sequences like `../`.

**Detected Vulnerable Patterns:**

#### PHP File & Directory Operations (High / Critical)
- `file_get_contents($request->input('path'))` - reads an arbitrary file from the filesystem
- `fopen($_GET['file'], 'r')` - opens a user-controlled file path
- `unlink($request->input('name'))` - deletes a user-specified file
- Also covers: `file_put_contents()`, `readfile()`, `rename()`, `copy()`, `move_uploaded_file()`, `scandir()`, `opendir()`, `glob()`

#### Include / Require with User Input (Critical)
- `include $request->input('module')` - remote or local file inclusion
- `require "{$base}/{$userModule}"` - dynamic include without path validation

#### Laravel Storage & File Facades (High)
- `Storage::get($request->input('path'))` - reads an arbitrary storage path
- `Storage::disk($request->input('disk'))` - switches storage disk, bypassing root directory restrictions
- `File::delete($_GET['path'])` - deletes a user-specified file via File facade
- Also covers all `Storage::` methods (`put`, `delete`, `exists`, `download`, `path`, `url`, `temporaryUrl`) and `File::` methods (`get`, `copy`, `move`, `put`, `append`, `link`) with user input

#### File Uploads (High)
- `$file->store($request->input('dir'))` - stores upload in user-controlled directory
- `$file->storeAs('uploads', $request->input('name'))` - user-controlled filename without `basename()` protection

#### Response, Archives & Symlinks (Critical / High)
- `response()->download($request->input('path'))` - serves an arbitrary file for download
- `response()->file($request->input('path'))` - serves an arbitrary file inline
- `symlink($_GET['target'], ...)` - creates a symlink to an attacker-controlled path
- `->open($_GET['archive'])` / `->extractTo($_GET['dest'])` - zip-slip archive extraction
- `str_replace('../', '', $input)` - naive traversal strip, bypassed with `....//`, `%2e%2e%2f`, or mixed separators

## Why It Matters

Directory traversal (also known as path traversal or dot-dot-slash attacks) allows attackers to escape intended directories and access sensitive files:

- **Credential Theft** - Read `.env`, `config/database.php`, SSH keys, and API credentials
- **Source Code Disclosure** - Access application source code to find further vulnerabilities
- **System File Access** - Read `/etc/passwd`, `/etc/shadow`, or Windows system files
- **Remote File Inclusion (RFI)** - Include malicious files from external servers via `include`/`require`
- **Local File Inclusion (LFI)** - Execute arbitrary PHP code by including uploaded files or log files
- **Data Manipulation** - Write or delete critical application files
- **Privilege Escalation** - Overwrite configuration files to gain admin access

A single traversal vulnerability can compromise the entire server, especially when combined with file inclusion.

## How to Fix

### Quick Fix (5 minutes)

Use `basename()` and `realpath()` to validate paths:

**Before (❌):**
```php
public function downloadFile(Request $request)
{
    $filename = $request->input('file');

    // VULNERABLE: User can send "../../.env" to access sensitive files
    return response()->download(storage_path("exports/{$filename}"));
}
```

**After (✅):**
```php
public function downloadFile(Request $request)
{
    $filename = basename($request->input('file'));

    // SAFE: basename() strips directory traversal sequences
    $path = storage_path("exports/{$filename}");

    if (!file_exists($path)) {
        abort(404);
    }

    return response()->download($path);
}
```

### Proper Fix (25 minutes)

**Validate with realpath() and base directory check:**

**Before (❌):**
```php
public function readDocument(Request $request)
{
    $path = $request->input('path');

    // VULNERABLE: Direct user input in file operations
    $content = file_get_contents(storage_path("documents/{$path}"));

    return response($content);
}
```

**After (✅):**
```php
public function readDocument(Request $request)
{
    $validated = $request->validate([
        'path' => 'required|string|max:255',
    ]);

    $baseDir = realpath(storage_path('documents'));
    $fullPath = realpath(storage_path("documents/{$validated['path']}"));

    // SAFE: Verify resolved path is within allowed directory
    if ($fullPath === false || !str_starts_with($fullPath, $baseDir)) {
        abort(403, 'Access denied');
    }

    $content = file_get_contents($fullPath);

    return response($content);
}
```

**Secure Laravel Storage usage:**

**Before (❌):**
```php
public function getFile(Request $request)
{
    $path = $request->input('path');

    // VULNERABLE: User can traverse with "../" in path
    return Storage::get($path);
}
```

**After (✅):**
```php
public function getFile(Request $request)
{
    $validated = $request->validate([
        'path' => ['required', 'string', 'max:255'],
    ]);

    $path = $validated['path'];

    // SAFE: Strip traversal sequences and validate
    if (str_contains($path, '..') || str_contains($path, "\0")) {
        abort(403, 'Invalid path');
    }

    if (!Storage::exists($path)) {
        abort(404);
    }

    return Storage::get($path);
}
```

**Secure file uploads with basename() protection:**

**Before (❌):**
```php
public function uploadFile(Request $request)
{
    $request->validate(['file' => 'required|file']);
    $name = $request->input('filename');

    // VULNERABLE: User-controlled filename allows path traversal
    $request->file('file')->storeAs('uploads', $name);
}
```

**After (✅):**
```php
public function uploadFile(Request $request)
{
    $request->validate([
        'file' => 'required|file|max:10240',
        'filename' => 'required|string|max:255',
    ]);

    // SAFE: basename() strips directory components
    $safeName = basename($request->input('filename'));

    // Even safer: generate a unique name
    $safeName = Str::uuid() . '.' . $request->file('file')->getClientOriginalExtension();

    $request->file('file')->storeAs('uploads', $safeName);
}
```

**Best Practice: Whitelist Approach (✅✅):**

```php
public function downloadReport(Request $request)
{
    $validated = $request->validate([
        'report_id' => 'required|integer|exists:reports,id',
    ]);

    // SAFE: Look up path from database, never from user input
    $report = Report::findOrFail($validated['report_id']);

    $this->authorize('download', $report);

    return Storage::download($report->file_path);
}
```


## References

- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [CWE-22: Improper Limitation of a Pathname to a Restricted Directory](https://cwe.mitre.org/data/definitions/22.html)
- [CWE-98: Improper Control of Filename for Include/Require Statement](https://cwe.mitre.org/data/definitions/98.html)
- [PHP realpath Documentation](https://www.php.net/manual/en/function.realpath.php)
- [PHP basename Documentation](https://www.php.net/manual/en/function.basename.php)
- [Laravel File Storage Documentation](https://laravel.com/docs/filesystem)

## Related Analyzers

- [Arbitrary File Upload Analyzer](/analyzers/security/arbitrary-file-upload) - Detects unsafe file upload handling
- [Command Injection Analyzer](/analyzers/security/command-injection) - Detects command injection vulnerabilities
- [File Permissions Analyzer](/analyzers/security/file-permissions) - Validates file permission settings
- [SQL Injection Analyzer](/analyzers/security/sql-injection) - Detects SQL injection vulnerabilities

---
