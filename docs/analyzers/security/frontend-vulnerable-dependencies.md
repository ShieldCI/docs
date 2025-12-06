---
title: Frontend Vulnerable Dependencies Analyzer
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

**6. Configure ShieldCI Exceptions (if needed)**

```php
// config/shieldci.php

return [
    'frontend_vulnerable_dependencies' => [
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
];
```

## References

- [npm audit Documentation](https://docs.npmjs.com/cli/audit)
- [yarn audit Documentation](https://yarnpkg.com/cli/audit)
- [GitHub Advisory Database](https://github.com/advisories)
- [Snyk Vulnerability Database](https://snyk.io/vuln)
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [OWASP Vulnerable and Outdated Components](https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/)

## Related Analyzers

- [Vulnerable Dependencies Analyzer](/analyzers/security/vulnerable-dependencies) - Scans Composer dependencies
- [Application Key Analyzer](/analyzers/security/app-key) - Validates Laravel encryption keys
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Prevents debug mode in production
- [CSRF Protection Analyzer](/analyzers/security/csrf-protection) - Validates CSRF token requirements
