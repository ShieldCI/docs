---
title: File Permissions Security Analyzer
description: Validates that your Laravel application's files and directories use secure Unix permissions
icon: lock
outline: [2, 3]
---

# File Permissions Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `file-permissions` | 🛡️ Security  | Critical   | 15 minutes   |

## What This Checks

Validates that your Laravel application's files and directories use secure Unix permissions. Checks for world-writable files and directories, overly permissive permissions exceeding recommended levels, sensitive files like `.env` with weak permissions, group-writable critical files, and executable permissions on non-executable files like PHP and configuration files.

## Why It Matters

- **Security Risk:** CRITICAL - Improper file permissions allow unauthorized access and code injection
- **Data Exposure:** World-readable `.env` files expose database credentials and API keys
- **Code Tampering:** World-writable directories allow attackers to inject malicious code
- **System Compromise:** Overly permissive settings enable complete server takeover

File permissions control who can read, write, and execute files on your server. Insecure permissions can lead to:
- Attackers reading sensitive configuration files containing database credentials and API keys
- Malicious code injection through world-writable application directories
- Configuration tampering by unauthorized users gaining write access
- Data exfiltration through exposed sensitive files

An attacker with limited shell access can read a world-readable `.env` file to compromise your database. World-writable directories allow code injection that leads to remote code execution and complete server compromise.

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: Fix Common Permission Issues**

```bash
# Fix directory permissions (755)
find /path/to/laravel -type d -exec chmod 755 {} \;

# Fix file permissions (644)
find /path/to/laravel -type f -exec chmod 644 {} \;

# Fix .env permissions (600)
chmod 600 .env .env.* 2>/dev/null || true

# Fix storage permissions (775 - web server needs write)
chmod -R 775 storage bootstrap/cache

# Fix artisan permissions (755 - needs execute)
chmod 755 artisan
```

**Scenario 2: World-Writable Files Detected**

```bash
# Find and fix world-writable files
find . -type f -perm -002 -exec chmod 644 {} \;

# Find and fix world-writable directories
find . -type d -perm -002 -exec chmod 755 {} \;
```

**Scenario 3: Exposed .env File**

```bash
# Secure .env file (owner read/write only)
chmod 600 .env

# Verify permissions
ls -la .env
# Should show: -rw------- 1 www-data www-data
```

### Proper Fix (30 minutes)

Implement comprehensive file permission security:

**1. Set Correct Ownership**

```bash
# Set ownership to web server user
chown -R www-data:www-data /var/www/your-app

# Or for nginx
chown -R nginx:nginx /var/www/your-app

# Verify ownership
ls -la /var/www/your-app
```

**2. Apply Proper Permissions by Type**

```bash
cd /var/www/your-app

# Application code (read-only for execution)
find app config database resources routes -type d -exec chmod 755 {} \;
find app config database resources routes -type f -exec chmod 644 {} \;

# Public assets
chmod 755 public
find public -type d -exec chmod 755 {} \;
find public -type f -exec chmod 644 {} \;

# Writable storage (web server needs write access)
chmod -R 775 storage
find storage -type d -exec chmod 775 {} \;
find storage -type f -exec chmod 664 {} \;

# Bootstrap cache (web server needs write access)
chmod -R 775 bootstrap/cache
find bootstrap/cache -type d -exec chmod 775 {} \;
find bootstrap/cache -type f -exec chmod 664 {} \;

# Environment files (owner only)
chmod 600 .env .env.* 2>/dev/null || true

# Executable files
chmod 755 artisan
```

**3. Create Post-Deployment Script**

```bash
#!/bin/bash
# deploy-permissions.sh

APP_PATH="/var/www/your-app"
WEB_USER="www-data"
WEB_GROUP="www-data"

cd "$APP_PATH"

# Set ownership
chown -R "$WEB_USER:$WEB_GROUP" .

# Directories: 755 (rwxr-xr-x)
find . -type d -exec chmod 755 {} \;

# Files: 644 (rw-r--r--)
find . -type f -exec chmod 644 {} \;

# Writable storage: 775 (rwxrwxr-x)
chmod -R 775 storage bootstrap/cache

# Secrets: 600 (rw-------)
chmod 600 .env .env.* 2>/dev/null || true

# Executables: 755 (rwxr-xr-x)
chmod 755 artisan

echo "Permissions applied successfully"
```

**4. Dockerfile with Proper Permissions**

```dockerfile
FROM php:8.1-fpm

# Copy application
COPY --chown=www-data:www-data . /var/www/html

# Set base permissions
RUN find /var/www/html -type d -exec chmod 755 {} \; \
    && find /var/www/html -type f -exec chmod 644 {} \; \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod 755 /var/www/html/artisan

# Don't copy real .env in image
COPY --chown=www-data:www-data --chmod=600 .env.example /var/www/html/.env

WORKDIR /var/www/html
```

**5. Laravel Envoy Deployment**

```php
@servers(['web' => 'user@server.com'])

@task('deploy', ['on' => 'web'])
    cd /var/www/your-app

    # Pull latest code
    git pull origin main

    # Fix permissions
    find . -type d -exec chmod 755 {} \;
    find . -type f -exec chmod 644 {} \;
    chmod -R 775 storage bootstrap/cache
    chmod 600 .env
    chmod 755 artisan

    # Optimize
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
@endtask
```

**6. GitHub Actions CI/CD**

```yaml
name: Security Checks

on: [push, pull_request]

jobs:
  file-permissions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check for world-writable files
        run: |
          if find . -type f -perm -002 | grep -q .; then
            echo "Error: World-writable files found"
            find . -type f -perm -002
            exit 1
          fi

      - name: Check for world-writable directories
        run: |
          if find . -type d -perm -002 | grep -q .; then
            echo "Error: World-writable directories found"
            find . -type d -perm -002
            exit 1
          fi

      - name: Run ShieldCI
        run: |
          composer install
          php artisan shield:analyze --analyzer=file-permissions
```

## Common Mistakes to Avoid

1. **Using 777 permissions (world-writable):**
   ```bash
   # BAD - Gives everyone full access
   chmod -R 777 storage/
   chmod 777 .env

   # GOOD - Minimal necessary permissions
   chmod -R 775 storage/
   chmod 600 .env
   ```

2. **Making configuration files executable:**
   ```bash
   # BAD - PHP and config files don't need execute permission
   chmod 755 config/database.php
   chmod +x .env

   # GOOD - Read/write only
   chmod 644 config/database.php
   chmod 600 .env
   ```

3. **Making .env world-readable:**
   ```bash
   # BAD - Anyone can read secrets
   chmod 644 .env
   # -rw-r--r-- (group and others can read)

   # GOOD - Owner only
   chmod 600 .env
   # -rw------- (only owner can read/write)
   ```

4. **Applying same permissions to all directories:**
   ```bash
   # BAD - Storage needs different permissions than app code
   chmod -R 755 .

   # GOOD - Different permissions for different purposes
   chmod -R 755 app config routes
   chmod -R 775 storage bootstrap/cache
   chmod 600 .env
   ```

5. **Forgetting to set proper ownership:**
   ```bash
   # BAD - Files owned by deployment user, not web server
   # Deployment as 'ubuntu' user
   git pull
   # Files now owned by ubuntu:ubuntu

   # GOOD - Set ownership to web server user
   git pull
   chown -R www-data:www-data .
   ```

6. **Relying on obscurity instead of permissions:**
   ```bash
   # BAD - Hidden file with weak permissions
   chmod 644 .secret_api_keys  # Still readable!

   # GOOD - Proper permissions
   chmod 600 .env
   # And ensure it's in .gitignore
   ```

## References

- [Laravel Security Best Practices](https://laravel.com/docs/deployment#optimization)
- [Unix File Permissions Guide](https://www.redhat.com/sysadmin/linux-file-permissions-explained)
- [OWASP: Insufficient Authorization](https://owasp.org/www-community/vulnerabilities/Insufficient_Authorization)
- [CIS Controls: Access Control Management](https://www.cisecurity.org/controls)

## Related Analyzers

- [Environment File Security](/analyzers/security/env-file-security) - Checks .env file security and .gitignore
- [App Key Security](/analyzers/security/app-key-security) - Validates Laravel encryption keys
- [Debug Mode](/analyzers/security/debug-mode) - Prevents debug mode in production
- [Configuration Caching](/analyzers/performance/config-caching) - Ensures config is cached in production
