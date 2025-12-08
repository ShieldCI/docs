---
title: Debug Mode Analyzer
description: Detects debug mode configurations and debugging functions that expose sensitive information in production environments
icon: alert-triangle
outline: [2, 3]
tags: debug,information-disclosure,security,configuration
---

# Debug Mode Analyzer

| Analyzer ID  | Category     | Severity   | Time To Fix  |
| -------------| :----------: |:----------:| ------------:|
| `debug-mode` | 🛡️ Security  | Critical   | 5 minutes   |

## What This Checks

Detects debug mode configurations and debugging functions that expose sensitive information. Checks:

- **`.env` file**: `APP_DEBUG=true` or variants (`1`, `yes`, `"true"`)
- **`config/app.php`**: Hardcoded `debug => true` (should use `env()`)
- **PHP code**: Debug functions like `dd()`, `dump()`, `var_dump()`, `ray()`
- **Error handling**: `ini_set('display_errors')`, `error_reporting(E_ALL)`
- **Dependencies**: Debug packages in `require` section (should be `require-dev`)

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

::: info Environment-Aware Analysis
This analyzer is **smart about development vs. production environments**:

- ✅ **Development/Local**: `APP_DEBUG=true` with `APP_ENV=local` or `development` will **pass** - this is the correct configuration for local development
- ⚠️ **Production/Staging**: `APP_DEBUG=true` with `APP_ENV=production` or `staging` triggers **Critical** severity - this is extremely dangerous

The analyzer reads `APP_ENV` from your `.env` file to intelligently determine if debug mode is appropriate for your environment.
:::

## How to Fix

### Quick Fix (1 minute)

**Scenario 1: APP_DEBUG=true in Production/Staging**

```bash
# For production/staging environments:
# Edit your .env file
APP_DEBUG=false
APP_ENV=production
LOG_LEVEL=error

# For development environments (already correct):
APP_DEBUG=true
APP_ENV=local
LOG_LEVEL=debug

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

];
```

**2. Set Correct Environment Variables**

```ini
# .env (development - APP_DEBUG=true is SAFE here)
APP_DEBUG=true
APP_ENV=local
LOG_LEVEL=debug

# .env (production - APP_DEBUG=true is DANGEROUS here)
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

# Check for debug functions in PHP files
if git diff --cached --name-only | grep '\.php$' | xargs grep -E '(dd\(|dump\(|var_dump\(|ray\()' 2>/dev/null; then
    echo "Error: Debug function found in staged files"
    echo "Remove dd(), dump(), var_dump(), or ray() before committing"
    exit 1
fi

# Check for debug packages in require section
if git diff --cached composer.json | grep -A 1 '"require"' | grep -E '(debugbar|telescope|ray|dump-server)'; then
    echo "Error: Debug package found in 'require' section"
    echo "Move debug packages to 'require-dev'"
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
