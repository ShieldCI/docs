---
title: Composer Autoloader Optimization
description: Validates that Composer's autoloader is optimized for production performance by checking for classmap optimization
icon: zap
outline: [2, 3]
---

# Composer Autoloader Optimization

## What This Checks

Validates that Composer's autoloader is optimized for production performance by checking for classmap optimization and authoritative classmap configuration.

## Why It Matters

- **Performance Impact:** Unoptimized autoloaders can slow down every single request by 10-30% as PHP searches through PSR-4 and PSR-0 rules
- **Production Critical:** This check only runs in production and staging environments where performance matters most
- **Bootstrap Speed:** Optimized autoloaders improve application bootstrap time significantly by converting namespace rules into fast classmap lookups

Laravel applications with many classes benefit the most from autoloader optimization. Without it, every class load requires filesystem checks and rule processing, adding measurable latency to each request.

## How to Fix

### Quick Fix (5 minutes)

Run the optimization command during deployment:

**Before (❌):**
```bash
# Deploying without optimization
composer install
php artisan optimize
```

**After (✅):**
```bash
# Deploy with autoloader optimization
composer install --optimize-autoloader
# OR run after install
composer dump-autoload -o
```

### Proper Fix (30 minutes)

For maximum performance, implement authoritative classmap mode in your deployment pipeline:

**Best Practice:**

1. **Add to composer.json:**
```json
{
    "config": {
        "optimize-autoloader": true,
        "classmap-authoritative": true
    }
}
```

2. **Update deployment script:**
```bash
# In your deployment script (deploy.sh, CI/CD pipeline, etc.)
composer install --no-dev --optimize-autoloader --classmap-authoritative
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

3. **Verify optimization:**
```bash
# Check if optimization is active
php -r "
\$classMap = include 'vendor/composer/autoload_classmap.php';
echo 'Classmap entries: ' . count(\$classMap) . PHP_EOL;
\$realPath = include 'vendor/composer/autoload_real.php';
echo 'Authoritative: ' . (strpos(file_get_contents('vendor/composer/autoload_real.php'), 'setClassMapAuthoritative(true)') !== false ? 'YES' : 'NO') . PHP_EOL;
"
```

**Environment-Specific Configuration:**

```php
// bootstrap/app.php or service provider
if (app()->environment('production', 'staging')) {
    // Autoloader should already be optimized via composer.json config
    // This is just a runtime verification
    if (!file_exists(base_path('vendor/composer/autoload_classmap.php'))) {
        logger()->warning('Autoloader classmap not found - performance will be degraded');
    }
}
```

## Common Mistakes to Avoid

1. **Running optimization in development:** Don't optimize autoloader locally - it makes development harder as class changes won't be picked up
   ```bash
   # DON'T do this in local development
   composer dump-autoload -o  # ❌
   ```

2. **Forgetting to run after class changes:** When adding new classes in production, remember to regenerate
   ```bash
   # After adding new classes in production
   composer dump-autoload --classmap-authoritative  # ✅
   ```

3. **Not using authoritative mode:** Regular optimization (`-o`) is good, but authoritative mode is better
   ```bash
   composer dump-autoload -o                        # Good ⚠️
   composer dump-autoload --classmap-authoritative  # Better ✅
   ```

4. **Mixing PSR-4 and classmap incorrectly:** Ensure your composer.json autoload section is properly configured
   ```json
   {
       "autoload": {
           "psr-4": {
               "App\\": "app/",
               "Database\\Factories\\": "database/factories/",
               "Database\\Seeders\\": "database/seeders/"
           }
       }
   }
   ```

## References

- [Composer Autoloader Optimization Documentation](https://getcomposer.org/doc/articles/autoloader-optimization.md)
- [Laravel Deployment Best Practices](https://laravel.com/docs/deployment#optimization)
- [PHP Autoloading Performance Guide](https://www.php.net/manual/en/language.oop5.autoload.php)

## Related Analyzers

- [Configuration Caching](/analyzers/performance/config-caching) - Cache configuration for faster bootstrap
- [Route Caching](/analyzers/performance/route-caching) - Optimize route loading
- [OPcache Enabled](/analyzers/performance/opcache-enabled) - PHP bytecode caching
