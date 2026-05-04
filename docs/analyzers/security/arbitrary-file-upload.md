---
title: Arbitrary File Upload Analyzer
description: Detects arbitrary file upload vulnerabilities that could lead to remote code execution in Laravel applications
icon: file-warning
outline: [2, 3]
tags: file-upload,rce,remote-code-execution,security,validation
pro: true
---

# Arbitrary File Upload Analyzer

| Analyzer ID              | Category     | Severity | Time To Fix  |
| -------------------------| :----------: |:--------:| ------------:|
| `arbitrary-file-upload`  | 🛡️ Security  | Critical | 20 minutes   |

## What This Checks

Detects arbitrary file upload vulnerabilities that could lead to remote code execution (RCE). Validates that file uploads have proper MIME type validation, file extension whitelisting, size limits, and are not stored in publicly executable locations. Also checks for dangerous file types (`.php`, `.phar`, `.exe`, `.sh`, `.shtml`, etc.), missing filename sanitization, ZIP/XML bomb susceptibility, and direct `$_FILES` access without validation.

Recognizes all Laravel validation approaches across versions 9–12, including `mimes:`, `mimetypes:`, `image`, and the `extensions:` rule (Laravel 11+).

## Why It Matters

- **Remote Code Execution**: Uploading executable files (`.php`, `.phtml`, `.exe`, `.sh`) allows attackers to run arbitrary code on your server
- **Complete Server Compromise**: A successful file upload attack can give attackers full control of your application and server
- **Data Breach**: Attackers can access databases, environment files, and sensitive user data
- **Malware Distribution**: Your server becomes a hosting platform for malware, phishing sites, or spam
- **Legal Liability**: Compromised servers used for illegal activities can result in legal consequences

Without proper file upload validation, an attacker can upload a PHP backdoor, execute it by visiting the uploaded file's URL, and gain complete control over your application. This is one of the most critical security vulnerabilities.

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: Missing MIME Type Validation**

```php
// BEFORE - Vulnerable
public function upload(Request $request)
{
    $file = $request->file('avatar');
    $file->store('public/avatars');  // ❌ No validation
}

// AFTER - Protected
public function upload(Request $request)
{
    $request->validate([
        'avatar' => 'required|mimes:jpg,png,gif|max:2048'  // ✅ MIME + size validation
    ]);

    $file = $request->file('avatar');
    $file->store('public/avatars');
}
```

**Scenario 2: Direct $_FILES Access**

```php
// BEFORE - Critical Vulnerability
public function upload()
{
    $uploadedFile = $_FILES['avatar'];  // ❌ Direct access, no validation
    move_uploaded_file($uploadedFile['tmp_name'], 'public/uploads/' . $uploadedFile['name']);
}

// AFTER - Protected
public function upload(Request $request)
{
    $request->validate([
        'avatar' => 'required|image|mimes:jpg,png|max:2048'
    ]);

    $file = $request->file('avatar');  // ✅ Use Laravel's Request object
    $file->store('private/avatars');   // ✅ Store in private directory
}
```

**Scenario 3: Missing Extension and MIME Validation**

```php
// BEFORE - Vulnerable
$request->validate([
    'document' => 'required|max:5120'  // ❌ Only size limit, any file type allowed
]);

// AFTER - Option A: mimes: (validates MIME type, all Laravel versions)
// Lists extensions as aliases — Laravel resolves them to MIME types via finfo
$request->validate([
    'document' => 'required|mimes:pdf,doc,docx|max:5120'  // ✅ MIME type + size
]);

// AFTER - Option B: mimetypes: (validates full MIME type string directly)
$request->validate([
    'document' => 'required|mimetypes:application/pdf,application/msword|max:5120'  // ✅ Explicit MIME
]);

// AFTER - Option C: extensions: (validates guessed extension from MIME type, Laravel 11+)
$request->validate([
    'document' => 'required|extensions:pdf,doc,docx|max:5120'  // ✅ Server-side extension detection
]);
```

**Scenario 4: Image Upload (using `image` rule)**

```php
// The `image` rule restricts to jpeg, png, bmp, gif, svg, and webp
// It provides both MIME type and extension validation in one rule.

$request->validate([
    'avatar' => 'required|image|max:2048'  // ✅ MIME + extension + size validation
]);
```

### Proper Fix (20 minutes)

Implement comprehensive file upload security:

**1. Comprehensive Validation Rules**

```php
// app/Http/Requests/AvatarUploadRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AvatarUploadRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'avatar' => [
                'required',
                'file',                    // ✅ Must be a file
                'mimes:jpg,jpeg,png,gif',  // ✅ Whitelist MIME types
                'max:2048',                // ✅ Max 2MB
                'dimensions:max_width=2000,max_height=2000',  // ✅ Image dimensions
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'avatar.mimes' => 'Avatar must be a JPG, PNG, or GIF image.',
            'avatar.max' => 'Avatar must not exceed 2MB.',
            'avatar.dimensions' => 'Avatar dimensions must not exceed 2000x2000 pixels.',
        ];
    }
}
```

**2. Field-Level Validation (Best Practice)**

```php
// Controller method using field-specific validation
public function uploadMultiple(Request $request)
{
    $request->validate([
        // Avatar with strict image validation
        'avatar' => [
            'required',
            'image',
            'mimes:jpg,jpeg,png',
            'max:2048',
        ],

        // Resume with document validation
        'resume' => [
            'required',
            'mimes:pdf,doc,docx',
            'max:5120',  // 5MB
        ],

        // Portfolio files (multiple)
        'portfolio.*' => [
            'required',
            'image',
            'mimes:jpg,jpeg,png,gif',
            'max:10240',  // 10MB per file
        ],
    ]);

    // Process uploads with field-specific handling
    if ($request->hasFile('avatar')) {
        $avatar = $request->file('avatar');
        $avatarPath = $avatar->store('private/avatars');
    }

    if ($request->hasFile('resume')) {
        $resume = $request->file('resume');
        $resumePath = $resume->store('private/resumes');
    }

    if ($request->hasFile('portfolio')) {
        foreach ($request->file('portfolio') as $file) {
            $file->store('private/portfolio');
        }
    }
}
```

**3. Support for allFiles() Pattern**

```php
// When using $request->allFiles() for multi-file uploads
public function uploadGallery(Request $request)
{
    // Validate all files in the request
    $files = $request->allFiles();

    foreach ($files as $fieldName => $fileOrArray) {
        $rules = [];

        // Field-specific validation
        if ($fieldName === 'avatar') {
            $rules = ['image', 'mimes:jpg,png', 'max:2048'];
        } elseif ($fieldName === 'gallery') {
            $rules = ['image', 'mimes:jpg,png,gif', 'max:5120'];
        }

        // Validate each field
        if (is_array($fileOrArray)) {
            // Multiple files for this field
            foreach ($fileOrArray as $index => $file) {
                $request->validate([
                    "{$fieldName}.{$index}" => $rules,
                ]);
            }
        } else {
            // Single file
            $request->validate([
                $fieldName => $rules,
            ]);
        }
    }

    // Process validated files
    if (isset($files['avatar'])) {
        $files['avatar']->store('private/avatars');
    }

    if (isset($files['gallery']) && is_array($files['gallery'])) {
        foreach ($files['gallery'] as $file) {
            $file->store('private/gallery');
        }
    }
}
```

**4. Secure File Storage**

```php
// Store in private directories (not publicly accessible)
public function upload(Request $request)
{
    $request->validate([
        'avatar' => 'required|image|mimes:jpg,png|max:2048',
    ]);

    // ✅ CORRECT - Store in private storage
    $path = $request->file('avatar')->store('private/avatars');

    // Save to database
    auth()->user()->update([
        'avatar_path' => $path,
    ]);

    // ❌ AVOID - Direct public storage
    // $path = $request->file('avatar')->store('public/avatars');
}

// Serve files through controller with access control
public function downloadAvatar($userId)
{
    $user = User::findOrFail($userId);

    // Check permissions
    if (auth()->id() !== $user->id && !auth()->user()->isAdmin()) {
        abort(403);
    }

    // Serve file from private storage
    return response()->file(storage_path('app/' . $user->avatar_path));
}
```

**5. Additional Security Measures**

```php
// app/Http/Controllers/UploadController.php
namespace App\Http\Controllers;

use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Intervention\Image\Facades\Image;

class UploadController extends Controller
{
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $file = $request->file('avatar');

        // ✅ Generate random filename (prevents filename guessing)
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();

        // ✅ Sanitize and validate file content (not just extension)
        $image = Image::make($file);

        // ✅ Re-encode to strip malicious metadata — chain encode() into save()
        // encode() returns a new instance; calling save() on the original would
        // bypass the re-encode step.
        $image->encode('jpg', 90)->save(storage_path('app/private/avatars/' . $filename));

        // Save reference in database
        auth()->user()->update([
            'avatar_path' => 'private/avatars/' . $filename,
        ]);

        return response()->json(['path' => $filename]);
    }
}
```

**6. Validation for Different File Types**

```php
// app/Http/Controllers/DocumentController.php
public function uploadDocument(Request $request)
{
    $fileType = $request->input('type');

    // Type-specific validation rules
    $rules = match($fileType) {
        'avatar' => [
            'file' => 'required|image|mimes:jpg,jpeg,png|max:2048',
        ],
        'resume' => [
            'file' => 'required|mimes:pdf,doc,docx|max:5120',
        ],
        'spreadsheet' => [
            'file' => 'required|mimes:xlsx,xls,csv|max:10240',
        ],
        'presentation' => [
            'file' => 'required|mimes:ppt,pptx,pdf|max:20480',
        ],
        default => [
            'file' => 'required|mimes:pdf|max:5120',
        ],
    };

    $request->validate($rules);

    // Type-specific storage paths
    $storagePath = match($fileType) {
        'avatar' => 'private/avatars',
        'resume' => 'private/resumes',
        'spreadsheet' => 'private/spreadsheets',
        'presentation' => 'private/presentations',
        default => 'private/documents',
    };

    $path = $request->file('file')->store($storagePath);

    return response()->json(['path' => $path]);
}
```

**7. Server-Side MIME Type Verification**

```php
// Don't trust client-provided MIME types
use Illuminate\Support\Facades\Storage;

public function verifyAndStore(Request $request)
{
    $request->validate([
        'file' => 'required|file|max:5120',
    ]);

    $file = $request->file('file');

    // ✅ Server-side MIME type detection via finfo (Laravel delegates to this internally)
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file->getRealPath());
    finfo_close($finfo);

    // Whitelist of allowed MIME types
    $allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
    ];

    if (!in_array($mimeType, $allowedMimes)) {
        return back()->withErrors([
            'file' => 'Invalid file type. Only images and PDFs are allowed.',
        ]);
    }

    // ✅ Use extension() — guesses the extension from MIME type detection (server-side, not spoofable).
    // Avoid getClientOriginalExtension() here: it returns the extension from the client-supplied
    // filename, which an attacker can set to anything (e.g., name shell.php as shell.jpg).
    $extension = strtolower($file->extension());
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf'];

    if (!in_array($extension, $allowedExtensions)) {
        return back()->withErrors([
            'file' => 'Invalid file extension.',
        ]);
    }

    // Store file
    $path = $file->store('private/uploads');

    return response()->json(['path' => $path]);
}
```

**Laravel Version Notes**

| Rule | Laravel Version | Behavior |
|------|:--------------:|----------|
| `mimes:jpg,png` | 9+ | Validates actual file MIME type; the listed extensions map to allowed MIME types via finfo |
| `mimetypes:image/jpeg` | 9+ | Validates actual MIME type of file content using the full MIME type string |
| `image` | 9+ | Restricts to jpeg, png, bmp, gif, svg, webp via MIME type detection |
| `extensions:pdf,docx` | 11+ | Validates the extension guessed from MIME type detection (server-side) |

> **Tip:** Both `mimes:` and `mimetypes:` use finfo to read actual file content — neither trusts the client-supplied filename. The difference: `mimes:` accepts extension aliases (e.g., `jpg`), while `mimetypes:` requires the full MIME type string (e.g., `image/jpeg`). For maximum security, combine both or use `extensions:` (Laravel 11+) which validates the guessed extension from MIME type detection.

## References

- [Laravel File Uploads Documentation](https://laravel.com/docs/filesystem#file-uploads)
- [Laravel Validation Documentation](https://laravel.com/docs/validation#rule-file)
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP Unrestricted File Upload](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [CVE Details: File Upload Vulnerabilities](https://www.cvedetails.com/vulnerability-list/opuf-1/file-upload.html)

## Related Analyzers

- [CSRF Protection Analyzer](/analyzers/security/csrf-protection) - Protects file upload forms from CSRF attacks
- [Mass Assignment Vulnerabilities](/analyzers/security/mass-assignment-vulnerabilities) - Prevents unauthorized field manipulation
- [File Permissions Analyzer](/analyzers/security/file-permissions) - Validates file system permissions
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Ensures debug mode is disabled in production
