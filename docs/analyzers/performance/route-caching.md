---
title: Route Caching Analyzer
description: Validates that Laravel's route caching is properly configured - enabled in production for performance
icon: zap
outline: [2, 3]
tags: cache,routes,performance,optimization
---

# Route Caching Analyzer

| Analyzer ID     | Category       | Severity   | Time To Fix  |
| ----------------| :------------: |:----------:| ------------:|
| `route-caching` | ⚡ Performance  | High       | 5 minutes   |

## What This Checks

Validates that Laravel's route caching is properly configured - enabled in production for performance, and disabled in development for flexibility.

## Why It Matters

- **Performance Impact:** Route caching provides up to 5x faster route registration and lookup
- **Bootstrap Speed:** Caching eliminates the need to parse all route files on every request
- **Production Critical:** Without route caching, Laravel must register and compile all routes on every single request

Laravel applications typically have hundreds or thousands of routes across multiple files. Without caching, Laravel must load, parse, and register all these routes on every request, adding significant overhead to application bootstrap time.

## How to Fix

### Quick Fix (2 minutes)

**Scenario 1: Production without Route Cache**

```bash
# Enable route caching in production
php artisan route:cache
```

**Scenario 2: Development with Route Cache (causes confusion)**

```bash
# Clear route cache in development
php artisan route:clear
```

### Proper Fix (5 minutes)

Implement environment-aware route caching in your deployment workflow:

**1. Deployment Script with Route Caching**

```bash
#!/bin/bash
# deploy.sh

ENVIRONMENT=${APP_ENV:-production}

if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo "Caching routes for ${ENVIRONMENT}..."

    # Cache all Laravel optimizations
    php artisan route:cache
    php artisan config:cache
    php artisan view:cache
    php artisan event:cache

    # Verify route cache was created
    if [ ! -f bootstrap/cache/routes-v7.php ]; then
        echo "ERROR: Route cache failed to generate!"
        exit 1
    fi

    echo "Routes cached successfully"
else
    echo "Clearing caches for ${ENVIRONMENT}..."
    php artisan route:clear
    php artisan config:clear
    php artisan view:clear
    php artisan event:clear
fi
```

**2. GitHub Actions CI/CD:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.1'
          extensions: mbstring, xml, zip

      - name: Install Dependencies
        run: composer install --no-dev --optimize-autoloader --classmap-authoritative

      - name: Cache Laravel Routes
        run: |
          php artisan route:cache
          php artisan config:cache
          php artisan view:cache

      - name: Verify Route Cache
        run: |
          if [ ! -f bootstrap/cache/routes-v7.php ]; then
            echo "Route cache verification failed!"
            exit 1
          fi
          echo "Route cache verified"

      - name: Deploy to Server
        run: |
          rsync -avz --exclude='.git' \
            --include='bootstrap/cache/*.php' \
            . user@server:/var/www/app/
```

**3. Laravel Forge Deployment Script:**

```bash
cd /home/forge/your-site.com

# Pull latest code
git pull origin $FORGE_SITE_BRANCH

# Install dependencies
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Run migrations
php artisan migrate --force

# Cache everything
php artisan route:cache
php artisan config:cache
php artisan view:cache

# Reload PHP-FPM
( flock -w 10 9 || exit 1
    echo 'Restarting FPM...'; sudo -S service php8.1-fpm reload ) 9>/tmp/fpmlock
```

**4. Laravel Vapor (Serverless):**

Vapor automatically handles route caching during deployment:

```yaml
# vapor.yml
id: 12345
name: your-app
environments:
  production:
    build:
      - 'composer install --no-dev --classmap-authoritative'
      - 'php artisan event:cache'
    deploy:
      - 'php artisan migrate --force'
```

**5. Docker Multi-Stage Build:**

```dockerfile
# Dockerfile
FROM php:8.1-fpm as build

WORKDIR /var/www

# Copy application code
COPY . .

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --classmap-authoritative

# Cache Laravel artifacts
RUN php artisan route:cache && \
    php artisan config:cache && \
    php artisan view:cache && \
    php artisan event:cache

# Production image
FROM php:8.1-fpm

WORKDIR /var/www

# Copy application and cached files
COPY --from=build /var/www /var/www

# Ensure cache files are present
RUN test -f bootstrap/cache/routes-v7.php || exit 1

CMD ["php-fpm"]
```

**6. Makefile for Consistent Commands:**

```makefile
# Makefile
.PHONY: optimize clear-cache verify-cache

optimize:
	@echo "Optimizing Laravel for production..."
	php artisan route:cache
	php artisan config:cache
	php artisan view:cache
	php artisan event:cache
	composer dump-autoload --classmap-authoritative
	@echo "Optimization complete!"

clear-cache:
	@echo "Clearing all caches..."
	php artisan route:clear
	php artisan config:clear
	php artisan view:clear
	php artisan event:clear
	php artisan cache:clear
	@echo "Caches cleared!"

verify-cache:
	@echo "Verifying cache files..."
	@test -f bootstrap/cache/routes-v7.php && echo "✓ Routes cached" || echo "✗ Routes not cached"
	@test -f bootstrap/cache/config.php && echo "✓ Config cached" || echo "✗ Config not cached"
	@test -f bootstrap/cache/views && echo "✓ Views cached" || echo "✗ Views not cached"

# Usage:
# make optimize        # Cache everything for production
# make clear-cache     # Clear all caches for development
# make verify-cache    # Verify cache status
```

**7. Handling Route Cache with Closure Routes:**

```php
// routes/web.php - AVOID closures in routes if you want to cache

// ❌ BAD - Cannot be cached
Route::get('/profile', function () {
    return view('profile');
});

// ✅ GOOD - Can be cached
Route::get('/profile', [ProfileController::class, 'show']);
```

If you have closure routes, you'll get this error:
```
Unable to prepare route [/example] for serialization. Uses Closure.
```

**Fix:** Convert all closure routes to controller actions:

```bash
# Generate controller
php artisan make:controller ProfileController

# Move logic from route closure to controller method
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- CI environments often use different caching strategies than production
- CI pipelines may run with uncached routes for test flexibility
- Prevents false failures when CI environments legitimately skip route caching

**When to run this analyzer:**
- ✅ **Local development**: Ensures you haven't accidentally cached routes locally
- ✅ **Staging/Production servers**: Validates route caching is properly enabled
- ❌ **CI/CD pipelines**: Skipped automatically (deployment-specific check)

## References

- [Laravel Route Caching Documentation](https://laravel.com/docs/routing#route-caching)
- [Laravel Deployment Best Practices](https://laravel.com/docs/deployment#optimization)
- [Optimizing Laravel Performance](https://laravel.com/docs/deployment#optimization)

## Related Analyzers

- [Configuration Caching Analyzer](/analyzers/performance/config-caching) - Ensures config is cached in production
- [View Caching Analyzer](/analyzers/performance/view-caching) - Ensures Blade views are properly compiled
- **[Composer Autoloader Optimization Analyzer](/analyzers/performance/autoloader-optimization)** - Ensures Composer autoloader is optimized for production performance
