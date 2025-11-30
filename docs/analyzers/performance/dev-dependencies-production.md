---
title: Development Dependencies Check
description: Ensures development dependencies are not installed in production environments
icon: alert-circle
outline: [2, 3]
---

# Development Dependencies Check

## What This Checks

Ensures development dependencies are not installed in production environments.

## Why It Matters

- **Security:** Dev tools may expose vulnerabilities
- **Performance:** Unnecessary packages increase autoloader overhead
- **Disk Space:** Dev dependencies waste storage

Development packages like PHPUnit, testing tools, and debug bars should never be in production.

## How to Fix

### Quick Fix (5 minutes)

```bash
# Install without dev dependencies
composer install --no-dev --optimize-autoloader
```

### Proper Fix (30 minutes)

**Update Deployment Script:**
```bash
#!/bin/bash
# Always use --no-dev in production
composer install --no-interaction --no-dev --optimize-autoloader --classmap-authoritative
```

**Docker:**
```dockerfile
RUN composer install --no-dev --optimize-autoloader
```

## Common Mistakes to Avoid

1. **Installing dev dependencies in production:**
   ```bash
   # ❌ Includes dev packages
   composer install

   # ✅ Production only
   composer install --no-dev
   ```

## References

- [Composer Documentation](https://getcomposer.org/doc/03-cli.md#install-i)

## Related Analyzers

- [Autoloader Optimization](/analyzers/performance/autoloader-optimization)
