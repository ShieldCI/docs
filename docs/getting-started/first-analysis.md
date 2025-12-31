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
3. Runs 73 analyzers across 5 categories (20-30 seconds)
4. Generates detailed report (2-5 seconds)

**Total duration:** 30-60 seconds for typical Laravel apps

## Step 2: Understanding the Output

### Terminal output

<img src="/terminal.png" style="margin-top: 16px" alt="ShieldCI Terminal" />

### Failed Checks

All checks that fail will include a description of why they failed along with the associated lines of code (if applicable).

<img src="/failed-checks.png" style="margin-top: 16px" alt="ShieldCI Terminal" />

### Report Card Summary

After displaying all issues, ShieldCI shows a Report Card with analyzer results grouped by category:

```
Report Card
===========

+----------------+----------------+----------------+----------------+----------------+----------------+------------+
| Status         | Security       | Performance    | Reliability    | Code Quality   | Best Practices |     Total  |
+----------------+----------------+----------------+----------------+----------------+----------------+------------+
| Passed         |   18  (82%)    |   8  (44%)     |   9  (69%)     |   1  (20%)     |   5  (33%)     | 41  (56%)  |
| Failed         |    1   (5%)    |    0   (0%)    |    3   (23%)   |    4   (80%)   |    9   (60%)   |  17  (23%) |
| Warning        |    1   (5%)    |    1   (6%)    |    0   (0%)    |    0   (0%)    |    0   (0%)    |  2  (3%)   |
| Not Applicable |    2   (9%)    |    9   (50%)   |    1   (8%)    |    0   (0%)    |    1   (7%)    |  13   (18%)|
| Error          |    0   (0%)    |    0   (0%)    |    0   (0%)    |    0   (0%)    |    0   (0%)    |  0   (0%)  |
+----------------+----------------+----------------+----------------+----------------+----------------+------------+
```

**Understanding the Report Card:**

- **Passed:** Analyzers that found no issues
- **Failed:** Analyzers that found Critical or High severity issues
- **Warning:** Analyzers that found Medium or Low severity issues
- **Not Applicable:** Analyzers skipped because they don't apply to your project (e.g., MySQL analyzer when using PostgreSQL)
- **Error:** Analyzers that encountered exceptions during execution

### Exit Codes

ShieldCI returns different exit codes for CI/CD integration:

- **Exit code 0:** Analysis passed (no Critical/High issues)
- **Exit code 1:** Analysis failed (Critical or High issues detected)

::: tip CI/CD Integration
Use the exit code in your CI/CD pipeline to fail builds when security issues are detected:
```bash
php artisan shield:analyze || exit 1
```
:::

## Step 3: Understanding Analyzer Statuses

Each analyzer reports one of five statuses:

### ✅ Passed
No issues detected. The analyzer completed successfully and found no problems.

### ❌ Failed
Critical or High severity issues detected. These require prompt attention.

**Critical Issues** - Security vulnerabilities that could lead to:
- Data breaches
- Account takeover
- Code execution
- Information disclosure

**Examples:** Debug mode in production, Missing CSRF protection, SQL injection, Exposed credentials

**High Issues** - Significant security or performance risks:
- Brute force attack vectors
- N+1 queries
- Vulnerable dependencies
- Missing auth checks

**Examples:** Login throttling disabled, Eager loading missing, Outdated packages with CVEs

### ⚠️ Warning
Medium or Low severity issues detected. Address when convenient.

**Medium Issues** - Best practice violations and optimizations:
- Missing cache configuration
- Deprecated API usage
- Code quality issues

**Examples:** Config not cached, Route caching disabled, Using deprecated methods

**Low Issues** - Optional improvements:
- Missing route names
- Documentation gaps
- Code style inconsistencies

**Examples:** Missing DocBlocks, Unnamed routes, Minor formatting issues

### ⊘ Not Applicable
Analyzer doesn't apply to your project configuration.

**Examples:**
- MySQL optimization analyzer when using PostgreSQL
- Horizon analyzer when not using Laravel Horizon
- Frontend dependency analyzer when no package.json exists

### ⚠️ Error
Analyzer encountered an unexpected error during execution. This typically indicates:
- Missing dependencies or configuration
- File permission issues
- Corrupted project files

**Action:** Check the error message and verify your project setup.

## Step 4: Fixing Your First Issue

Let's fix the **Debug Mode** critical issue step-by-step.

### Current State (Vulnerable)

**File:** `config/app.php`
```php
'debug' => env('APP_DEBUG', true),  // ❌ Defaults to true
```

**.env:**
```ini
APP_DEBUG=true  # ❌ Debug enabled
```

**Problem:** Stack traces expose sensitive data in production.

### Fix Step-by-Step

**1. Update production environment file:**
```bash
# Edit .env
nano .env
```

**2. Change debug setting:**
```ini
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

**4. Re-run ShieldCI to confirm:**
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

**.env:**
```ini
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
php artisan route:list --path=login -v
```

Expected output:
```
POST   | /login.........................LoginController@login
         ⇂ web
         ⇂ Illuminate\Routing\Middleware\ThrottleRequests:5,1
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

This exports a structured JSON file containing:
- Complete analysis results
- Issue details and metadata
- Summary statistics
- Analyzer information

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
          php-version: 8.1

      - name: Install Dependencies
        run: composer install --no-dev

      - name: Run ShieldCI
        run: php artisan shield:analyze --format=json
```

This runs ShieldCI on every commit, blocking merges if critical issues are found.


## Next Steps

Now that you've run your first analysis and fixed some issues:

1. **[Configuration](/getting-started/configuration)** - Customize analyzer behavior
2. **[Analyzers Reference](/analyzers/)** - Understand each analyzer in depth

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

- `0` - Success (no high/critical issues)
- `1` - Failed (high/critical issues found)

### Severity Priorities

1. **Critical** → Fix immediately (0-24 hours)
2. **High** → Fix soon (1-2 weeks)
3. **Medium** → Fix when convenient (1-2 months)
4. **Low** → Optional improvements

## Getting Help

**Found an issue you don't understand?**
- Check the [Analyzers Reference](/analyzers/) for detailed explanations
- Search [GitHub Issues](https://github.com/shieldci/laravel/issues)

**False positive?**
<!-- Use inline suppression: `// @shieldci-ignore-next-line` -->
- Report to improve analyzer accuracy
