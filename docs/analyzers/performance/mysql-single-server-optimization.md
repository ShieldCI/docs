---
title: MySQL Single Server Optimization
description: Detects MySQL read/write configuration on single server, suggesting optimization opportunities
icon: zap
outline: [2, 3]
---

# MySQL Single Server Optimization

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

### Proper Fix (for scaling)

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

## References

- [Laravel Database Read/Write](https://laravel.com/docs/database#read-and-write-connections)

## Related Analyzers

- [Cache Driver](/analyzers/performance/cache-driver)
