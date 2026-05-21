---
title: Vapor Configuration Analyzer
description: Validates Laravel Vapor configuration for proper serverless deployment on AWS Lambda
icon: shield
outline: [2, 3]
tags: deployment,vapor,serverless,configuration,aws
pro: true
---

# Vapor Configuration Analyzer

| Analyzer ID    | Category     | Severity   | Time To Fix  |
| ---------------| :----------: |:----------:| ------------:|
| `vapor-config` | ✅ Reliability  | Medium    | 15 minutes   |

## What This Checks

Validates the **structure and contents of `vapor.yml`** - the file that drives AWS Lambda provisioning and environment variable injection on Laravel Vapor. This analyzer deliberately does **not** grep `vapor.yml` for runtime variables such as `FILESYSTEM_DISK`, `SESSION_DRIVER`, `CACHE_DRIVER`, or `QUEUE_CONNECTION`: per Vapor's documentation those are managed via the Vapor UI or `.env.{env}` files synced with `vapor env:pull/push`, not inlined in `vapor.yml`. Validation of those driver values is the responsibility of the per-concern analyzers (filesystem, session, cache, queue).

Specific checks:

- `vapor.yml` exists when `laravel/vapor-core` is installed
- `vapor.yml` is valid YAML (surfaces parse errors with a line number)
- `runtime:` is pinned on every environment and is not an EOL PHP version (`php-7.4`, `php-8.0`, `php-8.1`)
- `timeout:` does not exceed API Gateway's 30 s hard cap for HTTP requests
- `memory:` (if set) is an integer between 128 and 10240 MB and a multiple of 64 MB
- `cli-timeout:` (if set) is an integer between 1 and 900 seconds
- `queue:` (if present) is a non-empty string resource name, not a list or null
- `warm:` is set on production-like environments (name matches `production`/`prod` variants, or `domain:` is present)
- `scheduler: true` is set when the host application defines scheduled commands
- `build:` hooks are present (artifact should run `composer install --no-dev` and any asset build)
- `deploy:` hooks include `php artisan migrate --force` when a `database:` resource is attached
- No unknown top-level or env-level keys (catches typos such as `warm_up`, `cliTimeout`, `domains`)

## Why It Matters

- **Runtime drift:** Vapor's default PHP runtime changes across releases. Unpinned or EOL runtimes can silently upgrade (or stop booting) on deploy.
- **Silent HTTP timeouts:** API Gateway hard-caps HTTP responses at 30 seconds regardless of the Lambda `timeout` setting. A `timeout: 60` looks fine locally but fails in production.
- **Cold starts:** Production environments without `warm:` pay the full 1–3 s initialization cost on every cold request.
- **Missed migrations:** Attaching a `database:` resource without adding `php artisan migrate --force` to `deploy:` hooks ships schema drift to production.
- **Silent scheduler:** Laravel's scheduler only runs on Vapor when `scheduler: true` is set on the environment. Missing this silently disables every scheduled command.
- **Typos:** Vapor ignores unrecognized keys without warning - `warm_up: 5` passes `vapor deploy` but has no effect.

## How to Fix

### Quick Fix (5 minutes)

Create a `vapor.yml` with pinned runtime and warming:

```yaml
id: 12345
name: my-app
environments:
    production:
        runtime: 'php-8.3:al2023'
        memory: 1024
        timeout: 28
        warm: 10
        domain: app.example.com
        build:
            - 'composer install --no-dev --optimize-autoloader'
```

### Proper Fix (15 minutes)

A production-ready `vapor.yml` with resource attachments, scheduler, and migration hook:

```yaml
id: 12345
name: my-app
environments:
    production:
        runtime: 'php-8.3:al2023'
        memory: 1024
        timeout: 28
        cli-timeout: 300
        warm: 10
        concurrency: 10
        database: my-app-db
        cache: my-app-cache
        queue: my-app-queue
        storage: my-app-storage
        scheduler: true
        domain: app.example.com
        build:
            - 'composer install --no-dev --optimize-autoloader'
            - 'php artisan event:cache'
            - 'php artisan config:cache'
            - 'php artisan route:cache'
        deploy:
            - 'php artisan migrate --force'
    staging:
        runtime: 'php-8.3:al2023'
        memory: 512
        timeout: 28
        database: my-app-staging-db
        build:
            - 'composer install --no-dev --optimize-autoloader'
        deploy:
            - 'php artisan migrate --force'
```

## References

- [Laravel Vapor Documentation](https://docs.vapor.build/)
- [Vapor Environments](https://docs.vapor.build/projects/environments.html)
- [Vapor Deployments](https://docs.vapor.build/projects/deployments.html)
- [API Gateway Quotas](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html)

## Related Analyzers

- [Octane Configuration](/analyzers/reliability/octane-config) - Validates Octane long-running server config
- [Cache Driver](/analyzers/performance/cache-driver) - Validates cache driver configuration
- [Session Driver](/analyzers/performance/session-driver) - Validates session driver configuration
