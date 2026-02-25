---
title: Cache Busting Analyzer
description: Verifies frontend assets use cache busting to prevent stale asset delivery after deployments
icon: refresh-cw
outline: [2, 3]
tags: cache-busting,assets,versioning,reliability,deployment
pro: true
---

# Cache Busting Analyzer

| Analyzer ID      | Category       | Severity | Time To Fix |
| -----------------| :------------: |:--------:| -----------:|
| `cache-busting`  | ✅ Reliability |   High   | 10 minutes  |

## What This Checks

- Verifies that Laravel Mix or Vite manifests exist and are valid
- Ensures Laravel Mix versioning is enabled (checks for `?id=` query strings in `mix-manifest.json`)
- Validates Vite manifest presence when a `vite.config.js` or `vite.config.ts` file is detected
- Checks manifest file readability and JSON validity
- Detects stale manifests older than 7 days that may indicate forgotten asset rebuilds
- Supports both `public/build/manifest.json` and `public/build/.vite/manifest.json` paths for Vite
- Only runs in production and staging environments
- Automatically skips in CI environments

## Why It Matters

- **Stale assets after deployments**: Without cache busting, browsers serve cached CSS/JS files even after you deploy new code, causing broken layouts and JavaScript errors
- **User experience degradation**: Users see outdated styles, missing functionality, or broken interactions until they manually clear their browser cache
- **Deployment reliability**: Cache busting ensures every deployment delivers fresh assets to all users immediately
- **CDN compatibility**: Cache-busted URLs work correctly with CDNs, which cache assets aggressively based on URL
- **Debugging difficulty**: Stale assets create hard-to-reproduce bugs that only affect some users depending on their cache state

## How to Fix

### Quick Fix (Laravel Mix)

Enable versioning in your `webpack.mix.js`:

```js
// ❌ BAD - No versioning
mix.js('resources/js/app.js', 'public/js')
   .css('resources/css/app.css', 'public/css');

// ✅ GOOD - Versioning enabled
mix.js('resources/js/app.js', 'public/js')
   .css('resources/css/app.css', 'public/css')
   .version();
```

Then rebuild assets:

```bash
npm run production
```

Your `mix-manifest.json` should now contain versioned URLs:

```json
{
    "/js/app.js": "/js/app.js?id=abc123def456",
    "/css/app.css": "/css/app.css?id=789ghi012jkl"
}
```

### Quick Fix (Vite)

Vite uses content-hashed filenames by default, so versioning is inherent. Ensure the manifest is generated:

```bash
npm run build
```

Verify the manifest exists at `public/build/manifest.json`:

```json
{
    "resources/js/app.js": {
        "file": "assets/app-4ed993c7.js",
        "src": "resources/js/app.js",
        "isEntry": true,
        "css": ["assets/app-bfa26aef.css"]
    }
}
```

### Proper Fix

1. **Automate asset builds in your deployment pipeline**:

```bash
# deploy.sh or CI/CD pipeline
npm ci
npm run build   # or npm run production for Mix
php artisan optimize
```

2. **Use the correct Blade helpers** to load versioned assets:

```blade
{{-- Laravel Mix --}}
<link rel="stylesheet" href="{{ mix('css/app.css') }}">
<script src="{{ mix('js/app.js') }}"></script>

{{-- Vite --}}
@vite(['resources/css/app.css', 'resources/js/app.js'])
```

3. **Add the manifest to version control** (optional but recommended for Mix):

```bash
# .gitignore - keep manifest tracked
# public/mix-manifest.json  ← do NOT ignore this
```

4. **Set proper cache headers** on your web server for hashed assets:

```nginx
# nginx.conf
location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments and only runs in production and staging.

**When to run this analyzer:**
- ✅ **Production/Staging servers**: Confirms assets are properly versioned
- ✅ **Local development**: Validates manifest existence and configuration
- ❌ **CI/CD pipelines**: Skipped automatically (manifest may not be built yet)

## References

- [Laravel Mix Versioning](https://laravel-mix.com/docs/main/versioning)
- [Laravel Vite Plugin](https://laravel.com/docs/vite)
- [Cache Busting Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

## Related Analyzers

- [Cache Status Analyzer](/analyzers/reliability/cache-status) - Verifies cache driver connectivity and operation
- [Cache Prefix Configuration Analyzer](/analyzers/reliability/cache-prefix-configuration) - Ensures cache prefix is set to avoid collisions
