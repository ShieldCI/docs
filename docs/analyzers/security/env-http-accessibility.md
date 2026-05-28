---
title: Environment File HTTP Accessibility Analyzer
description: Performs runtime HTTP checks to verify that .env files cannot be accessed via web requests
icon: shield-alert
outline: [2, 3]
tags: env,http,security,runtime,web-server,deployment
---

# Environment File HTTP Accessibility Analyzer

| Analyzer ID              | Category     | Severity   | Time To Fix  |
| -------------------------| :----------: |:----------:| ------------:|
| `env-http-accessibility` | 🛡️ Security  | Critical   | 20 minutes   |

## What This Checks

Performs runtime HTTP checks to verify that `.env` files cannot be accessed via web requests. Tests 8 common exposure paths including root level (`/.env`), path traversal (`/../.env`), and misconfigurations in public, storage, app, and config directories. This analyzer complements static file security checks by testing actual HTTP accessibility.

## Why It Matters

- **Critical Security Risk**: Exposed `.env` files leak all application secrets instantly
- **Complete Compromise**: Database passwords, API keys, encryption keys, and payment credentials exposed
- **Cannot Detect Statically**: Web server misconfigurations only visible through runtime HTTP testing
- **Real Attack Vector**: Attackers routinely scan for `/.env` files on discovered domains

Even with proper file permissions and `.gitignore` configuration, web server misconfigurations can expose your `.env` file to the internet. A single misconfigured Apache or Nginx directive can leak your entire production database password, AWS credentials, and payment processing keys to anyone who tries `curl https://yourapp.com/.env`.

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: .env Accessible at Root Level**

```bash
# Test if exposed
curl https://yourapp.com/.env
# If you see APP_KEY=, DB_PASSWORD=, fix immediately!
```

**Apache (.htaccess):**
```apache
# Add to public/.htaccess
<FilesMatch "^\.env">
    Require all denied
</FilesMatch>
```

**Nginx:**
```nginx
# Add to server block
location ~ /\.env {
    deny all;
    return 404;
}

# Restart nginx
sudo systemctl restart nginx
```

**Verify:**
```bash
curl -I https://yourapp.com/.env
# Should return 403 or 404, NOT 200
```

**Scenario 2: .env in Public Directory**

```bash
# IMMEDIATE: Remove .env from public/
rm public/.env

# Verify .env location
ls -la .env
# Should be in project root, NOT public/

# Add to .gitignore if committed
echo "public/.env" >> .gitignore
git rm --cached public/.env
git commit -m "Remove exposed .env from public/"
```

**Scenario 3: Path Traversal Vulnerability**

```bash
# Test vulnerability
curl https://yourapp.com/../.env
# If this works, attackers can bypass restrictions
```

**Nginx Fix:**
```nginx
# Block path traversal attempts
if ($request_uri ~* "\.\.") {
    return 403;
}
```

**Apache Fix:**
```apache
# Block directory traversal
RewriteEngine On
RewriteCond %{THE_REQUEST} \.\./
RewriteRule .* - [F,L]
```

### Proper Fix (20 minutes)

Implement comprehensive web server hardening to prevent `.env` exposure:

**1. Correct Directory Structure**

```
your-app/
├── .env                 ✅ HERE (not publicly accessible)
├── .env.example
├── public/              ← Web server document root points here
│   ├── index.php
│   ├── .htaccess
│   └── storage/         ← Symlink to ../storage/app/public
├── app/
├── config/
└── storage/
```

**2. Apache Production Configuration**

```apache
# /etc/apache2/sites-available/yourapp.conf
<VirtualHost *:80>
    ServerName example.com
    DocumentRoot /var/www/yourapp/public  # Point to public/, NOT root!

    # Deny all dotfiles
    <FilesMatch "^\.">
        Require all denied
    </FilesMatch>

    # Block sensitive files
    <FilesMatch "(\.env|\.git|composer\.json|package\.json)">
        Require all denied
    </FilesMatch>

    # Disable directory listing
    <Directory /var/www/yourapp/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Block path traversal
    RewriteEngine On
    RewriteCond %{THE_REQUEST} \.\./
    RewriteRule .* - [F,L]
</VirtualHost>
```

**Enable and test:**
```bash
sudo a2ensite yourapp.conf
sudo systemctl reload apache2

# Test all paths
curl -I https://yourapp.com/.env
curl -I https://yourapp.com/../.env
curl -I https://yourapp.com/public/.env
# All should return 403 or 404
```

**3. Nginx Production Configuration**

```nginx
# /etc/nginx/sites-available/yourapp
server {
    listen 80;
    server_name example.com;
    root /var/www/yourapp/public;  # Point to public/, NOT root!

    index index.php;

    # Block all dotfiles
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
        return 404;
    }

    # Block sensitive files
    location ~* (composer\.json|package\.json|\.git) {
        deny all;
        return 404;
    }

    # Block path traversal
    if ($request_uri ~* "\.\.") {
        return 403;
    }

    # Disable directory listing
    autoindex off;

    # PHP handling
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

**Enable and test:**
```bash
sudo ln -s /etc/nginx/sites-available/yourapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Verify protection
curl -I https://yourapp.com/.env  # Should fail
```

**4. PHP-FPM Security (Optional but Recommended)**

```ini
# /etc/php/8.1/fpm/pool.d/yourapp.conf
[yourapp]
user = www-data
group = www-data

# Restrict PHP file access to app directories only
php_admin_value[open_basedir] = /var/www/yourapp:/tmp
```

**5. Pre-Deployment Checklist**

```bash
# 1. Verify document root
grep -r "DocumentRoot" /etc/apache2/sites-enabled/  # Apache
grep -r "root" /etc/nginx/sites-enabled/            # Nginx
# Should point to /path/to/app/public

# 2. Test HTTP access to all .env paths
for path in .env ../.env ../../.env public/.env storage/.env app/.env config/.env; do
    echo "Testing: $path"
    curl -I "https://yourapp.com/$path"
done
# All should return 403 or 404

# 3. Verify .env location
ls -la .env
# Should be in project root, not in public/

# 4. Check .gitignore
grep ".env" .gitignore
# Should include .env (but not .env.example)
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- HTTP checks require a live web server, not applicable in CI
- CI environments typically don't have a publicly accessible web server
- Requires actual HTTP requests to test .env file accessibility

**Customization:**

By default, ShieldCI auto-discovers your application's login URL for HTTP testing. If you need to specify a custom URL, you can configure it:

```bash
# Test against staging
SHIELDCI_GUEST_URL=https://staging.yourapp.com \
    php artisan shield:analyze --analyzer=env-http-accessibility

# Or configure in published config file
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'guest_url' => env('SHIELDCI_GUEST_URL'),
```

And in your `.env`:

```ini
# .env
SHIELDCI_GUEST_URL=https://yourapp.com
```

::: tip
ShieldCI automatically discovers your application's URL by checking:
1. Named 'login' route
2. Any route with 'guest' middleware
3. Fallback to root URL '/'

You only need to configure `guest_url` if the auto-discovery doesn't work for your setup.
:::

## References

- [Laravel Deployment Documentation](https://laravel.com/docs/deployment#server-requirements)
- [OWASP Configuration Management](https://owasp.org/www-project-top-ten/)
- [Nginx Security Guide](https://nginx.org/en/docs/http/ngx_http_access_module.html)
- [Apache Security Tips](https://httpd.apache.org/docs/2.4/misc/security_tips.html)

## Related Analyzers

- [Environment File Analyzer](/analyzers/security/env-file) - Checks file permissions and .gitignore
- [Application Key Analyzer](/analyzers/security/app-key-security) - Validates encryption key security
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Ensures debug mode disabled in production
- [Configuration Caching Analyzer](/analyzers/performance/config-caching) - Ensures config is cached in production
