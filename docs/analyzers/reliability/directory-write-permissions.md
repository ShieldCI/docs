---
title: Directory Write Permissions Analyzer
description: Ensures critical Laravel directories have proper write permissions for logs, cache, sessions, and compiled views
icon: folder-lock
outline: [2, 3]
tags: permissions,filesystem,reliability,deployment,symlinks
---

# Directory Write Permissions Analyzer

| Analyzer ID                   | Category       | Severity | Time To Fix |
| ------------------------------| :------------: |:--------:| -----------:|
| `directory-write-permissions` | ✅ Reliability | Critical | 10 minutes  |

## What This Checks

- Verifies that `storage/` directory is writable
- Verifies that `bootstrap/cache/` directory is writable
- Checks custom directories if configured (via published config file)
- Tests actual write permissions, not just existence
- Validates both relative and absolute paths from configuration
- Reports all failed directories with actionable fix commands
- Supports symlinked directories
- Verifies storage symlinks exist (from `config('filesystems.links')`) — skipped automatically for API-only apps
- Detects broken symlinks (link exists but target doesn't)
- Validates symlink targets are directories
- Default: checks `public/storage` → `storage/app/public`

## Why It Matters

- **Application crashes**: Laravel requires writable storage for logs, sessions, cache, and compiled views - without it, your app will fail
- **Silent failures**: Missing write permissions can cause intermittent errors that are hard to debug in production
- **Security logs**: Without writable storage, security events and errors won't be logged, hiding potential attacks
- **Performance degradation**: Cache and compiled views require write access - without it, your app runs significantly slower
- **Session management**: User sessions require writable storage - login/authentication will fail without it
- **File uploads**: User file uploads to `storage/` will fail silently or with cryptic errors
- **Deployment issues**: Fresh deployments often fail due to incorrect directory permissions, especially in Docker/CI environments
- **Broken file URLs**: Without the storage symlink, publicly accessible files in `storage/app/public` return 404 errors
- **Image/file display**: User-uploaded images and files won't display without proper symlinks
- **Deployment failures**: New deployments often forget to recreate symlinks after fresh clones

## How to Fix

### Quick Fix (5 minutes)

1. Identify which directories are not writable:

```bash
# Check current permissions
ls -la storage/
ls -la bootstrap/cache/
```

2. Fix permissions based on your environment:

**Development (Local Machine)**:

```bash
# Make directories writable
chmod -R 775 storage bootstrap/cache
```

**Production (Linux Server with www-data user)**:

```bash
# Set correct owner and permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

**Docker Container**:

```bash
# In your Dockerfile
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
```

**Windows**:

```powershell
# Right-click folders → Properties → Security tab
# Grant "Full Control" to your web server user
# Or run as Administrator:
icacls storage /grant Users:F /t
icacls bootstrap\cache /grant Users:F /t
```

**Symlink Issues**:

```bash
# Check if storage symlink exists
ls -la public/storage

# If missing or broken, recreate it
php artisan storage:link

# For custom symlinks, add to config/filesystems.php:
'links' => [
    public_path('storage') => storage_path('app/public'),
    public_path('uploads') => storage_path('app/uploads'),
],

# Then run:
php artisan storage:link
```

### Proper Fix (10 minutes)

1. **Configure deployment automation** to set permissions:

```yaml
# .github/workflows/deploy.yml
- name: Set Directory Permissions
  run: |
    chmod -R 775 storage bootstrap/cache
    chown -R www-data:www-data storage bootstrap/cache
```

2. **Add post-deployment script**:

```bash
#!/bin/bash
# deploy/fix-permissions.sh

# Set ownership
chown -R www-data:www-data storage bootstrap/cache

# Set directory permissions (775 = rwxrwxr-x)
chmod -R 775 storage bootstrap/cache

# Ensure new files inherit correct permissions
chmod g+s storage bootstrap/cache

echo "✓ Directory permissions configured"
```

3. **Configure umask in your web server**:

**Nginx + PHP-FPM** (`/etc/php/8.1/fpm/pool.d/www.conf`):

```ini
; Set umask so new files are group-writable
php_admin_value[umask] = 0002
```

**Apache** (`.htaccess` or VirtualHost):

```apache
<IfModule mod_php.c>
    php_value umask 0002
</IfModule>
```

4. **Update your `.gitignore`** to exclude storage files:

```
/storage/*.key
/storage/app/*
!/storage/app/.gitignore
/storage/framework/cache/*
!/storage/framework/cache/.gitignore
/storage/framework/sessions/*
!/storage/framework/sessions/.gitignore
/storage/framework/testing/*
!/storage/framework/testing/.gitignore
/storage/framework/views/*
!/storage/framework/views/.gitignore
/storage/logs/*
!/storage/logs/.gitignore
```

5. **Configure custom writable directories** (optional):

If you need to check additional directories beyond the defaults (`storage` and `bootstrap/cache`), publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'reliability' => [
        'enabled' => true,
        
        'directory-write-permissions' => [
            'writable_directories' => [
                'storage',
                'bootstrap/cache',
                'public/uploads',      // If you store uploads here
                'resources/compiled',  // Custom compiled assets
            ],
        ],
    ],
],
```

::: tip
By default, the analyzer checks `storage` and `bootstrap/cache` directories. You only need to publish the config if you want to check additional directories.
:::

6. **Include symlink creation in deployment**:

```yaml
# .github/workflows/deploy.yml
- name: Create Storage Symlinks
  run: php artisan storage:link --force
```

```bash
# deploy/post-deploy.sh
php artisan storage:link --force
echo "✓ Storage symlinks created"
```

::: warning
The `--force` flag recreates symlinks even if they exist. Use with caution in production if you have custom symlink configurations.
:::

7. **Configure symlink checking** (optional):

If you want to disable symlink verification or check custom symlinks:

```php
// config/shieldci.php
'analyzers' => [
    'reliability' => [
        'enabled' => true,
        
        'directory-write-permissions' => [
            'check_symlinks' => true,  // Set to false to disable
        ],
    ],
],

// Or use Laravel's filesystems config:
// config/filesystems.php
'links' => [
    public_path('storage') => storage_path('app/public'),
    public_path('media') => storage_path('app/media'),
],
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- CI runners clone a fresh repository and never run `php artisan storage:link`, so the `public/storage` symlink is always absent — flagging it would be a false positive on every pipeline run
- Directory write permissions depend on the CI runner's OS and file system setup
- Prevents misleading failures in pipelines where the deployment steps that create symlinks and set permissions have not yet run

**When to run this analyzer:**
- ✅ **Local development**: Catches missing write permissions and broken symlinks before they cause runtime errors
- ✅ **Staging/Production servers**: Validates that storage directories are writable and symlinks are in place after deployment
- ❌ **CI/CD pipelines**: Skipped automatically (symlinks not created and permissions not set in CI)

## References

- [Laravel Installation - Directory Permissions](https://laravel.com/docs/installation#directory-permissions)
- [Laravel File Storage - The Public Disk](https://laravel.com/docs/filesystem#the-public-disk)
- [Linux File Permissions Guide](https://www.linux.com/training-tutorials/understanding-linux-file-permissions/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [Nginx + PHP-FPM Configuration](https://www.nginx.com/resources/wiki/start/topics/examples/phpfcgi/)

## Related Analyzers

- [Environment File Existence Analyzer](/analyzers/reliability/env-file-exists) - Ensures .env file exists and is readable
- [Cache Status Analyzer](/analyzers/reliability/cache-status) - Validates cache connectivity and functionality
