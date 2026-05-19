---
title: CDN Configuration Analyzer
description: Checks if a CDN is configured for serving static assets
icon: globe
outline: [2, 3]
tags: cdn,assets,performance,optimization,infrastructure
pro: true
---

# CDN Configuration Analyzer

| Analyzer ID          | Category       | Severity   | Time To Fix  |
| ---------------------| :------------: |:----------:| ------------:|
| `cdn-configuration`  | ⚡ Performance  | Low        | 60 minutes   |

## What This Checks

Validates that `ASSET_URL` in your `.env` file points to a CDN for serving static assets (JavaScript, CSS, images) in production environments. Checks for:

- `ASSET_URL` not set or empty (assets served from origin)
- `ASSET_URL` is not a valid absolute URL (missing scheme or host)
- `ASSET_URL` points to a local address (`localhost`, `127.0.0.1`, `::1`)
- `ASSET_URL` uses HTTP instead of HTTPS
- `ASSET_URL` points to the same host as `APP_URL` (not a CDN)

Only runs when compiled assets exist (Mix or Vite manifest detected).

## Why It Matters

- **Latency:** CDNs serve assets from edge locations geographically closer to users, reducing round-trip time for every asset request
- **Bandwidth:** Origin server handles less static file traffic, freeing capacity for dynamic requests
- **Scalability:** CDN edge networks absorb traffic spikes without impacting your origin
- **Security:** HTTPS on the CDN prevents mixed-content browser warnings and protects asset integrity in transit

For public-facing applications with global users, a CDN can reduce asset loading times by 50–80%.

## How to Fix

### Quick Fix (10 minutes)

Set `ASSET_URL` in your `.env` to point to your CDN distribution:

```env
ASSET_URL=https://cdn.yourdomain.com
# or using a provider-issued hostname:
ASSET_URL=https://d123456789.cloudfront.net
```

Ensure `config/app.php` reads from the environment:

```php
'asset_url' => env('ASSET_URL'),
```

Laravel's `asset()` helper and Vite/Mix will automatically prefix all asset URLs with this value. No template changes needed.

### Proper Fix (60 minutes)

**1. Choose a CDN Provider**

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| Cloudflare | Yes | Easy setup, includes DDoS protection |
| AWS CloudFront | Pay-as-you-go | Integrates with S3 and Laravel Vapor |
| Bunny CDN | ~$1/TB | Cost-effective, good global performance |
| DigitalOcean Spaces CDN | With Spaces | Simple S3-compatible storage + CDN |
| Fastly | Pay-as-you-go | Enterprise-grade |

**2. Sync Assets and Configure**

**AWS CloudFront with S3:**

```bash
# Build assets
npm run build

# Sync to S3 (your CDN origin)
aws s3 sync public/build s3://my-app-assets/build \
  --cache-control "max-age=31536000,public" \
  --delete

# Optionally invalidate cache after deploy
aws cloudfront create-invalidation \
  --distribution-id E1234567890 \
  --paths "/build/*"
```

```env
ASSET_URL=https://d123456789.cloudfront.net
```

**Cloudflare (proxy mode):**

1. Add your domain to Cloudflare and enable proxy status
2. Assets are automatically cached at the edge. No `ASSET_URL` change needed

**Bunny CDN:**

```env
ASSET_URL=https://your-zone.b-cdn.net
```

**Laravel Vapor:**

Vapor automatically configures CloudFront and uploads assets to S3 on every deploy. No manual CDN setup required.

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`) and in non-production environments. CDN setup is a production concern and should not generate noise during local development or testing.

It also skips when no compiled assets are detected (no `public/mix-manifest.json` or `public/build/manifest.json`).

## References

- [Laravel Asset Helpers](https://laravel.com/docs/helpers#method-asset)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Cloudflare CDN Setup](https://developers.cloudflare.com/cache/)
- [Laravel Vapor CDN](https://docs.vapor.build/1.0/projects/deployments.html#assets)

## Related Analyzers

- [Asset Minification Analyzer](/analyzers/performance/asset-minification) - Ensures assets are minified
- [Compression Headers Analyzer](/analyzers/performance/compression-headers) - Ensures gzip/brotli compression
- [Cache Headers Analyzer](/analyzers/performance/asset-cache-headers) - Ensures proper cache headers
