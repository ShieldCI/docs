---
title: How It Works
description: Technical overview of how ShieldCI analyzes Laravel applications
icon: code
outline: [2, 3]
---

# How It Works

## Overview

ShieldCI analyzes your Laravel application using static code analysis, examining your codebase without executing it. This deep-dive explains the technical architecture, analysis process, and how ShieldCI delivers actionable security and quality insights.

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Discovery Phase                                         │
│  ├─ Scan project structure                                  │
│  ├─ Read composer.json/composer.lock                        │
│  ├─ Detect Laravel version                                  │
│  └─ Identify relevant files                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Parsing Phase                                           │
│  ├─ Convert PHP files to Abstract Syntax Trees (AST)        │
│  ├─ Extract configuration values                            │
│  ├─ Map routes and middleware                               │
│  └─ Build dependency graph                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Analysis Phase                                          │
│  ├─ Run 102 specialized analyzers                           │
│  ├─ Check security patterns                                 │
│  ├─ Detect performance anti-patterns                        │
│  └─ Validate best practices                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Reporting Phase                                         │
│  ├─ Aggregate issues by severity                            │
│  ├─ Generate recommendations                                │
│  ├─ Create code snippets                                    │
│  └─ Output results (console/JSON/HTML)                      │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

**1. Analysis Engine**
- Orchestrates analyzer execution
- Manages file parsing and caching
- Coordinates result aggregation
- Handles error recovery

**2. Parser Interface**
- Converts PHP code to Abstract Syntax Trees using [nikic/php-parser](https://github.com/nikic/PHP-Parser)
- Provides AST traversal methods
- Extracts code patterns and structures
- Caches parsed results for performance

**3. Analyzer Registry**
- Maintains catalog of 102 analyzers
- Filters analyzers by category, severity, and tags
- Manages analyzer dependencies
- Supports dynamic analyzer loading

**4. Result Collector**
- Aggregates issues from all analyzers
- Deduplicates similar issues
- Calculates overall quality scores
- Generates summary statistics

**5. Reporter System**
- Formats results for different outputs (console, JSON, HTML)
- Creates code snippets with context
- Generates actionable recommendations
- Supports custom report templates

## Analysis Process Deep Dive

### Phase 1: Discovery

ShieldCI starts by understanding your project structure:

```php
// 1. Detect Laravel version
$laravelVersion = app()->version();  // e.g., "10.48.4"

// 2. Identify application type
$isAPI = file_exists(base_path('routes/api.php'));
$hasFrontend = file_exists(base_path('resources/views'));

// 3. Scan directory structure
$paths = [
    'app',
    'config',
    'routes',
    'resources',
    'database',
    'tests',
];

// 4. Read dependency manifest
$composer = json_decode(file_get_contents('composer.json'), true);
$packages = $composer['require'] ?? [];
```

**Optimization:** ShieldCI only analyzes relevant paths, skipping vendor/, node_modules/, and storage/ for performance.

### Phase 2: Parsing

ShieldCI converts PHP files into Abstract Syntax Trees (AST) for deep analysis:

**Example: Parsing a Controller**

```php
// Original PHP code
namespace App\Http\Controllers;

class UserController extends Controller
{
    public function index()
    {
        return User::all();  // ❌ N+1 query potential
    }
}
```

**AST Representation:**
```php
use PhpParser\Node;
use PhpParser\NodeTraverser;
use PhpParser\ParserFactory;

$parser = (new ParserFactory)->create(ParserFactory::PREFER_PHP8);
$ast = $parser->parse(file_get_contents('UserController.php'));

// AST structure:
Node\Stmt\Namespace_
└─ Node\Stmt\Class_ (name: UserController)
   └─ Node\Stmt\ClassMethod (name: index)
      └─ Node\Stmt\Return_
         └─ Node\Expr\StaticCall
            ├─ class: Node\Name (User)
            └─ method: Identifier (all)
```

**Why AST Analysis?**
- **Precision:** Understands code structure, not just text patterns
- **Context-aware:** Knows the difference between `User::all()` in a controller vs. a service
- **Robust:** Handles complex PHP syntax including closures, traits, and attributes

### Phase 3: Analyzer Execution

Each analyzer is a specialized component that checks for specific patterns:

**Example: N+1 Query Analyzer**

```php
class NPlusOneQueryAnalyzer extends AbstractFileAnalyzer
{
    protected function runAnalysis(): ResultInterface
    {
        $issues = [];

        // 1. Find all Eloquent queries
        foreach ($this->getPhpFiles() as $file) {
            $ast = $this->parser->parseFile($file);

            // 2. Look for ::all(), ::get() without ->with()
            $queries = $this->findEloquentQueries($ast);

            foreach ($queries as $query) {
                // 3. Check if relationships are accessed in loops
                if ($this->hasRelationshipAccessInLoop($query)) {
                    $issues[] = $this->createIssue(
                        message: 'N+1 query detected',
                        location: new Location($file, $query->getLine()),
                        severity: Severity::High,
                        recommendation: 'Use eager loading: User::with(\'posts\')->get()'
                    );
                }
            }
        }

        return $this->resultBySeverity($summary, $issues);
    }
}
```

**Analyzer Categories:**

1. **Security Analyzers** (22 total)
   - Pattern: Look for vulnerable code patterns (SQL injection, XSS, CSRF)
   - Method: AST analysis + configuration validation
   - Example: Detect missing `->middleware('throttle')` on login routes

2. **Performance Analyzers** (18 total)
   - Pattern: Identify inefficient database queries and caching issues
   - Method: AST analysis + configuration checks
   - Example: Detect N+1 queries by finding relationship access in loops

3. **Reliability Analyzers** (24 total)
   - Pattern: Validate error handling and configuration
   - Method: Configuration parsing + environment checks
   - Example: Ensure `APP_DEBUG=false` in production

4. **Code Quality Analyzers** (15 total)
   - Pattern: Check for deprecated APIs and anti-patterns
   - Method: AST traversal + Laravel version awareness
   - Example: Detect usage of deprecated `array_divide()` helper

5. **Best Practice Analyzers** (23 total)
   - Pattern: Enforce Laravel conventions
   - Method: AST analysis + naming pattern checks
   - Example: Ensure route names follow kebab-case convention

### Phase 4: Issue Detection

ShieldCI uses multiple detection strategies:

**1. AST Pattern Matching**
```php
// Detect raw SQL queries (SQL injection risk)
$traverser = new NodeTraverser();
$traverser->addVisitor(new class extends NodeVisitorAbstract {
    public function enterNode(Node $node) {
        // Find DB::raw(), DB::select() with concatenation
        if ($node instanceof Node\Expr\StaticCall &&
            $node->class->toString() === 'DB' &&
            in_array($node->name->toString(), ['raw', 'select'])) {

            // Check if argument contains string concatenation
            if ($this->hasStringConcatenation($node->args[0])) {
                // ❌ SQL injection vulnerability
                return $node;
            }
        }
    }
});
```

**2. Configuration Analysis**
```php
// Check production environment settings
$appConfig = config('app');

if ($appConfig['debug'] === true && app()->environment('production')) {
    // ❌ Debug mode enabled in production
    $this->createIssue('Debug mode exposes sensitive data');
}

if (empty($appConfig['key'])) {
    // ❌ Missing application key
    $this->createIssue('APP_KEY not set - sessions/encryption insecure');
}
```

**3. Dependency Scanning**
```php
// Check for vulnerable packages
$composerLock = json_decode(file_get_contents('composer.lock'), true);

foreach ($composerLock['packages'] as $package) {
    $vulnerabilities = $this->checkPackageVulnerabilities(
        $package['name'],
        $package['version']
    );

    if (!empty($vulnerabilities)) {
        // ❌ Vulnerable dependency
        $this->createIssue("Vulnerable package: {$package['name']}");
    }
}
```

**4. Route Analysis**
```php
// Validate route security
$routes = Route::getRoutes();

foreach ($routes as $route) {
    if ($this->isAuthenticationRoute($route)) {
        $middleware = $route->middleware();

        if (!in_array('throttle', $middleware)) {
            // ❌ Missing rate limiting
            $this->createIssue("Login route lacks throttle middleware");
        }
    }
}
```

### Phase 5: Result Generation

ShieldCI creates detailed, actionable reports:

**Issue Structure:**
```php
[
    'id' => 'login-throttling-001',
    'analyzer' => 'LoginThrottlingAnalyzer',
    'message' => 'Login route "/login" lacks rate limiting protection',
    'severity' => 'high',
    'category' => 'security',
    'location' => [
        'file' => 'routes/web.php',
        'line' => 42,
    ],
    'code_snippet' => "Route::post('/login', [LoginController::class, 'login']);",
    'recommendation' => 'Add ->middleware("throttle:5,1") to prevent brute force attacks',
    'time_to_fix' => 5,  // minutes
    'references' => [
        'https://laravel.com/docs/routing#rate-limiting',
        'https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks',
    ],
    'metadata' => [
        'route' => '/login',
        'issue_type' => 'missing_route_throttle',
    ],
]
```

**Severity Calculation:**
```php
// Critical: Immediate security risk
- Debug mode in production
- Missing CSRF protection
- SQL injection vulnerability

// High: Significant security/performance risk
- Missing login throttling
- N+1 queries in critical paths
- Vulnerable dependencies

// Medium: Best practice violations
- Missing cache configuration
- Deprecated API usage
- Code quality issues

// Low: Minor improvements
- Missing route names
- Suboptimal configuration
- Documentation gaps
```

## Performance Optimizations

### 1. Incremental Analysis

ShieldCI only analyzes changed files when possible:

```php
// Cache file hashes
$cache = [
    'app/Http/Controllers/UserController.php' => 'abc123...',
    'routes/web.php' => 'def456...',
];

// Only re-analyze modified files
foreach ($files as $file) {
    $currentHash = hash_file('sha256', $file);

    if ($cache[$file] !== $currentHash) {
        $this->analyzeFile($file);  // File changed
        $cache[$file] = $currentHash;
    }
}
```

**Result:** 80% faster analysis on subsequent runs

### 2. Parallel Execution

Analyzers run concurrently when possible:

```php
// Independent analyzers run in parallel
$results = collect($analyzers)->parallel(function ($analyzer) {
    return $analyzer->analyze();
}, 4);  // 4 parallel processes
```

**Result:** 3x faster on multi-core systems

### 3. Selective Parsing

Only parse files relevant to each analyzer:

```php
// Security analyzers only need controllers/routes
$securityFiles = array_merge(
    glob('app/Http/Controllers/**/*.php'),
    glob('routes/*.php')
);

// Performance analyzers need models/queries
$performanceFiles = array_merge(
    glob('app/Models/**/*.php'),
    glob('app/Services/**/*.php')
);
```

**Result:** 50% reduction in parsing overhead

### 4. AST Caching

Parsed ASTs are cached between analyzers:

```php
// First analyzer parses file
$ast = $this->parser->parseFile('UserController.php');
Cache::put('ast:UserController', $ast, 3600);

// Subsequent analyzers reuse cached AST
$ast = Cache::get('ast:UserController');
```

**Result:** 90% reduction in parse time for multi-analyzer runs

## CI/CD Integration

### GitHub Actions

```yaml
name: ShieldCI Analysis

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
        run: php artisan shield:analyze --format=json > results.json

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: shieldci-results
          path: results.json

      - name: Fail on Critical Issues
        run: |
          CRITICAL=$(cat results.json | jq '.issues[] | select(.severity=="critical") | length')
          if [ $CRITICAL -gt 0 ]; then exit 1; fi
```

### GitLab CI

```yaml
shieldci:
  stage: test
  image: php:8.1
  script:
    - composer install --no-dev
    - php artisan shield:analyze --format=json
  artifacts:
    reports:
      codequality: shieldci-results.json
  allow_failure: false
```

### Exit Codes

ShieldCI returns specific exit codes for CI/CD:

```php
0  // Success: No critical issues
1  // Failure: Critical issues found
2  // Warning: High severity issues found
3  // Error: Analysis failed (exception)
```

## Extending ShieldCI

### Custom Analyzers

Create project-specific analyzers:

```php
namespace App\Analyzers;

use ShieldCI\AnalyzersCore\Abstracts\AbstractFileAnalyzer;
use ShieldCI\AnalyzersCore\Contracts\ResultInterface;

class CustomSecurityAnalyzer extends AbstractFileAnalyzer
{
    protected function metadata(): AnalyzerMetadata
    {
        return new AnalyzerMetadata(
            id: 'custom-security',
            name: 'Custom Security Analyzer',
            description: 'Company-specific security checks',
            category: Category::Security,
            severity: Severity::High,
            tags: ['custom', 'security']
        );
    }

    protected function runAnalysis(): ResultInterface
    {
        $issues = [];

        // Your custom analysis logic
        foreach ($this->getPhpFiles() as $file) {
            // Check for company-specific patterns
        }

        return $this->resultBySeverity($summary, $issues);
    }
}
```

**Register Custom Analyzer:**

Custom analyzers are automatically discovered if placed in the `app/Analyzers` directory and follow the proper namespace structure. ShieldCI will automatically load them during analysis.

### Custom Rules

Disable specific analyzers or ignore specific errors:

```php
// config/shieldci.php
return [
    'disabled_analyzers' => [
        'license-compliance',  // Disable license checking
    ],

    'ignore_errors' => [
        'sql-injection' => [
            [
                'path' => 'app/Legacy/OldController.php',
                'message' => 'Potential SQL injection vulnerability',
            ],
        ],
    ],
];
```

## Output Formats

### Console (Default)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ShieldCI Analysis Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ❌ FAILED - Found 3 critical issues

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
  Location: config/app.php:46
  Time to Fix: 5 minutes

  APP_DEBUG=true exposes sensitive information in production.
  Set APP_DEBUG=false in .env.production

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### JSON

```json
{
  "status": "failed",
  "summary": {
    "total": 12,
    "critical": 3,
    "high": 4,
    "medium": 3,
    "low": 2
  },
  "issues": [
    {
      "id": "debug-mode-001",
      "analyzer": "DebugModeAnalyzer",
      "severity": "critical",
      "message": "Debug mode enabled in production",
      "location": {
        "file": "config/app.php",
        "line": 46
      },
      "recommendation": "Set APP_DEBUG=false in .env.production"
    }
  ]
}
```

### JSON Output

Structured JSON output for automation:
- Machine-readable format
- Easy integration with CI/CD
- Can be processed by scripts
- Compatible with code quality tools

## Privacy & Security

### Data Handling

**What ShieldCI Accesses:**
- ✅ PHP source code (AST parsing only)
- ✅ Configuration files (read-only)
- ✅ composer.json/composer.lock (dependency analysis)
- ✅ package.json/package-lock.json (NPM dependencies)

**What ShieldCI Never Accesses:**
- ❌ Database credentials (reads config structure, not values)
- ❌ API keys (pattern detection only, not values)
- ❌ User data or business logic
- ❌ Network requests (except CVE database for dependency checks)

### Compliance

- **GDPR:** No personal data collected or transmitted
- **SOC 2:** Pro version includes audit reports
- **HIPAA:** Can be used in HIPAA-compliant environments
- **ISO 27001:** Compatible with security standards
