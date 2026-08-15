---
title: Environment Example Documentation Analyzer
description: Ensures all environment variables used in .env and read by config files are documented in .env.example for proper team onboarding and deployment
icon: book-open
outline: [2, 3]
tags: environment,configuration,documentation,team-collaboration
---

# Environment Example Documentation Analyzer

| Analyzer ID               | Category       | Severity | Time To Fix |
| --------------------------| :------------: |:--------:| -----------:|
| `env-example-documented`  | ✅ Reliability | Low      | 10 minutes  |

## What This Checks

- Verifies that all environment variables in `.env` are documented in `.env.example`
- Verifies that every `env()` key read by the app's own `config/` files **without a default** (a bare `env('KEY')` or an explicit `null` default) appears in `.env.example`, actively or commented out
- Treats a key with a real config default as an optional knob that config owns, so documenting it stays voluntary; this mirrors the [Environment Variables Complete](/analyzers/reliability/env-variables-complete) grading
- Reports each undocumented defaultless key as a Medium issue located at the config file and line where it is first read
- Recognizes keys also read by installed packages' own vendor configs (the framework's included) as vendor-owned
- Runs the config direction even when `.env` is absent
- Ensures `.env.example` serves as complete documentation for the project
- Identifies variables added to `.env` but not documented
- Validates that `.env.example` exists and is accessible
- Helps maintain synchronized documentation as the project evolves
- Supports team collaboration by ensuring everyone knows what variables exist
- Prevents deployment configuration gaps

## Why It Matters

- **Team onboarding**: New developers don't know what environment variables they need to configure without complete `.env.example` documentation
- **Deployment gaps**: Production deployments may miss required variables if they're not documented in `.env.example`
- **Configuration drift**: As developers add new features requiring new variables, `.env.example` becomes outdated without this check
- **CI/CD failures**: Automated pipelines miss required variables because they're not in `.env.example`
- **Documentation decay**: Without enforcement, `.env.example` becomes unreliable as a reference
- **Knowledge loss**: When team members leave, undocumented variables become mysteries that are hard to understand
- **Integration issues**: Third-party service configurations added by developers aren't discovered by the rest of the team
- **Feature flags forgotten**: New feature toggles work locally but aren't documented for other environments
- **Required inputs surface**: A bare `env('ACME_API_KEY')` read in a config file returns null when the variable is unset, so the app degrades silently until someone documents that the key must be configured
- **Optional variables stay optional**: Commented documentation (`# ACME_API_KEY=`) counts, so a variable can be documented without being set anywhere

## How to Fix

### Quick Fix (5 minutes)

Find and add undocumented variables to `.env.example`:

```bash
# Find variables in .env but not in .env.example
comm -23 <(grep -E '^[A-Z_]+=' .env | cut -d= -f1 | sort) \
         <(grep -E '^[A-Z_]+=' .env.example | cut -d= -f1 | sort)

# This outputs undocumented variables, for example:
# NEW_API_KEY
# STRIPE_WEBHOOK_SECRET
# CUSTOM_FEATURE_FLAG
```

Then add them to `.env.example` with placeholder values:

```bash
# Add to .env.example
cat >> .env.example << 'EOF'

# New Feature Integration (added on 2025-12-03)
NEW_API_KEY=your_api_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
CUSTOM_FEATURE_FLAG=false
EOF
```

### Proper Fix (10 minutes)

1. **Identify all undocumented variables**:

```bash
# Compare .env and .env.example
diff <(grep -E '^[A-Z_]+=' .env | cut -d= -f1 | sort) \
     <(grep -E '^[A-Z_]+=' .env.example | cut -d= -f1 | sort)
```

2. **For each undocumented variable, add it to .env.example**:

```dotenv
# .env.example

# ❌ Don't copy the real value!
NEW_API_KEY=abc123real_secret  # Bad - exposes real secrets

# ✅ Use descriptive placeholder values
NEW_API_KEY=your_new_api_key_here  # Good - clear placeholder

# ✅ Add helpful comments
# New Feature API Key - get from https://newfeature.com/dashboard
NEW_API_KEY=your_new_api_key_here

# ✅ Show expected format
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here  # Format: whsec_*
```

3. **Group related variables with comments**:

```dotenv
# .env.example

# Application
APP_NAME=Laravel
APP_ENV=local
APP_KEY=  # Generated via: php artisan key:generate

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PASSWORD=your_database_password

# NEW: Stripe Payment Integration (added 2025-12-03)
STRIPE_KEY=pk_test_your_publishable_key
STRIPE_SECRET=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# NEW: Feature Flags (added 2025-12-03)
ENABLE_NEW_DASHBOARD=false
ENABLE_BETA_FEATURES=false
```

4. **For a config-read key finding, document the key where the issue points**:

The finding names the config file and line reading a key that has no default, so the app reads null when it is unset. Add the key to `.env.example`: actively when environments must set it, or commented out when leaving it unset is a supported state:

```dotenv
# .env.example

# Acme API - required for widget sync
ACME_API_KEY=your_acme_api_key_here

# Optional - leave unset to disable the reporting webhook
# ACME_REPORTING_WEBHOOK_URL=
```

Alternatively, give the key a real default in the config file (for example `env('ACME_TIMEOUT', 30)`); a defaulted key does not require a `.env.example` entry.

5. **Verify all variables are documented**:

```bash
# Should return no results
comm -23 <(grep -E '^[A-Z_]+=' .env | cut -d= -f1 | sort) \
         <(grep -E '^[A-Z_]+=' .env.example | cut -d= -f1 | sort) | wc -l
# Output: 0

# Run ShieldCI to verify
php artisan shieldci:check env-example-documented
```

6. **Commit .env.example** (but never .env!):

```bash
git add .env.example
git commit -m "docs: Add missing environment variables to .env.example

- Add NEW_API_KEY for feature integration
- Add STRIPE_WEBHOOK_SECRET for payment webhooks
- Add CUSTOM_FEATURE_FLAG for toggle control

These variables were added during recent feature development."

git push origin main
```

7. **Configure exceptions** for config-read keys that should not require documentation, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'reliability' => [
        'enabled' => true,

        'env-example-documented' => [
            // Config-read keys to exempt from the documentation check,
            // exact names or fnmatch wildcards (document why!)
            // Default: []
            'ignored_keys' => [
                'ACME_INTERNAL_TOKEN', // Injected by the deploy platform
                'LEGACY_*',            // Pre-rename keys still read by old config
            ],
        ],
    ],
],
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- CI runners do not check out `.env` (it is gitignored); the analyzer would warn on every pipeline run for a missing file that is intentionally absent
- Documentation completeness of `.env.example` is a developer workflow concern, not a CI gate

**When to run this analyzer:**
- ✅ **Local development**: Ensures every variable you add to `.env` gets documented for your teammates
- ✅ **Pre-commit / code review**: Catches undocumented variables before they reach the main branch
- ❌ **CI/CD pipelines**: Skipped automatically (`.env` file intentionally absent in CI)
- ❌ **Laravel Cloud**: Skipped automatically (platform-injected variables should not be in `.env.example`)
- ❌ **Laravel Vapor**: Skipped automatically (no `.env` file in serverless deployments)

## References

- [Laravel Configuration Documentation](https://laravel.com/docs/configuration)
- [Laravel Environment Configuration](https://laravel.com/docs/configuration#environment-configuration)
- [The Twelve-Factor App - Config](https://12factor.net/config)
- [PHP Dotenv Library](https://github.com/vlucas/phpdotenv)
- [Environment Variables Best Practices](https://12factor.net/config)

## Related Analyzers

- [Environment Variables Complete Analyzer](/analyzers/reliability/env-variables-complete) - Ensures all required variables from .env.example are in .env (reverse check)
- [Environment File Existence Analyzer](/analyzers/reliability/env-file-exists) - Ensures .env file exists
- [Environment File Analyzer](/analyzers/security/env-file) - Ensures .env.example doesn't contain real secrets
- [App Key Analyzer](/analyzers/security/app-key-security) - Validates APP_KEY format
- [Env Call Outside Config Analyzer](/analyzers/performance/env-call-outside-config) - Keeps env() reads inside config files, where this analyzer's config direction looks for them
