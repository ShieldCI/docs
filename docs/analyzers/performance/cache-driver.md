---
title: Cache Driver Configuration Analyzer
description: Validates that your Laravel application uses an appropriate cache driver for the current environment
icon: zap
outline: [2, 3]
---

# Cache Driver Configuration Analyzer

| Analyzer ID    | Category       | Severity   | Time To Fix  |
| ---------------| :------------: |:----------:| ------------:|
| `cache-driver` | ⚡ Performance  | High       | 60 minutes   |

## What This Checks

Validates that your Laravel application uses an appropriate cache driver for the current environment, ensuring optimal performance in production and proper setup for development.

## Why It Matters

- **Performance Impact:** Cache driver selection can affect application speed by 10-100x
- **Scalability:** Some drivers only work on single servers, causing issues in load-balanced environments
- **Production Critical:** Inappropriate cache drivers can create bottlenecks and cascading failures under load

The cache driver determines where Laravel stores cached data. Using `file` or `database` drivers in production creates significant performance bottlenecks, while `redis` or `memcached` provide 10-100x better performance with proper multi-server support.

## How to Fix

### Quick Fix (5 minutes)

**Scenario: File Driver in Production**

```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server php-redis

# Or via Docker
docker run -d -p 6379:6379 redis:alpine

# Update .env
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

### Proper Fix (60 minutes)

Implement production-grade caching with Redis or Memcached:

**Option A: Redis Setup (Recommended)**

```bash
# 1. Install Redis server
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server

# macOS
brew install redis
brew services start redis

# Verify Redis is running
redis-cli ping  # Should return "PONG"

# 2. Install PHP Redis extension
sudo apt-get install php8.1-redis

# Or via PECL
pecl install redis

# 3. Install Laravel Redis package
composer require predis/predis
# Or use phpredis extension (faster)
```

```ini
# .env configuration
CACHE_DRIVER=redis
REDIS_CLIENT=phpredis  # or 'predis'
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=0
```

```php
// config/cache.php - Verify Redis store configuration
'stores' => [
    'redis' => [
        'driver' => 'redis',
        'connection' => 'cache',  // Uses connection from config/database.php
        'lock_connection' => 'default',
    ],
],

// config/database.php - Redis connection
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'),

    'cache' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_CACHE_DB', 1),
    ],
],
```

**Option B: Memcached Setup**

```bash
# 1. Install Memcached server
sudo apt-get install memcached php8.1-memcached

# Start Memcached
sudo systemctl start memcached
sudo systemctl enable memcached

# 2. Verify it's running
echo "stats" | nc localhost 11211
```

```ini
# .env configuration
CACHE_DRIVER=memcached
MEMCACHED_HOST=127.0.0.1
MEMCACHED_PORT=11211
```

```php
// config/cache.php
'stores' => [
    'memcached' => [
        'driver' => 'memcached',
        'persistent_id' => env('MEMCACHED_PERSISTENT_ID'),
        'sasl' => [
            env('MEMCACHED_USERNAME'),
            env('MEMCACHED_PASSWORD'),
        ],
        'options' => [
            // Memcached::OPT_CONNECT_TIMEOUT => 2000,
        ],
        'servers' => [
            [
                'host' => env('MEMCACHED_HOST', '127.0.0.1'),
                'port' => env('MEMCACHED_PORT', 11211),
                'weight' => 100,
            ],
        ],
    ],
],
```

**Option C: DynamoDB (for Laravel Vapor/AWS)**

```bash
composer require aws/aws-sdk-php
```

```ini
CACHE_DRIVER=dynamodb
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_DEFAULT_REGION=us-east-1
DYNAMODB_CACHE_TABLE=laravel_cache
```

**Docker Compose Setup:**

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    environment:
      CACHE_DRIVER: redis
      REDIS_HOST: redis
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}

volumes:
  redis_data:
```

**Performance Optimization (Unix Sockets):**

For even better performance on single servers, use Unix sockets instead of TCP:

```php
// config/database.php
'redis' => [
    'cache' => [
        'scheme' => 'unix',
        'path' => '/var/run/redis/redis.sock',
        'database' => 1,
    ],
],
```

```bash
# Configure Redis to use socket
# /etc/redis/redis.conf
unixsocket /var/run/redis/redis.sock
unixsocketperm 770

# Add web server user to redis group
sudo usermod -a -G redis www-data

# Restart Redis
sudo systemctl restart redis
```

**Monitoring Cache Performance:**

```bash
# Monitor Redis stats
redis-cli info stats

# Monitor cache hit rate
php artisan tinker
>>> cache()->store('redis')->getRedis()->info('stats')
```

## References

- [Laravel Cache Documentation](https://laravel.com/docs/cache)
- [Redis Quick Start](https://redis.io/docs/getting-started/)
- [Memcached Documentation](https://www.memcached.org/)
- [Laravel Performance Best Practices](https://laravel.com/docs/deployment#optimization)

## Related Analyzers

- [Configuration Caching Analyzer](/analyzers/performance/config-caching) - Ensures config is cached in production
- [Session Driver Configuration Analyzer](/analyzers/performance/session-driver) - Validates session driver for scalability
- [Queue Driver Configuration Analyzer](/analyzers/performance/queue-driver) - Ensures a proper queue driver configuration for optimal performance and reliability
- [Shared Cache Lock Store Analyzer](/analyzers/performance/shared-cache-lock) - Detects cache lock usage on the default cache store
