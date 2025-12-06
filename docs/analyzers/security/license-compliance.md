---
title: Dependency License Compliance Analyzer
description: Validates that all dependencies use legally acceptable licenses for your application type
icon: file-text
outline: [2, 3]
tags: licenses,legal,compliance,dependencies,gpl,commercial
---

# Dependency License Compliance Analyzer

| Analyzer ID          | Category     | Severity   | Time To Fix  |
| ---------------------| :----------: |:----------:| ------------:|
| `license-compliance` | 🛡️ Security  | Critical   | 120 minutes   |

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

### Quick Fix (30 minutes)

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

### Proper Fix (120 minutes)

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

## References

- [SPDX License List](https://spdx.org/licenses/) - Standard license identifiers
- [Choose a License](https://choosealicense.com/) - License comparison
- [GPL FAQ](https://www.gnu.org/licenses/gpl-faq.html) - GNU GPL frequently asked questions
- [LGPL vs GPL](https://www.gnu.org/licenses/lgpl-3.0.html) - Understanding LGPL differences
- [AGPL Network Clause](https://www.gnu.org/licenses/agpl-3.0.html) - AGPL for SaaS implications
- [Composer License Command](https://getcomposer.org/doc/03-cli.md#licenses) - Check all licenses

## Related Analyzers

- [Vulnerable Dependencies Analyzer](/analyzers/security/vulnerable-dependencies) - Checks for known security vulnerabilities
- [Frontend Vulnerable Dependencies Analyzer](/analyzers/security/frontend-vulnerable-dependencies) - NPM package vulnerabilities
- [Up-to-Date Dependencies Analyzer](/analyzers/security/up-to-date-dependencies) - Identifies outdated packages
- [Stable Dependencies Analyzer](/analyzers/security/stable-dependencies) - Validates version constraints
