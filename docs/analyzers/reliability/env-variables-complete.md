---
title: Environment Variables Complete Analyzer
description: Ensures all required environment variables from .env.example are defined in .env to prevent missing configuration errors
icon: list-checks
outline: [2, 3]
tags: environment,configuration,reliability,deployment
---

# Environment Variables Complete Analyzer

| Analyzer ID               | Category       | Severity | Time To Fix |
| --------------------------| :------------: |:--------:| -----------:|
| `env-variables-complete`  | ✅ Reliability | High     | 20 minutes  |

## What This Checks

- Verifies that `.env.example` file exists in the application root
- Compares all environment variables defined in `.env.example` against `.env`
- Identifies missing environment variables that should be configured
- Validates variable names match (regardless of their values)
- Ignores comments and blank lines in both files
- Handles variables with empty values, special characters, and spaces
- Reports comprehensive metadata about missing variables
- Provides actionable recommendations with specific variable names

## Why It Matters

- **Configuration drift**: As your app evolves, new environment variables are added to `.env.example` but team members forget to update their `.env`, causing subtle bugs
- **Deployment failures**: Missing environment variables in production can cause crashes or silent failures that are hard to debug
- **Onboarding friction**: New developers copy `.env.example` but miss critical variables, wasting hours troubleshooting
- **CI/CD pipeline issues**: Test environments might work locally but fail in CI because of missing variables
- **Feature flags missing**: New feature toggles defined in `.env.example` aren't configured in `.env`, causing unexpected behavior
- **Third-party integrations broken**: API keys and service credentials in `.env.example` aren't added to `.env`, breaking integrations silently
- **Database connection failures**: Missing database configuration variables cause connection errors that could have been prevented
- **Cache/Queue misconfiguration**: Missing `CACHE_DRIVER`, `QUEUE_CONNECTION` variables cause performance issues

## How to Fix

### Quick Fix (5 minutes)

If you're missing specific variables:

```bash
# Option 1: Compare files manually
diff .env.example .env

# Option 2: Copy missing variables
# Open both files side by side and copy missing variables from .env.example to .env
nano .env.example .env
```

Then add the missing variables to your `.env` file:

```dotenv
# Add these missing variables to .env
DB_HOST=127.0.0.1
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
```

### Proper Fix (20 minutes)

1. **Identify all missing variables**:

```bash
# Show what's in .env.example but not in .env
comm -23 <(grep -E '^[A-Z_]+=' .env.example | cut -d= -f1 | sort) \
         <(grep -E '^[A-Z_]+=' .env | cut -d= -f1 | sort)
```

2. **Review each missing variable** in `.env.example`:

```bash
# See the context for each missing variable
grep -A 1 -B 1 'MISSING_VAR_NAME' .env.example
```

3. **Add missing variables to `.env`** with appropriate values:

```dotenv
# .env - Add missing variables from .env.example

# ❌ Don't copy placeholder values directly
DB_PASSWORD=your_password_here  # Bad - this is a placeholder!

# ✅ Replace with real values for your environment
DB_PASSWORD=my_secure_password_123  # Good - actual value

# ✅ Empty values are fine for optional variables
REDIS_PASSWORD=  # Good - no password needed locally
```

4. **Verify all variables are now present**:

```bash
# Run ShieldCI again to verify
php artisan shieldci:check env-variables-complete

# Or manually verify
comm -23 <(grep -E '^[A-Z_]+=' .env.example | cut -d= -f1 | sort) \
         <(grep -E '^[A-Z_]+=' .env | cut -d= -f1 | sort) | wc -l
# Should output: 0
```

5. **Document new variables** if you added them:

If you added new variables to `.env`, update `.env.example`:

```bash
# Add new variables to .env.example with placeholder values
echo "NEW_API_KEY=your_api_key_here" >> .env.example
echo "NEW_SERVICE_URL=https://example.com" >> .env.example
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- CI runners inject secrets via environment variables or a secrets manager — a `.env` file is intentionally absent
- Flagging a missing `.env` as Critical in CI would be a false positive on every pipeline run
- The check is meaningful only where a `.env` file is expected to be manually maintained

**When to run this analyzer:**
- ✅ **Local development**: Catches missing variables before you hit a runtime error
- ✅ **Staging/Production servers**: Ensures all required variables from `.env.example` are configured before deploy
- ❌ **CI/CD pipelines**: Skipped automatically (`.env` file intentionally absent)
- ❌ **Laravel Cloud**: Skipped automatically (platform-managed `.env`)
- ❌ **Laravel Vapor**: Skipped automatically (no `.env` file in serverless deployments)

## References

- [Laravel Configuration Documentation](https://laravel.com/docs/configuration)
- [Laravel Environment Configuration](https://laravel.com/docs/configuration#environment-configuration)
- [The Twelve-Factor App - Config](https://12factor.net/config)
- [PHP Dotenv Library](https://github.com/vlucas/phpdotenv)
- [Environment Variables Best Practices](https://blog.laravel.com/laravel-environment-configuration-best-practices)

## Related Analyzers

- [Environment File Existence Analyzer](/analyzers/reliability/env-file-exists) - Ensures .env file exists
- [Environment Example Documentation Analyzer](/analyzers/reliability/env-example-documented) - Ensures all environment variables used in .env are documented in .env.example
