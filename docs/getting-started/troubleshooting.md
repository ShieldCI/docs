---
title: Troubleshooting
description: Common issues and solutions when using ShieldCI
tags: troubleshooting,errors,debugging,memory,php
icon: wrench
outline: [2, 3]
---

# Troubleshooting

This guide covers common issues you might encounter when using ShieldCI and how to resolve them.

## Memory Issues

### PHP Memory Limit Exhausted

**Error:**
```
Fatal error: Allowed memory size of 134217728 bytes exhausted
```

**Solutions:**

1. **Increase memory limit in configuration:**
```php
// config/shieldci.php
'memory_limit' => '1G',  // Increase from default 512M
```

2. **Via environment variable:**
```bash
SHIELDCI_MEMORY_LIMIT=1G php artisan shield:analyze
```

3. **Via PHP CLI:**
```bash
php -d memory_limit=1G artisan shield:analyze
```

4. **Reduce analysis scope:**
```bash
# Analyze specific category
php artisan shield:analyze --category=security

# Analyze specific paths only
# Update config/shieldci.php paths.analyze array
```

### Large Codebases

For very large codebases (500k+ lines of code):

1. **Run categories separately:**
```bash
php artisan shield:analyze --category=security
php artisan shield:analyze --category=performance
php artisan shield:analyze --category=reliability
```

2. **Exclude generated/vendor code:**
```php
// config/shieldci.php
'excluded_paths' => [
    'vendor/*',
    'node_modules/*',
    'storage/*',
    '_ide_helper*.php',      // IDE helpers
    'database/factories/*',  // Factory files
    'resources/views/vendor/*', // Published views
],
```

## Timeout Issues

### Analysis Timeout

**Error:**
```
ShieldCI analysis timed out after 300 seconds
```

**Solutions:**

1. **Increase timeout:**
```php
// config/shieldci.php
'timeout' => 600,  // 10 minutes
```

2. **Via environment variable:**
```bash
SHIELDCI_TIMEOUT=600 php artisan shield:analyze
```

3. **Run specific analyzers:**
```bash
# Run only the analyzers you need
php artisan shield:analyze --analyzer=sql-injection,xss-vulnerabilities
```

4. **Exclude slow analyzers in CI:**
```php
// config/shieldci.php
'ci_mode_exclude_analyzers' => [
    'phpstan',  // PHPStan can be slow on large codebases
],
```

## False Positives

### Handling False Positives

If ShieldCI reports issues that aren't actually problems:

**Option 1: Ignore specific errors**
```php
// config/shieldci.php
'ignore_errors' => [
    'sql-injection' => [
        [
            'path' => 'app/Legacy/OldController.php',
            'message' => 'Potential SQL injection vulnerability',
        ],
    ],
],
```

**Option 2: Use path patterns**
```php
'ignore_errors' => [
    'xss-vulnerabilities' => [
        ['path_pattern' => 'app/Legacy/*.php'],  // All legacy files
    ],
],
```

**Option 3: Use baseline**
```bash
# Generate baseline of existing issues
php artisan shield:baseline

# Future runs only report NEW issues
php artisan shield:analyze --baseline
```

**Option 4: Disable the analyzer entirely**
```php
'disabled_analyzers' => [
    'analyzer-id-that-doesnt-apply',
],
```

### Reviewing False Positives

Before ignoring, verify it's actually a false positive:

1. **Read the full error message** - ShieldCI explains why it flagged the code
2. **Check the code context** - The code snippet shows surrounding lines
3. **Understand the vulnerability** - Link to OWASP/security resources in the analyzer docs
4. **Consider if it's worth fixing anyway** - Sometimes "false positives" are actually code smells

::: warning Be Careful
Don't blindly ignore security warnings. Each `ignore_errors` entry should be reviewed and documented. Consider adding a comment in your config explaining WHY it's safe to ignore.
:::

## Environment Detection Issues

### Wrong Environment Detected

Some analyzers behave differently based on environment (production vs development).

**Symptoms:**
- Production-only analyzers running in development
- Missing warnings that should appear in production

**Solutions:**

1. **Verify APP_ENV:**
```bash
php artisan env
```

2. **Check environment mapping:**
```php
// config/shieldci.php
'environment_mapping' => [
    'production-us' => 'production',
    'production-eu' => 'production',
    'staging-preview' => 'staging',
],
```

3. **Clear config cache:**
```bash
php artisan config:clear
```

## Analyzer Conflicts

### Conflicting Recommendations

Sometimes two analyzers may give seemingly conflicting advice.

**Example:** "Use query builder for performance" vs "Use Eloquent for maintainability"

**Resolution:**

ShieldCI prioritizes security over performance over code quality. When recommendations conflict:

1. **Security always wins** - Never sacrifice security for performance
2. **Consider context** - Read both recommendations fully
3. **Use your judgment** - You know your application best

### Analyzer Errors

**Error:**
```
Analyzer 'some-analyzer' encountered an error during execution
```

**Solutions:**

1. **Check the error details:**
```bash
php artisan shield:analyze --format=json | jq '.errors'
```

2. **Common causes:**
   - Missing optional dependencies (e.g., PHPStan for static analysis)
   - Invalid configuration files
   - Corrupted project files

3. **Run that analyzer in isolation:**
```bash
php artisan shield:analyze --analyzer=some-analyzer
```

4. **Disable problematic analyzer temporarily:**
```php
'disabled_analyzers' => [
    'problematic-analyzer',
],
```

## CI/CD Issues

### CI Builds Failing Unexpectedly

**Symptoms:** Builds pass locally but fail in CI

**Common causes and solutions:**

1. **Environment differences:**
```bash
# Ensure CI mode is enabled
php artisan shield:analyze --ci
```

2. **Different configurations:**
```bash
# Verify configuration in CI
php artisan config:show shieldci
```

3. **Caching issues:**
```bash
# Clear all caches in CI
php artisan config:clear
php artisan cache:clear
```

4. **Different PHP versions:**
   - Ensure CI uses the same PHP version as production

### Exit Code Issues

**Problem:** ShieldCI returns wrong exit code

**Verify exit code behavior:**
```bash
php artisan shield:analyze
echo "Exit code: $?"
```

**Check fail_on configuration:**
```php
// config/shieldci.php
'fail_on' => 'high',  // Default: fails on High and Critical
```

**Environment override:**
```bash
SHIELDCI_FAIL_ON=critical php artisan shield:analyze
```

### Baseline Not Working

**Problem:** Issues are still reported despite baseline

**Solutions:**

1. **Verify baseline flag:**
```bash
php artisan shield:analyze --baseline
```

2. **Check baseline file exists:**
```bash
ls -la .shieldci-baseline.json
```

3. **Regenerate baseline:**
```bash
php artisan shield:baseline
```

4. **Check for file changes:**
   - Baseline matches by file path and line number
   - If code moved, regenerate baseline

## Installation Issues

### Package Not Found

**Error:**
```
Package shieldci/laravel not found
```

**Solutions:**

1. **Check repository configuration:**
```bash
composer config repositories
```

2. **Clear Composer cache:**
```bash
composer clear-cache
```

3. **Update Composer:**
```bash
composer self-update
```

### Service Provider Not Loaded

**Error:**
```
Class 'ShieldCI\Laravel\ShieldCIServiceProvider' not found
```

**Solutions:**

1. **Clear bootstrap cache:**
```bash
php artisan clear-compiled
composer dump-autoload
```

2. **Manually register provider (if auto-discovery disabled):**
```php
// config/app.php
'providers' => [
    ShieldCI\Laravel\ShieldCIServiceProvider::class,
],
```

3. **Check composer.json autoload:**
```bash
composer dump-autoload
```

## Performance Optimization

### Speed Up Analysis

1. **Enable OPcache:**
```ini
; php.ini
opcache.enable=1
opcache.enable_cli=1
```

2. **Run specific categories:**
```bash
php artisan shield:analyze --category=security
```

3. **Limit issues per analyzer:**
```php
'report' => [
    'max_issues_per_check' => 3,  // Show only first 3 issues
],
```

4. **Disable code snippets:**
```php
'report' => [
    'show_code_snippets' => false,  // Faster output
],
```

### Caching Analysis Results

ShieldCI doesn't cache results between runs (each analysis is fresh). For repeated analysis:

1. **Save to file:**
```bash
php artisan shield:analyze --format=json --output=results.json
```

2. **Compare results:**
```bash
# Compare with previous run
diff previous-results.json results.json
```

## Getting Help

### Collect Debug Information

When reporting issues, include:

1. **Laravel version:**
```bash
php artisan --version
```

2. **PHP version:**
```bash
php --version
```

3. **ShieldCI version:**
```bash
composer show shieldci/laravel
```

4. **Full error output:**
```bash
php artisan shield:analyze 2>&1 | tee shieldci-output.log
```

5. **Configuration:**
```bash
php artisan config:show shieldci
```

### Report Issues

- **GitHub Issues:** [github.com/shieldci/laravel/issues](https://github.com/shieldci/laravel/issues)
- Include: Error message, steps to reproduce, environment details

## Next Steps

- **[Configuration](/getting-started/configuration)** - Customize ShieldCI behavior
- **[CI/CD Integration](/getting-started/ci-cd-integration)** - Pipeline setup guide
- **[Analyzers](/analyzers/)** - Understanding each analyzer
