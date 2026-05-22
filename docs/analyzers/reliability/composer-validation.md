---
title: Composer Validation Analyzer
description: Ensures composer.json is syntactically correct and passes `composer validate`, preventing dependency resolution failures during deployment
icon: code
outline: [2, 3]
tags: composer,dependencies,reliability,configuration
---

# Composer Validation Analyzer

| Analyzer ID           | Category       | Severity  | Time To Fix  |
| ----------------------| :------------: |:---------:| ------------:|
| `composer-validation` | ✅ Reliability | Critical  | 10 minutes   |

## What This Checks

- Confirms `composer.json` exists and contains valid JSON
- Runs `composer validate --no-check-publish` via a dedicated validator service
- Surfaces Composer’s stderr/stdout to highlight version-constraint or schema issues
- Fails fast when the Composer binary is missing or inaccessible

## Why It Matters

- **Broken deploys**: Invalid composer files block `composer install` on production servers
- **Dependency drift**: Mistyped constraints or deprecated fields lead to inconsistent dependency graphs
- **Automation**: CI/CD pipelines rely on `composer validate` before publishing packages; this analyzer mirrors that safeguard locally

## How to Fix

### Quick Fix (5 minutes)

1. Run the same command locally for details:

```bash
composer validate --no-check-publish
```

2. Fix the specific schema errors (e.g., rename `psr4` to `psr-4`, update version constraints).

3. Re-run the analyzer to confirm it passes.

### Proper Fix (10 minutes)

1. **Schema compliance**: Keep `composer.json` minimal and documented; remove unused packages
2. **Automate**: Add `composer validate` to CI before building artifacts
3. **Lockfile hygiene**: Pair validation with `composer update --lock` to ensure lock and JSON stay in sync
4. **Tooling**: Consider `composer normalize` to standardize ordering and improve diff readability
5. **Documentation**: Record dependency policy (allowed licenses, stability flags) so contributors adhere to standards

## ShieldCI Configuration

This analyzer runs in CI environments by default.

**Serverless runtimes (Lambda, Cloud Functions):** On serverless platforms where the Composer binary is not installed, the `composer validate` subprocess is automatically skipped. JSON syntax validation still runs. The analyzer confirms `composer.json` is valid JSON and has the required structure without invoking the Composer CLI.

**When to run this analyzer:**
- ✅ **Local development**: Confirms `composer.json` is schema-valid before pushing
- ✅ **CI/CD pipelines**: Catches schema regressions before build artifacts are created
- ✅ **Staging/Production servers**: Full validation including Composer CLI subprocess (when available)
- ⚠️ **Serverless**: Partial validation only (JSON syntax, no subprocess)

## References

- [Composer Schema](https://getcomposer.org/doc/04-schema.md)
- [Composer Validate Command](https://getcomposer.org/doc/03-cli.md#validate)
- [Composer Normalize](https://github.com/ergebnis/composer-normalize)

## Related Analyzers

- [Cache Prefix Configuration Analyzer](/analyzers/reliability/cache-prefix-configuration) - Ensures cache prefix is set to avoid collisions
- [Cache Status Analyzer](/analyzers/reliability/cache-status) - Validates cache connectivity and functionality
- [Up-to-Date Migrations Analyzer](/analyzers/reliability/up-to-date-migrations) - Ensures all database migrations are up to date and have been executed
