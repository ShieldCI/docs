---
title: PHP Configuration Analyzer
description: Validates that PHP ini settings are configured securely for production environments
icon: cog
outline: [2, 3]
---

# PHP Configuration Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `php-ini`          | 🛡️ Security  | High       | 15 minutes  |

## What This Checks

Validates that PHP configuration (`php.ini`) follows security best practices for production and staging environments. This analyzer automatically runs only in production and staging environments, as development environments may have different PHP ini settings for debugging purposes (which is acceptable).

Checks include:

- **Dangerous settings disabled**: `allow_url_fopen`, `allow_url_include`, `expose_php`
- **Error handling**: `display_errors` disabled, `log_errors` enabled
- **Dangerous functions**: Functions like `exec`, `shell_exec`, `system` are disabled
- **File access restrictions**: `open_basedir` configured to limit file access
- **Error reporting**: Proper verbosity levels (not too verbose for production)

## Why It Matters

- **Remote Code Execution (RCE)**: Functions like `exec()` and `system()` allow attackers to execute arbitrary system commands
- **Information Disclosure**: `display_errors` and `expose_php` leak sensitive information about your application
- **Remote File Inclusion (RFI)**: `allow_url_include` enables attackers to include malicious remote files
- **Local File Inclusion (LFI)**: `allow_url_fopen` with weak code can expose sensitive files
- **Directory Traversal**: Missing `open_basedir` allows reading files outside application directory

Misconfigured PHP settings are consistently in OWASP Top 10 (A05:2021 – Security Misconfiguration). Common attack vectors include:

1. **RCE via exec()**: `exec($_GET['cmd'])` → Full server compromise
2. **Error disclosure**: Stack traces reveal file paths, database credentials, API keys
3. **RFI attacks**: `include($_GET['page'])` with `allow_url_include=On` → Remote shell
4. **Version fingerprinting**: `expose_php=On` → `X-Powered-By: PHP/8.1.0` helps attackers target known vulnerabilities

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: Dangerous Settings Enabled**

Find your `php.ini` file location:
```bash
php --ini
# Configuration File (php.ini) Path: /etc/php/8.1/fpm/php.ini
```

Edit the php.ini file:
```ini
# Disable dangerous URL functions
allow_url_fopen = Off
allow_url_include = Off

# Hide PHP version from HTTP headers
expose_php = Off

# Disable error display in production
display_errors = Off
display_startup_errors = Off

# Enable error logging instead
log_errors = On
error_log = /var/log/php/error.log
```

Restart PHP to apply changes:
```bash
# For PHP-FPM
sudo systemctl restart php8.1-fpm

# For Apache with mod_php
sudo systemctl restart apache2

# For nginx with PHP-FPM
sudo systemctl restart nginx
sudo systemctl restart php8.1-fpm
```

**Scenario 2: Dangerous Functions Still Enabled**

Add to your `php.ini`:
```ini
disable_functions = exec,passthru,shell_exec,system,proc_open,popen,curl_exec,curl_multi_exec,parse_ini_file,show_source
```

**Scenario 3: Missing open_basedir Restriction**

Restrict file access to your application directory:
```ini
# Replace with your actual application path
open_basedir = /var/www/html:/tmp
```

### Proper Fix (15 minutes)

Implement comprehensive PHP security hardening:

**1. Production-Grade php.ini Configuration**

Create a security-focused `php.ini` configuration:

```ini
;;;;;;;;;;;;;;;;;;;
; Security Settings
;;;;;;;;;;;;;;;;;;;

; Disable dangerous URL functions
allow_url_fopen = Off
allow_url_include = Off

; Hide PHP version from headers
expose_php = Off

; Disable error display (security risk)
display_errors = Off
display_startup_errors = Off

; Enable error logging instead
log_errors = On
error_log = /var/log/php/error.log
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT

; Disable dangerous functions
disable_functions = exec,passthru,shell_exec,system,proc_open,popen,curl_exec,curl_multi_exec,parse_ini_file,show_source,phpinfo

; File upload restrictions
file_uploads = On
upload_max_filesize = 2M
max_file_uploads = 5

; Restrict file access to application directory
open_basedir = /var/www/html:/var/lib/php/sessions:/tmp

; Session security
session.cookie_httponly = 1
session.cookie_secure = 1
session.use_strict_mode = 1
session.cookie_samesite = Lax

; Disable deprecated functions
enable_dl = Off
```

**2. Environment-Specific Configuration**

Use different `php.ini` files per environment:

```bash
# Production server
/etc/php/8.1/fpm/php.ini → Strict security settings (errors off)

# Staging server
/etc/php/8.1/fpm/php.ini → Moderate settings (log errors)

# Development server
/etc/php/8.1/cli/php.ini → Relaxed settings (display errors on)
```

**3. Validate Configuration After Changes**

Create a validation script:

```php
<?php
// check-php-config.php - Run once then DELETE THIS FILE!

$securityChecks = [
    'allow_url_fopen' => ['expected' => 'Off', 'severity' => 'HIGH'],
    'allow_url_include' => ['expected' => 'Off', 'severity' => 'CRITICAL'],
    'expose_php' => ['expected' => 'Off', 'severity' => 'HIGH'],
    'display_errors' => ['expected' => 'Off', 'severity' => 'HIGH'],
    'log_errors' => ['expected' => 'On', 'severity' => 'MEDIUM'],
];

echo "PHP Security Configuration Check\n";
echo "=================================\n\n";

foreach ($securityChecks as $setting => $config) {
    $value = ini_get($setting);
    $status = strtolower($value) === strtolower($config['expected']) ? '✅ PASS' : '❌ FAIL';

    echo "{$status} {$setting}: {$value} (expected: {$config['expected']}) [{$config['severity']}]\n";
}

echo "\nDisabled Functions:\n";
$disabled = ini_get('disable_functions');
echo !empty($disabled) ? "✅ {$disabled}\n" : "❌ None disabled\n";

echo "\nopen_basedir:\n";
$basedir = ini_get('open_basedir');
echo !empty($basedir) ? "✅ {$basedir}\n" : "❌ Not configured\n";
```

Run the validation:
```bash
php check-php-config.php
rm check-php-config.php  # DELETE after validation!
```

**4. Configure ShieldCI Custom Settings (Optional)**

Customize the analyzer in your Laravel config:

```php
// config/shieldci.php

return [
    // Map custom environment names to standard types (if needed)
    'environment_mapping' => [
        'production-us' => 'production',
        'production-eu' => 'production',
        'staging-preview' => 'staging',
    ],

    'php_configuration' => [
        // Path to your php.ini file (auto-detected if not set)
        'ini_path' => null,

        // Custom secure settings to validate
        'secure_settings' => [
            'allow_url_fopen' => false,
            'allow_url_include' => false,
            'expose_php' => false,
            'display_errors' => false,
            'display_startup_errors' => false,
            'log_errors' => true,
        ],

        // Custom dangerous functions to check
        'dangerous_functions' => [
            'exec',
            'passthru',
            'shell_exec',
            'system',
            'proc_open',
            'popen',
            'curl_exec',
            'curl_multi_exec',
            'parse_ini_file',
            'show_source',
            'phpinfo',  // Add phpinfo as dangerous
        ],

        // Error reporting validation
        'error_reporting' => [
            'disallowed_values' => [E_ALL, -1],  // Don't allow E_ALL
            'forbidden_flags' => ['E_STRICT', 'E_DEPRECATED'],
        ],
    ],
];
```

**Note:** If you use custom environment names (e.g., `production-us`, `production-blue`), configure `environment_mapping` so the analyzer recognizes them as production/staging environments.

**5. Monitor PHP Configuration in CI/CD**

Add to your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
deploy:
  steps:
    - name: Validate PHP Configuration
      run: |
        # After deployment, run ShieldCI
        php artisan shieldci:analyze --analyzer=php-ini-security

        # Fail deployment if PHP config is insecure
        if [ $? -ne 0 ]; then
          echo "❌ Insecure PHP configuration detected!"
          exit 1
        fi
```

**6. Docker/Container Configuration**

For containerized applications:

```dockerfile
# Dockerfile
FROM php:8.1-fpm

# Copy secure php.ini
COPY docker/php.ini /usr/local/etc/php/php.ini

# Verify configuration during build
RUN php -r "exit(ini_get('allow_url_include') === 'Off' ? 0 : 1);" \
    || (echo "❌ Insecure PHP configuration!" && exit 1)
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments and only runs in production and staging environments.

**Why skip in CI and development?**
- PHP ini settings are environment-specific and not applicable in CI
- Local/Development/Testing environments may have permissive settings for debugging (e.g., `display_errors = On`), which is acceptable
- Production and staging should have strict security settings

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

- [PHP Security Configuration](https://www.php.net/manual/en/security.php)
- [PHP ini Settings](https://www.php.net/manual/en/ini.core.php)
- [OWASP PHP Configuration Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/PHP_Configuration_Cheat_Sheet.html)
- [CWE-16: Configuration](https://cwe.mitre.org/data/definitions/16.html)
- [CWE-209: Information Exposure Through Error Messages](https://cwe.mitre.org/data/definitions/209.html)
- [PHP disable_functions Documentation](https://www.php.net/manual/en/ini.core.php#ini.disable-functions)
- [PHP open_basedir Documentation](https://www.php.net/manual/en/ini.core.php#ini.open-basedir)

## Related Analyzers

- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Validates APP_DEBUG is disabled in production
- [Environment File Analyzer](/analyzers/security/env-file) - Checks .env file permissions
- [Application Key Analyzer](/analyzers/security/app-key) - Validates APP_KEY configuration
- [SQL Injection Analyzer](/analyzers/security/sql-injection) - Detects SQL injection vulnerabilities
