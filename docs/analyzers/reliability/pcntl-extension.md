---
title: PCNTL Extension Analyzer
description: Verifies that required PHP extensions (PCNTL, Redis) are loaded for queue and cache operations
icon: cpu
outline: [2, 3]
tags: pcntl,extension,signals,queue,reliability,infrastructure
pro: true
---

# PCNTL Extension Analyzer

| Analyzer ID        | Category       | Severity | Time To Fix |
| -------------------| :------------: |:--------:| -----------:|
| `pcntl-extension`  | ✅ Reliability |   High   | 10 minutes  |

## What This Checks

- Verifies the PCNTL extension is loaded when Laravel Horizon is installed or a non-sync queue driver is in use
- Checks for the Redis PHP extension (`phpredis`) or Predis library when Redis is configured for cache, queue, session, or broadcasting
- Supports custom extension requirements defined in configuration
- Provides OS-specific installation instructions (macOS, Ubuntu/Debian, CentOS/RHEL)
- Detects Windows environments where PCNTL is unavailable and provides alternative recommendations
- Context-aware: only flags PCNTL as missing when the application actually needs it (Horizon installed or queue workers running)
- Skips when using sync or null queue drivers (no queue workers needed)
- Only runs in production and staging environments
- Automatically skips in CI environments

## Why It Matters

- **Job timeouts silently broken**: Without PCNTL, queue workers cannot enforce job timeouts via `SIGALRM`; long-running jobs block the worker indefinitely instead of being killed after the configured timeout
- **Graceful shutdown impossible**: PCNTL enables signal handling (`SIGTERM`, `SIGINT`) that allows workers to finish their current job before shutting down; without it, workers are killed mid-job during deployments
- **Horizon worker management**: Laravel Horizon requires PCNTL to manage worker processes, scale dynamically, and handle graceful restarts
- **Data integrity risk**: Jobs killed mid-execution (instead of completing gracefully) can leave data in an inconsistent state
- **Redis connectivity**: Missing Redis extension prevents the application from connecting to Redis for caching, queues, sessions, and real-time broadcasting, causing immediate runtime failures
- **Deployment reliability**: Missing extensions that are required in production but optional in development cause deployment failures that are hard to diagnose

## How to Fix

### Quick Fix (5 minutes)

Install the PCNTL extension for your operating system:

```bash
# Ubuntu / Debian
sudo apt-get install php-pcntl
# or for a specific PHP version:
sudo apt-get install php8.2-pcntl

# CentOS / RHEL
sudo yum install php-process

# macOS (Homebrew) - usually included by default
# Verify with:
php -m | grep pcntl

# Verify installation
php -m | grep pcntl
# Should output: pcntl

# Restart PHP-FPM after installation
sudo systemctl restart php8.2-fpm
```

Install a Redis client library:

```bash
# Option 1 (recommended): Install phpredis extension
# Ubuntu / Debian
sudo apt-get install php-redis

# macOS
pecl install redis

# Option 2: Install Predis via Composer
composer require predis/predis
```

### Proper Fix (10 minutes)

#### 1: Include extensions in your Docker image

```dockerfile
# Dockerfile
FROM php:8.2-fpm

# Install PCNTL
RUN docker-php-ext-install pcntl

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Verify extensions
RUN php -m | grep pcntl && php -m | grep redis
```

#### 2: Add extension requirements to composer.json

```json
{
    "require": {
        "ext-pcntl": "*",
        "ext-redis": "*"
    }
}
```

This ensures `composer install` fails if required extensions are missing, catching the issue early.

#### 3: Validate extensions in your deployment pipeline

```bash
# deploy.sh
echo "Checking required PHP extensions..."

php -m | grep -q pcntl || { echo "ERROR: pcntl extension missing"; exit 1; }
php -m | grep -q redis || { echo "ERROR: redis extension missing"; exit 1; }

echo "All required extensions are loaded."
```

#### 4: Handle Windows environments

PCNTL is not available on Windows. Use one of these alternatives:

```bash
# Option 1: Use WSL2 (Windows Subsystem for Linux)
wsl --install
# Run queue workers inside WSL2

# Option 2: Use Docker
docker run --rm -it php:8.2-cli php -m | grep pcntl

# Option 3: Use a cloud queue worker service
# Configure a Linux-based worker server for production
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments and only runs in production and staging.

**Why skip in CI and development?**
- Extension availability differs between CI runners, local machines, and production servers
- Extensions like `pcntl` are Linux-only and absent on macOS development machines
- Validating required extensions only makes sense on servers matching the production environment

**When to run this analyzer:**
- ✅ **Production/Staging servers**: Validates all required extensions are loaded
- ✅ **Local development**: Catches missing extensions before deployment
- ❌ **CI/CD pipelines**: Skipped automatically (CI may have different extension sets)

**Define additional required extensions:**

To specify which extensions must be present beyond the defaults, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'reliability' => [
        'enabled' => true,
        
        'pcntl-extension' => [
            'required_extensions' => [
                'pcntl',
                'redis',    // Add additional required extensions
                'posix',
            ],
        ],
    ],
],
```

## References

- [PHP PCNTL Extension](https://www.php.net/manual/en/book.pcntl.php)
- [PHP Redis Extension (phpredis)](https://github.com/phpredis/phpredis)
- [Predis Library](https://github.com/predis/predis)
- [Laravel Queue Workers](https://laravel.com/docs/queues#running-the-queue-worker)
- [Laravel Horizon Requirements](https://laravel.com/docs/horizon#installation)
- [Docker PHP Extensions](https://hub.docker.com/_/php)

## Related Analyzers

- [Horizon Reliability Analyzer](/analyzers/reliability/horizon-reliability) - Monitors Horizon runtime status, health, and configuration
- [Queue Timeout Configuration Analyzer](/analyzers/reliability/queue-timeout-configuration) - Ensures queue timeout and retry_after values are properly configured
