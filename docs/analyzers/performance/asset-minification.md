---
title: Asset Minification
description: Validates that JavaScript and CSS assets are minified for production deployment
icon: zap
outline: [2, 3]
---

# Asset Minification

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

### Proper Fix (30 minutes)

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

## References

- [Laravel Vite](https://laravel.com/docs/vite)
- [Laravel Mix](https://laravel-mix.com/)

## Related Analyzers

- [Cache Headers](/analyzers/performance/cache-header)
