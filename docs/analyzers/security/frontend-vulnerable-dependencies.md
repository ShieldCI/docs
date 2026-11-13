---
title: Frontend Vulnerable Dependencies Analyzer
seoTopic: Vulnerable npm Packages
description: Scans npm and yarn dependencies for known security vulnerabilities using npm audit and yarn audit
icon: shield-alert
outline: [2, 3]
tags: dependencies,npm,yarn,vulnerabilities,frontend,javascript
---

# Frontend Vulnerable Dependencies Analyzer

| Analyzer ID                        | Category     | Severity   | Time To Fix  |
| -----------------------------------| :----------: |:----------:| ------------:|
| `frontend-vulnerable-dependencies` | 🛡️ Security  | Critical   | 60 minutes   |

## What This Checks

Scans your npm and yarn dependencies for known security vulnerabilities using npm audit and yarn audit. Identifies packages with CVEs, security advisories, outdated versions, and missing lock files that expose your application to attacks through the frontend dependency chain.

Each advisory keeps the severity npm or yarn assigns it (`critical`, `high`, `moderate`, `low`); an `info` advisory is reported as Low, and one with no severity as High.

The check passes only when the audit actually ran and covered your dependencies. It reports a warning instead when:

- **The audit did not run**: npm or yarn is not installed, the registry refused the audit request, the audit timed out, or its output was not an audit report. The message names the tool and the reason.
- **The lock file is out of date**: a dependency declared in `package.json` (or in an npm workspace's `package.json`) has no entry in `package-lock.json` or `yarn.lock`, so the audit never looked at it.

`npm audit` runs with `--offline=false` and `--include-workspace-root=true`, so `offline` or `workspaces` settings in `.npmrc` cannot turn it into an empty report.

## Why It Matters

- **Security Risk:** CRITICAL - Vulnerable packages can contain malware, backdoors, or exploitable flaws
- **Supply Chain Attacks:** Malicious packages in the npm ecosystem can steal credentials and compromise user data
- **Client-Side Exposure:** Frontend vulnerabilities directly expose users' browsers to XSS and code injection
- **Transitive Dependencies:** Your direct dependencies pull in hundreds of sub-dependencies, any of which may be vulnerable

Frontend dependencies are a common attack vector in modern web applications. Real-world incidents include:
- **event-stream (2018)**: Compromised package with 8M weekly downloads stole Bitcoin wallet credentials
- **ua-parser-js (2021)**: Malicious versions downloaded cryptocurrency miners on millions of developer machines
- **Lodash prototype pollution**: Multiple CVEs allowing remote code execution in applications worldwide
- **Axios SSRF (2021)**: Vulnerability allowing attackers to access internal resources and bypass firewalls

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: Auto-Fixable Vulnerabilities**

```bash
# Fix all auto-fixable vulnerabilities (npm)
npm audit fix

# View what would change first
npm audit fix --dry-run

# For yarn
yarn upgrade
yarn audit
```

**Scenario 2: Breaking Changes Required**

```bash
# Update with breaking changes (test thoroughly!)
npm audit fix --force

# Or update specific packages
npm update lodash axios
npm audit
```

**Scenario 3: Missing Lock File**

```bash
# Generate lock file (npm)
npm install
git add package-lock.json
git commit -m "Add package lock file"

# Or for yarn
yarn install
git add yarn.lock
git commit -m "Add yarn lock file"
```

**Scenario 4: Audit Did Not Run or Lock File Is Out of Date**

```bash
# Make sure the audit can run where ShieldCI runs
npm --version
npm audit

# Bring the lock file in line with package.json
npm install
git add package-lock.json
git commit -m "Update package lock file"
```

If your registry does not support audit requests, run the analyzer where the public npm registry is reachable, or audit in a dedicated pipeline step.

### Proper Fix (60 minutes)

Implement comprehensive dependency security management:

**1. Identify and Prioritize Vulnerabilities**

```bash
# Get detailed vulnerability report
npm audit

# Focus on critical/high severity
npm audit --audit-level=high

# JSON format for analysis
npm audit --json > audit-results.json
```

**2. Update Dependencies Systematically**

```bash
# Update single vulnerable package
npm update lodash

# Update to specific safe version
npm install lodash@4.17.21

# Check what's outdated
npm outdated

# Verify application still works
npm test
npm run build
```

**3. Handle Transitive Dependencies**

When the vulnerable package is a sub-dependency:

```bash
# Find which package depends on vulnerable one
npm ls vulnerable-package

# Update the parent package
npm update parent-package

# For npm 8.3+, use overrides
```

```json
// package.json
{
  "overrides": {
    "vulnerable-package": "^safe-version"
  }
}
```

```bash
# For yarn, use resolutions
```

```json
// package.json
{
  "resolutions": {
    "vulnerable-package": "^safe-version"
  }
}
```

**4. Enable Automated Scanning**

```bash
# Configure npm to audit on install
# .npmrc
audit=true
audit-level=moderate
```

```yaml
# Setup GitHub Dependabot
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

**5. Remove Unnecessary Dependencies**

```bash
# Audit your dependencies
npm ls --depth=0

# Find unused packages
npx depcheck

# Remove unused dependencies
npm uninstall unused-package

# Verify no vulnerabilities remain
npm audit
```

**6. Configure Exceptions:**

If you need to ignore specific packages or advisories (e.g., false positives, accepted risks), publish the config and add them:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'security' => [
        'enabled' => true,

        'frontend-vulnerable-dependencies' => [
            // Packages to ignore (document why!)
            'ignored_packages' => [
                'legacy-package', // Can't update due to compatibility
            ],
        
            // Advisory IDs to ignore
            'ignored_advisories' => [
                'GHSA-xxxx-yyyy-zzzz', // False positive - doesn't affect our usage
                'CVE-2020-1234',       // Risk accepted and documented
            ],
        ],
    ],
],
```

::: warning Document Exceptions
Always document why you're ignoring vulnerabilities. This helps during security audits and prevents accidental exposure to known risks.
:::

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- Running `npm audit` / `yarn audit` spawns a subprocess that takes up to 60 seconds and makes external network calls — a significant portion of the Lambda/Vapor timeout budget
- Dedicated pipeline steps (`npm audit`, Dependabot, Snyk) already cover frontend dependency scanning in CI with better caching, retry logic, and structured output
- Prevents timeout pressure on serverless runtimes where the process is hard-killed with no signal when the function timeout is reached

**When to run this analyzer:**
- ✅ **Local development**: Surfaces vulnerabilities interactively as you work
- ✅ **Staging/Production scans**: Validates the deployed dependency set against current advisories
- ❌ **CI/CD pipelines**: Skipped automatically — use `npm audit` or a dedicated scanning step instead
- ❌ **Laravel Vapor / AWS Lambda**: Skipped automatically to avoid timeout pressure

## References

- [npm audit Documentation](https://docs.npmjs.com/cli/audit)
- [yarn audit Documentation](https://classic.yarnpkg.com/lang/en/docs/cli/audit/)
- [GitHub Advisory Database](https://github.com/advisories)
- [Snyk Vulnerability Database](https://snyk.io/vuln)
- [npm Security Best Practices](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities)
- [OWASP Vulnerable and Outdated Components](https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/)

## Related Analyzers

- [Vulnerable Dependencies Analyzer](/analyzers/security/vulnerable-dependencies) - Scans Composer dependencies
- [Application Key Analyzer](/analyzers/security/app-key-security) - Validates Laravel encryption keys
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Prevents debug mode in production
- [CSRF Protection Analyzer](/analyzers/security/csrf-protection) - Validates CSRF token requirements
