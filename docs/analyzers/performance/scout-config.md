---
title: Scout Config Analyzer
description: Validates Laravel Scout search configuration, indexing, and sensitive data exposure in search indexes
icon: zap
outline: [2, 3]
tags: performance,scout,search,indexing,configuration
pro: true
---

# Scout Config Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `scout-config` | ⚡ Performance  | Medium    | 10 minutes   |

## What This Checks

Validates Laravel Scout search configuration for performance and security. Checks for:

- Queued indexing disabled (blocks request processing)
- Soft delete handling when models use `SoftDeletes`
- Sensitive data exposure in `toSearchableArray()` returning full model
- Development-only search drivers in production (null, collection)
- Excessive chunk sizes (searchable and unsearchable) that may cause memory issues during imports
- Queue disabled via `env()` wrapper with `false` default

## Why It Matters

- **Request Blocking:** Without queued indexing, every model save triggers a synchronous API call to the search engine
- **Data Exposure:** Sending full model data to search indexes may expose passwords, tokens, and API keys
- **Memory Issues:** Large chunk sizes during `scout:import` can exhaust PHP memory
- **Production Readiness:** Development drivers don't scale and lack persistence

## How to Fix

### Quick Fix (5 minutes)

Enable queued indexing:

```php
// config/scout.php
'queue' => true,
```

### Proper Fix (10 minutes)

**1. Configure a production search driver:**

```php
// config/scout.php
// Supported production drivers: algolia, meilisearch, typesense, database
'driver' => env('SCOUT_DRIVER', 'meilisearch'),
```

**2. Filter searchable data:**

**Before (❌):**
```php
public function toSearchableArray(): array
{
    return $this->toArray(); // Exposes all fields including sensitive data
}
```

**After (✅):**
```php
public function toSearchableArray(): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'bio' => $this->bio,
    ];
}
```

**3. Configure soft delete handling:**

```php
// config/scout.php
'soft_delete' => true,
```

**4. Set reasonable chunk size:**

```php
// config/scout.php
'chunk' => [
    'searchable' => 500,
    'unsearchable' => 500,
],
```

## Known Limitations

- The `env()` wrapper detection for queue checks the static default value in the config file. If your production environment always sets the `SCOUT_QUEUE` environment variable, you can safely ignore this warning.
- Driver detection only flags literal string assignments (`'driver' => 'null'`). Drivers configured via `env()` wrapper are assumed to be overridden in production.

## References

- [Laravel Scout Documentation](https://laravel.com/docs/scout)
- [Laravel Scout Configuration](https://laravel.com/docs/scout#configuration)
- [Meilisearch Laravel Integration](https://github.com/meilisearch/meilisearch-laravel-scout)

## Related Analyzers

- [Queue Driver](/analyzers/performance/queue-driver) - Validates queue driver configuration
- [Database Query Optimization](/analyzers/performance/database-query-optimization) - Detects inefficient query patterns
- [GDPR Compliance](/analyzers/security/gdpr-compliance) - Validates data protection practices
