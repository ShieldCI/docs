---
title: Stable Dependencies Analyzer
description: Ensures composer.json enforces stable dependencies and scans for unstable package constraints
icon: package
outline: [2, 3]
tags: dependencies,composer,stability,versions,production
---

# Stable Dependencies Analyzer

| Analyzer ID           | Category     | Severity | Time To Fix  |
| ----------------------| :----------: |:--------:| ------------:|
| `stable-dependencies` | 🛡️ Security  |  Low  | 30 minutes   |

## What This Checks

- **Configuration checks** (always performed):
  - Flags dangerous `minimum-stability` values (`dev`, `alpha`, `beta`, `RC`)
  - Warns when `prefer-stable` is not enabled
  - Optionally flags missing `minimum-stability` (see [Configuration](#configuration) below)

- **Version constraint checks** (in `require` and `require-dev`):
  - Detects `dev-*`, `*-dev`, `@alpha`, `@beta`, or `@RC` constraints
  - Severity is risk-based: Medium for `require`, Low for `require-dev` when `minimum-stability: stable`

- **Installed package verification**:
  - Parses `composer.lock` (both `packages` and `packages-dev`) for installed unstable versions
  - Executes `composer update --dry-run --prefer-stable` to detect if updates would change packages (this subprocess is **skipped** when `prefer-stable: true` is already set in `composer.json`, since the flag would have no additional effect on resolution)
  - Uses locale-independent pattern matching (works with non-English Composer output)

## Why It Matters

- **Supply chain risk**: dev branches and pre-release tags often get force-pushed or deleted, making builds non-repeatable and hiding malicious commits.
- **Missing security patches**: unstable channels frequently skip CVE backports or break BC, leading to silent regressions in production.
- **CI/CD drift**: when minimum stability isn't "stable", `composer install` in CI can pull new dev snapshots that were never tested locally.
- **Audit requirements**: many compliance frameworks (SOC2, ISO 27001) require documenting that only stable vendor releases reach production.

## How to Fix

### Quick Fix (5 minutes)

1. Force stable defaults and prefer-stable resolution:

```bash
composer config minimum-stability stable
composer config prefer-stable true
```

2. Update any unstable constraints to tagged releases.

The analyzer detects **all** Composer-valid unstable version formats:

**Before (❌):**
```json
{
    "require": {
        "vendor/package": "dev-master",      // dev branch
        "vendor/another": "2.0.x-dev",       // dev version suffix
        "vendor/tool": "1.0.0-alpha",        // alpha with dash
        "vendor/lib": "1.0.0alpha",          // alpha without dash
        "vendor/beta": "v1.0.0-beta",        // beta with v prefix
        "vendor/rc": "1.0.0RC1",             // RC without dash
        "vendor/flag": "^2.0@dev"            // stability flag
    }
}
```

**After (✅):**
```json
{
    "require": {
        "vendor/package": "^2.3",
        "vendor/another": "^2.0",
        "vendor/tool": "^1.0",
        "vendor/lib": "^1.0",
        "vendor/beta": "^1.0",
        "vendor/rc": "^1.0",
        "vendor/flag": "^2.0"
    }
}
```

::: tip Supported Unstable Formats
The analyzer correctly identifies all these as unstable:
- Dev: `dev-master`, `dev-main`, `2.0.x-dev`
- Alpha: `1.0.0-alpha`, `1.0.0alpha`, `v1.0.0-alpha`, `1.0.0-alpha.1`
- Beta: `1.0.0-beta`, `1.0.0beta2`, `v1.0.0-beta`, `1.0.0-beta.2`
- RC: `1.0.0-RC`, `1.0.0RC1`, `v1.0.0-RC`, `1.0.0-RC.1`
- Flags: `^2.0@dev`, `^1.0@alpha`, `^1.0@beta`, `^1.0@RC`
:::

3. Regenerate the lock file with stable versions only:

```bash
composer update --prefer-stable
```

### Proper Fix (30 minutes)

1. **Audit constraints**: list every package that uses `@alpha`, `@beta`, `dev-*`, or `*-dev` and verify why it was pinned that way.

2. **Coordinate releases**: work with vendors (or tag your own release) instead of depending on mutable branches.

3. **Prioritize by risk**:
   - **High priority**: Fix unstable packages in `require` (Medium severity, affects production)
   - **Medium priority**: Fix unstable packages in `require-dev` when `minimum-stability` is not `stable` (can leak dependencies)
   - **Low priority**: Consider fixing unstable packages in `require-dev` when `minimum-stability: stable` (Low severity, isolated to dev)

4. **Set minimum-stability to stable** (if not already):
   ```bash
   composer config minimum-stability stable
   ```
   This prevents unstable `require-dev` dependencies from leaking into production.

5. **Regenerate and verify**:
   ```bash
   composer update --prefer-stable
   git diff composer.lock
   ```
   Ensure Composer reports `Nothing to install or update` afterwards.

6. **Lock it down in CI**: add `composer update --dry-run --prefer-stable` to CI to catch regressions before code is merged.

## ShieldCI Configuration

The analyzer can be configured to enforce explicit `minimum-stability` declaration in `composer.json`.

### Default Behavior (Recommended)

By default, the analyzer **does NOT** flag missing `minimum-stability` in `composer.json`. This assumes teams understand that Composer defaults to `"stable"` when the key is absent.

**What's always flagged** (regardless of config):
- ❌ Dangerous `minimum-stability` values (`dev`, `alpha`, `beta`, `RC`) → Medium severity
- ❌ Missing `prefer-stable` → Low severity
- ❌ Unstable version constraints in `require` → Medium severity
- ⚠️ Unstable version constraints in `require-dev` (when min-stability is not `stable`) → Medium severity
- ⚠️ Unstable version constraints in `require-dev` (when min-stability is `stable`) → Low severity

### Strict Mode (Opt-in)

For teams that want to enforce explicit configuration documentation, enable strict mode:
```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:
```php
'analyzers' => [
    'security' => [
        'enabled' => true,

        'stable-dependencies' => [
            'enforce_explicit_minimum_stability' => true,
        ],
    ],
],
```

With strict mode enabled, missing `minimum-stability` will be flagged with **Low severity**:

```json
{
  "name": "my-app",
  "require": {...}
  // Missing "minimum-stability": "stable"
}
```

⚠️ **Warning (Low)**: Composer minimum-stability is not explicitly set (using implicit default "stable")

**Recommendation**: Teams new to Composer or with strict documentation requirements should enable this. Experienced teams comfortable with Composer defaults can leave it disabled to reduce noise.

## References

- [Composer Stability Settings](https://getcomposer.org/doc/04-schema.md#minimum-stability)
- [Prefer Stable Flag](https://getcomposer.org/doc/03-cli.md#config-set)
- [Secure Supply Chain Checklist (OWASP)](https://owasp.org/www-community/controls/Software_Supply_Chain_Security)

## Related Analyzers

- [Frontend Vulnerable Dependencies Analyzer](/analyzers/security/frontend-vulnerable-dependencies) - scans npm/yarn lock files for known CVEs.
- [Dependency License Compliance Analyzer](/analyzers/security/license-compliance) - validates OSS license requirements for all dependencies.
