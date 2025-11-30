---
title: Queue Driver Configuration
description: Ensures Laravel's queue driver is configured for reliability and performance - Redis or SQS for production
icon: zap
outline: [2, 3]
---

# Queue Driver Configuration

## What This Checks

Ensures Laravel's queue driver is configured for reliability and performance - Redis or SQS for production, avoiding sync driver that blocks requests.

## Why It Matters

- **Performance:** Sync driver blocks requests until jobs complete
- **Reliability:** Null driver silently discards jobs
- **Scalability:** Proper drivers enable horizontal scaling

The sync driver processes jobs immediately in the same request, blocking the user. The null driver discards jobs entirely. Both are unsuitable for production.

## How to Fix

### Quick Fix (5 minutes)

```env
# .env
QUEUE_CONNECTION=redis
```

### Proper Fix (30 minutes)

**Redis:**
```bash
sudo apt-get install redis-server
composer require predis/predis
```

**AWS SQS:**
```bash
composer require aws/aws-sdk-php
```

```env
QUEUE_CONNECTION=sqs
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_DEFAULT_REGION=us-east-1
SQS_QUEUE=your-queue-url
```

**Start Workers:**
```bash
php artisan queue:work redis --tries=3
```

## Common Mistakes to Avoid

1. **Sync driver in production:**
   ```env
   # ❌ Blocks requests
   QUEUE_CONNECTION=sync

   # ✅ Async processing
   QUEUE_CONNECTION=redis
   ```

2. **No queue workers running:**
   ```bash
   # Start workers with supervisor
   sudo supervisorctl start laravel-worker:*
   ```

## References

- [Laravel Queues](https://laravel.com/docs/queues)
- [Redis Queues](https://laravel.com/docs/queues#driver-prerequisites)
- [AWS SQS](https://laravel.com/docs/queues#sqs-configuration)

## Related Analyzers

- [Cache Driver](/analyzers/performance/cache-driver)
- [Horizon Suggestion](/analyzers/performance/horizon-suggestion)
