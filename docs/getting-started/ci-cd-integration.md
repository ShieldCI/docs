---
title: CI/CD Integration
description: Integrate ShieldCI into your continuous integration and deployment pipelines
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
php artisan shield:analyze
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
```php
// config/shieldci.php
'ci_mode' => env('SHIELDCI_CI_MODE', false),
```

Or via environment variable:
```bash
SHIELDCI_CI_MODE=true php artisan shield:analyze
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
        run: php artisan shield:analyze
        env:
          SHIELDCI_CI_MODE: true
```

### With JSON Report Artifact

```yaml
name: ShieldCI Analysis

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'

      - name: Install dependencies
        run: composer install --no-dev --prefer-dist

      - name: Run ShieldCI
        run: php artisan shield:analyze --format=json --output=shieldci-report.json
        continue-on-error: true
        id: analysis

      - name: Upload analysis report
        uses: actions/upload-artifact@v4
        with:
          name: shieldci-report
          path: shieldci-report.json
          retention-days: 30

      - name: Check analysis result
        if: steps.analysis.outcome == 'failure'
        run: exit 1
```

### PR Comment with Results

```yaml
name: ShieldCI PR Analysis

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'

      - name: Install dependencies
        run: composer install --no-dev --prefer-dist

      - name: Run ShieldCI
        id: shieldci
        run: |
          php artisan shield:analyze --format=json --output=report.json
          echo "result=$(cat report.json | jq -c '.summary')" >> $GITHUB_OUTPUT
        continue-on-error: true

      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            const summary = JSON.parse('${{ steps.shieldci.outputs.result }}');
            const body = `## 🛡️ ShieldCI Analysis Results

            | Severity | Count |
            |----------|-------|
            | Critical | ${summary.critical} |
            | High | ${summary.high} |
            | Medium | ${summary.medium} |
            | Low | ${summary.low} |

            **Total Issues:** ${summary.total}`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
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
    - php artisan shield:analyze
  variables:
    SHIELDCI_CI_MODE: "true"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

### With Artifacts

```yaml
shieldci:
  stage: test
  image: php:8.2-cli
  before_script:
    - apt-get update && apt-get install -y git unzip
    - curl -sS https://getcomposer.org/installer | php
    - php composer.phar install --no-dev
  script:
    - php artisan shield:analyze --format=json --output=shieldci-report.json
  artifacts:
    reports:
      codequality: shieldci-report.json
    paths:
      - shieldci-report.json
    expire_in: 1 week
  variables:
    SHIELDCI_CI_MODE: "true"
```

## Jenkins

### Pipeline Script

```groovy
pipeline {
    agent any

    stages {
        stage('Install') {
            steps {
                sh 'composer install --no-dev --prefer-dist'
            }
        }

        stage('ShieldCI Analysis') {
            steps {
                sh '''
                    export SHIELDCI_CI_MODE=true
                    php artisan shield:analyze --format=json --output=shieldci-report.json
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'shieldci-report.json', fingerprint: true
                }
            }
        }
    }

    post {
        failure {
            echo 'ShieldCI found security or quality issues!'
        }
    }
}
```

## CircleCI

### Configuration

Create `.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  shieldci:
    docker:
      - image: cimg/php:8.2
    steps:
      - checkout
      - run:
          name: Install dependencies
          command: composer install --no-dev --prefer-dist
      - run:
          name: Run ShieldCI
          command: php artisan shield:analyze
          environment:
            SHIELDCI_CI_MODE: true
      - store_artifacts:
          path: shieldci-report.json

workflows:
  main:
    jobs:
      - shieldci
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
          - php artisan shield:analyze
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
            - php artisan shield:analyze --format=json --output=shieldci-report.json

definitions:
  caches:
    composer: ~/.composer/cache
```

## Pre-Commit Hooks

Run ShieldCI before commits using Git hooks.

### Using Husky (npm)

Install Husky:
```bash
npm install husky --save-dev
npx husky init
```

Create `.husky/pre-commit`:
```bash
#!/bin/sh
php artisan shield:analyze --category=security
```

### Using pre-commit framework

Create `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: local
    hooks:
      - id: shieldci
        name: ShieldCI Security Scan
        entry: php artisan shield:analyze --category=security
        language: system
        pass_filenames: false
        stages: [commit]
```

### Native Git Hook

Create `.git/hooks/pre-commit`:
```bash
#!/bin/sh

echo "Running ShieldCI security scan..."
php artisan shield:analyze --category=security

if [ $? -ne 0 ]; then
    echo "❌ Security issues found. Please fix before committing."
    exit 1
fi

echo "✅ Security scan passed."
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Best Practices

### 1. Use CI Mode

Always enable CI mode in pipelines to skip analyzers that don't make sense in ephemeral environments:

```bash
SHIELDCI_CI_MODE=true php artisan shield:analyze
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
      - run: php artisan shield:analyze --category=security
        env:
          SHIELDCI_CI_MODE: true

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
      - run: php artisan shield:analyze --category=performance,reliability
        env:
          SHIELDCI_CI_MODE: true

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
      - run: php artisan shield:analyze --category=code-quality,best-practices
        env:
          SHIELDCI_CI_MODE: true
```

**Why tier your analysis?**

- **Security** issues pose immediate risk (exploits, data breaches) and should block *any* branch from being deployed or merged accidentally
- **Performance/Reliability** issues affect production quality but are most relevant when code is about to be deployed (PRs targeting main, or the main branch itself)
- **Code Quality/Best Practices** issues are about maintainability, not immediate risk—they're most actionable during code review when someone is actively looking at the changes
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
| `SHIELDCI_CI_MODE` | `false` | Enable CI mode |
| `SHIELDCI_FAIL_ON` | `high` | Failure threshold |
| `SHIELDCI_FAIL_THRESHOLD` | `null` | Minimum score to pass (0-100) |
| `SHIELDCI_TIMEOUT` | `300` | Analysis timeout in seconds |
| `SHIELDCI_MEMORY_LIMIT` | `512M` | PHP memory limit |
| `SHIELDCI_REPORT_FORMAT` | `console` | Output format (console/json) |

## Next Steps

- **[Configuration](/getting-started/configuration)** - Full configuration reference
- **[Troubleshooting](/getting-started/troubleshooting)** - Common CI/CD issues and solutions
- **[Analyzers](/analyzers/)** - Understanding what ShieldCI checks
