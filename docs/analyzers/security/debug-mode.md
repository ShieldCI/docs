---
title: Debug Mode Analyzer
description: Detects debug mode configurations and debugging functions that expose sensitive information in production environments
icon: alert-triangle
outline: [2, 3]
---

# Debug Mode Analyzer

| Analyzer ID  | Category     | Severity   | Time To Fix  |
| -------------| :----------: |:----------:| ------------:|
| `debug-mode` | 🛡️ Security  | High       | 5 minutes   |

## What This Checks

Detects debug mode configurations and debugging functions that expose sensitive information in production environments. Scans for `APP_DEBUG=true`, hardcoded debug settings, debug functions (`dd()`, `dump()`, `ray()`), error display configurations, and debug packages in production dependencies that can leak application internals, credentials, and stack traces to attackers.

## Why It Matters

- **Security Risk:** HIGH - Debug mode exposes stack traces, file paths, and environment variables
- **Credential Exposure:** Environment variables visible on error pages include database passwords and API keys
- **Path Disclosure:** Reveals exact file paths, framework versions, and directory structure to attackers
- **SQL Injection Aid:** Error messages expose table structures and query patterns
- **Attack Surface:** Debug packages in production increase vulnerability opportunities

Debug mode enabled in production is one of the most dangerous misconfigurations in web applications. A single error page can expose:
- Complete stack traces showing your application architecture
- Database query structures revealing table and column names
- Environment variables containing passwords and API keys
- Framework versions helping attackers find known vulnerabilities
- File system paths assisting in directory traversal attacks

## How to Fix

### Quick Fix (1 minute)

**Scenario 1: APP_DEBUG=true in Production**

```bash
# Edit .env.production file
APP_DEBUG=false
APP_ENV=production
LOG_LEVEL=error

# Clear configuration cache
php artisan config:clear
php artisan config:cache
```

**Scenario 2: Debug Functions in Code**

```bash
# Search for debug functions
grep -r "dd(" app/
grep -r "dump(" app/
grep -r "ray(" app/

# Replace with proper logging
# Before: dd($user);
# After: Log::debug('User data', ['user' => $user->toArray()]);
```

**Scenario 3: Debug Packages in Production**

```bash
# Move debug packages to require-dev
composer require --dev barryvdh/laravel-debugbar
composer require --dev laravel/telescope
composer require --dev spatie/laravel-ray

# Deploy without dev packages
composer install --no-dev --optimize-autoloader
```

### Proper Fix (5 minutes)

Implement comprehensive debug mode security across all environments:

**1. Configure Environment-Based Debug Settings**

```php
// config/app.php
return [
    'debug' => env('APP_DEBUG', false), // Default to false
    'env' => env('APP_ENV', 'production'),

    // Hide sensitive variables from debug output
    'debug_hide' => [
        '_TOKEN',
        '_SESSION',
        'APP_KEY',
        'DB_PASSWORD',
        'DB_USERNAME',
        'REDIS_PASSWORD',
        'MAIL_PASSWORD',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'PUSHER_APP_KEY',
        'PUSHER_APP_SECRET',
        'STRIPE_SECRET',
    ],
];
```

**2. Set Correct Environment Variables**

```ini
# .env.local (development)
APP_DEBUG=true
APP_ENV=local
LOG_LEVEL=debug

# .env.production (production)
APP_DEBUG=false
APP_ENV=production
LOG_LEVEL=error
```

**3. Replace Debug Functions with Logging**

```php
// ❌ BAD - Debug functions in code
dd($request->all());
dump($user);
ray($query);

// ✅ GOOD - Structured logging
Log::debug('Request data', ['data' => $request->validated()]);
Log::info('User retrieved', ['user_id' => $user->id]);
Log::channel('api')->debug('Query executed', ['sql' => $query->toSql()]);

// ✅ GOOD - Conditional debugging
if (app()->environment('local')) {
    dump($data);
}
```

**4. Custom Error Pages for Production**

```php
// app/Exceptions/Handler.php
public function render($request, Throwable $exception)
{
    if ($request->expectsJson()) {
        return $this->renderApiError($exception);
    }

    return parent::render($request, $exception);
}

protected function renderApiError(Throwable $exception): JsonResponse
{
    $status = 500;
    $message = 'Internal server error';

    // Only expose details in development
    if (config('app.debug')) {
        return response()->json([
            'error' => $exception->getMessage(),
            'trace' => $exception->getTrace(),
        ], $status);
    }

    // Production: Generic error
    return response()->json([
        'error' => $message,
        'status' => $status,
    ], $status);
}
```

```blade
{{-- resources/views/errors/500.blade.php --}}
@extends('layouts.app')

@section('content')
<div class="error-page">
    <h1>Oops! Something went wrong.</h1>
    <p>We're working on fixing this issue. Please try again later.</p>
</div>
@endsection
```

**5. Add Pre-Commit Hooks**

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Check for debug functions
if git diff --cached | grep -E '(dd\(|dump\(|var_dump\(|ray\()'; then
    echo "Error: Debug function found in staged files"
    echo "Remove dd(), dump(), var_dump(), or ray() before committing"
    exit 1
fi

# Check for APP_DEBUG=true in production files
if git diff --cached .env.production | grep -E 'APP_DEBUG\s*=\s*true'; then
    echo "Error: APP_DEBUG=true found in .env.production"
    exit 1
fi
```

**6. Production Deployment Checklist**

```bash
# Before deploying to production:

# 1. Verify APP_DEBUG is false
php artisan tinker
>>> config('app.debug')
// Should output: false

# 2. Test error pages
APP_DEBUG=false php artisan serve
# Trigger an error and verify no stack traces shown

# 3. Verify debug packages excluded
composer install --no-dev
composer show | grep -i debug
# Should return nothing

# 4. Check configuration is cached
php artisan config:cache
>>> app()->configurationIsCached()
// Should be true
```

## References

- [Laravel Error Handling Documentation](https://laravel.com/docs/errors)
- [Laravel Logging Documentation](https://laravel.com/docs/logging)
- [OWASP Information Disclosure](https://owasp.org/www-community/vulnerabilities/Information_exposure_through_an_error_message)
- [Laravel Configuration Documentation](https://laravel.com/docs/configuration)

## Related Analyzers

- [Environment File Analyzer](/analyzers/security/env-file) - Protects .env files from exposure
- [Application Key Analyzer](/analyzers/security/app-key) - Validates encryption key configuration
- [Debug Log Level Analyzer](/analyzers/performance/debug-log-level) - Checks logging performance impact
- [Custom Error Pages Analyzer](/analyzers/reliability/custom-error-pages) - Validates exception handling patterns
