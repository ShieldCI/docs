---
title: Environment File Existence Analyzer
description: Ensures .env file exists and is properly configured for Laravel to load application configuration
icon: file-cog
outline: [2, 3]
---

# Environment File Existence Analyzer

| Analyzer ID       | Category       | Severity | Time To Fix |
| ------------------| :------------: |:--------:| -----------:|
| `env-file-exists` | ✅ Reliability | Critical | 5 minutes   |

## What This Checks

- Verifies that `.env` file exists in the application root
- Checks if `.env` is readable by the application
- Detects empty `.env` files that contain no configuration
- Identifies broken symlinks pointing to non-existent target files
- Validates that `.env` contains actual configuration data
- Provides context-aware recommendations based on `.env.example` presence
- Reports file permissions and symlink metadata for debugging

## Why It Matters

- **Application cannot start**: Laravel loads critical configuration from `.env` - without it, your application will crash immediately with "RuntimeException: No application encryption key has been specified"
- **Configuration failures**: Environment-specific settings (database, cache, queue, mail) won't load, causing cascading failures across your app
- **Security vulnerabilities**: Missing `APP_KEY` means sessions and encrypted data are insecure or completely broken
- **Deployment disasters**: Fresh deployments to staging/production fail immediately if `.env` is missing, causing downtime
- **Developer onboarding**: New team members cannot run the project without `.env`, wasting hours troubleshooting
- **CI/CD pipeline failures**: Automated tests and deployments fail silently when `.env` is missing in test environments
- **Silent data loss**: Missing database configuration can cause the application to connect to wrong databases or fail to save data
- **Broken symlinks in production**: Common deployment pattern using symlinked `.env` files can break, causing production outages

## How to Fix

### Quick Fix (2 minutes)

If `.env.example` exists:

```bash
# Unix/Linux/macOS
cp .env.example .env

# Windows (Command Prompt)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Then generate a secure application key:

```bash
php artisan key:generate
```

### Proper Fix (5 minutes)

1. **Create `.env` from `.env.example`** (if it exists):

```bash
cp .env.example .env
```

2. **Configure critical environment variables**:

```bash
# Open .env in your editor
nano .env  # or vim, code, etc.
```

Update these **required** variables:

```dotenv
# Application
APP_NAME="Your App Name"
APP_ENV=local              # local, staging, production
APP_DEBUG=true             # true for local, false for production
APP_URL=http://localhost   # Your application URL

# Generate this with: php artisan key:generate
APP_KEY=base64:GENERATED_32_CHARACTER_KEY_HERE

# Database
DB_CONNECTION=mysql        # mysql, pgsql, sqlite, sqlsrv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Cache (optional but recommended)
CACHE_DRIVER=file          # file, redis, memcached, database
SESSION_DRIVER=file        # file, cookie, database, redis
QUEUE_CONNECTION=sync      # sync, database, redis, sqs
```

3. **Generate application key** (if not already set):

```bash
php artisan key:generate
```

This will automatically update `APP_KEY` in your `.env` file.

4. **Verify configuration loads**:

```bash
# Test that .env is readable
php artisan tinker
>>> config('app.name')
=> "Your App Name"

# Or run a quick test
php artisan config:show app
```

5. **Set proper file permissions**:

```bash
# Unix/Linux/macOS
chmod 644 .env

# Ensure it's readable by web server
sudo chown www-data:www-data .env  # Adjust user as needed
```

### Creating .env from Scratch (if .env.example is missing)

If `.env.example` doesn't exist, create `.env` manually:

```bash
# Create new .env file
touch .env

# Add minimum required configuration
cat > .env << 'EOF'
APP_NAME=Laravel
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"
EOF

# Generate secure APP_KEY
php artisan key:generate
```

## References

- [Laravel Configuration Documentation](https://laravel.com/docs/configuration)
- [Laravel Environment Configuration](https://laravel.com/docs/configuration#environment-configuration)
- [Laravel Deployment Guide](https://laravel.com/docs/deployment)
- [PHP Dotenv Library](https://github.com/vlucas/phpdotenv)
- [The Twelve-Factor App - Config](https://12factor.net/config)

## Related Analyzers

- [Environment Variables Complete Analyzer](/analyzers/reliability/env-variables-complete) - Ensures all required environment variables from .env.example are defined in .env
- [Environment Example Documentation Analyzer](/analyzers/reliability/env-example-documented) - Ensures all environment variables used in .env are documented in .env.example
- [Directory Write Permissions Analyzer](/analyzers/reliability/directory-write-permissions) - Ensures storage directories are writable
