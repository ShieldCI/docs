---
title: Up-to-Date Dependencies Analyzer
description: Detects pending dependency updates within declared version constraints using composer install --dry-run
icon: package
outline: [2, 3]
---

# Up-to-Date Dependencies Analyzer

| Analyzer ID               | Category     | Severity   | Time To Fix  |
| --------------------------| :----------: |:----------:| ------------:|
| `up-to-date-dependencies` | 🛡️ Security  | Low        | 60 minutes   |

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

### Quick Fix (15 minutes)

1. Update production dependencies only:

```bash
composer update --no-dev
```

2. For a full refresh (prod + dev):

```bash
composer update
```

3. Commit the updated `composer.lock` so teammates and CI run with the same versions.

### Proper Fix (60 minutes)

1. **Schedule regular updates**: add a weekly/biweekly task (or CI pipeline) that runs `composer update` and opens a PR with the diff.
2. **Review the changelog**: before merging, skim release notes for breaking changes or manual migration steps.
3. **Pin risky packages**: if a dependency frequently ships breaking patches, constrain it more tightly (e.g., `^2.4.3`).
4. **Combine with security scanning**: run `composer audit` or a SaaS scanner (like ShieldCI’s own vulnerable dependency analyzer) immediately after updating.
5. **Automate notifications**: if this analyzer reports failures, wire it into Slack/Email so the team can act quickly.

## References

- [Composer install vs update](https://getcomposer.org/doc/01-basic-usage.md#installing-dependencies)
- [Composer version constraints](https://getcomposer.org/doc/articles/versions.md)
- [Composer audit command](https://getcomposer.org/doc/03-cli.md#audit)

## Related Analyzers

- [Stable Dependencies Analyzer](/analyzers/security/stable-dependencies) — ensures you stick to stable tagged releases.
- [Frontend Vulnerable Dependencies Analyzer](/analyzers/security/frontend-vulnerable-dependencies) — keeps npm/yarn packages patched.
- [Vulnerable Dependencies Analyzer](/analyzers/security/vulnerable-dependencies) — scans composer.lock for known CVEs.
