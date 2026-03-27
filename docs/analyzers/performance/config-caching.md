---
title: Configuration Caching Analyzer
description: Verifies that Laravel's configuration caching is properly configured for each environment
icon: zap
outline: [2, 3]
tags: cache,configuration,performance,optimization
---

# Configuration Caching Analyzer

| Analyzer ID      | Category       | Severity   | Time To Fix  |
| -----------------| :------------: |:----------:| ------------:|
| `config-caching` | ⚡ Performance  | High       | 5 minutes   |

## What This Checks

Verifies that Laravel's configuration caching is properly configured for each environment - cached in production for performance, and uncached in development for flexibility.

## Why It Matters

- **Performance Impact:** Configuration caching improves bootstrap time by up to 50% on every request in production
- **Development Flexibility:** Cached config in development prevents config changes from taking effect until cache is cleared
- **Production Critical:** Without config caching, Laravel loads and parses dozens of configuration files on every single request

Every Laravel request loads configuration from multiple files (`config/app.php`, `config/database.php`, etc.). Caching combines all configs into a single optimized file (`bootstrap/cache/config.php`), dramatically reducing I/O operations and parse time.

## How to Fix

### Quick Fix (2 minutes)

**Scenario 1: Production without cache (Performance Issue)**

```bash
# Enable config caching in production
php artisan config:cache
```

**Scenario 2: Development with cache (Flexibility Issue)**

```bash
# Clear config cache in development
php artisan config:clear
```

### Proper Fix (5 minutes)

Implement environment-aware configuration caching in your deployment workflow:

**Best Practice Deployment Script:**

```bash
#!/bin/bash
# deploy.sh

# Determine environment
ENVIRONMENT=${APP_ENV:-production}

if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo "Caching configuration for ${ENVIRONMENT}..."

    # Cache all Laravel optimizations
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan event:cache

    # Verify cache was created
    if [ ! -f bootstrap/cache/config.php ]; then
        echo "ERROR: Config cache failed to generate!"
        exit 1
    fi

    echo "Configuration cached successfully"
else
    echo "Clearing caches for ${ENVIRONMENT}..."
    php artisan config:clear
    php artisan route:clear
    php artisan view:clear
    php artisan event:clear

    echo "Caches cleared for development"
fi
```

**GitHub Actions CI/CD Example:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.1'

      - name: Install Dependencies
        run: composer install --no-dev --optimize-autoloader

      - name: Cache Laravel Configuration
        run: |
          php artisan config:cache
          php artisan route:cache
          php artisan view:cache

      - name: Deploy to Server
        run: |
          rsync -avz --exclude='.git' . user@server:/var/www/app/
```

**Laravel Forge / Envoyer Integration:**

```bash
# In your deployment script
cd /home/forge/your-site.com

# Pull latest code
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader --classmap-authoritative

# Run migrations (if needed)
php artisan migrate --force

# Cache everything for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Reload PHP-FPM
sudo -S service php8.1-fpm reload
```

**Makefile for Consistent Commands:**

```makefile
# Makefile
.PHONY: production-optimize development-clear

production-optimize:
	@echo "Optimizing for production..."
	php artisan config:cache
	php artisan route:cache
	php artisan view:cache
	php artisan event:cache
	composer dump-autoload --classmap-authoritative
	@echo "Production optimization complete!"

development-clear:
	@echo "Clearing caches for development..."
	php artisan config:clear
	php artisan route:clear
	php artisan view:clear
	php artisan event:clear
	php artisan cache:clear
	@echo "Development caches cleared!"

# Usage:
# make production-optimize   # On production deployment
# make development-clear     # On local development
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- CI environments often use different caching strategies than production
- CI pipelines may run with uncached config for test flexibility
- Prevents false failures when CI environments legitimately skip config caching

**Laravel Vapor / Serverless:** This analyzer is automatically skipped on Laravel Vapor and other serverless platforms — config is always cached by the platform regardless of the environment value, so the check is not meaningful there.

**When to run this analyzer:**
- ✅ **Local development**: Ensures you haven't accidentally cached config locally
- ✅ **Staging/Production servers**: Validates config caching is properly enabled
- ❌ **CI/CD pipelines**: Skipped automatically (deployment-specific check)
- ❌ **Laravel Vapor / Serverless**: Skipped automatically (platform handles config caching)

## References

- [Laravel Configuration Caching Documentation](https://laravel.com/docs/configuration#configuration-caching)
- [Laravel Deployment Best Practices](https://laravel.com/docs/deployment#optimization)
- [Understanding Laravel's Bootstrap Process](https://laravel.com/docs/lifecycle)

## Related Analyzers

- **[Composer Autoloader Optimization Analyzer](/analyzers/performance/autoloader-optimization)** - Ensures Composer autoloader is optimized for production performance
- [Route Caching Analyzer](/analyzers/performance/route-caching) - Ensures route caching is properly configured
- [View Caching Analyzer](/analyzers/performance/view-caching) - Ensures Blade views are properly compiled
