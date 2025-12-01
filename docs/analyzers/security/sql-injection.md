---
title: SQL Injection Detector
description: Detects potential SQL injection vulnerabilities by identifying unsafe database query patterns in Laravel applications
icon: shield-alert
outline: [2, 3]
---

# SQL Injection Detector

| Analyzer ID     | Category     | Severity   | Time To Fix  |
| ----------------| :----------: |:----------:| ------------:|
| `sql-injection` | 🛡️ Security  | Critical   | 30 minutes   |

## What This Checks

This analyzer detects potential SQL injection vulnerabilities in your Laravel application by identifying unsafe database query patterns, including string concatenation in raw SQL methods, variable interpolation in queries, use of `DB::unprepared()`, and native PHP database functions that bypass Laravel's query protections.

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

## Common Vulnerabilities Detected

### 1. Variable Interpolation

**Before (❌):**
```php
// Variables embedded in SQL strings
DB::raw("SELECT * FROM users WHERE id = $userId");
DB::raw("SELECT * FROM users WHERE name = '{$userName}'");
```

**After (✅):**
```php
// Use parameter binding
DB::select("SELECT * FROM users WHERE id = ?", [$userId]);
DB::select("SELECT * FROM users WHERE name = ?", [$userName]);
```

### 2. Raw Query Methods

**Before (❌):**
```php
// whereRaw, havingRaw, orderByRaw with concatenation
DB::table('users')
    ->whereRaw("status = '" . $status . "'")
    ->get();

DB::table('products')
    ->orderByRaw($sortColumn . ' DESC')
    ->get();
```

**After (✅):**
```php
// Use parameter binding in raw methods
DB::table('users')
    ->whereRaw('status = ?', [$status])
    ->get();

// Better: Use query builder methods
DB::table('products')
    ->orderBy($sortColumn, 'desc')
    ->get();
```

### 3. DB::unprepared()

**Before (❌):**
```php
// DB::unprepared() bypasses ALL protections
DB::unprepared("DROP TABLE IF EXISTS temp_" . $tableName);
```

**After (✅):**
```php
// Use Schema builder
Schema::dropIfExists('temp_' . $tableName);

// Or use prepared statements
DB::statement('DROP TABLE IF EXISTS ?', ['temp_' . $tableName]);
```

### 4. Native PHP Database Functions

**Before (❌):**
```php
// Direct mysqli/pg usage
mysqli_query($conn, "SELECT * FROM users WHERE id = " . $userId);
pg_query($conn, "SELECT * FROM users WHERE name = '" . $name . "'");
new PDO($dsn, $user, $password);
```

**After (✅):**
```php
// Use Laravel's DB facade
DB::select("SELECT * FROM users WHERE id = ?", [$userId]);
DB::select("SELECT * FROM users WHERE name = ?", [$name]);

// Laravel manages connections automatically
DB::connection('pgsql')->select(...);
```

### 5. User Input Sources

**Before (❌):**
```php
// Superglobals and request helpers directly in queries
$term = $_GET['q'];
DB::select("SELECT * FROM products WHERE name LIKE '%" . $term . "%'");

$category = request('category');
DB::table('products')->whereRaw("category = '" . $category . "'")->get();
```

**After (✅):**
```php
// Validate, then use parameter binding or query builder
$validated = $request->validate(['q' => 'required|string|max:255']);
DB::table('products')
    ->where('name', 'like', '%' . $validated['q'] . '%')
    ->get();
```

## Common Mistakes to Avoid

### 1. Assuming Internal Data is Safe

**Mistake:**
```php
// Even data from auth() should use parameter binding
$userId = auth()->id();
DB::raw("SELECT * FROM orders WHERE user_id = " . $userId);
```

**Correct:**
```php
$userId = auth()->id();
DB::table('orders')->where('user_id', $userId)->get();
```

### 2. Concatenating Table/Column Names

**Mistake:**
```php
// Building dynamic table names with concatenation
$table = 'users';
DB::select("SELECT * FROM " . $table . " WHERE id = ?", [$id]);
```

**Correct:**
```php
// Use query builder which handles identifiers safely
DB::table($table)->where('id', $id)->get();
```

### 3. Building Complex WHERE Clauses Manually

**Mistake:**
```php
// Manually constructing WHERE clauses
$conditions = [];
if ($name) {
    $conditions[] = "name LIKE '%" . $name . "%'";
}
if ($status) {
    $conditions[] = "status = '" . $status . "'";
}
$where = implode(' AND ', $conditions);
DB::select("SELECT * FROM users WHERE " . $where);
```

**Correct:**
```php
// Use query builder's conditional methods
$query = DB::table('users');
if ($name) {
    $query->where('name', 'like', '%' . $name . '%');
}
if ($status) {
    $query->where('status', $status);
}
$results = $query->get();
```

### 4. Using ORDER BY with User Input

**Mistake:**
```php
// Directly using user input in ORDER BY
$sortBy = request('sort'); // Could be "name; DROP TABLE users--"
DB::table('users')->orderByRaw($sortBy)->get();
```

**Correct:**
```php
// Whitelist allowed columns
$allowedColumns = ['name', 'email', 'created_at'];
$sortBy = request('sort', 'created_at');

if (!in_array($sortBy, $allowedColumns)) {
    $sortBy = 'created_at';
}

DB::table('users')->orderBy($sortBy)->get();
```

### 5. Forgetting to Validate Input

**Mistake:**
```php
// Using request data without validation
$email = request('email');
DB::table('users')->where('email', $email)->first();
```

**Correct:**
```php
// Always validate first
$validated = $request->validate([
    'email' => 'required|email|max:255',
]);

DB::table('users')->where('email', $validated['email'])->first();
```

## Configuration

Customize detection via `config/shieldci.php`:

```php
return [
    'sql_injection' => [
        // Add custom mysqli functions to detect
        'mysqli_functions' => [
            'mysqli_connect',
            'mysqli_query',
            // ... add more
        ],

        // Add custom PostgreSQL functions
        'postgres_functions' => [
            'pg_connect',
            'pg_query',
            // ... add more
        ],
    ],
];
```

## References

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [Laravel Query Builder Documentation](https://laravel.com/docs/queries)
- [Laravel Eloquent ORM](https://laravel.com/docs/eloquent)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [PHP PDO Prepared Statements](https://www.php.net/manual/en/pdo.prepared-statements.php)

## Related Analyzers

- **app-debug-mode** - Debug mode can leak SQL queries in error messages
- **debug-log** - Prevents logging of SQL queries with sensitive data
- **mass-assignment** - Protects against mass assignment vulnerabilities
- **xss-detection** - Detects cross-site scripting vulnerabilities
- **csrf-protection** - Ensures CSRF protection is enabled

---

**Severity:** Critical
**Time to Fix:** 30 minutes
**Auto-fixable:** No (requires code review)
**Analyzer ID:** `sql-injection`
