---
title: Redis Single Server Optimization
description: Suggests using Unix sockets for local Redis connections to improve performance
icon: database
outline: [2, 3]
tags: redis,sockets,performance,optimization,infrastructure
---

# Redis Single Server Optimization

| Analyzer ID                       | Category       | Severity   | Time To Fix  |
| ----------------------------------| :------------: |:----------:| ------------:|
| `redis-single-server-optimization`| ⚡ Performance  | Medium     | 15 minutes   |

## What This Checks

When Redis runs on the same server as your Laravel application, this analyzer suggests using Unix sockets instead of TCP for measurably better performance.

## Why It Matters

- **Performance:** Unix sockets are ~10-20% faster than TCP for local connections
- **Overhead Reduction:** Eliminates TCP/IP stack overhead (no network layer processing)
- **Lower Latency:** Reduces context switches between kernel and userspace
- **Resource Efficiency:** Fewer file descriptors and less memory usage

When Redis is on the same host, using TCP adds unnecessary overhead. Unix sockets provide direct inter-process communication without network stack involvement.

## How to Fix

### 1. Configure Redis to Listen on Socket

**Edit `/etc/redis/redis.conf`:**

```ini
# Enable Unix socket
unixsocket /var/run/redis/redis.sock
unixsocketperm 770

# Optionally disable TCP (if only local access needed)
# port 0
# bind 127.0.0.1
```

**Restart Redis:**

```bash
sudo systemctl restart redis
```

**Verify socket exists:**

```bash
ls -la /var/run/redis/redis.sock
```

### 2. Update Laravel Configuration

**In `config/database.php`:**

```php
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'),

    'default' => [
        'scheme' => 'unix',
        'path' => env('REDIS_SOCKET', '/var/run/redis/redis.sock'),
        'database' => env('REDIS_DB', 0),
        'password' => env('REDIS_PASSWORD'),
    ],

    'cache' => [
        'scheme' => 'unix',
        'path' => env('REDIS_SOCKET', '/var/run/redis/redis.sock'),
        'database' => env('REDIS_CACHE_DB', 1),
        'password' => env('REDIS_PASSWORD'),
    ],
],
```

**In `.env`:**

```env
REDIS_SOCKET=/var/run/redis/redis.sock
REDIS_PASSWORD=null
```

### Common Socket Paths

| Distribution | Default Socket Path |
|--------------|---------------------|
| Ubuntu/Debian | `/var/run/redis/redis.sock` |
| CentOS/RHEL | `/var/run/redis/redis.sock` |
| macOS (Homebrew) | `/tmp/redis.sock` |
| Docker | `/var/run/redis/redis.sock` (mount volume) |

### Docker Configuration

**docker-compose.yml:**

```yaml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --unixsocket /var/run/redis/redis.sock --unixsocketperm 770
    volumes:
      - redis-socket:/var/run/redis

  app:
    build: .
    volumes:
      - redis-socket:/var/run/redis

volumes:
  redis-socket:
```

**Laravel .env for Docker:**

```env
REDIS_SOCKET=/var/run/redis/redis.sock
```

### Permissions

Ensure your PHP user can access the socket:

```bash
# Add www-data to redis group
sudo usermod -a -G redis www-data

# Or set socket permissions
sudo chmod 770 /var/run/redis/redis.sock
sudo chown redis:www-data /var/run/redis/redis.sock
```

## When Not to Use Sockets

- **Remote Redis:** When Redis is on a different server
- **Redis Cluster:** Clusters require TCP connections
- **Sentinel/Replication:** High-availability setups typically use TCP
- **Elasticache/Managed Redis:** Cloud services only offer TCP

## Verification

```bash
# Test connection via socket
redis-cli -s /var/run/redis/redis.sock ping

# In Laravel
php artisan tinker
>>> Redis::ping()
=> "PONG"
```

## Performance Comparison

| Connection Type | Requests/sec | Latency (avg) |
|-----------------|--------------|---------------|
| TCP localhost   | ~100,000     | 0.15ms        |
| Unix socket     | ~120,000     | 0.12ms        |
| **Improvement** | **~20%**     | **~20%**      |

*Benchmarks vary by hardware and workload*

## ShieldCI Configuration

This analyzer:
- Runs only in **production** and **staging** environments
- Skips if Redis is not used by the application
- Checks all Redis connections in `config/database.php`
- Reports higher severity for the default/primary connection

## References

- [Redis Unix Socket Documentation](https://redis.io/docs/manual/config/)
- [PhpRedis Unix Socket Support](https://github.com/phpredis/phpredis#connection)
- [Predis Unix Socket Configuration](https://github.com/predis/predis#connecting-to-redis)

## Related Analyzers

- [MySQL Single Server Optimization](/analyzers/performance/mysql-single-server-optimization) - Similar optimization for MySQL
- [Cache Driver Analyzer](/analyzers/performance/cache-driver) - Ensures optimal cache driver
- [Session Driver Analyzer](/analyzers/performance/session-driver) - Ensures optimal session driver
