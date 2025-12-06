---
title: Environment Example Documentation Analyzer
description: Ensures all environment variables used in .env are documented in .env.example for proper team onboarding and deployment
icon: book-open
outline: [2, 3]
---

# Environment Example Documentation Analyzer

| Analyzer ID               | Category       | Severity | Time To Fix |
| --------------------------| :------------: |:--------:| -----------:|
| `env-example-documented`  | ✅ Reliability | Low      | 10 minutes  |

## What This Checks

- Verifies that all environment variables in `.env` are documented in `.env.example`
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

4. **Verify all variables are documented**:

```bash
# Should return no results
comm -23 <(grep -E '^[A-Z_]+=' .env | cut -d= -f1 | sort) \
         <(grep -E '^[A-Z_]+=' .env.example | cut -d= -f1 | sort) | wc -l
# Output: 0

# Run ShieldCI to verify
php artisan shieldci:check env-example-documented
```

5. **Commit .env.example** (but never .env!):

```bash
git add .env.example
git commit -m "docs: Add missing environment variables to .env.example

- Add NEW_API_KEY for feature integration
- Add STRIPE_WEBHOOK_SECRET for payment webhooks
- Add CUSTOM_FEATURE_FLAG for toggle control

These variables were added during recent feature development."

git push origin main
```

## Common Mistakes to Avoid

- **Copying real values** - Use placeholders in `.env.example`, never real secrets!
- **Forgetting to commit .env.example** - Team members won't see the changes
- **Not adding comments** - Explain what each variable is for and where to get it
- **Using vague placeholders** - `NEW_VAR=value` is less helpful than `NEW_VAR=your_api_key_from_dashboard`
- **Not grouping related variables** - Keep related configs together with section headers
- **Ignoring the analyzer warning** - "It's just documentation" → leads to team confusion
- **Not updating after feature development** - Document variables as you add them, not later

## References

- [Laravel Configuration Documentation](https://laravel.com/docs/configuration)
- [Laravel Environment Configuration](https://laravel.com/docs/configuration#environment-configuration)
- [The Twelve-Factor App - Config](https://12factor.net/config)
- [PHP Dotenv Library](https://github.com/vlucas/phpdotenv)
- [Environment Variables Best Practices](https://blog.laravel.com/laravel-environment-configuration-best-practices)

## Related Analyzers

- [Environment Variables Complete Analyzer](/analyzers/reliability/env-variables-complete) - Ensures all required variables from .env.example are in .env (reverse check)
- [Environment File Existence Analyzer](/analyzers/reliability/env-file-exists) - Ensures .env file exists
- [Environment File Security](/analyzers/security/env-file-security) - Ensures .env.example doesn't contain real secrets
- [App Key Security](/analyzers/security/app-key-security) - Validates APP_KEY format
