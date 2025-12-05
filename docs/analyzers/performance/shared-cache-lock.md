---
title: Shared Cache Lock Store Analyzer
description: Validates that atomic locks use a shared backend (Redis/Memcached) in load-balanced environments
icon: zap
outline: [2, 3]
---

# Shared Cache Lock Store Analyzer

| Analyzer ID         | Category       | Severity  | Time To Fix  |
| --------------------| :------------: |:---------:| ------------:|
| `shared-cache-lock` | ⚡ Performance  | Low       | 20 minutes   |

## What This Checks

Validates that atomic locks use a shared backend (Redis/Memcached) in load-balanced environments.

## Why It Matters

- **Reliability:** File-based locks only work on single servers
- **Data Integrity:** Distributed locks prevent race conditions
- **Concurrency:** Ensures mutual exclusion across servers

File locks don't work across multiple servers, allowing concurrent operations that should be mutually exclusive.

## How to Fix

### Proper Fix (20 minutes)

**Configure Lock Store:**
```php
// config/cache.php
'stores' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'cache',
        'lock_connection' => 'default',
    ],
],
```

**Usage:**
```php
use Illuminate\Support\Facades\Cache;

Cache::lock('process-invoice')->get(function () {
    // Critical section
});
```

## References

- [Laravel Atomic Locks](https://laravel.com/docs/cache#atomic-locks)

## Related Analyzers

- [Cache Driver Configuration Analyzer](/analyzers/performance/cache-driver) - Ensures a proper cache driver configuration for optimal performance
