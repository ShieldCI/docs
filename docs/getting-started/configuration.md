---
title: Configuration
description: Configure ShieldCI analyzers and settings for your Laravel application
icon: settings
outline: [2, 3]
---

# Configuration

ShieldCI works great out-of-the-box with zero configuration, but offers extensive customization options for advanced use cases.

## Quick Start

**Option 1: Use Defaults (Recommended)**
```bash
# No configuration needed
php artisan shield:analyze
```

**Option 2: Generate Config File**
```bash
php artisan vendor:publish --tag=shieldci-config
```

This creates `config/shieldci.php` with all available options.

## Configuration File Structure

### Basic Configuration

```php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Analysis Configuration
    |--------------------------------------------------------------------------
    | Control the overall behavior of ShieldCI analysis.
    */
    'enabled' => env('SHIELDCI_ENABLED', true),
    'timeout' => env('SHIELDCI_TIMEOUT', 300), // seconds
    'memory_limit' => env('SHIELDCI_MEMORY_LIMIT', '512M'),

    /*
    |--------------------------------------------------------------------------
    | Analysis Paths
    |--------------------------------------------------------------------------
    | Directories to analyze (relative to project root)
    */
    'paths' => [
        'analyze' => [
            'app',
            'config',
            'database',
            'routes',
            'resources/views',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Excluded Paths
    |--------------------------------------------------------------------------
    | Directories to skip during analysis (glob patterns)
    */
    'excluded_paths' => [
        'vendor/*',
        'node_modules/*',
        'storage/*',
        'bootstrap/cache/*',
        'tests/*',
    ],

    /*
    |--------------------------------------------------------------------------
    | Analyzer Categories
    |--------------------------------------------------------------------------
    | Enable or disable entire categories of analyzers, and configure
    | category-specific analyzer settings.
    */
    'analyzers' => [
        'security' => [
            'enabled' => env('SHIELDCI_SECURITY_ANALYZERS', true),
        ],
        'performance' => [
            'enabled' => env('SHIELDCI_PERFORMANCE_ANALYZERS', true),
        ],
        'reliability' => [
            'enabled' => env('SHIELDCI_RELIABILITY_ANALYZERS', true),
        ],
        'code_quality' => [
            'enabled' => env('SHIELDCI_CODE_QUALITY_ANALYZERS', true),
        ],
        'best_practices' => [
            'enabled' => env('SHIELDCI_BEST_PRACTICES_ANALYZERS', true),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Disabled Analyzers
    |--------------------------------------------------------------------------
    | Disable specific analyzers by their ID.
    */
    'disabled_analyzers' => [
        // 'sql-injection',
    ],

    /*
    |--------------------------------------------------------------------------
    | Reporting Configuration
    |--------------------------------------------------------------------------
    */
    'report' => [
        'format' => env('SHIELDCI_REPORT_FORMAT', 'console'), // console or json
        'output_file' => null,
        'show_recommendations' => env('SHIELDCI_SHOW_RECOMMENDATIONS', true),
        'show_code_snippets' => env('SHIELDCI_SHOW_CODE_SNIPPETS', true),
        'max_issues_per_check' => env('SHIELDCI_MAX_ISSUES', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | CI/CD Failure Threshold
    |--------------------------------------------------------------------------
    | Exit with error code if issues of this severity are found
    | Options: never, critical, high, medium, low
    */
    'fail_on' => env('SHIELDCI_FAIL_ON', 'critical'),
    'fail_threshold' => env('SHIELDCI_FAIL_THRESHOLD', null), // minimum score to pass (0-100)
];
```

## Analyzer Configuration

### Enable/Disable ShieldCI

**Globally enable or disable ShieldCI:**
```php
'enabled' => env('SHIELDCI_ENABLED', true),
```

Set `SHIELDCI_ENABLED=false` in your `.env` to completely disable ShieldCI.

### Enabling/Disabling Analyzers

**Run specific categories:**
```php
'analyzers' => [
    // Run all security analyzers
    'security' => [
        'enabled' => env('SHIELDCI_SECURITY_ANALYZERS', true),
    ],
    // Run all performance analyzers
    'performance' => [
        'enabled' => env('SHIELDCI_PERFORMANCE_ANALYZERS', true),
    ],
    // Skip reliability analyzers
    'reliability' => [
        'enabled' => env('SHIELDCI_RELIABILITY_ANALYZERS', false),
    ],
    // Run all code quality analyzers
    'code_quality' => [
        'enabled' => env('SHIELDCI_CODE_QUALITY_ANALYZERS', true),
    ],
    // Run all best practices analyzers
    'best_practices' => [
        'enabled' => env('SHIELDCI_BEST_PRACTICES_ANALYZERS', true),
    ],
],
```

**Configure category-specific analyzer settings:**
```php
'analyzers' => [
    'code_quality' => [
        'enabled' => env('SHIELDCI_CODE_QUALITY_ANALYZERS', true),
        // Configure method length analyzer
        'method_length' => [
            'threshold' => 60,  // Custom threshold (default: 50)
            'exclude_patterns' => ['get*', 'set*', 'is*', 'has*', 'can*'],
        ],
        // Configure nesting depth analyzer
        'nesting_depth' => [
            'threshold' => 5,  // Custom threshold (default: 4)
        ],
    ],
],
```

**Disable specific analyzers:**
```php
'disabled_analyzers' => [
    'license-compliance',      // Skip GPL/AGPL checks
    'vulnerable-dependencies', // Skip dependency scanning
],
```

**Note:** To run only specific analyzers, disable entire categories and use `--analyzer` flag:
```bash
php artisan shield:analyze --analyzer=sql-injection
```

## Path Configuration

### Custom Analysis Paths

**Analyze specific directories:**
```php
'paths' => [
    'analyze' => [
        'app/Http/Controllers',  // Only controllers
        'app/Models',           // Only models
        'routes',               // Only routes
    ],
],
```

**Analyze microservices structure:**
```php
'paths' => [
    'analyze' => [
        'services/auth/app',
        'services/payments/app',
        'services/notifications/app',
    ],
],
```

### Exclude Patterns

**Glob patterns:**
```php
'excluded_paths' => [
    'vendor/*',
    'node_modules/*',
    'storage/*',
    'app/Legacy/**',         // Exclude legacy code
    'tests/Fixtures/**',     // Exclude test fixtures
],
```

**Note:** Blade templates are analyzed by default. To exclude them, add to `excluded_paths`:
```php
'excluded_paths' => [
    'resources/views/**/*.blade.php',
],
```

## Output Configuration

### Console Output

**Default (colorized, detailed):**
```php
'report' => [
    'format' => 'console',
    'show_code_snippets' => true,
    'show_recommendations' => true,
],
```

### JSON Output

**Structured data for automation:**
```php
'report' => [
    'format' => 'json',
    'output_file' => 'storage/shieldci-results.json',
],
```

**Example JSON output:**
```json
{
  "status": "failed",
  "timestamp": "2025-01-15T10:30:00Z",
  "summary": {
    "total": 12,
    "critical": 3,
    "high": 4,
    "medium": 3,
    "low": 2
  },
  "issues": [...]
}
```

### Output to File

**Save report to file:**
```bash
php artisan shield:analyze --output=results.json
```

Or configure default output file:
```php
'report' => [
    'format' => 'json',
    'output_file' => 'storage/shieldci-results.json',
],
```

## CI/CD Configuration

### Exit Codes

**Control when CI/CD fails:**
```php
'fail_on' => 'critical',  // Fail only on critical issues
```

Options:
- `'never'` - Never fail CI (warning only)
- `'critical'` - Only critical issues fail CI
- `'high'` - Critical + high issues fail CI
- `'medium'` - Critical + high + medium fail CI
- `'low'` - Any issue fails CI

**CI Mode Configuration:**
```php
'ci_mode' => env('SHIELDCI_CI_MODE', false),
```

When CI mode is enabled, only analyzers that support CI will run. Configure which analyzers run in CI:
```php
'ci_mode_analyzers' => [
    // Whitelist: Only these analyzers run in CI mode
    // Leave empty to use each analyzer's $runInCI property
],

'ci_mode_exclude_analyzers' => [
    // Blacklist: Exclude these analyzers in CI mode
],
```

## Baseline & Ignoring Issues

### Create Baseline

**Ignore existing issues:**
```bash
php artisan shield:baseline
```

This creates `.shieldci-baseline.json` with all current issues:
```json
{
  "version": "1.0.0",
  "created_at": "2025-01-15T10:30:00Z",
  "issues": {
    "debug-mode-001": {
      "file": "config/app.php",
      "line": 46,
      "hash": "abc123..."
    }
  }
}
```

**Use baseline:**
```bash
php artisan shield:analyze --baseline
```

Or configure baseline file location:
```php
'baseline_file' => base_path('.shieldci-baseline.json'),
```

Future runs with `--baseline` flag only report **new** issues introduced after baseline creation.

### Ignoring Issues

ShieldCI provides two mechanisms for handling issues: `ignore_errors` (completely removes issues from reports) and `dont_report` (shows issues but doesn't fail CI).

#### Ignore Errors (Complete Suppression)

Issues matching `ignore_errors` rules are **completely removed** from the report and do not appear in console/JSON output.

**Ignore specific file and message:**
```php
'ignore_errors' => [
    'sql-injection' => [
        [
            'path' => 'app/Legacy/OldController.php',
            'message' => 'Potential SQL injection vulnerability',
        ],
    ],
],
```

**Ignore by pattern:**
```php
'ignore_errors' => [
    'xss-vulnerabilities' => [
        [
            'path_pattern' => 'app/Legacy/*.php',
            'message_pattern' => '*XSS*',
        ],
    ],
],
```

**Ignore all issues in a specific file:**
```php
'ignore_errors' => [
    'sql-injection' => [
        ['path' => 'app/Models/OldModel.php'],
    ],
],
```

**Ignore specific message across all files:**
```php
'ignore_errors' => [
    'debug-mode' => [
        ['message_pattern' => '*Ray debugging*'],
    ],
],
```

**Multiple rules for same analyzer:**
```php
'ignore_errors' => [
    'xss-vulnerabilities' => [
        ['path_pattern' => 'app/Legacy/*.php'],
        ['path_pattern' => 'app/Admin/Old*.php'],
        ['message' => 'Known safe usage in template'],
    ],
],
```

**Matching Rules:**
- Path matching is case-sensitive on case-sensitive filesystems
- Message matching is case-sensitive for exact matches
- Patterns use Laravel `Str::is()` (supports `*`, `?`, `[abc]`)
- Both path AND message must match if both are specified
- If only path is specified, all issues in that path are ignored
- If only message is specified, all issues with that message are ignored

#### Don't Report (Informational Only)

Analyzers in `dont_report` run normally and show in the report, but **don't affect the exit code**. Useful for gradual adoption or informational checks.

```php
'dont_report' => [
    'missing-error-tracking',  // Shows in report but doesn't fail CI
    'select-asterisk',         // Shows in report but doesn't fail CI
],
```

**Behavior:**
- Analyzers run normally and show in report output
- Issues are displayed in console/JSON output
- Exit code is not affected (won't fail CI/CD)
- Can be auto-populated by `php artisan shield:baseline`
- Merged with baseline's `dont_report` when using `--baseline` flag

#### Comparison: ignore_errors vs dont_report vs disabled_analyzers

| Feature | `ignore_errors` | `dont_report` | `disabled_analyzers` |
|---------|----------------|---------------|---------------------|
| Analyzer runs? | ✅ Yes | ✅ Yes | ❌ No |
| Shows in report? | ❌ No (filtered out) | ✅ Yes | ❌ No |
| Affects exit code? | ❌ No | ❌ No | ❌ No |
| Granularity | Per-issue (file/message) | Per-analyzer | Per-analyzer |
| Use case | Known false positives | Gradual adoption | Not applicable to project |

**When to use each:**
- **`ignore_errors`**: You've reviewed specific issues and determined they're false positives or acceptable risks
- **`dont_report`**: You want visibility into issues but don't want them to fail CI (yet)
- **`disabled_analyzers`**: The analyzer doesn't apply to your project at all

::: tip Configuration Validation
ShieldCI validates your `ignore_errors` configuration and displays warnings for:
- Unknown analyzer IDs
- Invalid rule structure
- Empty rules (missing matching criteria)
- Potentially invalid glob patterns

These warnings don't block execution but help you fix configuration issues.
:::

### Inline Suppression

**Note:** Inline suppression via comments is not currently supported. Use the `ignore_errors` configuration or baseline file instead.

## Performance Configuration

### Memory and Timeout

**Configure memory limit:**
```php
'memory_limit' => env('SHIELDCI_MEMORY_LIMIT', '512M'),
```

**Configure timeout:**
```php
'timeout' => env('SHIELDCI_TIMEOUT', 300),  // seconds
```

**Note:** Performance optimizations like caching and parallel execution are handled automatically by ShieldCI.

## Environment-Specific Configuration

### Different configs per environment

**config/shieldci.php:**
```php
return [
    'analyzers' => [
        'security' => [
            'enabled' => env('SHIELDCI_SECURITY_ANALYZERS', true),
        ],
        'performance' => [
            'enabled' => env('SHIELDCI_PERFORMANCE_ANALYZERS', true),
        ],
        'reliability' => [
            'enabled' => env('APP_ENV') !== 'production',
        ],
        'code_quality' => [
            'enabled' => env('APP_ENV') !== 'production',
        ],
        'best_practices' => [
            'enabled' => env('APP_ENV') !== 'production',
        ],
    ],

    'fail_on' => env('SHIELDCI_FAIL_ON', 'critical'),
];
```

**.env:**
```ini
# Development
SHIELDCI_FAIL_ON=medium

# Production
SHIELDCI_FAIL_ON=critical
```

### Environment Mapping

**Map custom environment names to standard types:**
```php
'environment_mapping' => [
    // Multi-region deployments
    'production-us' => 'production',
    'production-eu' => 'production',
    
    // Blue-green deployments
    'production-blue' => 'production',
    'production-green' => 'production',
    
    // Preview environments
    'staging-preview' => 'staging',
    'staging-pr-123' => 'staging',
],
```

This allows analyzers that check for `production` or `staging` environments to work with your custom environment names. Standard environments (`local`, `development`, `staging`, `production`, `testing`) don't need mapping.

## Reporting Configuration

**Configure report format and output:**
```php
'report' => [
    'format' => env('SHIELDCI_REPORT_FORMAT', 'console'),  // console or json
    'output_file' => null,  // Set to save report automatically
    'show_recommendations' => env('SHIELDCI_SHOW_RECOMMENDATIONS', true),
    'show_code_snippets' => env('SHIELDCI_SHOW_CODE_SNIPPETS', true),
    'max_issues_per_check' => env('SHIELDCI_MAX_ISSUES', 5),  // Limit displayed issues per analyzer
],
```

## Additional Configuration Options

### Build Path

**Configure where compiled assets are located:**
```php
'build_path' => env('SHIELDCI_BUILD_PATH', public_path()),
```

Used by analyzers like Asset Minification to check for minified JavaScript and CSS files.

### Writable Directories

**Configure directories that must be writable:**
```php
'writable_directories' => [
    'storage',
    'bootstrap/cache',
],
```

Used by the Directory Write Permissions analyzer to verify critical directories have proper write permissions.

### Guest URL

**Configure guest URL for HTTP-based analyzers:**
```php
'guest_url' => env('SHIELDCI_GUEST_URL', null),
```

If not set, ShieldCI automatically tries to find a suitable route:
1. Named 'login' route
2. Any route with 'guest' middleware
3. Fallback to root URL '/'

Example: `/login`, `/register`, `/forgot-password`

### Fail Threshold

**Set minimum score to pass (0-100):**
```php
'fail_threshold' => env('SHIELDCI_FAIL_THRESHOLD', null),
```

If set, analysis will fail if the overall score is below this threshold. Useful for maintaining a minimum code quality score.

## Next Steps

- **[First Analysis](/getting-started/first-analysis)** - Run your first scan
- **[Analyzers Reference](/analyzers/)** - Detailed analyzer documentation
- **[CI/CD Integration](/integrations/ci-cd)** - Automate checks

## Configuration Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | bool | `true` | Globally enable/disable ShieldCI |
| `timeout` | int | `300` | Analysis timeout in seconds |
| `memory_limit` | string | `'512M'` | PHP memory limit for analysis |
| `ci_mode` | bool | `false` | Enable CI mode (only CI-compatible analyzers) |
| `ci_mode_analyzers` | array | `[]` | Whitelist of analyzers to run in CI mode |
| `ci_mode_exclude_analyzers` | array | `[]` | Blacklist of analyzers to exclude in CI mode |
| `environment_mapping` | array | `[]` | Map custom environment names to standard types |
| `analyzers` | array | All `enabled: true` | Enable/disable analyzer categories and configure analyzer-specific settings |
| `disabled_analyzers` | array | `[]` | Disable specific analyzers by ID (never run) |
| `dont_report` | array | `[]` | Analyzers to run but not affect exit code (shows in report) |
| `paths.analyze` | array | `['app', 'config', ...]` | Directories to analyze |
| `excluded_paths` | array | `['vendor/*', ...]` | Paths to skip (glob patterns) |
| `build_path` | string | `public_path()` | Path where compiled assets are located |
| `writable_directories` | array | `['storage', 'bootstrap/cache']` | Directories that must be writable |
| `report.format` | string | `'console'` | Output format (console, json) |
| `report.output_file` | string\|null | `null` | Save report to file |
| `report.show_recommendations` | bool | `true` | Show recommendations in output |
| `report.show_code_snippets` | bool | `true` | Show code snippets in output |
| `report.max_issues_per_check` | int | `5` | Limit displayed issues per analyzer |
| `baseline_file` | string | `.shieldci-baseline.json` | Baseline file path |
| `ignore_errors` | array | `[]` | Ignore specific errors by analyzer (completely removes from report) |
| `guest_url` | string\|null | `null` | Guest URL for HTTP-based analyzers |
| `fail_on` | string | `'critical'` | Failure threshold for CI (never, critical, high, medium, low) |
| `fail_threshold` | int\|null | `null` | Minimum score to pass (0-100) |
