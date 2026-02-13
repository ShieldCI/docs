---
title: Vapor Configuration Analyzer
description: Validates Laravel Vapor configuration for proper serverless deployment on AWS Lambda
icon: shield
outline: [2, 3]
tags: deployment,vapor,serverless,configuration,aws
pro: true
---

# Vapor Configuration Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `vapor-config` | 🔄 Reliability  | Medium    | 15 minutes   |

## What This Checks

Validates Laravel Vapor configuration for correct serverless deployment. Checks for:

- Missing `vapor.yml` when `vapor-core` is installed
- File storage driver (must use S3 on Lambda — local filesystem is ephemeral)
- Session driver (must not be `file` — no persistent local storage)
- Cache driver (must not be `file` — same reason)
- Queue connection (should be SQS or Redis for Lambda)
- Missing `warm` setting on production environments (cold starts)
- Missing memory allocation
- CLI timeout configuration

## Why It Matters

- **Data Loss:** File-based drivers lose data when Lambda containers are recycled (every few minutes to hours)
- **Cold Starts:** Without warming, Lambda functions take 1-3 seconds to initialize on first request
- **Session Loss:** Users get logged out when their request hits a different Lambda container
- **Resource Limits:** Without memory configuration, Lambda may OOM on complex requests

## How to Fix

### Quick Fix (5 minutes)

Create a basic `vapor.yml`:

```yaml
id: 12345
name: my-app
environments:
    production:
        memory: 1024
        cli-memory: 512
        cli-timeout: 60
        warm: 10
        runtime: php-8.2:al2
        build:
            - 'composer install --no-dev'
```

### Proper Fix (15 minutes)

**1. Use cloud-compatible drivers:**

```env
# .env.production
FILESYSTEM_DISK=s3
SESSION_DRIVER=redis
CACHE_DRIVER=redis
QUEUE_CONNECTION=sqs
```

**2. Configure vapor.yml properly:**

```yaml
id: 12345
name: my-app
environments:
    production:
        memory: 1024
        cli-memory: 512
        cli-timeout: 60
        warm: 10
        runtime: php-8.2:al2
        storage: my-app-storage
        database: my-app-db
        cache: my-app-cache
        build:
            - 'composer install --no-dev'
            - 'php artisan event:cache'
            - 'php artisan config:cache'
            - 'php artisan route:cache'
    staging:
        memory: 512
        warm: 2
        runtime: php-8.2:al2
        build:
            - 'composer install --no-dev'
```

**3. Verify no file-based drivers:**

```php
// config/filesystems.php
'default' => env('FILESYSTEM_DISK', 's3'),

// config/session.php
'driver' => env('SESSION_DRIVER', 'redis'),

// config/cache.php
'default' => env('CACHE_STORE', 'redis'),
```

## References

- [Laravel Vapor Documentation](https://docs.vapor.build/)
- [Laravel Vapor Configuration](https://docs.vapor.build/projects/environments.html)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

## Related Analyzers

- [Octane Configuration](/analyzers/reliability/octane-config) - Validates Octane long-running server config
- [Cache Driver](/analyzers/performance/cache-driver) - Validates cache driver configuration
- [Session Driver](/analyzers/performance/session-driver) - Validates session driver configuration
