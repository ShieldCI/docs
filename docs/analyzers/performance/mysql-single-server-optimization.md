---
title: MySQL Single Server Optimization Analyzer
description: Detects MySQL read/write configuration on single server, suggesting optimization opportunities
icon: zap
outline: [2, 3]
tags: mysql,database,performance,sockets,optimization
---

# MySQL Single Server Optimization Analyzer

| Analyzer ID                        | Category       | Severity   | Time To Fix  |
| -----------------------------------| :------------: |:----------:| ------------:|
| `mysql-single-server-optimization` | ⚡ Performance  | Medium     | 30 minutes   |

## What This Checks

Detects MySQL read/write configuration on single server, suggesting optimization opportunities.

## Why It Matters

- **Performance:** Single connection limits throughput
- **Scalability:** Prevents easy read replica addition
- **Reliability:** No failover capability

Single-server MySQL configuration works but limits scaling options as traffic grows.

## How to Fix

### Quick Fix (5 minutes)

Current single-server config is acceptable for most applications. This is informational.

### Proper Fix (30 minutes)

**Read Replicas:**
```php
// config/database.php
'mysql' => [
    'read' => [
        'host' => [
            '192.168.1.2',  // Replica 1
            '192.168.1.3',  // Replica 2
        ],
    ],
    'write' => [
        'host' => ['192.168.1.1'],  // Master
    ],
    'driver' => 'mysql',
    'database' => 'laravel',
    'username' => 'root',
    'password' => '',
],
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments and only runs in production and staging environments.

**Why skip in CI and development?**
- MySQL server configuration is not applicable in CI
- Local/Development/Testing environments may use TCP connections, which is acceptable
- Production and staging should use Unix sockets for optimal performance (up to 50% faster)

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

**Examples:**
- `APP_ENV=production` → Runs (no mapping needed)
- `APP_ENV=production-us` → Maps to `production` → Runs
- `APP_ENV=local` → Skipped (not production/staging)

**Docker:** This analyzer is automatically skipped in Docker environments — MySQL runs in a separate container and communicates over TCP; Unix socket optimization is not applicable for inter-container communication.

**Non-MySQL database driver:** This analyzer is automatically skipped when the default database connection is not `mysql` — Unix socket optimization is MySQL-specific.

## References

- [Laravel Database Read/Write](https://laravel.com/docs/database#read-and-write-connections)

## Related Analyzers

- [Cache Driver Configuration Analyzer](/analyzers/performance/cache-driver) - Ensures a proper cache driver configuration for optimal performance
