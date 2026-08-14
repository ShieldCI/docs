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
- Grades each missing variable by whether an `env()` call in the app's `config/` files supplies a real default
- Reports a variable with **no config default** (a bare `env('KEY')` or an explicit `null` default) as a High issue when it is absent from `.env`
- Treats a variable **with a real config default** as the lean-`.env` style working as intended: it is listed in the result metadata (`defaulted_variables`) and the result stays passed
- Reports variables commented out in `.env` (`# KEY=...`) as a Low issue, the sanctioned "consciously not set" idiom
- Validates variable names (regardless of their values), ignoring comments and blank lines in both files
- Handles variables with empty values, special characters, and spaces
- Provides actionable recommendations with specific variable names

## Why It Matters

- **Lean `.env` support**: `env('KEY', $default)` in a config file is Laravel's official default mechanism, so a variable with a safe config default does not need restating in `.env`. Restating it silently pins a stale value when the config default later changes: config owns defaults, `.env` owns overrides
- **Configuration drift**: As your app evolves, new required variables are added to `.env.example` but team members forget to update their `.env`, causing subtle bugs
- **Deployment failures**: Missing environment variables in production can cause crashes or silent failures that are hard to debug
- **Onboarding friction**: New developers copy `.env.example` but miss critical variables, wasting hours troubleshooting
- **CI/CD pipeline issues**: Test environments might work locally but fail in CI because of missing variables
- **Feature flags missing**: New feature toggles defined in `.env.example` aren't configured in `.env`, causing unexpected behavior
- **Third-party integrations broken**: API keys and service credentials in `.env.example` aren't added to `.env`, breaking integrations silently
- **Database connection failures**: Missing database configuration variables cause connection errors that could have been prevented
- **Cache/Queue misconfiguration**: Missing `CACHE_DRIVER`, `QUEUE_CONNECTION` variables cause performance issues

## How to Fix

### Quick Fix (5 minutes)

The finding's recommendation names the variables that have no config default. Add those to your `.env` file with real values:

```dotenv
# Add the variables named by the finding to .env
ACME_SECRET_KEY=sk_live_real_key_here
DB_HOST=127.0.0.1
```

### Proper Fix (20 minutes)

1. **Review each variable named by the finding** in `.env.example`:

```bash
# See the context for each missing variable
grep -A 1 -B 1 'MISSING_VAR_NAME' .env.example
```

2. **Add the missing variables to `.env`** with appropriate values:

```dotenv
# .env - Add missing variables named by the finding

# ❌ Don't copy placeholder values directly
DB_PASSWORD=your_password_here  # Bad - this is a placeholder!

# ✅ Replace with real values for your environment
DB_PASSWORD=my_secure_password_123  # Good - actual value

# ✅ Empty values are fine for optional variables
REDIS_PASSWORD=  # Good - no password needed locally
```

3. **Leave config-defaulted variables out** if the default suits this environment:

A variable read as `env('WIDGET_MAX_SEATS', 1000)` in a config file can simply stay out of `.env`: the config default applies, and the analyzer lists it in the result metadata instead of raising an issue. Set it in `.env` only when this environment needs a different value.

4. **Verify**:

```bash
# Run ShieldCI again to verify
php artisan shieldci:check env-variables-complete
```

5. **Document new variables** if you added them:

If you added new variables to `.env`, update `.env.example`:

```bash
# Add new variables to .env.example with placeholder values
echo "NEW_API_KEY=your_api_key_here" >> .env.example
echo "NEW_SERVICE_URL=https://example.com" >> .env.example
```

6. **Configure optional reports** if you want defaulted or redundant variables surfaced as findings, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'reliability' => [
        'enabled' => true,

        'env-variables-complete' => [
            // Also report config-defaulted absences as a single Info issue
            // Default: false
            'report_defaulted' => true,

            // Report .env values identical to the statically-known config
            // default as a single Info issue (removing the override lets
            // future config default changes take effect)
            // Default: false
            'report_redundant' => true,
        ],
    ],
],
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- CI runners inject secrets via environment variables or a secrets manager, so a `.env` file is intentionally absent
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
- [Environment Variables Best Practices](https://12factor.net/config)

## Related Analyzers

- [Environment File Existence Analyzer](/analyzers/reliability/env-file-exists) - Ensures .env file exists
- [Environment Example Documentation Analyzer](/analyzers/reliability/env-example-documented) - Ensures all environment variables used in .env and read by config files are documented in .env.example
- [Env Call Outside Config Analyzer](/analyzers/performance/env-call-outside-config) - Keeps env() reads inside config files, which this analyzer's default detection relies on
