---
title: Compression Headers Analyzer
description: Checks if gzip or brotli compression is enabled for static assets
icon: archive
outline: [2, 3]
tags: compression,gzip,brotli,headers,performance
---

# Compression Headers Analyzer

| Analyzer ID            | Category       | Severity   | Time To Fix  |
| -----------------------| :------------: |:----------:| ------------:|
| `compression-headers`  | ⚡ Performance  | Medium     | 30 minutes   |

## What This Checks

Verifies that your web server returns compressed responses (gzip or brotli) for static assets like JavaScript, CSS, and HTML files.

## Why It Matters

- **Bandwidth Reduction:** Compression reduces transfer size by 60-90% for text-based assets
- **Faster Load Times:** Smaller files download faster, especially on slow connections
- **Cost Savings:** Less bandwidth usage reduces hosting costs
- **Better UX:** Users experience faster page loads

| File Type | Original Size | Gzip | Brotli |
|-----------|---------------|------|--------|
| JavaScript (minified) | 500 KB | 150 KB | 125 KB |
| CSS (minified) | 100 KB | 25 KB | 20 KB |
| HTML | 50 KB | 10 KB | 8 KB |

Brotli typically provides 15-20% better compression than gzip.

## How to Fix

### Nginx Configuration

```nginx
# /etc/nginx/nginx.conf or /etc/nginx/sites-available/yoursite

http {
    # Enable gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_comp_level 6;
    gzip_proxied any;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/json
        application/javascript
        application/x-javascript
        application/xml
        application/xml+rss
        application/vnd.ms-fontobject
        font/ttf
        font/otf
        font/woff
        font/woff2
        image/svg+xml;

    # Enable brotli (requires ngx_brotli module)
    brotli on;
    brotli_comp_level 6;
    brotli_types
        text/plain
        text/css
        text/javascript
        application/json
        application/javascript
        application/x-javascript
        application/xml
        application/xml+rss
        font/ttf
        font/otf
        font/woff
        font/woff2
        image/svg+xml;
}
```

**Install Brotli for Nginx:**
```bash
# Ubuntu/Debian
sudo apt-get install libnginx-mod-brotli

# Or compile from source
git clone https://github.com/google/ngx_brotli.git
cd ngx_brotli && git submodule update --init
# Add --add-module=/path/to/ngx_brotli when compiling nginx
```

### Apache Configuration

```apache
# .htaccess or httpd.conf

# Enable mod_deflate
<IfModule mod_deflate.c>
    # Compress HTML, CSS, JavaScript, Text, XML and fonts
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE font/ttf
    AddOutputFilterByType DEFLATE font/woff
    AddOutputFilterByType DEFLATE font/woff2
    AddOutputFilterByType DEFLATE image/svg+xml

    # Compression level
    DeflateCompressionLevel 6
</IfModule>

# Enable mod_brotli (Apache 2.4.26+)
<IfModule mod_brotli.c>
    AddOutputFilterByType BROTLI_COMPRESS text/html text/css
    AddOutputFilterByType BROTLI_COMPRESS text/javascript application/javascript
    AddOutputFilterByType BROTLI_COMPRESS application/json application/xml
    AddOutputFilterByType BROTLI_COMPRESS font/ttf font/woff font/woff2
    AddOutputFilterByType BROTLI_COMPRESS image/svg+xml
</IfModule>
```

**Enable Apache modules:**
```bash
sudo a2enmod deflate
sudo a2enmod brotli  # Apache 2.4.26+
sudo systemctl restart apache2
```

### Laravel Vapor / Serverless

Laravel Vapor automatically configures compression through CloudFront. No additional configuration needed.

### Docker with Nginx

```dockerfile
# Dockerfile
FROM nginx:alpine

# Install brotli module
RUN apk add --no-cache nginx-mod-http-brotli

COPY nginx.conf /etc/nginx/nginx.conf
```

### CDN Configuration

Most CDNs handle compression automatically:

| CDN | Gzip | Brotli | Configuration |
|-----|------|--------|---------------|
| Cloudflare | Auto | Auto | Enabled by default |
| AWS CloudFront | Auto | Config | Enable "Compress Objects Automatically" |
| Bunny CDN | Auto | Auto | Enabled by default |

## Verification

**Using curl:**
```bash
# Check for gzip
curl -H "Accept-Encoding: gzip" -I https://yoursite.com/js/app.js

# Check for brotli
curl -H "Accept-Encoding: br" -I https://yoursite.com/js/app.js

# Look for: Content-Encoding: gzip (or br)
```

**Using browser DevTools:**
1. Open DevTools (F12)
2. Go to Network tab
3. Load your page
4. Check "Content-Encoding" response header for assets

**Using online tools:**
- [KeyCDN Compression Test](https://tools.keycdn.com/compression-test)
- [GTmetrix](https://gtmetrix.com)
- [Google PageSpeed Insights](https://pagespeed.web.dev)

## Pre-Compressed Assets

For maximum performance, pre-compress assets during build:

**Webpack/Mix:**
```javascript
// webpack.mix.js
const CompressionPlugin = require('compression-webpack-plugin');

mix.webpackConfig({
    plugins: [
        new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|svg)$/,
        }),
        new CompressionPlugin({
            algorithm: 'brotliCompress',
            test: /\.(js|css|svg)$/,
            filename: '[path][base].br',
        }),
    ],
});
```

**Nginx serving pre-compressed:**
```nginx
location ~* \.(js|css)$ {
    gzip_static on;
    brotli_static on;
}
```

## ShieldCI Configuration

This analyzer:
- Runs only in **production** and **staging** environments
- Makes HTTP requests to verify actual compression
- Checks JS and CSS assets from your Mix/Vite manifest

## References

- [Nginx gzip Module](https://nginx.org/en/docs/http/ngx_http_gzip_module.html)
- [Apache mod_deflate](https://httpd.apache.org/docs/current/mod/mod_deflate.html)
- [Brotli Compression](https://github.com/google/brotli)
- [Web.dev Compression Guide](https://web.dev/reduce-network-payloads-using-text-compression/)

## Related Analyzers

- [CDN Configuration Analyzer](/analyzers/performance/cdn-configuration) - Ensures CDN is configured
- [Asset Minification Analyzer](/analyzers/performance/asset-minification) - Ensures assets are minified
- [Cache Headers Analyzer](/analyzers/performance/asset-cache-headers) - Ensures proper cache headers
