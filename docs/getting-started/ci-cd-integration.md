---
title: CI/CD Integration
description: Integrate ShieldCI into GitHub Actions, GitLab CI, or Bitbucket Pipelines to catch security and performance issues automatically on every commit
tags: ci-cd,github-actions,gitlab-ci,automation,pipeline,deployment
icon: git-branch
outline: [2, 3]
---

# CI/CD Integration

ShieldCI is designed for seamless integration into your CI/CD pipelines, providing automated security and quality analysis on every commit, pull request, or deployment.

## Quick Start

Add ShieldCI to any CI pipeline with these basic steps:

```bash
# Install dependencies
composer install --no-dev

# Run analysis
php artisan shield:analyze --ci
```

ShieldCI returns exit codes based on analysis results, making it easy to fail builds when issues are detected.

## Exit Codes

ShieldCI uses standard exit codes for CI/CD integration:

| Exit Code | Meaning |
|-----------|---------|
| `0` | Success - No issues above threshold |
| `1` | Failure - Issues found at or above threshold |

The exit code behavior is controlled by the `fail_on` configuration:

```php
// config/shieldci.php
'fail_on' => env('SHIELDCI_FAIL_ON', 'high'),
```

| `fail_on` Value | Fails On | Typical Use Case |
|-----------------|----------|------------------|
| `'never'` | Never | Reporting only (always exit 0) |
| `'critical'` | Critical issues | Legacy codebases, gradual adoption |
| `'high'` | High + Critical | **Recommended default** |
| `'medium'` | Medium + High + Critical | Stricter quality standards |
| `'low'` | Any issue | Zero-tolerance enforcement |

## CI Mode

CI mode is a special operating mode that only runs analyzers suitable for CI environments. Some analyzers (like those checking server configuration) don't make sense in ephemeral CI containers.

**Enable CI mode:**
```bash
php artisan shield:analyze --ci
```

### CI Mode Analyzer Control

**Whitelist specific analyzers for CI:**
```php
'ci_mode_analyzers' => [
    'sql-injection',
    'xss-vulnerabilities',
    'csrf-protection',
    'mass-assignment-vulnerabilities',
],
```

**Exclude specific analyzers from CI:**
```php
'ci_mode_exclude_analyzers' => [
    'opcache-enabled',           // Not relevant in CI
    'php-ini',                   // CI has different PHP config
    'asset-cache-headers',       // No web server in CI
],
```

### Create CI-Specific Baseline

Generate a baseline containing only CI-compatible analyzers:
```bash
php artisan shield:baseline --ci
```

## GitHub Actions

### Basic Workflow

Create `.github/workflows/shieldci.yml`:

```yaml
name: ShieldCI Analysis

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master, develop]

jobs:
  analyze:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: mbstring, xml, ctype, json, bcmath
          coverage: none

      - name: Get Composer cache directory
        id: composer-cache
        run: echo "dir=$(composer config cache-files-dir)" >> $GITHUB_OUTPUT

      - name: Cache Composer dependencies
        uses: actions/cache@v4
        with:
          path: ${{ steps.composer-cache.outputs.dir }}
          key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}
          restore-keys: ${{ runner.os }}-composer-

      - name: Install dependencies
        run: composer install --no-dev --prefer-dist --no-progress

      - name: Run ShieldCI
        run: php artisan shield:analyze --ci
```

## GitLab CI

### Basic Configuration

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test

shieldci:
  stage: test
  image: php:8.2-cli
  before_script:
    - apt-get update && apt-get install -y git unzip
    - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    - composer install --no-dev --prefer-dist
  script:
    - php artisan shield:analyze --ci
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

## Bitbucket Pipelines

### Configuration

Create `bitbucket-pipelines.yml`:

```yaml
image: php:8.2-cli

pipelines:
  default:
    - step:
        name: ShieldCI Analysis
        caches:
          - composer
        script:
          - apt-get update && apt-get install -y git unzip
          - curl -sS https://getcomposer.org/installer | php
          - php composer.phar install --no-dev
          - php artisan shield:analyze --ci
        artifacts:
          - shieldci-report.json

  pull-requests:
    '**':
      - step:
          name: ShieldCI PR Analysis
          script:
            - apt-get update && apt-get install -y git unzip
            - curl -sS https://getcomposer.org/installer | php
            - php composer.phar install --no-dev
            - php artisan shield:analyze --ci --format=json --output=shieldci-report.json

definitions:
  caches:
    composer: ~/.composer/cache
```

## Best Practices

### 1. Use CI Mode

Always enable CI mode in pipelines to skip analyzers that don't make sense in ephemeral environments:

```bash
php artisan shield:analyze --ci
```

### 2. Cache Dependencies

Cache Composer dependencies to speed up builds:

```yaml
# GitHub Actions
- uses: actions/cache@v4
  with:
    path: vendor
    key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}
```

### 3. Use Baseline for Gradual Adoption

For existing projects, create a baseline to focus on new issues:

```bash
# Generate baseline once
php artisan shield:baseline --ci

# Run with baseline in CI
php artisan shield:analyze --baseline
```

### 4. Fail Fast on Critical Issues

Start with failing only on critical issues, then gradually tighten:

```bash
# Phase 1: Critical only
SHIELDCI_FAIL_ON=critical

# Phase 2: High + Critical (recommended)
SHIELDCI_FAIL_ON=high

# Phase 3: Medium and above
SHIELDCI_FAIL_ON=medium
```

### 5. Archive Reports

Always save JSON reports as artifacts for debugging and tracking:

```yaml
artifacts:
  paths:
    - shieldci-report.json
```

### 6. Tier Your Analysis by Risk Level

Different analyzer categories have different risk profiles and should run at different stages of your pipeline:

| Category | When to Run | Rationale |
|----------|-------------|-----------|
| **Security** | All branches | Immediate risk - exploits, data breaches |
| **Performance** | PRs + main | Deployment quality - scaling, speed |
| **Reliability** | PRs + main | Uptime - error handling, connectivity |
| **Code Quality** | PRs only | Maintainability - review-time concerns |
| **Best Practices** | PRs only | Technical debt - review-time concerns |

**Three-tier approach:**

```yaml
jobs:
  # Tier 1: Security on ALL branches (immediate risk)
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
      - run: composer install --no-dev --prefer-dist
      - run: php artisan shield:analyze --ci --category=security

  # Tier 2: Performance + Reliability on PRs and main (deployment quality)
  deployment-quality:
    if: github.event_name == 'pull_request' || github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
      - run: composer install --no-dev --prefer-dist
      - run: php artisan shield:analyze --ci --category=performance,reliability

  # Tier 3: Code quality + Best practices on PRs only (maintainability)
  code-quality:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
      - run: composer install --no-dev --prefer-dist
      - run: php artisan shield:analyze --ci --category=code-quality,best-practices
```

**Why tier your analysis?**

- **Security** issues pose immediate risk (exploits, data breaches) and should block *any* branch from being deployed or merged accidentally
- **Performance/Reliability** issues affect production quality but are most relevant when code is about to be deployed (PRs targeting main, or the main branch itself)
- **Code Quality/Best Practices** issues are about maintainability, not immediate risk. They're most actionable during code review when someone is actively looking at the changes
- Running all checks on every push to every branch adds CI time/cost with diminishing returns for WIP feature branches

::: tip Simplified Alternative
If managing three tiers is too complex, use a simpler two-tier split:
```yaml
# Always: Security (immediate risk)
- php artisan shield:analyze --category=security

# PRs only: Everything else (review-time concerns)
- if: github.event_name == 'pull_request'
  run: php artisan shield:analyze --category=performance,reliability,code-quality,best-practices
```
:::

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `SHIELDCI_ENABLED` | `true` | Enable/disable ShieldCI |
| `SHIELDCI_FAIL_ON` | `high` | Failure threshold |
| `SHIELDCI_FAIL_THRESHOLD` | `null` | Minimum score to pass (0-100) |
| `SHIELDCI_TIMEOUT` | `300` | Analysis timeout in seconds |
| `SHIELDCI_MEMORY_LIMIT` | `512M` | PHP memory limit |
| `SHIELDCI_REPORT_FORMAT` | `console` | Output format (console/json) |

## Next Steps

- **[Configuration](/getting-started/configuration)** - Full configuration reference
- **[Troubleshooting](/getting-started/troubleshooting)** - Common CI/CD issues and solutions
- **[Analyzers](/analyzers/)** - Understanding what ShieldCI checks
