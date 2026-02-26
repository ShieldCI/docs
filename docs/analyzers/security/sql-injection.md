---
title: SQL Injection Analyzer
description: Detects potential SQL injection vulnerabilities by identifying unsafe database query patterns in Laravel applications
icon: shield-alert
outline: [2, 3]
tags: sql,injection,database,security
---

# SQL Injection Analyzer

| Analyzer ID     | Category     | Severity   | Time To Fix  |
| ----------------| :----------: |:----------:| ------------:|
| `sql-injection` | 🛡️ Security  | Critical   | 30 minutes   |

## What This Checks

This analyzer detects potential SQL injection vulnerabilities in your Laravel application by identifying unsafe SQL query construction patterns:

- **String concatenation** in SQL queries (e.g., `"WHERE id = " . $id`)
- **Variable interpolation** in SQL queries (e.g., `"WHERE name = '$name'"`)
- **Missing parameter bindings** when user input is present
- **Unsafe usage** of `DB::raw()`, `whereRaw()`, `selectRaw()`, and similar methods
- **DB::unprepared()** usage (inherently unsafe)
- **Native query functions** (`mysqli_query`, `pg_query`) with concatenation/interpolation

::: info Two-Tier Detection
The analyzer uses context-aware detection to minimize false positives:

- **Full query methods** (`DB::select`, `DB::insert`, `DB::update`, `DB::delete`, `DB::raw`) — flags **all** concatenation/interpolation when no bindings are present. When bindings are provided, only flags concatenation containing direct user input.
- **Fragment methods** (`whereRaw`, `orderByRaw`, `selectRaw`, `havingRaw`) — only flags concatenation/interpolation that contains **direct user input** (`$_GET`, `$_POST`, `request()`, `Request::input()`, `$request->input()`, etc.). Table/column name concatenation is not flagged.

:::

::: tip What's NOT Flagged
The analyzer correctly recognizes these as **safe**:
- PDO/mysqli instantiation (`new PDO()`, `new mysqli()`) - just connection setup
- Prepared statement functions (`mysqli_prepare()`, `pg_prepare()`) - secure by design
- Parameter binding (`DB::select('WHERE id = ?', [$id])`) - the recommended safe pattern
- Static queries without variables (`DB::select('SELECT * FROM users')`)
- Table/column name concatenation in query fragment methods (`->orderByRaw('col/' . $table . '.goal ASC')`) — only direct user input is flagged in `*Raw()` methods
- Structural concatenation with bindings (`DB::select('... IN (' . $placeholders . ')', $bindings)`) — when bindings are present, only direct user input in the SQL string is flagged
:::

## Why It Matters

SQL injection is one of the most critical security vulnerabilities (OWASP Top 10 #1) that can lead to:

- **Complete data breach** - Attackers can extract entire databases
- **Data manipulation** - Unauthorized modification or deletion of records
- **Authentication bypass** - Logging in as any user including administrators
- **Privilege escalation** - Gaining elevated system permissions
- **Server compromise** - In severe cases, complete system takeover

A single SQL injection vulnerability can compromise your entire application, making it critical to detect and fix these issues before deployment.

## How to Fix

### Quick Fix (5 minutes)

Replace string concatenation with parameter binding:

**Before (❌):**
```php
use Illuminate\Support\Facades\DB;

public function search($userId)
{
    // Vulnerable: String concatenation
    $results = DB::select(
        "SELECT * FROM users WHERE id = '" . $userId . "'"
    );
}
```

**After (✅):**
```php
use Illuminate\Support\Facades\DB;

public function search($userId)
{
    // Safe: Parameter binding with placeholders
    $results = DB::select(
        "SELECT * FROM users WHERE id = ?",
        [$userId]
    );
}
```

### Proper Fix (30 minutes)

Refactor to use Laravel's Query Builder or Eloquent ORM for automatic protection:

**Before (❌):**
```php
public function searchUsers($name, $status)
{
    // Multiple vulnerabilities
    $query = "SELECT * FROM users WHERE name LIKE '%" . $name . "%'";
    if ($status) {
        $query .= " AND status = '" . $status . "'";
    }
    return DB::select($query);
}
```

**After (✅):**
```php
public function searchUsers($name, $status)
{
    // Safe: Query Builder handles escaping automatically
    $query = DB::table('users')
        ->where('name', 'like', '%' . $name . '%');

    if ($status) {
        $query->where('status', $status);
    }

    return $query->get();
}
```

**Best Practice (✅✅):**
```php
public function searchUsers(Request $request)
{
    // Validate input first
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'status' => 'nullable|in:active,inactive,pending',
    ]);

    // Use Eloquent with validated data
    return User::query()
        ->where('name', 'like', '%' . $validated['name'] . '%')
        ->when($validated['status'] ?? null, function ($query, $status) {
            $query->where('status', $status);
        })
        ->get();
}
```

## ShieldCI Configuration

The analyzer can be customized to recognize additional native database functions specific to your application. To configure them, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'security' => [
        'enabled' => true,

        'sql-injection' => [
            // MySQLi query execution functions to check for SQL injection
            // Only functions that execute queries are checked (not prepare/connect/fetch)
            'mysqli_functions' => [
                'mysqli_query',        // Default
                'mysqli_real_query',   // Default
                'mysqli_multi_query',  // Default
                // Add any custom mysqli wrapper functions that execute queries
                'custom_db_query',
            ],

            // PostgreSQL query execution functions to check
            'postgres_functions' => [
                'pg_query',       // Default
                'pg_send_query',  // Default
                // Add any custom pg wrapper functions that execute queries
                'custom_pg_execute',
            ],
        ],
    ],
],
```

::: tip When to Customize
Only customize the function lists if you have **custom query execution functions** in your codebase.

**Important**: The analyzer only flags functions when SQL queries have concatenation or interpolation. Safe usage patterns are not flagged:

```php
// ✅ NOT flagged - no concatenation
mysqli_query($conn, "SELECT * FROM users WHERE id = 1");

// ❌ FLAGGED - has concatenation
mysqli_query($conn, "SELECT * FROM users WHERE id = " . $userId);
```

The default lists cover standard MySQLi and PostgreSQL query execution functions. You typically don't need to customize unless you have wrapper functions like `custom_execute_query()` or `legacy_db_run()`.
:::

## References

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [Laravel Query Builder Documentation](https://laravel.com/docs/queries)
- [Laravel Eloquent ORM](https://laravel.com/docs/eloquent)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [PHP PDO Prepared Statements](https://www.php.net/manual/en/pdo.prepared-statements.php)

## Related Analyzers

- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Debug mode can leak SQL queries in error messages
- [Debug Log Level Analyzer](/analyzers/performance/debug-log-level) - Prevents logging of SQL queries with sensitive data
- [Mass Assignment Vulnerabilities Analyzer](/analyzers/security/mass-assignment-vulnerabilities) - Protects against mass assignment vulnerabilities
- [XSS Vulnerabilities Analyzer](/analyzers/security/xss-vulnerabilities) - Detects cross-site scripting vulnerabilities
- [CSRF Protection Analyzer](/analyzers/security/csrf-protection) - Ensures CSRF protection is enabled

---
