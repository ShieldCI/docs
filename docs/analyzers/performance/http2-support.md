---
title: HTTP/2 Support Analyzer
description: Verifies that HTTP/2 protocol is enabled for your Laravel application, enabling request multiplexing and header compression for improved page load performance
icon: zap
outline: [2, 3]
tags: http2,protocol,performance,infrastructure
pro: true
---

# HTTP/2 Support Analyzer

| Analyzer ID      | Category       | Severity   | Time To Fix  |
| -----------------| :------------: |:----------:| ------------:|
| `http2-support`  | ⚡ Performance  | Medium     | 30 minutes   |

## What This Checks

Verifies that your web server supports HTTP/2 protocol, which provides significant performance improvements over HTTP/1.1.

## Why It Matters

- **Multiplexing:** Multiple requests over a single connection (no head-of-line blocking)
- **Header Compression:** HPACK reduces header overhead by 30-90%
- **Binary Protocol:** More efficient parsing than text-based HTTP/1.1
- **Stream Prioritization:** Important resources loaded first

| Metric | HTTP/1.1 | HTTP/2 | Improvement |
|--------|----------|--------|-------------|
| Connections per domain | 6 | 1 | Fewer connections |
| Header size | ~700 bytes | ~20 bytes | ~97% smaller |
| Page load time | Baseline | 15-50% faster | Significant |

## How to Fix

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/yoursite
# Nginx 1.25.1+ (modern syntax)

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;

    server_name example.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Recommended SSL settings for HTTP/2
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # ... rest of configuration
}
```

::: details Legacy syntax for Nginx 1.9.5–1.25.0
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    # ...
}
```
The `http2` parameter on the `listen` directive was deprecated in Nginx 1.25.1 (June 2023).
:::

**Verify Nginx HTTP/2 support:**
```bash
nginx -V 2>&1 | grep -o http_v2
```

### Apache Configuration

```apache
# httpd.conf or apache2.conf

# Load HTTP/2 module (Apache 2.4.17+)
LoadModule http2_module modules/mod_http2.so

# Enable HTTP/2
Protocols h2 http/1.1

<VirtualHost *:443>
    ServerName example.com

    # HTTP/2 specific settings
    Protocols h2 http/1.1

    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
</VirtualHost>
```

**Enable Apache HTTP/2:**
```bash
sudo a2enmod http2
sudo systemctl restart apache2
```

### Caddy (HTTP/2 by Default)

```txt
# Caddyfile
example.com {
    # HTTP/2 is enabled by default with HTTPS
    root * /var/www/html
    file_server
    php_fastcgi unix//run/php/php8.1-fpm.sock
}
```

### Laravel Vapor

HTTP/2 is enabled by default through AWS CloudFront.

### Docker with Nginx

```dockerfile
FROM nginx:alpine

# HTTP/2 is supported by default in nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
```

### CDN Configuration

| CDN | HTTP/2 | HTTP/3 | Notes |
|-----|--------|--------|-------|
| Cloudflare | Default | Default | No configuration needed |
| AWS CloudFront | Default | Available | Enable in distribution settings |
| Bunny CDN | Default | Default | No configuration needed |
| Fastly | Default | Available | Enable in configuration |

## HTTP/2 Requirements

1. **HTTPS Required:** Browsers only support HTTP/2 over TLS
2. **TLS 1.2+:** Minimum TLS version required
3. **ALPN Support:** Application-Layer Protocol Negotiation for protocol discovery
4. **Modern Web Server:** Nginx 1.9.5+, Apache 2.4.17+

## Verification

**Using curl:**
```bash
# Check HTTP version
curl -sI https://example.com -o /dev/null -w '%{http_version}\n'
# Output: 2 (for HTTP/2)

# Verbose output
curl -vso /dev/null https://example.com 2>&1 | grep -i 'http/2'
```

**Using browser DevTools:**
1. Open DevTools (F12)
2. Go to Network tab
3. Right-click column header → Enable "Protocol" column
4. Reload page and check protocol column (should show "h2")

**Using online tools:**
- [KeyCDN HTTP/2 Test](https://tools.keycdn.com/http2-test)
- [HTTP/2 Test by Cloudflare](https://http2.cloudflare.com/)

## HTTP/3 (QUIC)

HTTP/3 uses QUIC protocol for even better performance:

| Feature | HTTP/2 | HTTP/3 |
|---------|--------|--------|
| Transport | TCP | QUIC (UDP) |
| Connection setup | 2-3 RTTs | 0-1 RTT |
| Head-of-line blocking | At TCP level | Eliminated |
| Mobile performance | Good | Excellent |

**Nginx HTTP/3 (experimental):**
```nginx
server {
    listen 443 ssl;
    listen 443 quic reuseport;
    http2 on;

    ssl_protocols TLSv1.3;

    add_header Alt-Svc 'h3=":443"; ma=86400';
}
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments and only runs in production and staging.

**Why skip in CI and development?**
- The check makes actual HTTP requests to your live application, which is not available in CI pipelines
- HTTP/2 requires HTTPS (`APP_URL` starting with `https://`), typically absent in local and CI environments
- Protocol support is a production infrastructure concern, not a code-correctness concern

**When to run this analyzer:**
- ✅ **Production/Staging servers**: Verifies HTTP/2 (and HTTP/3, informational) is active on your live application
- ❌ **CI/CD pipelines**: Skipped automatically (no live server or HTTPS available)
- ❌ **Local/Development environments**: Skipped (requires HTTPS and a public-facing server)

## References

- [HTTP/2 Specification (RFC 7540)](https://httpwg.org/specs/rfc7540.html)
- [Nginx HTTP/2 Module](https://nginx.org/en/docs/http/ngx_http_v2_module.html)
- [Apache HTTP/2 Guide](https://httpd.apache.org/docs/current/howto/http2.html)
- [Can I Use HTTP/2](https://caniuse.com/http2)

## Related Analyzers

- [HTTPS Configuration](/analyzers/security/hsts-header) - Ensures HTTPS is properly configured
- [Compression Headers Analyzer](/analyzers/performance/compression-headers) - Ensures compression is enabled
- [CDN Configuration Analyzer](/analyzers/performance/cdn-configuration) - Ensures CDN is configured
