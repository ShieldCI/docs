---
title: Collection Call Optimization
description: Detects inefficient collection operations that could be optimized for better performance
icon: zap
outline: [2, 3]
---

# Collection Call Optimization

| Analyzer ID                    | Category       | Severity   | Time To Fix  |
| -------------------------------| :------------: |:----------:| ------------:|
| `collection-call-optimization` | ⚡ Performance  | High       | 45 minutes   |

## What This Checks

Detects inefficient collection operations that could be optimized for better performance.

## Why It Matters

- **Performance:** Inefficient loops process data multiple times
- **Memory:** Poor collection usage increases memory consumption
- **Code Quality:** Laravel collections provide elegant, efficient methods

Using raw PHP loops instead of collection methods often leads to slower, less readable code.

## How to Fix

### Quick Fix (5 minutes)

**Before:**
```php
$total = 0;
foreach ($users as $user) {
    $total += $user->points;
}
```

**After:**
```php
$total = $users->sum('points');
```

## References

- [Laravel Collections](https://laravel.com/docs/collections)

## Related Analyzers

- [Database Query Optimization](/analyzers/performance/database-query)
