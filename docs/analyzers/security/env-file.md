---
title: Environment File Analyzer
description: Validates that Laravel environment files are properly secured against exposure and credential leaks
icon: lock
outline: [2, 3]
tags: env,environment,secrets,security,configuration
---

# Environment File Analyzer

| Analyzer ID         | Category     | Severity   | Time To Fix  |
| --------------------| :----------: |:----------:| ------------:|
| `env-file` | 🛡️ Security  | Critical       | 10 minutes   |

## What This Checks

Validates that Laravel environment files are properly secured against exposure and credential leaks. Detects `.env` files in public directories, real credentials in `.env.example`, missing `.gitignore` entries, files committed to git repositories, and insecure file permissions that could expose database passwords, API keys, and other sensitive configuration data.

## Why It Matters

- **Security Risk:** CRITICAL - Exposed .env files leak all application secrets instantly
- **HTTP Accessibility:** .env files in public directories can be downloaded directly via browser
- **Git History:** Once committed, credentials persist in version control history forever
- **File Permissions:** World-readable permissions allow any server user to read secrets
- **Compliance:** GDPR, PCI DSS, and SOC 2 require proper access controls for sensitive data

A single exposed `.env` file can compromise your entire application. Real-world impacts include:
- Database credentials stolen leading to complete data breaches
- AWS keys used for cryptocurrency mining resulting in massive bills
- API keys enabling unauthorized access to third-party services
- Session secrets allowing attackers to forge authenticated sessions
- Complete application takeover through credential reuse

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: .env in Public Directory**

```bash
# Move .env to application root (one level up from public)
mv public/.env .env

# Verify it's not accessible via HTTP
curl https://yoursite.com/.env
# Should return: 404 Not Found
```

**Scenario 2: .env Not in .gitignore**

```bash
# Add .env to .gitignore
echo ".env" >> .gitignore

# Verify
git check-ignore .env
# Should output: .env
```

**Scenario 3: Insecure File Permissions**

```bash
# Set secure permissions (owner read/write only)
chmod 600 .env

# Verify
ls -la .env
# Should show: -rw------- (600)

# For production with web server
chown www-data:www-data .env
chmod 600 .env
```

### Proper Fix (10 minutes)

Implement comprehensive environment file security:

**1. Secure File Location and Permissions**

```bash
# Ensure .env is in application root, not public directory
# Correct structure:
/var/www/
├── .env              ← Here (600 permissions)
├── app/
├── config/
└── public/
    ├── index.php
    └── .htaccess

# Set secure permissions
chmod 600 .env
chown www-data:www-data .env

# Verify not accessible via web
curl https://yoursite.com/.env          # Should 404
curl https://yoursite.com/../.env       # Should 404
```

**2. Configure .gitignore Properly**

```
# .gitignore - Comprehensive environment file exclusion

# Environment files
.env
.env.*
!.env.example

# Environment backups
.env.backup
.env.save
.env.old

# IDE environment files
.env.local
.env.*.local
```

**3. Remove .env from Git History (If Already Committed)**

```bash
# WARNING: This rewrites history - coordinate with team first

# 1. Remove from tracking (keeps local file)
git rm --cached .env

# 2. Add to .gitignore
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Remove .env from version control"

# 3. CRITICAL: Rotate ALL exposed credentials immediately
php artisan key:generate --force
# Change database passwords, API keys, AWS credentials, etc.

# 4. Remove from history (if repo is private)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 5. Force push after team coordination
git push origin --force --all
git push origin --force --tags
```

**4. Create Secure .env.example Template**

```ini
# .env.example - Safe template (committed to git)

# Application
APP_NAME="Laravel Application"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://yourapp.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=

# Cache & Sessions
CACHE_DRIVER=redis
SESSION_DRIVER=redis
REDIS_PASSWORD=

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=
MAIL_PASSWORD=

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1

# Third-Party APIs
STRIPE_KEY=pk_test_
STRIPE_SECRET=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
```

**5. Add Web Server Protection**

```nginx
# Nginx - Block access to environment files
location ~ /\.env {
    deny all;
    return 404;
}

location ~ /\. {
    deny all;
    return 404;
}
```

```apache
# Apache - .htaccess protection
<FilesMatch "^\.env">
    Order allow,deny
    Deny from all
</FilesMatch>
```

**6. Implement Deployment Security**

```bash
# deploy.sh - Secure deployment script

#!/bin/bash
set -e

# Copy environment template
cp .env.example .env

# Set secure permissions BEFORE adding secrets
chmod 600 .env

# Load secrets from secure vault (recommended)
# aws secretsmanager get-secret-value --secret-id prod/app/env

# Verify permissions
if [ "$(stat -c %a .env)" != "600" ]; then
    echo "Error: .env must have 600 permissions"
    exit 1
fi

# Clear caches
php artisan config:clear
php artisan cache:clear
php artisan config:cache
```

## References

- [Laravel Environment Configuration Documentation](https://laravel.com/docs/configuration#environment-configuration)
- [OWASP Sensitive Data Exposure](https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [HashiCorp Vault](https://www.vaultproject.io/)

## Related Analyzers

- [Application Key Analyzer](/analyzers/security/app-key-security) - Validates encryption key configuration
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Prevents debug information exposure
- [Configuration Caching Analyzer](/analyzers/performance/config-caching) - Ensures config is cached in production
- [HSTS Header Analyzer](/analyzers/security/hsts-header) - Validates SSL/TLS configuration via HSTS headers
