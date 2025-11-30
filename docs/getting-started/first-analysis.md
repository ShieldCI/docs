---
title: First Analysis
description: Run your first ShieldCI analysis and understand the results
icon: play
outline: [2, 3]
---

# First Analysis

This tutorial walks you through running your first ShieldCI security and quality scan, understanding the results, and fixing your first issues.

## Prerequisites

- ShieldCI installed ([Installation Guide](/getting-started/installation))
- Laravel 9+ application
- 5-10 minutes

## Step 1: Run Your First Scan

Open your terminal in your Laravel project root and run:

```bash
php artisan shield:analyze
```

**What happens next:**
1. ShieldCI discovers your project structure (3-5 seconds)
2. Parses PHP files into Abstract Syntax Trees (10-20 seconds)
3. Runs 102 analyzers across 5 categories (20-30 seconds)
4. Generates detailed report (2-5 seconds)

**Total duration:** 30-60 seconds for typical Laravel apps

## Step 2: Understanding the Output

### Success - No Critical Issues

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ShieldCI Analysis Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ PASSED - Your application meets security standards

  📊 Summary:
  • Total Issues: 0
  • Critical: 0
  • High: 0
  • Medium: 0
  • Low: 0

  🎉 Great job! No issues found.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Analysis completed in 42.3 seconds
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Congratulations!** Your app has no detectable security or quality issues.

### Warning - Medium/Low Issues

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ShieldCI Analysis Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⚠️  WARNING - Found 5 medium/low severity issues

  📊 Summary:
  • Total Issues: 5
  • Critical: 0
  • High: 0
  • Medium: 3
  • Low: 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Medium Issues (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⚠️  Missing Route Caching
  Location: routes/web.php
  Time to Fix: 2 minutes

  Routes are not cached, impacting performance. Run:
  php artisan route:cache

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Action required:** Fix medium/low issues when convenient.

### Failed - Critical/High Issues

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ShieldCI Analysis Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ❌ FAILED - Found 3 critical issues requiring immediate attention

  📊 Summary:
  • Total Issues: 12
  • Critical: 3
  • High: 4
  • Medium: 3
  • Low: 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Critical Issues (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ❌ Debug Mode Enabled in Production
  Category: Security
  Location: config/app.php:46
  Time to Fix: 5 minutes

  Issue:
  APP_DEBUG=true in production exposes sensitive information including:
  - Stack traces with file paths and code
  - Database credentials in error messages
  - API keys and secrets in exception dumps

  Code:
  45 │     'debug' => env('APP_DEBUG', false),
  46 │

  Fix:
  1. Set APP_DEBUG=false in .env.production
  2. Configure proper error logging:

     # .env.production
     APP_DEBUG=false
     LOG_LEVEL=error
     LOG_CHANNEL=stack

  3. Restart application

  References:
  - https://laravel.com/docs/errors
  - https://owasp.org/www-community/Improper_Error_Handling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ❌ Login Route Lacks Rate Limiting
  Category: Security
  Location: routes/web.php:24
  Time to Fix: 5 minutes

  Issue:
  Without rate limiting, attackers can attempt unlimited password
  combinations, leading to brute force attacks and account takeover.

  Code:
  23 │ use App\Http\Controllers\Auth\LoginController;
  24 │ Route::post('/login', [LoginController::class, 'login']);
  25 │

  Fix:
  Add throttle middleware:

  Route::post('/login', [LoginController::class, 'login'])
       ->middleware('throttle:5,1');

  This allows 5 attempts per minute per IP address.

  References:
  - https://laravel.com/docs/routing#rate-limiting
  - https://docs.shieldci.com/analyzers/security/login-throttling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ❌ Vulnerable Dependency Detected
  Category: Security
  Location: composer.lock
  Time to Fix: 10 minutes

  Issue:
  symfony/http-foundation v6.0.1 has a known security vulnerability
  (CVE-2023-1234): Session fixation attack possible

  Fix:
  Update the vulnerable package:

  composer update symfony/http-foundation

  Then verify the fix:
  composer show symfony/http-foundation

  Expected version: 6.0.8 or higher

  References:
  - https://symfony.com/blog/cve-2023-1234
  - https://github.com/symfony/symfony/security/advisories

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  High Issues (4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⚠️  N+1 Query Detected in UserController
  [Additional issues listed...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Analysis completed in 45.7 seconds
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Action required:** Fix critical/high issues immediately before deploying.

## Step 3: Understanding Issue Severity

### Critical Issues (Red ❌)
**Fix immediately** - These are security vulnerabilities that could lead to:
- Data breaches
- Account takeover
- Code execution
- Information disclosure

**Examples:**
- Debug mode enabled in production
- Missing CSRF protection
- SQL injection vulnerabilities
- Exposed database credentials

**Timeline:** Fix before next deployment (0-24 hours)

### High Issues (Orange ⚠️)
**Fix soon** - These are significant security or performance risks:
- Brute force attack vectors
- N+1 queries in critical paths
- Vulnerable dependencies
- Missing authentication checks

**Timeline:** Fix within 1-2 weeks

### Medium Issues (Yellow ⚠️)
**Fix when convenient** - Best practice violations and optimizations:
- Missing cache configuration
- Deprecated API usage
- Code quality issues
- Suboptimal configurations

**Timeline:** Fix within 1-2 months or next refactoring cycle

### Low Issues (Blue ℹ️)
**Optional improvements** - Minor enhancements:
- Missing route names
- Documentation gaps
- Code style inconsistencies

**Timeline:** Fix when refactoring or during maintenance

## Step 4: Fixing Your First Issue

Let's fix the **Debug Mode** critical issue step-by-step.

### Current State (Vulnerable)

**File:** `config/app.php`
```php
'debug' => env('APP_DEBUG', true),  // ❌ Defaults to true
```

**.env:**
```env
APP_DEBUG=true  # ❌ Debug enabled
```

**Problem:** Stack traces expose sensitive data in production.

### Fix Step-by-Step

**1. Update production environment file:**
```bash
# Edit .env (or .env.production)
nano .env
```

**2. Change debug setting:**
```env
# BEFORE
APP_DEBUG=true

# AFTER
APP_DEBUG=false
LOG_LEVEL=error
```

**3. Clear config cache:**
```bash
php artisan config:clear
php artisan cache:clear
```

**4. Verify the fix:**
```bash
php artisan tinker
>>> config('app.debug')
=> false  // ✅ Correct
```

**5. Re-run ShieldCI to confirm:**
```bash
php artisan shield:analyze
```

Expected output:
```
✅ Debug Mode Analyzer: PASSED
No issues found in config/app.php
```

### Fixed State (Secure)

**File:** `config/app.php`
```php
'debug' => env('APP_DEBUG', false),  // ✅ Defaults to false
```

**.env.production:**
```env
APP_DEBUG=false  # ✅ Debug disabled
LOG_LEVEL=error
LOG_CHANNEL=stack
```

**Result:** Production errors logged securely without exposing sensitive data.

## Step 5: Fixing Login Throttling

Let's fix the **Login Throttling** issue.

### Current State (Vulnerable)

**File:** `routes/web.php`
```php
Route::post('/login', [LoginController::class, 'login']);  // ❌ No throttle
```

**Problem:** Attackers can try unlimited password combinations.

### Fix

**Add throttle middleware:**
```php
Route::post('/login', [LoginController::class, 'login'])
     ->middleware('throttle:5,1');  // ✅ 5 attempts per minute
```

**Verify the fix:**
```bash
php artisan route:list | grep login
```

Expected output:
```
POST   | /login | login | throttle:5,1 | LoginController@login
```

**Re-run ShieldCI:**
```bash
php artisan shield:analyze
```

Expected:
```
✅ Login Throttling Analyzer: PASSED
Rate limiting properly configured on authentication routes
```

## Step 6: Updating Vulnerable Dependencies

Let's fix the **Vulnerable Dependency** issue.

### Current State

**composer.lock shows:**
```json
{
  "name": "symfony/http-foundation",
  "version": "v6.0.1"  // ❌ Vulnerable
}
```

### Fix

**1. Update the package:**
```bash
composer update symfony/http-foundation
```

**2. Verify the update:**
```bash
composer show symfony/http-foundation
```

Expected output:
```
name     : symfony/http-foundation
version  : v6.0.8  // ✅ Fixed version
```

**3. Re-run ShieldCI:**
```bash
php artisan shield:analyze
```

Expected:
```
✅ Vulnerable Dependencies Analyzer: PASSED
No known vulnerabilities in Composer dependencies
```

## Step 7: Export Results

### JSON Export (for automation)

```bash
php artisan shield:analyze --format=json > results.json
```

**Use in scripts:**
```bash
# Check if critical issues exist
CRITICAL=$(cat results.json | jq '.summary.critical')

if [ $CRITICAL -gt 0 ]; then
    echo "❌ Critical issues found - blocking deployment"
    exit 1
fi
```

### JSON Report Export

```bash
php artisan shield:analyze --format=json --output=report.json
```

Open `report.html` in your browser for an interactive report with:
- Visual charts
- Filterable issue list
- Historical trends
- Exportable PDF

## Step 8: Continuous Monitoring

### Schedule Regular Scans

**File:** `app/Console/Kernel.php`
```php
protected function schedule(Schedule $schedule)
{
    // Daily security scan
    $schedule->command('shield:analyze --format=json')
             ->daily()
             ->at('02:00')
             ->emailOutputOnFailure('security@company.com');

    // Weekly comprehensive scan
    $schedule->command('shield:analyze --format=json')
             ->weekly()
             ->mondays()
             ->at('09:00');
}
```

### CI/CD Integration

**GitHub Actions (.github/workflows/shieldci.yml):**
```yaml
name: Security Analysis

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: 8.2

      - name: Install Dependencies
        run: composer install --no-dev

      - name: Run ShieldCI
        run: php artisan shield:analyze --format=json
```

This runs ShieldCI on every commit, blocking merges if critical issues are found.

## Common First-Time Issues

### Issue: "Skipped - No routes directory"

**Cause:** Project doesn't have a `routes/` directory

**Solution:**
```bash
# For Laravel 11+ with bootstrap/app.php
mkdir -p routes
touch routes/web.php
```

### Issue: "Memory limit exceeded"

**Cause:** Large project with insufficient memory

**Solution:**
```bash
php -d memory_limit=512M artisan shield:analyze
```

### Issue: "Too many issues to fix"

**Cause:** Legacy project with accumulated technical debt

**Solution:** Create a baseline
```bash
# Ignore existing issues
php artisan shield:baseline

# Only new issues will be reported
php artisan shield:analyze --baseline
```

## Next Steps

Now that you've run your first analysis and fixed some issues:

1. **[Configuration](/getting-started/configuration)** - Customize analyzer behavior
2. **[Analyzers Reference](/analyzers/)** - Understand each analyzer in depth
3. **[CI/CD Integration](/integrations/ci-cd)** - Automate security checks
4. **[Best Practices](/guides/best-practices)** - Learn pro tips for secure Laravel apps

## Quick Reference

### Commands

```bash
# Basic analysis
php artisan shield:analyze

# Specific categories
php artisan shield:analyze --category=security

# Specific analyzer
php artisan shield:analyze --analyzer=sql-injection

# JSON output
php artisan shield:analyze --format=json

# Save report to file
php artisan shield:analyze --output=results.json

# Create baseline (ignore existing issues)
php artisan shield:baseline

# Use baseline to filter results
php artisan shield:analyze --baseline
```

### Exit Codes

- `0` - Success (no critical issues)
- `1` - Failed (critical issues found)
- `2` - Warning (high severity issues)
- `3` - Error (analysis failed)

### Severity Priorities

1. **Critical** → Fix immediately (0-24 hours)
2. **High** → Fix soon (1-2 weeks)
3. **Medium** → Fix when convenient (1-2 months)
4. **Low** → Optional improvements

## Getting Help

**Found an issue you don't understand?**
- Check the [Analyzers Reference](/analyzers/) for detailed explanations
- Search [GitHub Issues](https://github.com/shieldci/laravel/issues)
- Ask on [Discord](https://discord.gg/shieldci)

**False positive?**
- Use inline suppression: `// @shieldci-ignore-next-line`
- Report to improve analyzer accuracy

**Need custom rules?**
- See [Custom Analyzers](/guides/custom-analyzers)
- Contact support for Pro customers
