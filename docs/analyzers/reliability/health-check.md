---
title: Health Check Analyzer
description: Validates that the application has proper health check endpoints for monitoring and load balancer integration
icon: shield
outline: [2, 3]
tags: reliability,monitoring,health-check,devops
pro: true
---

# Health Check Analyzer

| Analyzer ID    |    Category    | Severity   | Time To Fix  |
| ---------------|:--------------:|:----------:| ------------:|
| `health-check` | ✅ Reliability  | Medium    | 10 minutes   |

## What This Checks

Validates that health check endpoints exist for infrastructure monitoring. Checks for:

- Existence of health check routes (`/health`, `/healthz`, `/health-check`, `/status`, `/up`, `/ping`)
- Health check depth (does it verify DB, cache, storage dependencies?)
- Laravel 11+ built-in health check route (`/up`)
- Scheduler monitoring (`schedule:monitor` or heartbeat patterns)

## Why It Matters

- **Load Balancer Integration:** Load balancers need health endpoints to route traffic away from unhealthy instances
- **Downtime Detection:** Without health checks, outages are only detected when users report them
- **Dependency Monitoring:** Shallow health checks may report "healthy" when the database is down
- **Scheduler Reliability:** Unmonitored scheduled tasks can silently stop running

## How to Fix

### Quick Fix (5 minutes)

Add a basic health check route:

```php
// routes/web.php
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});
```

### Proper Fix (10 minutes)

**1. Add a deep health check that verifies dependencies:**

```php
// routes/web.php
Route::get('/health', function () {
    $checks = [];

    // Database
    try {
        DB::connection()->getPdo();
        $checks['database'] = 'ok';
    } catch (\Exception $e) {
        $checks['database'] = 'failed';
    }

    // Cache
    try {
        Cache::store()->put('health-check', true, 10);
        Cache::store()->get('health-check');
        $checks['cache'] = 'ok';
    } catch (\Exception $e) {
        $checks['cache'] = 'failed';
    }

    // Storage
    try {
        Storage::disk()->put('health-check.txt', 'ok');
        Storage::disk()->delete('health-check.txt');
        $checks['storage'] = 'ok';
    } catch (\Exception $e) {
        $checks['storage'] = 'failed';
    }

    $healthy = !in_array('failed', $checks);

    return response()->json([
        'status' => $healthy ? 'ok' : 'degraded',
        'checks' => $checks,
    ], $healthy ? 200 : 503);
});
```

**2. Enable Laravel 11+ built-in health check:**

```php
// bootstrap/app.php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        health: '/up',
    )
    ->create();
```

**3. Add scheduler monitoring:**

```php
// routes/console.php
Schedule::command('inspire')
    ->hourly()
    ->pingOnSuccess('https://heartbeat.example.com/abc123');
```

## References

- [Laravel Health Check (11+)](https://laravel.com/docs/routing#the-health-route)
- [Kubernetes Health Checks](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Laravel Task Scheduling Monitoring](https://laravel.com/docs/scheduling#task-hooks)

## Related Analyzers

- [Alerting Configuration](/analyzers/reliability/alerting-config) - Validates alerting mechanisms
- [Database Status](/analyzers/reliability/database-status) - Checks database connectivity
- [Cache Status](/analyzers/reliability/cache-status) - Checks cache connectivity
