---
title: Installation
description: Step-by-step guide to installing ShieldCI in your Laravel application
icon: download
outline: [2, 3]
---

# Installation

## System Requirements

### Minimum Requirements

- **PHP:** 8.1 or higher
- **Laravel:** 9.x, 10.x, 11.x, or 12.x
- **Composer:** 2.0 or higher
- **Memory:** 512MB minimum (1GB recommended for large projects)
- **Disk Space:** 50MB for package + cache

### Recommended Requirements

- **PHP:** 8.2 or higher
- **Extensions:** `ext-json`, `ext-mbstring`, `ext-tokenizer`
- **Memory:** 1GB or higher
- **OPcache:** Enabled for better performance

### Compatibility Matrix

| Laravel Version | PHP Version | ShieldCI Support |
|----------------|-------------|------------------|
| Laravel 12.x   | PHP 8.2+    | ✅ Full Support   |
| Laravel 11.x   | PHP 8.2+    | ✅ Full Support   |
| Laravel 10.x   | PHP 8.1+    | ✅ Full Support   |
| Laravel 9.x    | PHP 8.1+    | ✅ Full Support   |

## Installation Methods

### Method 1: Composer (Recommended)

Install ShieldCI:

```bash
composer require shieldci/laravel
```

**Verify Installation:**
```bash
php artisan shield:analyze
```

This will run the analysis and show the ShieldCI version in the output.

### Method 2: Global Installation

Install ShieldCI globally for use across multiple projects:

```bash
composer global require shieldci/laravel
```

**Add to PATH** (if not already):
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$HOME/.composer/vendor/bin:$PATH"
```

**Run from any Laravel project:**
```bash
cd /path/to/your/laravel/app
php artisan shield:analyze
```

### Method 3: Docker

Use ShieldCI in a Docker container:

```bash
# Pull official image
docker pull shieldci/laravel:latest

# Run analysis
docker run --rm -v $(pwd):/app shieldci/laravel:latest php artisan shield:analyze
```

**Docker Compose Integration:**
```yaml
# docker-compose.yml
services:
  shieldci:
    image: shieldci/laravel:latest
    volumes:
      - .:/app
    command: php artisan shield:analyze
```

Run analysis:
```bash
docker-compose run --rm shieldci
```

## Post-Installation Setup

### Step 1: Publish Configuration (Optional)

Generate a configuration file to customize analyzer behavior:

```bash
php artisan vendor:publish --tag=shieldci-config
```

This creates `config/shieldci.php` with default settings:

```php
<?php

return [
    /*
     * Paths to analyze (relative to project root)
     */
    'paths' => [
        'analyze' => [
            'app',
            'config',
            'database',
            'routes',
        ],
    ],

    /*
     * Paths to exclude from analysis
     */
    'excluded_paths' => [
        'vendor/*',
        'node_modules/*',
        'storage/*',
        'bootstrap/cache/*',
    ],

    /*
     * Analyzers to run (all enabled by default)
     */
    'analyzers' => [
        'security' => true,
        'performance' => true,
        'reliability' => true,
        'code_quality' => true,
        'best_practices' => true,
    ],

    /*
     * Reporting configuration
     */
    'report' => [
        'format' => 'console',  // console or json
        'output_file' => null,
    ],

    /*
     * Fail CI/CD on issues of this severity or higher
     */
    'fail_on' => 'critical',  // never, critical, high, medium, low
];
```

### Step 2: Verify Installation

Run your first analysis to verify installation:

```bash
php artisan shield:analyze
```

This will run all analyzers and show you the results. If you see the analysis report, ShieldCI is installed correctly.

### Step 3: Run First Analysis

Perform your first security and quality scan:

```bash
php artisan shield:analyze
```

This will:
1. Discover your Laravel project structure
2. Parse PHP files into ASTs
3. Run all 103 analyzers
4. Generate a detailed report

**Expected duration:** 30-60 seconds for typical Laravel apps

See [First Analysis](/getting-started/first-analysis) for detailed walkthrough.

## Installation Troubleshooting

### Issue: Composer Install Fails

**Error:**
```
Your requirements could not be resolved to an installable set of packages.
```

**Solutions:**

1. **Update Composer dependencies:**
   ```bash
   composer update shieldci/laravel --with-all-dependencies
   ```

2. **Check PHP version:**
   ```bash
   php -v  # Must be 8.1+
   ```

3. **Clear Composer cache:**
   ```bash
   composer clear-cache
   composer install
   ```

### Issue: Command Not Found

**Error:**
```bash
php artisan shield:analyze
# Command "shield:analyze" is not defined.
```

**Solutions:**

1. **Clear Laravel cache:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan optimize:clear
   ```

2. **Verify package is in composer.json:**
   ```bash
   composer show shieldci/laravel
   ```

3. **Reinstall package:**
   ```bash
   composer remove shieldci/laravel
   composer require shieldci/laravel
   ```

### Issue: Memory Limit Exceeded

**Error:**
```
PHP Fatal error: Allowed memory size of 134217728 bytes exhausted
```

**Solutions:**

1. **Increase PHP memory limit (temporary):**
   ```bash
   php -d memory_limit=512M artisan shield:analyze
   ```

2. **Update php.ini (permanent):**
   ```ini
   memory_limit = 512M
   ```

3. **Exclude large directories:**
   ```php
   // config/shieldci.php
   'excluded_paths' => [
       'vendor/*',
       'node_modules/*',
       'storage/*',
       'public/build/*',  // Add large build directories
   ],
   ```

### Issue: Parse Errors in Legacy Code

**Error:**
```
Parse error: syntax error, unexpected token "match" in OldController.php
```

**Solutions:**

1. **Exclude problematic files:**
   ```php
   // config/shieldci.php
   'excluded_paths' => [
       'vendor/*',
       'app/Legacy/**',  // Exclude legacy code
   ],
   ```

2. **Update PHP version:**
   ```bash
   # ShieldCI requires PHP 8.1+ for modern syntax
   php -v
   ```

### Issue: Slow Analysis Performance

**Symptoms:** Analysis takes 5+ minutes

**Solutions:**

1. **Enable OPcache:**
   ```ini
   ; php.ini
   opcache.enable=1
   opcache.enable_cli=1
   ```

2. **Reduce analyzed paths:**
   ```php
   // config/shieldci.php
   'paths' => [
       'analyze' => [
           'app/Http',      // Only analyze critical paths
           'app/Models',
           'routes',
       ],
   ],
   ```

## Advanced Installation

### Laravel Sail

Add ShieldCI to your Sail environment:

```yaml
# docker-compose.yml
services:
  laravel.test:
    build:
      context: ./vendor/laravel/sail/runtimes/8.1
      dockerfile: Dockerfile
    extra_hosts:
      - 'host.docker.internal:host-gateway'
    ports:
      - '${APP_PORT:-80}:80'
    environment:
      # ... existing environment variables
    volumes:
      - '.:/var/www/html'
    networks:
      - sail
```

**Run analysis in Sail:**
```bash
sail artisan shield:analyze
```

### Homestead

ShieldCI works out-of-the-box with Homestead:

```bash
# SSH into Homestead VM
vagrant ssh

# Navigate to project
cd /home/vagrant/code/your-app

# Run analysis
php artisan shield:analyze
```

### Custom Autoloading

If you have custom autoloading requirements:

```json
// composer.json
{
    "autoload-dev": {
        "psr-4": {
            "App\\Analyzers\\": "app/Analyzers/"
        }
    }
}
```

**Regenerate autoload:**
```bash
composer dump-autoload
```

## Environment-Specific Installation

### Production (Not Recommended)

While ShieldCI is a dev tool, you can install in production if needed:

```bash
composer require shieldci/laravel
```

**Security consideration:** ShieldCI reads your codebase but never modifies it. However, it's best practice to keep analysis tools in development only.

### Staging

Install in staging for pre-deployment checks:

```bash
# Install on staging server
composer install --no-dev=false  # Include dev dependencies

# Run analysis before deployment
php artisan shield:analyze --format=json
```

### CI/CD Environments

See [CI/CD Integration](/integrations/ci-cd) for detailed setup guides:
- GitHub Actions
- GitLab CI
- Bitbucket Pipelines
- Jenkins
- CircleCI

## Upgrading

### From Previous ShieldCI Versions

```bash
# Update to latest version
composer update shieldci/laravel

# Clear caches
php artisan config:clear
php artisan cache:clear

# Republish config (if needed)
php artisan vendor:publish --tag=shieldci-config --force
```

**Breaking changes:** See [CHANGELOG.md](https://github.com/shieldci/laravel/blob/main/CHANGELOG.md)

## License Activation (Pro Version)

### Free Version

No activation required. Install and start analyzing immediately.

### Pro Version

**Step 1: Purchase License**
Visit [shieldci.com/pricing](https://shieldci.com/pricing) to purchase a Pro license.

**Step 2: Install Pro Package**
```bash
composer require shieldci/laravel-pro
```

**Step 3: Activate License**

Set your license key in your environment:

```ini
# .env
SHIELDCI_LICENSE_KEY=YOUR-LICENSE-KEY
```

The Pro package will automatically detect and use the license key from your environment.

## Uninstallation

Remove ShieldCI completely:

```bash
# 1. Remove package
composer remove shieldci/laravel

# 2. Delete configuration (optional)
rm config/shieldci.php

# 3. Clear caches
php artisan config:clear
php artisan cache:clear
```

## Next Steps

- **[First Analysis](/getting-started/first-analysis)** - Run your first security scan
- **[Configuration](/getting-started/configuration)** - Customize analyzer behavior
- **[CI/CD Integration](/integrations/ci-cd)** - Automate security checks

## Getting Help

- **Documentation:** [docs.shieldci.com](https://docs.shieldci.com)
- **GitHub Issues:** [github.com/shieldci/laravel/issues](https://github.com/shieldci/laravel/issues)
- **Email Support:** support@shieldci.com (Pro customers)
