---
title: Maintenance Mode Status Analyzer
description: Detects when your Laravel application is currently in maintenance mode, alerting you to potential downtime and ensuring maintenance mode is intentional
icon: alert-triangle
outline: [2, 3]
---

# Maintenance Mode Status Analyzer

| Analyzer ID                | Category       | Severity | Time To Fix |
| ---------------------------| :------------: |:--------:| -----------:|
| `maintenance-mode-status`  | ✅ Reliability | High     | 5 minutes   |

## What This Checks

- Detects when your application is currently in maintenance mode
- Checks for the presence of `storage/framework/down` file
- Alerts when users cannot access your application
- Validates maintenance mode is intentional, not accidental
- Ensures you're aware of application downtime
- Helps prevent forgotten maintenance mode after deployments

## Why It Matters

- **Unexpected downtime**: Forgotten maintenance mode means users cannot access your application
- **Lost revenue**: Every minute in maintenance mode can cost sales, sign-ups, and user engagement
- **Poor user experience**: Users encountering maintenance pages may abandon your site permanently
- **SEO impact**: Search engines may deindex pages if maintenance mode persists too long
- **Customer trust**: Unplanned or extended downtime damages brand reputation
- **Support burden**: Users will contact support asking why the site is down
- **Deployment mistakes**: Easy to forget to run `php artisan up` after deployments
- **Monitoring blind spots**: Some monitoring tools don't check maintenance mode status
- **Team coordination**: Team members may not know the application is down
- **Emergency response**: Quick detection helps you respond to accidental maintenance mode

## How to Fix

### Quick Fix (1 minute)

If your application is unintentionally in maintenance mode:

```bash
# ❌ Application is down
# Users see: "Be right back. Service Unavailable"

# ✅ Bring application back online
php artisan up
```

### Proper Fix (5 minutes)

#### Scenario 1: Maintenance Mode Was Accidental

If you didn't intend to put the application in maintenance mode:

```bash
# Check current maintenance status
php artisan down --render="errors::503"

# Bring application back online immediately
php artisan up

# Verify application is accessible
curl -I https://your-app.com
# Should return: HTTP/2 200 OK (not 503)

# Check Laravel logs for the maintenance command
tail -n 100 storage/logs/laravel.log | grep "maintenance"
```

#### Scenario 2: Maintenance Mode Is Intentional

If maintenance is ongoing, ensure proper communication:

```bash
# ✅ Use maintenance mode with custom message
php artisan down \
    --retry=60 \
    --refresh=15 \
    --secret="super-secret-token" \
    --render="errors::maintenance"

# Create custom maintenance page: resources/views/errors/maintenance.blade.php
```

**Custom Maintenance Page Example:**

```blade
<!DOCTYPE html>
<html>
<head>
    <title>Scheduled Maintenance</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 20px;
        }
        .container {
            text-align: center;
            max-width: 600px;
        }
        h1 { font-size: 3em; margin-bottom: 0.5em; }
        p { font-size: 1.2em; line-height: 1.6; }
        .back-soon {
            background: rgba(255, 255, 255, 0.2);
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Scheduled Maintenance</h1>
        <p>
            We're currently performing scheduled maintenance to improve your experience.
        </p>
        <div class="back-soon">
            <strong>Expected return:</strong> 30 minutes<br>
            <strong>Status updates:</strong> <a href="https://status.your-app.com" style="color: white;">status.your-app.com</a>
        </div>
        <p style="margin-top: 30px; font-size: 0.9em; opacity: 0.8;">
            Thank you for your patience!
        </p>
    </div>
</body>
</html>
```

#### Scenario 3: Post-Deployment Checklist

Prevent forgotten maintenance mode with deployment checklists:

```bash
#!/bin/bash
# deploy.sh - Automated deployment script

echo "🚀 Starting deployment..."

# Put application in maintenance mode
php artisan down --message="Deploying updates..."

# Run deployment steps
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
npm run build

# ✅ CRITICAL: Bring application back online
php artisan up

# Verify application is accessible
if curl -f -s -o /dev/null https://your-app.com; then
    echo "✅ Application is online and accessible"
else
    echo "❌ ERROR: Application may still be down!"
    exit 1
fi

echo "✅ Deployment complete!"
```

#### Scenario 4: Maintenance Mode with Bypass Secret

Allow team members to access the site during maintenance:

```bash
# Put app in maintenance mode with secret bypass token
php artisan down --secret="team-access-2024"

# Share bypass URL with team:
# https://your-app.com/team-access-2024
# Team can access the site normally while maintenance mode is active

# When maintenance is complete
php artisan up
```

## References

- [Laravel Maintenance Mode](https://laravel.com/docs/configuration#maintenance-mode)
- [Laravel Artisan Commands](https://laravel.com/docs/artisan)
- [HTTP Status Code 503](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503)
- [Site Reliability Engineering Best Practices](https://sre.google/sre-book/table-of-contents/)

## Related Analyzers

- [Database Status Analyzer](/analyzers/reliability/database-status) - Ensures database connections are accessible and functioning
- [Cache Status Analyzer](/analyzers/reliability/cache-status) - Validates cache connectivity and functionality
- [Debug Mode](/analyzers/security/debug-mode) - Ensures debug mode is disabled in production
