---
title: OPcache Enabled Analyzer
description: Validates that PHP's OPcache extension is installed, enabled, and properly configured for production performance
icon: zap
outline: [2, 3]
tags: php,opcache,performance,optimization,bytecode
---

# OPcache Enabled Analyzer

| Analyzer ID       | Category       | Severity   | Time To Fix  |
| ------------------| :------------: |:----------:| ------------:|
| `opcache-enabled` | ⚡ Performance  | High       | 15 minutes   |

## What This Checks

Validates that PHP's OPcache extension is installed, enabled, and properly configured for production performance with optimal settings for Laravel applications.

## Why It Matters

- **Performance Impact:** OPcache can improve PHP performance by 30-70% by caching precompiled bytecode
- **Production Critical:** Without OPcache, PHP recompiles every script on every request, wasting CPU cycles
- **Memory Efficiency:** Proper OPcache configuration reduces memory usage through interned strings and shared memory

PHP normally parses and compiles scripts on every request. OPcache stores the compiled bytecode in shared memory, eliminating the compilation step for subsequent requests. This is one of the single most impactful performance optimizations for any PHP application.

## How to Fix

### Quick Fix (5 minutes)

**If OPcache is not installed:**

```bash
# Ubuntu/Debian
sudo apt-get install php8.1-opcache

# CentOS/RHEL
sudo yum install php82-opcache

# macOS (Homebrew)
brew install php@8.1
# OPcache is included by default

# Verify installation
php -m | grep -i opcache
```

**If OPcache is installed but disabled:**

```ini
; php.ini
opcache.enable=1
opcache.enable_cli=0  ; Keep disabled for CLI
```

Then restart PHP-FPM:
```bash
# Ubuntu/Debian
sudo systemctl restart php8.1-fpm

# CentOS/RHEL
sudo systemctl restart php-fpm

# macOS
brew services restart php@8.1
```

### Proper Fix (15 minutes)

Implement production-optimized OPcache configuration:

**Optimal php.ini Configuration for Laravel:**

```ini
; /etc/php/8.1/fpm/php.ini (or your php.ini location)

[opcache]
; Enable OPcache for web requests
opcache.enable=1

; Disable for CLI (recommended)
opcache.enable_cli=0

; Memory allocation (256MB recommended for Laravel)
opcache.memory_consumption=256

; Interned strings buffer (16MB minimum)
opcache.interned_strings_buffer=16

; Max files to cache (20000 recommended for Laravel)
opcache.max_accelerated_files=20000

; Disable timestamp validation in production (maximum performance)
opcache.validate_timestamps=0

; Revalidation frequency (0 when validate_timestamps=0)
opcache.revalidate_freq=0

; Fast shutdown for better performance
opcache.fast_shutdown=1

; Don't waste memory on comments
opcache.save_comments=0

; Optimization level
opcache.optimization_level=0x7FFEBFFF
```

**Environment-Specific Configuration:**

For production/staging (`/etc/php/8.1/fpm/php.ini`):
```ini
[opcache]
opcache.enable=1
opcache.validate_timestamps=0  ; Maximum performance
opcache.revalidate_freq=0
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
```

For development (`/etc/php/8.1/cli/php.ini`):
```ini
[opcache]
opcache.enable=0  ; Or enable with validation
opcache.validate_timestamps=1  ; Check for file changes
opcache.revalidate_freq=2  ; Check every 2 seconds
```

**Docker Configuration:**

```dockerfile
# Dockerfile
FROM php:8.1-fpm

# Install OPcache
RUN docker-php-ext-install opcache

# Copy custom OPcache configuration
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# The rest of your Dockerfile...
```

```ini
; docker/php/opcache.ini
[opcache]
opcache.enable=1
opcache.enable_cli=0
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.validate_timestamps=${OPCACHE_VALIDATE_TIMESTAMPS}
opcache.revalidate_freq=0
opcache.fast_shutdown=1
```

**Verification Script:**

```php
<?php
// opcache-status.php (remove after verification)

if (!extension_loaded('Zend OPcache')) {
    die("OPcache is NOT installed!\n");
}

$status = opcache_get_status();
$config = opcache_get_configuration();

echo "OPcache Status:\n";
echo "- Enabled: " . ($config['directives']['opcache.enable'] ? 'YES' : 'NO') . "\n";
echo "- Memory Used: " . round($status['memory_usage']['used_memory'] / 1024 / 1024, 2) . " MB\n";
echo "- Memory Free: " . round($status['memory_usage']['free_memory'] / 1024 / 1024, 2) . " MB\n";
echo "- Cached Scripts: " . $status['opcache_statistics']['num_cached_scripts'] . "\n";
echo "- Hit Rate: " . round($status['opcache_statistics']['opcache_hit_rate'], 2) . "%\n";
echo "- Validate Timestamps: " . ($config['directives']['opcache.validate_timestamps'] ? 'YES (slower)' : 'NO (faster)') . "\n";
```

**Deployment Checklist:**

```bash
# 1. Verify OPcache is installed
php -i | grep opcache

# 2. Check configuration
php -r "print_r(opcache_get_configuration());"

# 3. After deployment, reset OPcache
# Option 1: Restart PHP-FPM (recommended)
sudo systemctl restart php8.1-fpm

# Option 2: Use opcache_reset() (only if you have a script for it)
curl https://yoursite.com/opcache-reset.php

# 4. Monitor hit rate (should be >95%)
php -r "print_r(opcache_get_status());" | grep hit_rate
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`) and only runs in production and staging environments.

**Why skip in CI and development?**
- OPcache configuration is not applicable in CI
- Local/Development/Testing environments may have OPcache disabled or with validation enabled for debugging, which is acceptable
- Production and staging should have OPcache enabled and optimized for maximum performance

**Environment Detection:**
The analyzer checks your Laravel `APP_ENV` setting and only runs when it maps to `production` or `staging`. Custom environment names can be mapped in `config/shieldci.php`:

```php
// config/shieldci.php
'environment_mapping' => [
    'production-us' => 'production',
    'production-blue' => 'production',
    'staging-preview' => 'staging',
],
```

**Examples:**
- `APP_ENV=production` → Runs (no mapping needed)
- `APP_ENV=production-us` → Maps to `production` → Runs
- `APP_ENV=local` → Skipped (not production/staging)

## References

- [PHP OPcache Documentation](https://www.php.net/manual/en/book.opcache.php)
- [OPcache Configuration Directives](https://www.php.net/manual/en/opcache.configuration.php)
- [Laravel Performance Best Practices](https://laravel.com/docs/deployment#optimization)
- [Optimizing PHP OPcache for High Traffic Sites](https://tideways.com/profiler/blog/fine-tune-your-opcache-configuration-to-avoid-caching-suprises)

## Related Analyzers

- **[Composer Autoloader Optimization Analyzer](/analyzers/performance/autoloader-optimization)** - Ensures Composer autoloader is optimized for production performance
- [Configuration Caching Analyzer](/analyzers/performance/config-caching) - Ensures config is cached in production
- [Debug Log Level Analyzer](/analyzers/performance/debug-log-level) - Ensure debug mode is disabled in production
