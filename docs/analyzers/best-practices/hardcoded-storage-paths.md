---
title: Hardcoded Storage Paths Analyzer
description: Detects hardcoded storage, public, and Laravel directory paths instead of using Laravel's path helper functions for cross-environment portability
icon: folder-open
outline: [2, 3]
tags: laravel,portability,configuration,paths,deployment,best-practices,helpers,filesystem
---

# Hardcoded Storage Paths Analyzer

| Analyzer ID                 | Category           | Severity | Time To Fix |
| ----------------------------| :----------------: |:--------:| -----------:|
| `hardcoded-storage-paths`   | ⚡ Best Practices  | Medium   | 10 minutes  |

## What This Checks

Detects hardcoded file system paths in your code instead of using Laravel's path helper functions. Checks:

- **Unix absolute paths**: `/var/www/storage/`, `/var/www/public/`, `/storage/app/`, etc.
- **Windows absolute paths**: `C:\storage\app\`, `D:\public\images\`, etc.
- **Relative paths**: `../storage/`, `./public/`, etc.
- **All Laravel directories**: storage, public, app, resources, database, config
- **Heredoc/Nowdoc strings**: Path strings in heredoc/nowdoc syntax
- **Array literals and constants**: Paths in arrays and class constants

**Smart Detection**:
- ✅ Automatically skips URLs (`http://`, `https://`) to avoid false positives
- ✅ Uses anchored patterns to avoid matching helper function arguments
- ✅ Supports configuration for legitimate exceptions via `allowed_paths`
- ✅ Extensible with custom patterns via `additional_patterns`

## Why It Matters

- **Deployment Portability:** Hardcoded paths break when deploying to different environments (local → staging → production)
- **Windows/Linux Incompatibility:** Absolute paths work on one OS but fail on another
- **Docker/Container Issues:** Container paths differ from local development paths
- **Team Collaboration:** Different team members may have different local path structures
- **Cloud Storage:** Can't switch to S3, CloudFlare R2, or other cloud storage drivers
- **Testing Challenges:** Tests fail when run in different environments (CI/CD, other developers' machines)

**Real-world impact:**
- Production deployment failures due to hardcoded paths
- Windows developers unable to run code written with Unix paths
- Docker container failures when mounting volumes at different paths
- Cloud migration blockers preventing adoption of S3, DigitalOcean Spaces, etc.
- CI/CD pipeline failures due to different filesystem layouts

**Statistics:**
- 40% of deployment issues in Laravel apps involve path-related problems
- Hardcoded paths are among the top 5 reasons for "works on my machine" bugs
- Average time to debug path issues in production: 2-4 hours

## How to Fix

### Quick Fix (5 minutes)

Replace hardcoded paths with Laravel's path helper functions:

**Scenario 1: Storage Paths**

```php
// ❌ BAD - Hardcoded storage path
$path = '/var/www/storage/app/uploads/file.jpg';
file_put_contents($path, $data);

// ✅ GOOD - Use storage_path() helper
$path = storage_path('app/uploads/file.jpg');
file_put_contents($path, $data);
```

**Scenario 2: Public Paths**

```php
// ❌ BAD - Hardcoded public path
$imagePath = '/var/www/public/images/logo.png';

// ✅ GOOD - Use public_path() helper
$imagePath = public_path('images/logo.png');
```

**Scenario 3: Windows Paths**

```php
// ❌ BAD - Windows-specific path
$dataFile = 'C:\storage\app\data.json';

// ✅ GOOD - Cross-platform helper
$dataFile = storage_path('app/data.json');
```

**Scenario 4: Relative Paths**

```php
// ❌ BAD - Relative path (fragile)
$config = '../storage/config/app.json';

// ✅ GOOD - Absolute with helper
$config = storage_path('config/app.json');
```

### Proper Fix (10 minutes)

Implement comprehensive path helper usage across your application:

**1. Storage Directory Paths**

```php
// ❌ BAD - Various hardcoded storage paths
$logPath = '/var/www/storage/logs/app.log';
$uploadDir = '/storage/app/uploads/';
$frameworkPath = '../storage/framework/cache/';

// ✅ GOOD - Use storage_path() for all storage paths
$logPath = storage_path('logs/app.log');
$uploadDir = storage_path('app/uploads/');
$frameworkPath = storage_path('framework/cache/');
```

**2. Public Directory Paths**

```php
// ❌ BAD - Hardcoded public paths
$assetPath = '/var/www/public/assets/css/app.css';
$uploadPath = '/public/uploads/avatars/';

// ✅ GOOD - Use public_path() for public directory
$assetPath = public_path('assets/css/app.css');
$uploadPath = public_path('uploads/avatars/');
```

**3. App Directory Paths**

```php
// ❌ BAD - Hardcoded app paths
$modelPath = '/var/www/app/Models/User.php';

// ✅ GOOD - Use app_path() for app directory
$modelPath = app_path('Models/User.php');
```

**4. Resources Directory Paths**

```php
// ❌ BAD - Hardcoded resource paths
$viewPath = '/var/www/resources/views/welcome.blade.php';
$langPath = '/resources/lang/en/messages.php';

// ✅ GOOD - Use resource_path() for resources
$viewPath = resource_path('views/welcome.blade.php');
$langPath = resource_path('lang/en/messages.php');
```

**5. Database Directory Paths**

```php
// ❌ BAD - Hardcoded database paths
$migrationPath = '/var/www/database/migrations/2023_create_users_table.php';
$seedPath = '/database/seeders/UserSeeder.php';

// ✅ GOOD - Use database_path() for database directory
$migrationPath = database_path('migrations/2023_create_users_table.php');
$seedPath = database_path('seeders/UserSeeder.php');
```

**6. Config Directory Paths**

```php
// ❌ BAD - Hardcoded config paths
$appConfig = '/var/www/config/app.php';

// ✅ GOOD - Use config_path() for config directory
$appConfig = config_path('app.php');
```

**7. Base Directory Path**

```php
// ❌ BAD - Hardcoded project root
$envFile = '/var/www/.env';
$composerJson = '/var/www/composer.json';

// ✅ GOOD - Use base_path() for project root
$envFile = base_path('.env');
$composerJson = base_path('composer.json');
```

**8. Configuration for Legitimate Exceptions**

Sometimes you have legitimate reasons for hardcoded paths (e.g., OAuth keys). To configure exceptions, publish the config:
```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'best_practices' => [
        'enabled' => true,
        
        'hardcoded-storage-paths' => [
            // Whitelist legitimate hardcoded paths
            'allowed_paths' => [
                '/storage/oauth-public.key',    // OAuth public key
                '/storage/oauth-private.key',   // OAuth private key
                '/var/run/php-fpm.sock',        // System socket
            ],

            // Add custom path patterns for your app
            'additional_patterns' => [
                '/\/custom\/uploads\//i' => 'custom_upload_path(...)',
                '/\/shared\/cache\//i' => 'shared_cache_path(...)',
            ],
        ],
    ],
],
```

**9. Path Joining Best Practices**

```php
// ❌ BAD - Manual path joining
$path = '/var/www/storage/app/' . $folder . '/' . $file;

// ✅ GOOD - Join paths properly
$path = storage_path('app/' . $folder . '/' . $file);

// ✅ BETTER - Use path helpers
use Illuminate\Support\Facades\Storage;

$path = Storage::path($folder . '/' . $file);
```

**10. Multi-Environment Paths**

```php
// ❌ BAD - Environment-specific hardcoded paths
if (app()->environment('production')) {
    $path = '/var/www/production/storage/logs/';
} else {
    $path = '/home/dev/storage/logs/';
}

// ✅ GOOD - Works across all environments
$path = storage_path('logs/');
```

## References

- [Laravel Helpers - Paths](https://laravel.com/docs/helpers#paths) - Official Laravel path helpers documentation
- [Laravel File Storage](https://laravel.com/docs/filesystem) - Laravel filesystem and storage documentation
- [The Twelve-Factor App - Config](https://12factor.net/config) - Configuration best practices
- [Laravel Deployment](https://laravel.com/docs/deployment) - Deployment best practices

## Related Analyzers

- [Config Outside Config Analyzer](/analyzers/best-practices/config-outside-config) - Detects configuration outside config files
- [Environment Check Smell Analyzer](/analyzers/best-practices/environment-check-smell) - Detects environment checks in code
- [File Permissions Analyzer](/analyzers/security/file-permissions) - Validates file and directory permissions
- [Environment File Security Analyzer](/analyzers/security/environment-file-security) - Validates .env security
