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

## References

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [Laravel Query Builder Documentation](https://laravel.com/docs/queries)
- [Laravel Eloquent ORM](https://laravel.com/docs/eloquent)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [PHP PDO Prepared Statements](https://www.php.net/manual/en/pdo.prepared-statements.php)

## Related Analyzers

- [Debug Mode](/analyzers/security/debug-mode) - Debug mode can leak SQL queries in error messages
- [Debug Log Level](/analyzers/performance/debug-log-level) - Prevents logging of SQL queries with sensitive data
- [Mass Assignment](/analyzers/security/mass-assignment) - Protects against mass assignment vulnerabilities
- [XSS Detection](/analyzers/security/xss-detection) - Detects cross-site scripting vulnerabilities
- [CSRF Protection](/analyzers/security/csrf-protection) - Ensures CSRF protection is enabled

---
