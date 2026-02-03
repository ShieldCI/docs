---
title: CDN Configuration Analyzer
description: Checks if a CDN is configured for serving static assets
icon: globe
outline: [2, 3]
tags: cdn,assets,performance,optimization,infrastructure
---

# CDN Configuration Analyzer

| Analyzer ID          | Category       | Severity   | Time To Fix  |
| ---------------------| :------------: |:----------:| ------------:|
| `cdn-configuration`  | ⚡ Performance  | Low        | 60 minutes   |

## What This Checks

Validates that the `ASSET_URL` configuration points to a CDN for serving static assets (JavaScript, CSS, images) in production environments.

## Why It Matters

- **Reduced Latency:** CDNs serve assets from edge locations closer to users
- **Bandwidth Offloading:** Origin server handles less static file traffic
- **Global Performance:** Consistent fast loading worldwide
- **Scalability:** CDNs can handle traffic spikes without affecting your origin
- **Caching:** Edge caching reduces load on your infrastructure

For public-facing applications with global users, a CDN can reduce asset loading times by 50-80%.

## How to Fix

### 1. Choose a CDN Provider

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| Cloudflare | Yes | Easy setup, includes DDoS protection |
| AWS CloudFront | Pay-as-you-go | Integrates with S3 and Laravel Vapor |
| Bunny CDN | Very cheap | ~$1/TB, good performance |
| DigitalOcean Spaces CDN | With Spaces | Simple S3-compatible |
| Fastly | Pay-as-you-go | Enterprise-grade |

### 2. Configure Laravel

**In `.env`:**

```env
ASSET_URL=https://cdn.yourdomain.com
# or
ASSET_URL=https://d123456789.cloudfront.net
```

**In `config/app.php`:**

```php
'asset_url' => env('ASSET_URL'),
```

### 3. Update Asset References

**In Blade templates:**

```blade
{{-- This automatically uses ASSET_URL --}}
<link href="{{ asset('css/app.css') }}" rel="stylesheet">
<script src="{{ asset('js/app.js') }}"></script>
<img src="{{ asset('images/logo.png') }}" alt="Logo">

{{-- Or with Vite --}}
@vite(['resources/css/app.css', 'resources/js/app.js'])
```

### CDN Setup Examples

**Cloudflare (Easiest):**
1. Add your domain to Cloudflare
2. Enable "Proxy" status for your domain
3. Assets are automatically cached at edge
4. No `ASSET_URL` change needed (Cloudflare proxies everything)

**AWS CloudFront with S3:**
```bash
# 1. Create S3 bucket for assets
aws s3 mb s3://my-app-assets

# 2. Sync public directory
aws s3 sync public/ s3://my-app-assets/ --exclude "*.php"

# 3. Create CloudFront distribution pointing to S3
# 4. Update .env
ASSET_URL=https://d123456789.cloudfront.net
```

**Laravel Vapor:**
```yaml
# vapor.yml
environments:
  production:
    # Vapor automatically configures CloudFront
    # Assets are uploaded to S3 and served via CDN
```

**Bunny CDN:**
```env
# .env
ASSET_URL=https://your-zone.b-cdn.net
```

### Deployment Automation

**Deploy script with asset sync:**

```bash
#!/bin/bash
# deploy.sh

# Build assets
npm run build

# Sync to S3 (or your CDN origin)
aws s3 sync public/build s3://my-app-assets/build \
  --cache-control "max-age=31536000,public" \
  --delete

# Invalidate CDN cache (optional, for cache busting)
aws cloudfront create-invalidation \
  --distribution-id E1234567890 \
  --paths "/build/*"
```

### Mix/Vite Configuration

**Laravel Mix:**
```javascript
// webpack.mix.js
mix.js('resources/js/app.js', 'public/js')
   .sass('resources/sass/app.scss', 'public/css')
   .version();  // Adds hash for cache busting
```

**Vite:**
```javascript
// vite.config.js
export default defineConfig({
    plugins: [laravel(['resources/js/app.js', 'resources/css/app.css'])],
    build: {
        manifest: true,  // Required for asset versioning
    }
});
```

## When Not to Use CDN

- **Internal applications:** Only accessed from within your network
- **Development/Staging:** CDN adds complexity; test with origin
- **Highly dynamic content:** CDN is for static assets only
- **Simple apps:** Overhead may not be worth it for small apps

## ShieldCI Configuration

This analyzer:
- Runs only in **production** environment
- Skips if no compiled assets exist (no Mix/Vite manifest)
- Checks if `ASSET_URL` is set
- Warns if `ASSET_URL` points to the same host as `APP_URL`

## Verification

```bash
# Check ASSET_URL configuration
php artisan tinker
>>> config('app.asset_url')
=> "https://cdn.yourdomain.com"

# Verify asset helper output
>>> asset('js/app.js')
=> "https://cdn.yourdomain.com/js/app.js"
```

## References

- [Laravel Asset Helpers](https://laravel.com/docs/helpers#method-asset)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Cloudflare CDN Setup](https://developers.cloudflare.com/cache/)
- [Laravel Vapor CDN](https://docs.vapor.build/1.0/projects/deployments.html#assets)

## Related Analyzers

- [Asset Minification Analyzer](/analyzers/performance/asset-minification) - Ensures assets are minified
- [Compression Headers Analyzer](/analyzers/performance/compression-headers) - Ensures gzip/brotli compression
- [Cache Headers Analyzer](/analyzers/performance/asset-cache-headers) - Ensures proper cache headers
