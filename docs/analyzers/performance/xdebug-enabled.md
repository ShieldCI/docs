---
title: Xdebug Enabled Analyzer
description: Ensures Xdebug and other debugging extensions are not loaded in production environments
icon: bug
outline: [2, 3]
tags: php,xdebug,debugging,performance,production
pro: true
---

# Xdebug Enabled Analyzer

| Analyzer ID       | Category       | Severity   | Time To Fix  |
| ------------------| :------------: |:----------:| ------------:|
| `xdebug-enabled`  | ⚡ Performance  | Critical   | 5 minutes    |

## What This Checks

Validates that Xdebug and other debugging extensions (Blackfire, Tideways, PCOV) are not loaded in production or staging environments where they can severely impact performance.

## Why It Matters

- **Performance Impact:** Xdebug can slow PHP execution by 50% or more, even when not actively debugging
- **Security Risk:** Xdebug can expose sensitive information through stack traces and debugging output
- **Memory Overhead:** Debugging extensions consume additional memory for tracking execution
- **Production Critical:** These extensions are designed for development, not production use

Even with Xdebug mode set to "off", there is still some overhead from the extension being loaded. The safest approach is to not load it at all in production.

## How to Fix

### Quick Fix (2 minutes)

**Option 1: Disable Xdebug in php.ini**

```ini
; Comment out or remove the Xdebug extension line
; zend_extension=xdebug.so
```

**Option 2: Use Xdebug Mode (Xdebug 3+)**

If you can't remove Xdebug entirely, set mode to "off":

```ini
xdebug.mode=off
```

Or via environment variable:
```bash
XDEBUG_MODE=off
```

Then restart PHP-FPM:
```bash
# Ubuntu/Debian
sudo systemctl restart php8.1-fpm

# CentOS/RHEL
sudo systemctl restart php-fpm
```

### Proper Fix (5 minutes)

**Production php.ini:**
```ini
; /etc/php/8.1/fpm/conf.d/production.ini
; No Xdebug extension loaded
; All debugging extensions removed from production
```

**Development php.ini:**
```ini
; /etc/php/8.1/fpm/conf.d/development.ini
zend_extension=xdebug.so
xdebug.mode=debug,develop
xdebug.start_with_request=yes
```

**Docker Multi-Stage Configuration:**

```dockerfile
# Dockerfile.production
FROM php:8.1-fpm
# No Xdebug installed

# Dockerfile.development
FROM php:8.1-fpm
RUN pecl install xdebug && docker-php-ext-enable xdebug
COPY docker/php/xdebug.ini /usr/local/etc/php/conf.d/xdebug.ini
```

**Verify Xdebug is removed:**

```bash
# Check if Xdebug is loaded
php -m | grep -i xdebug

# If loaded, check the mode
php -r "echo ini_get('xdebug.mode');"

# List all debugging extensions
php -m | grep -iE 'xdebug|blackfire|tideways|pcov'
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`) and only runs in production and staging environments.

**Why skip in CI and development?**
- Xdebug is essential for development debugging
- CI environments are controlled and don't reflect production
- Testing environments may need PCOV for coverage

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

- [Xdebug Documentation](https://xdebug.org/docs/)
- [Xdebug 3 Upgrade Guide](https://xdebug.org/docs/upgrade_guide)
- [Xdebug Settings Reference](https://xdebug.org/docs/all_settings)

## Related Analyzers

- [OPcache Enabled Analyzer](/analyzers/performance/opcache-enabled) - Ensures OPcache is enabled for production performance
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Ensures APP_DEBUG is disabled in production
- [Debug Log Level Analyzer](/analyzers/performance/debug-log-level) - Ensures appropriate log levels in production
