---
title: Compression Headers Analyzer
description: Checks if gzip, brotli, or zstd compression is enabled for static assets
icon: archive
outline: [2, 3]
tags: compression,gzip,brotli,zstd,headers,performance
pro: true
---

# Compression Headers Analyzer

| Analyzer ID            | Category       | Severity   | Time To Fix  |
| -----------------------| :------------: |:----------:| ------------:|
| `compression-headers`  | ⚡ Performance  | Medium     | 30 minutes   |

## What This Checks

Verifies that your web server returns compressed responses for static assets like JavaScript, CSS, and HTML files. Recognised encodings are `gzip`, `br` (brotli), `zstd` (zstandard), and `deflate`.

Checks for:

- `Content-Encoding` response header present on JS and CSS assets
- A recognised compression encoding (`gzip`, `br`, `zstd`, `deflate`)
- Correct `Accept-Encoding` negotiation (brotli is only advertised on HTTPS sites)

> **Note:** Brotli (`br`) is only negotiated over HTTPS. The analyzer reflects this — brotli is only checked on HTTPS sites.

## Why It Matters

- **Bandwidth Reduction:** Compression reduces transfer size by 60-90% for text-based assets, directly cutting hosting costs
- **Faster Load Times:** Smaller files download faster, especially on slow or mobile connections — gzip cuts JS by ~70%, brotli by ~75%
- **Core Web Vitals:** Faster asset delivery improves LCP and FID scores, which affect SEO rankings
- **Production Critical:** Uncompressed assets are one of the easiest performance wins to miss in server configuration

## How to Fix

### Quick Fix (5 minutes)

Enable gzip in your web server with the minimum required configuration:

**Nginx:**
```nginx
# /etc/nginx/nginx.conf
http {
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;
}
```

**Apache:**
```bash
sudo a2enmod deflate
sudo systemctl restart apache2
```

```apache
# .htaccess or httpd.conf
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>
```

**CDN (no server config needed):**
Most CDNs compress automatically — enable "Compress Objects Automatically" in AWS CloudFront, or verify it is on in Cloudflare's Speed settings.

### Proper Fix (30 minutes)

For full compression coverage including brotli (HTTPS only) and pre-compressed asset serving:

**Nginx — gzip + brotli:**
```nginx
http {
    # Gzip (all connections)
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_comp_level 6;
    gzip_proxied any;
    gzip_types
        text/plain text/css text/javascript
        application/json application/javascript application/x-javascript
        application/xml application/xml+rss
        font/ttf font/otf font/woff font/woff2
        image/svg+xml;

    # Brotli (requires ngx_brotli module — HTTPS only in browsers)
    brotli on;
    brotli_comp_level 6;
    brotli_types
        text/plain text/css text/javascript
        application/json application/javascript application/x-javascript
        application/xml font/ttf font/woff font/woff2
        image/svg+xml;
}
```

**Install brotli module for Nginx:**
```bash
# Ubuntu/Debian
sudo apt-get install libnginx-mod-brotli

# Alpine (Docker)
apk add --no-cache nginx-mod-http-brotli
```

**Apache — mod_deflate + mod_brotli:**
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css
    AddOutputFilterByType DEFLATE text/javascript application/javascript
    AddOutputFilterByType DEFLATE application/json application/xml
    AddOutputFilterByType DEFLATE font/ttf font/woff font/woff2 image/svg+xml
    DeflateCompressionLevel 6
</IfModule>

# Apache 2.4.26+ only
<IfModule mod_brotli.c>
    AddOutputFilterByType BROTLI_COMPRESS text/html text/css
    AddOutputFilterByType BROTLI_COMPRESS text/javascript application/javascript
    AddOutputFilterByType BROTLI_COMPRESS application/json application/xml
    AddOutputFilterByType BROTLI_COMPRESS font/ttf font/woff font/woff2 image/svg+xml
</IfModule>
```

**Serve pre-compressed assets (maximum performance):**

Build pre-compressed versions during your asset pipeline:
```javascript
// webpack.mix.js
const CompressionPlugin = require('compression-webpack-plugin');

mix.webpackConfig({
    plugins: [
        new CompressionPlugin({ algorithm: 'gzip', test: /\.(js|css|svg)$/ }),
        new CompressionPlugin({ algorithm: 'brotliCompress', test: /\.(js|css|svg)$/, filename: '[path][base].br' }),
    ],
});
```

Then tell Nginx to serve them directly instead of compressing on the fly:
```nginx
location ~* \.(js|css)$ {
    gzip_static on;
    brotli_static on;
}
```

**Verify compression is working:**
```bash
curl -H "Accept-Encoding: gzip, br" -I https://yoursite.com/js/app.js
# Look for: Content-Encoding: gzip (or br)
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`) and only runs in production and staging environments.

**Why skip in CI and development?**
- Compression is a web server configuration — it cannot be verified without a running server
- Local and CI environments typically serve assets without a web server in front of them
- Production and staging should have a properly configured web server (Nginx, Apache, or CDN)

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

## References

- [Nginx gzip Module](https://nginx.org/en/docs/http/ngx_http_gzip_module.html)
- [Apache mod_deflate](https://httpd.apache.org/docs/current/mod/mod_deflate.html)
- [ngx_brotli Module](https://github.com/google/ngx_brotli)
- [Web.dev Compression Guide](https://web.dev/reduce-network-payloads-using-text-compression/)

## Related Analyzers

- [CDN Configuration Analyzer](/analyzers/performance/cdn-configuration) - Ensures CDN is configured
- [Asset Minification Analyzer](/analyzers/performance/asset-minification) - Ensures assets are minified before compression
- [Cache Headers Analyzer](/analyzers/performance/asset-cache-headers) - Ensures proper cache headers are set
