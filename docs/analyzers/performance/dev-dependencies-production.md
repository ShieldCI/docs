---
title: Dev Dependencies in Production Analyzer
description: Ensures development dependencies are not installed in production environments
icon: alert-circle
outline: [2, 3]
---

# Dev Dependencies in Production Analyzer

| Analyzer ID                   | Category       | Severity   | Time To Fix  |
| ------------------------------| :------------: |:----------:| ------------:|
| `dev-dependencies-production` | ⚡ Performance  | High       | 10 minutes   |

## What This Checks

Ensures development dependencies are not installed in production environments.

## Why It Matters

- **Security:** Dev tools may expose vulnerabilities
- **Performance:** Unnecessary packages increase autoloader overhead
- **Disk Space:** Dev dependencies waste storage

Development packages like PHPUnit, testing tools, and debug bars should never be in production.

## How to Fix

### Quick Fix (5 minutes)

```bash
# Install without dev dependencies
composer install --no-dev --optimize-autoloader
```

### Proper Fix (10 minutes)

**Update Deployment Script:**
```bash
#!/bin/bash
# Always use --no-dev in production
composer install --no-interaction --no-dev --optimize-autoloader --classmap-authoritative
```

**Docker:**
```dockerfile
RUN composer install --no-dev --optimize-autoloader
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments and only runs in production and staging environments.

**Why skip in CI and development?**
- Dev dependency checks are not applicable in CI
- Local/Development/Testing environments need dev dependencies (PHPUnit, debug tools, etc.)
- Production and staging should not have dev dependencies installed

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

- [Composer Documentation](https://getcomposer.org/doc/03-cli.md#install-i)

## Related Analyzers

- **[Composer Autoloader Optimization Analyzer](/analyzers/performance/autoloader-optimization)** - Ensures Composer autoloader is optimized for production performance
