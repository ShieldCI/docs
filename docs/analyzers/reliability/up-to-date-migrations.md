---
title: Up-to-Date Migrations Analyzer
description: Ensures all database migrations are up to date and have been executed in your Laravel application to prevent data inconsistencies and deployment issues
icon: database
outline: [2, 3]
tags: database,migrations,reliability,deployment
---

# Up-to-Date Migrations Analyzer

| Analyzer ID            | Category       | Severity | Time To Fix |
| -----------------------| :------------: |:--------:| -----------:|
| `up-to-date-migrations`| ✅ Reliability | High     | 5 minutes   |

## What This Checks

- Detects pending database migrations that haven't been executed
- Verifies database schema is in sync with migration files
- Ensures migrations table exists and is accessible
- Identifies unapplied migrations before deployment
- Checks migration status using safe, read-only operations
- Reports specific migration file names that need to be run
- Skipped in CI environments (deployment-specific check)

## Why It Matters

- **Data inconsistencies**: Running application code against outdated database schema causes errors
- **Production crashes**: Missing tables, columns, or indexes break application functionality
- **Deployment failures**: Deploying code that expects schema changes without running migrations
- **User-facing errors**: Database queries fail when schema doesn't match application expectations
- **Data corruption**: Operations on non-existent columns can corrupt database state
- **Rollback difficulties**: Discovering missing migrations in production makes rollbacks complex
- **Team coordination**: Developers pulling code may have different schema states locally
- **Testing gaps**: Tests may pass locally but fail in other environments due to schema drift
- **Security risks**: Missing migrations for security features (like adding 2FA columns) leave vulnerabilities
- **Performance issues**: Missing indexes defined in pending migrations cause slow queries

## How to Fix

### Quick Fix (2 minutes)

If you have pending migrations to run:

```bash
# Run all pending migrations
php artisan migrate

# Verify migrations are up to date
php artisan migrate:status
```

### Proper Fix (5 minutes)

#### 1: Run Pending Migrations Locally

Execute all pending migrations in your development environment:

```bash
# Check migration status
php artisan migrate:status

# Expected output when up to date:
# No pending migrations.

# If there are pending migrations, run them:
php artisan migrate

# Example output:
# Migrating: 2024_01_15_000000_create_posts_table
# Migrated:  2024_01_15_000000_create_posts_table (45.67ms)
# Migrating: 2024_01_16_000000_add_published_at_to_posts
# Migrated:  2024_01_16_000000_add_published_at_to_posts (12.34ms)

# Verify all migrations ran
php artisan migrate:status
```

**Always run migrations before:**
- Starting development work
- Running tests
- Deploying to any environment

#### 2: Add Migrations to Deployment Process

Ensure migrations run automatically during deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'

      - name: Install dependencies
        run: composer install --no-dev --optimize-autoloader

      - name: Run migrations
        run: php artisan migrate --force
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_DATABASE: ${{ secrets.DB_DATABASE }}
          DB_USERNAME: ${{ secrets.DB_USERNAME }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}

      - name: Deploy application
        run: ./deploy.sh
```

**Laravel Forge/Envoyer Deployment Script:**

```bash
cd /home/forge/example.com

# Enable maintenance mode
php artisan down

# Pull latest code
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader

# Run migrations (with --force for production)
php artisan migrate --force

# Clear caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart queue workers
php artisan queue:restart

# Disable maintenance mode
php artisan up
```

#### 3: Handle Migration Rollbacks Safely

Create reversible migrations to enable safe rollbacks:

```php
// ❌ BAD - No down() method
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('email_verified_at')->nullable();
        });
    }

    // Missing down() method!
};

// ✅ GOOD - Reversible migration
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('email_verified_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('email_verified_at');
        });
    }
};
```

**Rollback commands:**

```bash
# Rollback last migration batch
php artisan migrate:rollback

# Rollback specific number of migrations
php artisan migrate:rollback --step=3

# Rollback all migrations (dangerous!)
php artisan migrate:reset

# Rollback all and re-run migrations
php artisan migrate:refresh

# Rollback all, re-run, and seed database
php artisan migrate:refresh --seed
```

#### 4: Use Migration Squashing for Large Projects

Reduce migration file count in established projects:

```bash
# Laravel 8+ migration squashing
# Squash all migrations into one file
php artisan schema:dump

# Squash and delete old migrations
php artisan schema:dump --prune

# This creates: database/schema/mysql-schema.sql
# And optionally deletes old migration files
```

**Benefits:**
- Faster fresh installations
- Cleaner migration directory
- Easier onboarding for new developers
- Reduced migration execution time

**After squashing:**

```php
// database/migrations/0001_01_01_000000_create_users_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Load the schema dump
        DB::unprepared(file_get_contents(
            database_path('schema/mysql-schema.sql')
        ));
    }
};
```

#### 5: Test Migrations Before Deployment

Always test migrations in staging environment first:

```bash
# In staging environment
# 1. Backup database
php artisan db:backup

# 2. Run migrations
php artisan migrate

# 3. Test application functionality
# 4. If issues found, rollback:
php artisan migrate:rollback

# 5. Restore from backup if needed
php artisan db:restore latest
```

**Automated testing:**

```php
// tests/Feature/MigrationsTest.php
<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MigrationsTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function all_migrations_run_successfully()
    {
        // RefreshDatabase trait runs all migrations
        // This test will fail if any migration has errors

        $this->assertTrue(true);
    }

    /** @test */
    public function migrations_can_be_rolled_back()
    {
        // Test that down() methods work
        $this->artisan('migrate:rollback')
            ->assertSuccessful();

        $this->artisan('migrate')
            ->assertSuccessful();
    }
}
```

#### 6: Handle Schema Changes in Zero-Downtime Deployments

Use multi-step migrations for zero-downtime deployments:

```php
// Step 1: Add new column (nullable)
// Migration: 2024_01_15_000000_add_status_column.php
public function up(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->string('status')->nullable()->after('total');
    });
}

// Deploy code that handles both old and new schema

// Step 2: Backfill data
// Migration: 2024_01_16_000000_backfill_status.php
public function up(): void
{
    DB::table('orders')
        ->whereNull('status')
        ->update(['status' => 'pending']);
}

// Step 3: Make column non-nullable
// Migration: 2024_01_17_000000_make_status_required.php
public function up(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->string('status')->nullable(false)->change();
    });
}
```

#### 7: Set Up Database Backup Before Migrations

Always backup production database before running migrations:

```bash
#!/bin/bash
# deploy-with-backup.sh

# 1. Create backup
BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_FILE

# 2. Upload backup to S3
aws s3 cp $BACKUP_FILE s3://my-backups/database/

# 3. Run migrations
php artisan migrate --force

# Check if migrations succeeded
if [ $? -eq 0 ]; then
    echo "Migrations completed successfully"
    # Keep backup for 30 days
else
    echo "Migrations failed! Restore from backup:"
    echo "mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME < $BACKUP_FILE"
    exit 1
fi
```

**Using Laravel Backup package:**

```bash
# Install laravel-backup
composer require spatie/laravel-backup

# Configure in config/backup.php

# Create backup before migrations
php artisan backup:run --only-db

# Run migrations
php artisan migrate --force

# If something goes wrong:
php artisan backup:list
php artisan backup:restore latest
```

#### 8: Monitor Migration Status in Production

Set up alerts for pending migrations:

```php
// app/Console/Commands/CheckMigrations.php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class CheckMigrations extends Command
{
    protected $signature = 'migrations:check';

    protected $description = 'Check for pending migrations';

    public function handle()
    {
        Artisan::call('migrate:status', ['--pending' => true]);

        $output = Artisan::output();

        if (! str_contains($output, 'No pending migrations')) {
            // Alert team via Slack, email, etc.
            $this->error('⚠️  Pending migrations detected!');
            $this->line($output);

            // Send notification
            \Notification::route('slack', config('services.slack.webhook'))
                ->notify(new \App\Notifications\PendingMigrations($output));

            return 1;
        }

        $this->info('✅ All migrations up to date');
        return 0;
    }
}
```

**Schedule daily checks:**

::: code-group
```php [Laravel 11+]
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('migrations:check')
    ->daily()
    ->at('09:00')
    ->environments(['production']);
```

```php [Laravel 9–10]
// app/Console/Kernel.php
protected function schedule(Schedule $schedule)
{
    $schedule->command('migrations:check')
        ->daily()
        ->at('09:00')
        ->environments(['production']);
}
```
:::

#### 9: Create Migration for New Installation

Initialize migrations table for new projects:

```bash
# First time setup
php artisan migrate:install

# This creates the 'migrations' table
# Then run all migrations:
php artisan migrate
```

**Fresh installation script:**

```bash
#!/bin/bash
# fresh-install.sh

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Create database (if using SQLite)
touch database/database.sqlite

# Initialize migrations
php artisan migrate:install

# Run all migrations
php artisan migrate

# Seed database
php artisan db:seed

echo "✅ Installation complete!"
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- CI databases are often fresh for each run, making migration status checks irrelevant
- Migration status is deployment/environment-specific, not code-quality related
- Prevents false failures in CI pipelines where databases are reset between runs

**When to run this analyzer:**
- ✅ **Local development**: Ensures your local database is in sync before development work
- ✅ **Staging/Production servers**: Validates migrations are up to date after deployment
- ❌ **CI/CD pipelines**: Skipped automatically (fresh databases for each test run)

## References

- [Laravel Migrations Documentation](https://laravel.com/docs/migrations)
- [Laravel Migration Commands](https://laravel.com/docs/migrations#running-migrations)
- [Database Schema Dumps](https://laravel.com/docs/migrations#squashing-migrations)
- [Laravel Backup Package](https://spatie.be/docs/laravel-backup)
- [Zero-Downtime Deployments](https://www.google.com/search?q=laravel+zero+downtime+deployment)

## Related Analyzers

- [Queue Timeout Configuration Analyzer](/analyzers/reliability/queue-timeout-configuration) - Ensures queue configuration is correct
- [Database Status Analyzer](/analyzers/reliability/database-status) - Ensures database connections are accessible and functioning
- [Maintenance Mode Status Analyzer](/analyzers/reliability/maintenance-mode-status) - Detects maintenance mode issues
