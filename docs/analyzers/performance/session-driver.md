---
title: Session Driver Configuration
description: Validates that Laravel's session driver is appropriate for production scalability - Redis or database for multi-server setups
icon: zap
outline: [2, 3]
---

# Session Driver Configuration

| Analyzer ID      | Category       | Severity   | Time To Fix  |
| -----------------| :------------: |:----------:| ------------:|
| `session-driver` | ⚡ Performance  | Medium     | 30 minutes   |

## What This Checks

Validates that Laravel's session driver is appropriate for production scalability - Redis or database for multi-server setups, avoiding file-based sessions in load-balanced environments.

## Why It Matters

- **Scalability:** File sessions only work on single servers
- **Performance:** Redis sessions are 10-100x faster than file/database
- **User Experience:** Lost sessions cause unexpected logouts

File-based sessions store data locally. In load-balanced environments, users may be routed to different servers where their session doesn't exist, causing unexpected logouts.

## How to Fix

### Quick Fix (5 minutes)

```bash
# Set Redis as session driver
# .env
SESSION_DRIVER=redis
REDIS_HOST=127.0.0.1
```

### Proper Fix (30 minutes)

**Install Redis:**
```bash
sudo apt-get install redis-server php-redis
php artisan session:table  # If using database
```

**Configure:**
```env
SESSION_DRIVER=redis
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_CONNECTION=default
```

## Common Mistakes to Avoid

1. **File driver in load-balanced production:**
   ```env
   # ❌ Sessions lost between servers
   SESSION_DRIVER=file

   # ✅ Shared sessions
   SESSION_DRIVER=redis
   ```

2. **Cookie driver with large session data:**
   ```env
   # ❌ Cookie size limit (4KB)
   SESSION_DRIVER=cookie

   # ✅ No size limit
   SESSION_DRIVER=redis
   ```

## References

- [Laravel Session Documentation](https://laravel.com/docs/session)
- [Redis Session Configuration](https://laravel.com/docs/redis#configuration)

## Related Analyzers

- [Cache Driver](/analyzers/performance/cache-driver)
- [Queue Driver](/analyzers/performance/queue-driver)
