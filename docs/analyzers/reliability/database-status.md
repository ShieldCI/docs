---
title: Database Status Analyzer
description: Ensure your database connections are accessible and functioning properly
icon: database
outline: [2, 3]
tags: database,infrastructure,reliability,availability
---

# Database Status Analyzer

| Analyzer ID       | Category       | Severity  | Time To Fix  |
| ------------------| :------------: |:---------:| ------------:|
| `database-status` | ✅ Reliability | Critical  | 15 minutes   |

## What This Checks

- Attempts to establish PDO connections to all configured database connections
- Validates the default database connection is reachable
- Checks additional connections specified in `config('shieldci.database.connections')`
- Reports connection failures with specific error messages (access denied, connection refused, unknown database)
- Skips automatically in CI (where database backends may not be available)
- Points to `config/database.php` and `.env` so you know where to fix connection details

## Why It Matters

- **Data integrity**: Applications cannot read/write data if database connections fail; users see cryptic errors or white screens
- **Deployment surprises**: Misconfigured database hosts, credentials, or firewall rules show up only at runtime. This analyzer surfaces them before production deploys
- **Multi-tenant environments**: Applications using multiple database connections (tenant isolation, read replicas) need all connections validated
- **Silent failures**: Laravel's lazy connection means errors only appear when queries execute, potentially deep in the request lifecycle

## How to Fix

### Quick Fix (5 minutes)

1. Verify your database server is running and reachable:

```bash
# For MySQL
mysql -h 127.0.0.1 -u root -p

# For PostgreSQL
psql -h 127.0.0.1 -U postgres

# For SQLite
ls -la database/database.sqlite
```

2. Update `.env` with the correct connection credentials:

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=my_application
DB_USERNAME=root
DB_PASSWORD=secret
```

3. Test the connection manually:

```bash
php artisan tinker
>>> DB::connection()->getPdo();
```

### Proper Fix (15 minutes)

1. **Verify all connection details** in `config/database.php`:

```php
// Before - Missing database or wrong credentials
'mysql' => [
    'driver' => 'mysql',
    'host' => env('DB_HOST', '127.0.0.1'),
    'database' => env('DB_DATABASE', ''),  // ❌ Empty database name
    'username' => env('DB_USERNAME', 'root'),
    'password' => env('DB_PASSWORD', 'wrong_password'),  // ❌ Incorrect password
],

// After - Correct configuration
'mysql' => [
    'driver' => 'mysql',
    'host' => env('DB_HOST', '127.0.0.1'),
    'database' => env('DB_DATABASE', 'my_application'),  // ✅ Valid database
    'username' => env('DB_USERNAME', 'root'),
    'password' => env('DB_PASSWORD', ''),  // ✅ Correct password from .env
],
```

2. **Install missing PHP extensions**:

```bash
# For MySQL
php -m | grep pdo_mysql

# If missing
sudo apt-get install php8.2-mysql
sudo service apache2 restart

# For PostgreSQL
php -m | grep pdo_pgsql

# If missing
sudo apt-get install php8.2-pgsql
sudo service apache2 restart
```

3. **Create missing databases**:

```sql
-- MySQL
CREATE DATABASE IF NOT EXISTS my_application;
GRANT ALL PRIVILEGES ON my_application.* TO 'root'@'localhost';

-- PostgreSQL
CREATE DATABASE my_application;
GRANT ALL PRIVILEGES ON DATABASE my_application TO postgres;
```

4. **Check firewall/network access**:

```bash
# Test if database port is reachable
telnet 127.0.0.1 3306

# Check if firewall is blocking
sudo ufw status
```

## ShieldCI Configuration

This analyzer is automatically skipped in CI environments (`$runInCI = false`).

**Why skip in CI?**
- Database backends may not be available in CI pipelines
- CI environments often use different database configurations (SQLite in-memory) than production
- Prevents false failures when production database credentials aren't configured in CI

**When to run this analyzer:**
- ✅ **Local development**: Ensures your database is properly configured during development
- ✅ **Staging/Production servers**: Confirms database connections are accessible
- ✅ **Deployment verification**: Run after deploying database configuration changes
- ❌ **CI/CD pipelines**: Skipped automatically (database services typically unavailable)

**Check additional database connections:**

By default, only the default connection is checked. To verify multiple connections (e.g., read replicas, multi-tenancy):

```php
// config/shieldci.php
'analyzers' => [
    'reliability' => [
        'enabled' => true,
        
        'database-status' => [
            'connections' => ['mysql', 'tenant_db', 'analytics'],

            // Or as comma-separated string
            'connections' => 'mysql,tenant_db,analytics',
        ],
    ],
],
```

## References

- [Laravel Database Configuration](https://laravel.com/docs/database#configuration)
- [Laravel Multiple Database Connections](https://laravel.com/docs/database#using-multiple-database-connections)
- [MySQL Connection Errors](https://dev.mysql.com/doc/refman/8.0/en/error-handling.html)
- [PostgreSQL Connection Errors](https://www.postgresql.org/docs/current/errcodes-appendix.html)

## Related Analyzers

- [Cache Status Analyzer](/analyzers/reliability/cache-status) - Validates cache connectivity and functionality
- [Composer Validation Analyzer](/analyzers/reliability/composer-validation) - Ensures composer.json is valid and follows best practices
- [Up-to-Date Migrations Analyzer](/analyzers/reliability/up-to-date-migrations) - Ensures all database migrations are up to date and have been executed
