# ShieldCI Documentation

This directory contains the complete documentation for ShieldCI - a comprehensive static analysis and security auditing tool for Laravel applications.

## Documentation Structure

```
docs/
├── introduction/
│   ├── what-is-shieldci.md        # Overview and key features
│   ├── why-shieldci.md            # Why use ShieldCI
│   └── how-it-works.md            # Architecture and process
│
├── getting-started/
│   ├── installation.md            # Installation guide (Free + Pro)
│   ├── configuration.md           # Configuration options
│   └── first-analysis.md          # Running your first analysis
│
├── analyzers/
│   ├── overview.md                # Analyzer categories and how they work
│   ├── security/                  # 30+ security analyzers
│   │   ├── overview.md
│   │   ├── sql-injection.md
│   │   ├── xss-detection.md
│   │   ├── csrf-protection.md
│   │   ├── app-key-security.md    # APP_KEY validation
│   │   └── ... (30+ files)
│   ├── performance/               # 18 performance analyzers
│   │   ├── overview.md
│   │   ├── autoloader-optimization.md
│   │   ├── config-caching.md
│   │   ├── opcache-enabled.md
│   │   └── ... (18 files)
│   ├── reliability/               # 10 reliability analyzers
│   │   ├── overview.md
│   │   └── ...
│   ├── code-quality/              # 9 code quality analyzers
│   │   ├── overview.md
│   │   └── ...
│   └── best-practices/            # Best practice analyzers
│       ├── overview.md
│       └── ...
│
├── integrations/
│   ├── github-actions.md          # GitHub Actions setup
│   ├── gitlab-ci.md               # GitLab CI setup
│   ├── bitbucket-pipelines.md     # Bitbucket Pipelines
│   └── custom-ci.md               # Other CI/CD systems
│
├── api/
│   ├── authentication.md          # API authentication
│   ├── endpoints.md               # API endpoints reference
│   └── webhooks.md                # Webhook integration
│
└── advanced/
    ├── custom-analyzers.md        # Building custom analyzers
    ├── ci-cd-best-practices.md    # Advanced CI/CD patterns
    └── team-workflows.md          # Team collaboration
```

## URL Structure

Documentation is available at `docs.shieldci.com` with the following URL pattern:

```
https://docs.shieldci.com/
├── introduction/what-is-shieldci
├── getting-started/installation
├── analyzers/security/sql-injection
├── analyzers/performance/opcache-enabled
├── integrations/github-actions
└── api/authentication
```

## Documentation Standards

Each analyzer documentation page follows this template:

### Required Sections

1. **What This Checks** - Clear 1-2 sentence description of what the analyzer detects
2. **Why It Matters** - Explain the security risk, performance impact, or compliance requirement
3. **How to Fix** - Provide Quick Fix (with time) and Proper Fix (with time) with code examples
4. **Common Mistakes to Avoid** - List frequent errors and pitfalls
5. **References** - Link to Laravel docs, security advisories, and related resources
6. **Related Analyzers** - Cross-link to related analyzers

### Code Examples

Always provide before/after code examples:

```php
**Before (❌):**
// Vulnerable code
DB::raw($userInput);

**After (✅):**
// Secure code
DB::raw(DB::escape($userInput));
```

### Severity Indicators

- **Critical:** Severe security vulnerabilities or data loss risks
- **High:** Significant performance issues or security concerns
- **Medium:** Code quality issues or minor performance problems
- **Low:** Best practice violations or optimization opportunities

## Search Configuration

The documentation site uses Algolia DocSearch for full-text search:

- Index: `shieldci-docs`
- API Key: (configured in Laravel app)
- Search includes all page content, code examples, and metadata

## Writing Guidelines

1. **Be Clear and Concise** - Use simple language, avoid jargon
2. **Provide Context** - Explain why something matters, not just how to fix it
3. **Use Code Examples** - Show, don't just tell
4. **Link Extensively** - Cross-reference related docs and external resources
5. **Keep Updated** - Review and update docs with each release

## Contributing to Documentation

### Adding New Analyzer Documentation

1. Create a new markdown file in the appropriate category directory
2. Follow the standard template structure
3. Use kebab-case for file names (e.g., `sql-injection.md`)
4. Add the analyzer to the category overview page
5. Cross-reference related analyzers
6. Update search index after publishing

### Updating Existing Documentation

1. Preserve the URL structure (never change file names/paths)
2. Update the content while maintaining template structure
3. Add version notes if behavior changed
4. Update "Last Updated" timestamp

### Testing Documentation Locally

```bash
# Install dependencies
composer install
npm install

# Start local docs server
php artisan serve

# Build search index
php artisan docs:index

# Visit http://localhost:8000
```

## Version Control

- **Main branch:** Production documentation (auto-deployed)
- **Develop branch:** Draft content and updates
- **Feature branches:** Major documentation additions

## Deployment

Documentation auto-deploys on push to `master` branch:

1. GitHub Actions builds the site
2. Search index is updated (Algolia)
3. CDN cache is purged
4. Site is deployed to `docs.shieldci.com`

## License

Documentation is © 2025 ShieldCI. All rights reserved.

Code examples in documentation are licensed under MIT License.

---

**Questions?** Contact documentation@shieldci.com
