---
title: Dependency License Compliance Analyzer
description: Validates that all dependencies use legally acceptable licenses for your application type
icon: file-text
outline: [2, 3]
---

# Dependency License Compliance Analyzer

## What This Checks

Validates that all dependencies use legally acceptable licenses for your application type. Detects GPL/AGPL licenses in commercial applications, packages with restrictive licenses, missing license information, and supports configurable license whitelists.

## Why It Matters

- **Security Risk:** CRITICAL - Using GPL/AGPL packages in proprietary software may require releasing your entire codebase as open source
- **Legal Liability:** License violations can result in lawsuits, forced code disclosure, and financial penalties
- **Commercial Impact:** GPL contamination requires either open-sourcing your product or removing the dependency
- **Due Diligence:** Investors and acquirers scrutinize license compliance during audits
- **Multi-Tenancy SaaS:** AGPL-3.0 requires disclosing source code to all network users

GPL (General Public License) and AGPL (Affero GPL) are "copyleft" licenses that require derivative works to be released under the same license. Using GPL code in a commercial application can force you to open-source your entire product.

**Real-World Impact:**
- Companies forced to open-source proprietary code due to GPL contamination
- M&A deals delayed or cancelled over license compliance issues
- Multi-million dollar settlements for GPL violations
- SaaS products forced to release source code under AGPL-3.0

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: GPL/AGPL Package Found**

```bash
# Check which package has GPL license
composer show --all | grep -i gpl

# Remove the GPL package
composer remove vendor/gpl-package

# Find MIT/Apache alternative
composer search "alternative functionality"
composer require vendor/mit-alternative
```

**Scenario 2: Missing License Information**

```bash
# Check package on Packagist
open https://packagist.org/packages/vendor/package

# Or check GitHub repository
composer show vendor/package --all | grep source

# If license is acceptable, ignore in config
```

**Scenario 3: Dev Dependency with GPL**

```php
// config/shieldci.php
return [
    'license_compliance' => [
        // Dev-only tools are usually safe
        'ignored_models' => [],
    ],
];
```

### Proper Fix (30 minutes)

**1. Audit All Dependencies**

```bash
# Generate license report
composer licenses

# Check for GPL variants
composer licenses | grep -E "(GPL|AGPL)"

# Review each flagged package
composer show vendor/package --all
```

**2. Replace GPL/AGPL Packages**

```php
// ❌ BEFORE: GPL package for PDF generation
composer require tecnickcom/tcpdf  // LGPL-3.0 (acceptable)
// But some forks are GPL-3.0 (not acceptable)

// ✅ AFTER: MIT alternative
composer require dompdf/dompdf  // LGPL-2.1 (acceptable)
// Or
composer require mpdf/mpdf  // GPL-2.0 (use only if open-source app)
```

**3. Configure License Whitelist**

```php
// config/shieldci.php
return [
    'license_compliance' => [
        // Add licenses your legal team approves
        'whitelisted_licenses' => [
            'MIT',
            'Apache-2.0',
            'BSD-3-Clause',
            'ISC',
            'LGPL-2.1',  // Lesser GPL is usually acceptable
            'LGPL-3.0',
            'CC0-1.0',
            // Add your approved licenses
        ],

        // Customize restrictive licenses
        'restrictive_licenses' => [
            'GPL-2.0',
            'GPL-3.0',
            'AGPL-3.0',
            // Add licenses your legal team flags
        ],

        // Allow specific packages (use with caution!)
        'allowed_packages' => [
            // 'vendor/gpl-package' => 'Approved by Legal - Ticket #12345'
        ],
    ],
];
```

**4. Handle Dual-Licensed Packages**

```json
// Some packages offer multiple licenses (choose one)
{
  "license": ["MIT", "GPL-3.0"]
}
```

If a package has both MIT and GPL, you can choose MIT (the analyzer will pass).

**5. Create License Policy**

```markdown
# Company License Policy

## Acceptable for Commercial Use
- MIT, Apache-2.0, BSD-2/3-Clause
- ISC, CC0-1.0, Unlicense, WTFPL
- LGPL-2.1, LGPL-3.0 (library use only)

## Requires Legal Review
- Custom/Proprietary licenses
- SSPL (Server Side Public License)
- BSL (Business Source License)

## Not Acceptable
- GPL-2.0, GPL-3.0 (requires open-sourcing)
- AGPL-3.0 (requires open-sourcing for SaaS)
- EUPL (European Union Public License)

## Dev Dependencies Exception
- GPL tools acceptable for dev-only (PHPUnit, PHPStan, etc.)
- Must not be distributed with production code
```

**6. Add Pre-Commit Hook**

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Check licenses before committing composer.lock
if git diff --cached --name-only | grep -q "composer.lock"; then
    echo "Checking dependency licenses..."
    php artisan shield:analyze --analyzer=license-compliance

    if [ $? -ne 0 ]; then
        echo "❌ License compliance check failed!"
        echo "Run: composer licenses | grep GPL"
        exit 1
    fi
fi
```

## Common Mistakes to Avoid

1. **Not checking transitive dependencies:**
   ```bash
   # ❌ BAD - Only checking direct dependencies
   composer show --direct

   # ✅ GOOD - Check all dependencies (including nested)
   composer show --all
   composer licenses  # Shows all transitive dependencies
   ```

2. **Assuming LGPL is the same as GPL:**
   ```php
   // ❌ BAD - Treating LGPL like GPL
   'restrictive_licenses' => ['GPL-3.0', 'LGPL-3.0']

   // ✅ GOOD - LGPL allows linking in commercial apps
   'whitelisted_licenses' => ['MIT', 'Apache-2.0', 'LGPL-3.0']
   'restrictive_licenses' => ['GPL-3.0', 'AGPL-3.0']
   ```

3. **Ignoring dev dependencies completely:**
   ```php
   // ❌ BAD - Deploying dev dependencies to production
   composer install  // Installs dev dependencies

   // ✅ GOOD - Exclude dev dependencies in production
   composer install --no-dev

   // Dev GPL tools (PHPUnit, PHPStan) are OK for development
   ```

4. **Not understanding dual licensing:**
   ```json
   // Package offers choice: MIT OR GPL-3.0
   {"license": ["MIT", "GPL-3.0"]}

   // ✅ You can choose MIT (no GPL obligations)
   // ❌ Some tools incorrectly flag this as GPL violation
   ```

5. **Confusing license versions:**
   ```php
   // Different GPL versions have different rules
   'GPL-2.0'           // Older version
   'GPL-2.0-only'      // Cannot upgrade to GPL-3.0
   'GPL-2.0-or-later'  // Can use GPL-2.0 or GPL-3.0
   'GPL-3.0'           // Newer version (stricter)
   'GPL-3.0-only'      // Must use GPL-3.0
   'GPL-3.0-or-later'  // Can upgrade to future GPL versions
   ```

6. **Forgetting about AGPL in SaaS applications:**
   ```php
   // ❌ BAD - Using AGPL in SaaS (must disclose source to users)
   composer require vendor/agpl-package

   // ✅ GOOD - Avoid AGPL entirely for SaaS
   // AGPL triggers when users access over network (not just distribution)
   ```

## References

- [SPDX License List](https://spdx.org/licenses/) - Standard license identifiers
- [Choose a License](https://choosealicense.com/) - License comparison
- [GPL FAQ](https://www.gnu.org/licenses/gpl-faq.html) - GNU GPL frequently asked questions
- [LGPL vs GPL](https://www.gnu.org/licenses/lgpl-3.0.html) - Understanding LGPL differences
- [AGPL Network Clause](https://www.gnu.org/licenses/agpl-3.0.html) - AGPL for SaaS implications
- [Composer License Command](https://getcomposer.org/doc/03-cli.md#licenses) - Check all licenses

## Related Analyzers

- [Vulnerable Dependencies](/analyzers/security/vulnerable-dependencies) - Checks for known security vulnerabilities
- [Frontend Vulnerable Dependencies](/analyzers/security/frontend-vulnerable-dependencies) - NPM package vulnerabilities
- [Dependency Version Constraints](/analyzers/reliability/dependency-constraints) - Validates version constraints
- [Outdated Dependencies](/analyzers/maintenance/outdated-dependencies) - Identifies outdated packages
