---
title: Global Variable Analyzer
description: Detects use of PHP superglobals and global functions that should use Laravel alternatives
icon: globe
outline: [2, 3]
tags: global-variable,state,reliability,code-quality
pro: true
---

# Global Variable Analyzer

| Analyzer ID        | Category       | Severity | Time To Fix |
| -------------------| :------------: |:--------:| -----------:|
| `global-variables` | ✅ Reliability |  Medium  | 15 minutes  |

## What This Checks

- Detects usage of PHP superglobals: `$_GET`, `$_POST`, `$_REQUEST`, `$_COOKIE`, `$_SESSION`, `$_SERVER`, `$_FILES`, `$GLOBALS`, `$_ENV`
- Detects `filter_input()` and `filter_input_array()` calls that bypass Laravel's request validation
- Detects discouraged session functions: `session_start()`, `session_destroy()`, `session_id()`, `session_regenerate_id()`, `session_name()`, `session_status()`, `session_unset()`, `session_write_close()`, `session_abort()`, `session_reset()`
- Detects discouraged header functions: `header()`, `header_remove()`, `headers_list()`, `headers_sent()`, `http_response_code()`, `setcookie()`, `setrawcookie()`
- Detects discouraged environment functions: `getenv()`, `putenv()`
- Suggests the correct Laravel alternative for each detected pattern
- Context-aware exclusions: automatically skips middleware, kernel files, console commands, and bootstrap files

## Why It Matters

- **Testability**: Superglobals are difficult to mock in unit tests, making code that uses them harder to verify
- **Security**: Direct superglobal access bypasses Laravel's request validation, sanitization, and CSRF protection
- **Portability**: Code tightly coupled to superglobals cannot be reused in Artisan commands, queued jobs, or other non-HTTP contexts
- **Consistency**: Mixing native PHP functions with Laravel abstractions leads to unpredictable behavior (e.g., `session_start()` conflicts with Laravel's session middleware)
- **Caching**: Using `getenv()` or `putenv()` outside of config files breaks `php artisan config:cache`, causing hard-to-diagnose production issues

## How to Fix

### Quick Fix (5 minutes)

Replace superglobals with their Laravel equivalents:

```php
// ❌ BAD - Direct superglobal access
$name = $_GET['name'];
$email = $_POST['email'];
$token = $_COOKIE['token'];
$host = $_SERVER['HTTP_HOST'];
$avatar = $_FILES['avatar'];
$value = $GLOBALS['setting'];
$dbHost = $_ENV['DB_HOST'];

// ✅ GOOD - Laravel request helpers
$name = request()->query('name');
$email = request()->post('email');
$token = request()->cookie('token');
$host = request()->server('HTTP_HOST');
$avatar = request()->file('avatar');
$value = app('setting');           // or dependency injection
$dbHost = config('database.connections.mysql.host');
```

Replace `filter_input()` with Laravel validation:

```php
// ❌ BAD - filter_input
$email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);

// ✅ GOOD - Laravel validation
$validated = request()->validate([
    'email' => 'required|email',
]);
$email = $validated['email'];
```

Replace native session functions:

```php
// ❌ BAD - Native session functions
session_start();
$_SESSION['user'] = $userId;
session_destroy();

// ✅ GOOD - Laravel session helpers
session(['user' => $userId]);
session()->flush();
session()->invalidate();
```

### Proper Fix (15 minutes)

#### 1: Use Form Request Classes for Input Validation

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'avatar' => 'nullable|image|max:2048',
        ];
    }
}
```

```php
// Controller uses type-hinted Form Request
public function store(StoreUserRequest $request): RedirectResponse
{
    $validated = $request->validated();

    // All input is validated and safe
    $user = User::create($validated);

    if ($request->hasFile('avatar')) {
        $user->updateAvatar($request->file('avatar'));
    }

    return redirect()->route('users.show', $user);
}
```

#### 2: Replace Header Functions with Response Methods

```php
// ❌ BAD - Native header functions
header('Content-Type: application/json');
header('X-Custom-Header: value');
setcookie('preference', 'dark', time() + 86400);
http_response_code(404);

// ✅ GOOD - Laravel response
return response()->json($data)
    ->header('X-Custom-Header', 'value')
    ->cookie('preference', 'dark', 1440);
```

#### 3: Replace Environment Functions with Config

```php
// ❌ BAD - getenv / putenv
$apiKey = getenv('API_KEY');
putenv('TEMP_VAR=value');

// ✅ GOOD - Use config() everywhere except config files
// In config/services.php:
'api_key' => env('API_KEY'),

// In application code:
$apiKey = config('services.api_key');
```

#### 4: Configure Custom Exclusion Paths

If certain files legitimately need superglobal access, exclude them:

```php
// config/shieldci.php
return [
    'global_variables' => [
        'exclude_paths' => [
            'app/Legacy/*',
            'app/ThirdParty/*.php',
        ],
    ],
];
```

## ShieldCI Configuration

Exclude specific paths from global variable scanning:

```php
// config/shieldci.php
'global_variables' => [
    'exclude_paths' => [
        'bootstrap/helpers.php',
        'app/Legacy/*.php',
    ],
],
```

## References

- [Laravel HTTP Requests](https://laravel.com/docs/requests)
- [Laravel Form Request Validation](https://laravel.com/docs/validation#form-request-validation)
- [Laravel Session](https://laravel.com/docs/session)
- [Laravel HTTP Responses](https://laravel.com/docs/responses)
- [Laravel Configuration](https://laravel.com/docs/configuration)

## Related Analyzers

- [Cache Prefix Configuration Analyzer](/analyzers/reliability/cache-prefix-configuration) - Ensures shared cache backends use unique prefixes
- [Composer Validation Analyzer](/analyzers/reliability/composer-validation) - Ensures composer.json is valid and follows best practices
- [Env Variables Complete Analyzer](/analyzers/reliability/env-variables-complete) - Verifies all required environment variables are set
