---
title: Vulnerable Dependencies Analyzer
description: Detects vulnerable Composer packages with CVEs and abandoned dependencies using OSV API
icon: package
outline: [2, 3]
tags: dependencies,composer,vulnerabilities,cve,security
---

# Vulnerable Dependencies Analyzer

| Analyzer ID               | Category     | Severity   | Time To Fix  |
| --------------------------| :----------: |:----------:| ------------:|
| `vulnerable-dependencies` | 🛡️ Security  | Critical    | 60 minutes   |

## What This Checks

- Reads `composer.lock` and your dev dependencies to detect abandoned packages and missing lock files.
- Queries OSV (Open Source Vulnerability) for each Composer package/version via batch API.
- Flags every package with recorded CVEs/advisories and annotates severity, CVE, and upgrade guidance.
- Highlights abandoned packages (including those under `packages-dev`) and suggests replacements.

## Why It Matters

- **Actively exploited CVEs**: Packagist libraries receive coordinated disclosures, and ignoring them leads to remote code execution, SQL injection, or privilege escalation.
- **Transitive exposure**: You may not be aware of a vulnerable subdependency; OSV catches both direct and transitive hits because it analyzes the lock file.
- **Abandoned libraries**: Packages without maintainers never receive patches, forcing you to fork or replace them before a vulnerability is published.
- **Compliance**: Security questionnaires often require proof that you monitor upstream CVEs; this analyzer produces that evidence.

## How to Fix

### Quick Fix (15 minutes)

1. Run Composer’s audit locally for details:

```bash
composer audit
```

2. Upgrade the vulnerable package:

```bash
composer update vendor/package
```

3. If the package is abandoned, follow the recommendation to replace it and commit the updated `composer.lock`.

### Proper Fix (60 minutes)

1. **Review each advisory**: read the linked CVE/advisory summary to confirm impact and any manual remediation steps.
2. **Pin patched versions**: adjust `composer.json` constraints so patched releases remain within your allowed range (e.g., `^3.2.1`).
3. **Add regression tests**: if the upgrade touches sensitive areas, write smoke tests before deploying.
4. **Remove or fork abandoned packages**: if no drop-in replacement exists, fork the package, apply patches, and reference your fork explicitly.
5. **Automate**: add `composer audit` (or this analyzer) to CI so regressions get caught before merges.

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- Each run makes an HTTP POST to the OSV API (`api.osv.dev`) with up to 73 package versions — network latency is non-deterministic and adds to the Lambda/Vapor timeout budget
- `composer audit` is already a standard CI step and covers the same advisory database with better caching and retry behaviour
- Prevents timeout pressure on serverless runtimes where the function is hard-killed with no PHP signal when the Lambda timeout is reached

**When to run this analyzer:**
- ✅ **Local development**: Surfaces CVEs interactively as you work
- ✅ **Staging/Production scans**: Validates the deployed `composer.lock` against current advisories
- ❌ **CI/CD pipelines**: Skipped automatically — use `composer audit` or a dedicated scanning step instead
- ❌ **Laravel Vapor / AWS Lambda**: Skipped automatically to avoid timeout pressure

## References

- [Composer Audit](https://getcomposer.org/doc/03-cli.md#audit)
- [OSV API](https://osv.dev/)
- [FriendsOfPHP Security Advisories](https://github.com/FriendsOfPHP/security-advisories)

## Related Analyzers

- [Stable Dependencies Analyzer](/analyzers/security/stable-dependencies) - Ensures stable tagged releases
- [Up-to-Date Dependencies Analyzer](/analyzers/security/up-to-date-dependencies) - Checks for dependency updates
- [Frontend Vulnerable Dependencies Analyzer](/analyzers/security/frontend-vulnerable-dependencies) - Scans npm/yarn dependencies
