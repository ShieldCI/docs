---
title: Asset Minification Analyzer
description: Validates that JavaScript and CSS assets are minified for production, preventing oversized bundles that slow page loads and hurt Core Web Vitals scores
icon: zap
outline: [2, 3]
tags: assets,minification,performance,javascript,css
---

# Asset Minification Analyzer

| Analyzer ID          | Category       | Severity   | Time To Fix  |
| ---------------------| :------------: |:----------:| ------------:|
| `asset-minification` | ⚡ Performance  | Medium     | 15 minutes   |

## What This Checks

Validates that JavaScript and CSS assets are minified for production deployment.

## Why It Matters

- **Performance:** Minified assets are 50-70% smaller
- **Bandwidth:** Reduces data transfer costs
- **Load Time:** Faster downloads improve page speed

Unminified assets contain whitespace, comments, and verbose code that wastes bandwidth.

## How to Fix

### Quick Fix (5 minutes)

```bash
# Using Laravel Mix
npm run production

# Using Vite
npm run build
```

### Proper Fix (15 minutes)

**Laravel Mix (legacy):**
```js
// webpack.mix.js
mix.js('resources/js/app.js', 'public/js')
   .sass('resources/sass/app.scss', 'public/css')
   .version();  // Enable versioning

if (mix.inProduction()) {
    mix.minify('public/js/app.js');
}
```

**Vite (Laravel 9+):**
```js
// vite.config.js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel(['resources/js/app.js', 'resources/css/app.css']),
    ],
    build: {
        minify: 'terser',  // or 'esbuild'
    },
});
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments and only runs in production and staging environments.

**Why skip in CI and development?**
- Asset minification checks require compiled assets, not applicable in CI
- Local/Development/Testing environments may have unminified assets for debugging, which is acceptable
- Production and staging should have minified assets for optimal performance

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

**Build Path (Optional)**

By default, the analyzer checks the `public` directory for compiled assets. If your build output is in a different location, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'performance' => [
        'enabled' => true,
        
        'asset-minification' => [
            'build_path' => env('SHIELDCI_BUILD_PATH', public_path('dist')),
        ],
    ],
],
```

Or via environment variable:

```ini
# .env
SHIELDCI_BUILD_PATH=/var/www/html/public/build
```

::: tip
By default, the analyzer checks the `public` directory. You only need to configure `analyzers.performance.asset-minification.build_path` if your assets are compiled to a different location (e.g., `public/dist`, `public/build`).
:::


## References

- [Laravel Vite](https://laravel.com/docs/vite)
- [Laravel Mix](https://laravel-mix.com/)

## Related Analyzers

- [Asset Cache Headers Analyzer](/analyzers/performance/asset-cache-headers) - Ensures compiled assets have appropriate cache headers for optimal browser caching
