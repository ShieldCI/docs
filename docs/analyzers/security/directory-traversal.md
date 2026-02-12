---
title: Directory Traversal Analyzer
description: Detects path traversal vulnerabilities where user input can access files outside intended directories via file operations, includes, and Laravel Storage
icon: folder
outline: [2, 3]
tags: directory-traversal,path-traversal,file-access,security,lfi
pro: true
---

# Directory Traversal Analyzer

| Analyzer ID          | Category     | Severity   | Time To Fix  |
| -------------------- | :----------: |:----------:| ------------:|
| `directory-traversal`| 🛡️ Security  | High       | 25 minutes   |

## What This Checks

This analyzer detects path traversal vulnerabilities where user input is used to construct file paths without proper validation, allowing attackers to access files outside the intended directory using sequences like `../`.

**Detected Vulnerable Patterns:**

#### File Operations (11)
- `fopen()` - Opening files with user-controlled paths
- `file_get_contents()` - Reading files with user input
- `file_put_contents()` - Writing files to user-controlled locations
- `readfile()` - Outputting files with traversal risk
- `file()` - Reading files into arrays
- `unlink()` - Deleting files with user-controlled paths
- `rmdir()` - Removing directories with user input
- `rename()` - Renaming/moving files to user-controlled destinations
- `copy()` - Copying files with user-controlled paths
- `move_uploaded_file()` - Moving uploads to user-controlled paths

#### Include/Require (4)
- `include` - Local/Remote File Inclusion with user input
- `include_once` - File inclusion with dynamic paths
- `require` - File inclusion with concatenated paths
- `require_once` - File inclusion with interpolated strings

#### Directory Operations (4)
- `scandir()` - Listing directory contents with user input
- `opendir()` - Opening directories with user-controlled paths
- `readdir()` - Reading directory entries
- `glob()` - Pattern matching with user-controlled paths

#### Laravel Storage Facade (6)
- `Storage::get()` - Reading files with user input
- `Storage::put()` - Writing files with user-controlled paths
- `Storage::delete()` - Deleting files with user input
- `Storage::exists()` - Checking file existence with user paths
- `Storage::download()` - Downloading files with user input
- `Storage::path()` - Resolving paths with user input

#### File Upload Handling (2)
- `$file->store()` - Storing uploads with user-controlled directory
- `$file->storeAs()` - Storing with user-controlled filename without `basename()` protection

::: tip What's NOT Flagged
The analyzer correctly recognizes these as **safe**:
- Paths wrapped in `realpath()` -- validates against actual filesystem
- Paths wrapped in `basename()` -- strips directory components
- Paths wrapped in `pathinfo()` -- extracts specific path parts
- Static string literals with no user input or concatenation
- Storage operations with hardcoded paths
:::

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
