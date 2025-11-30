---
title: Up-to-Date Dependency Analyzer
description: Detects pending dependency updates within declared version constraints using composer install --dry-run
icon: package
outline: [2, 3]
---

# Up-to-Date Dependency Analyzer

**Category:** Security · **Severity:** Low · **Analyzer ID:** `up-to-date-dependencies`

## What This Checks

- Runs `composer install --dry-run` (with and without `--no-dev`) to detect pending updates within your declared version constraints.
- Warns when `composer.lock` is missing so you don’t lose reproducible builds.
- Differentiates between production-only updates and dev-only updates for precise severity and recommendation messaging.
- Surfaces actionable metadata (scope, command used) so you know exactly what to run next.

## Why It Matters

- **Security patches land in point releases**: if you never run `composer update`, you miss CVE fixes even when they’re compatible with your constraints.
- **Reproducible builds**: keeping lock files fresh prevents “works on my machine” bugs and deployment drift.
- **CI hygiene**: dev dependencies (linters, test frameworks) still impact your ability to catch regressions early.
- **Compliance and audits**: many review checklists require proving dependencies stay within a supported version window.

## How to Fix

### Quick Fix (5 minutes)

1. Update production dependencies only:

```bash
composer update --no-dev
```

2. For a full refresh (prod + dev):

```bash
composer update
```

3. Commit the updated `composer.lock` so teammates and CI run with the same versions.

### Proper Fix (30 minutes)

1. **Schedule regular updates**: add a weekly/biweekly task (or CI pipeline) that runs `composer update` and opens a PR with the diff.
2. **Review the changelog**: before merging, skim release notes for breaking changes or manual migration steps.
3. **Pin risky packages**: if a dependency frequently ships breaking patches, constrain it more tightly (e.g., `^2.4.3`).
4. **Combine with security scanning**: run `composer audit` or a SaaS scanner (like ShieldCI’s own vulnerable dependency analyzer) immediately after updating.
5. **Automate notifications**: if this analyzer reports failures, wire it into Slack/Email so the team can act quickly.

## Common Mistakes to Avoid

- Relying solely on `composer outdated`; it ignores what `composer install` will actually do given your constraints.
- Deleting `composer.lock` entirely when conflicts arise—instead, resolve the conflict and keep the lock file committed.
- Forgetting to update dev tools because they “don’t ship to production”; outdated linters/tests produce false positives or miss regressions.
- Running updates locally but never committing the lock file, causing CI to pull stale packages.

## References

- [Composer install vs update](https://getcomposer.org/doc/01-basic-usage.md#installing-dependencies)
- [Composer version constraints](https://getcomposer.org/doc/articles/versions.md)
- [Composer audit command](https://getcomposer.org/doc/03-cli.md#audit)

## Related Analyzers

- [Stable Dependency Analyzer](../security/stable-dependencies.md) — ensures you stick to stable tagged releases.
- [Frontend Vulnerable Dependencies](../security/frontend-vulnerable-dependencies.md) — keeps npm/yarn packages patched.
- [Vulnerable Dependency Analyzer](../security/frontend-vulnerable-dependencies.md) — scans composer.lock for known CVEs.
