---
title: Stable Dependency
description: Ensures composer.json enforces stable dependencies and scans for unstable package constraints
icon: package
outline: [2, 3]
---

# Stable Dependency Analyzer

| Analyzer ID           | Category     | Severity   | Time To Fix  |
| ----------------------| :----------: |:----------:| ------------:|
| `stable-dependencies` | 🛡️ Security  | Low        | 30 minutes   |

## What This Checks

- Ensures `composer.json` enforces `"minimum-stability": "stable"` and `"prefer-stable": true` so unstable releases are never preferred by default.
- Scans every package listed in `require` and `require-dev` for `dev-*`, `*-dev`, `@alpha`, `@beta`, or `@RC` constraints.
- Parses `composer.lock` (both `packages` and `packages-dev`) to flag any installed dev/beta/RC versions that slipped past the constraints.
- Executes `composer update --dry-run --prefer-stable` and fails if Composer would upgrade/downgrade packages, indicating unstable versions are currently installed.

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

2. Update any dev constraints to tagged releases.

```json
**Before (❌)**
{
    "require": {
        "vendor/package": "dev-master",
        "another/package": "2.0.0@beta"
    }
}

**After (✅)**
{
    "require": {
        "vendor/package": "^2.3",
        "another/package": "^2.0"
    }
}
```

3. Regenerate the lock file with stable versions only:

```bash
composer update --prefer-stable
```

### Proper Fix (30 minutes)

1. **Audit constraints**: list every package that uses `@alpha`, `@beta`, `dev-*`, or `*-dev` and verify why it was pinned that way.
2. **Coordinate releases**: work with vendors (or tag your own release) instead of depending on mutable branches.
3. **Update `require-dev` too**: unstable dev tools can still leak into production when `minimum-stability` is relaxed.
4. **Regenerate and verify**:
   ```bash
   composer update --prefer-stable
   git diff composer.lock
   ```
   Ensure Composer reports `Nothing to install or update` afterwards.
5. **Lock it down in CI**: add `composer update --dry-run --prefer-stable` to CI to catch regressions before code is merged.

## Common Mistakes to Avoid

- Relying on `minimum-stability: dev` because a single dependency lacked a tag—publish a forked tag instead.
- Forgetting to remove `@beta` flags after a stable release becomes available.
- Assuming `require-dev` is safe—unstable tools can still influence code generation or leak into production when the env is misconfigured.
- Running `composer update` locally without `--prefer-stable`, then wondering why CI reports additional upgrades.

## References

- [Composer Stability Settings](https://getcomposer.org/doc/04-schema.md#minimum-stability)
- [Prefer Stable Flag](https://getcomposer.org/doc/03-cli.md#config-set)
- [Secure Supply Chain Checklist (OWASP)](https://owasp.org/www-community/controls/Software_Supply_Chain_Security)

## Related Analyzers

- [Frontend Vulnerable Dependencies Analyzer](../security/frontend-vulnerable-dependencies.md) — scans npm/yarn lock files for known CVEs.
- [License Compliance Analyzer](../security/license-compliance.md) — validates OSS license requirements for all dependencies.
