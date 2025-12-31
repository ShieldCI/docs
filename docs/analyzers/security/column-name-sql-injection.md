---
title: Column Name SQL Injection Analyzer
description: Detects SQL injection vulnerabilities where user input controls column names in database queries
icon: shield-x
outline: [2, 3]
tags: sql-injection,column-names,security,database,pdo
---

# Column Name SQL Injection Analyzer

| Analyzer ID                   | Category     | Severity | Time To Fix  |
| ------------------------------| :----------: |:--------:| ------------:|
| `column-name-sql-injection`   | 🛡️ Security  | Critical | 10 minutes   |

## What This Checks

Detects SQL injection vulnerabilities where user input controls column names in Laravel database queries. PDO does not support binding column names, only values, making column name injection a unique and dangerous vulnerability.

**Covered methods (6 total):**
- `orderBy`, `orderByDesc` - Position-aware detection (only flags 1st argument)
- `select`, `addSelect` - Any request usage flagged
- `groupBy` - Any request usage flagged
- `pluck` - Any request usage flagged

**Excluded from detection:**
- `*Raw` methods (`orderByRaw`, `selectRaw`, `groupByRaw`) - Covered by [SQL Injection Analyzer](/analyzers/security/sql-injection)
- `having()`, `havingRaw()` - Often operate on aggregates (COUNT, SUM), high false-positive rate
- `value()` - Typically uses hardcoded column names, low real-world risk

## Why It Matters

- **SQL Injection**: Column names cannot be safely bound by PDO, creating a direct SQL injection vulnerability
- **Data Exfiltration**: Attackers can manipulate queries to extract sensitive data from unexpected columns
- **Database Structure Discovery**: Malicious users can probe your database schema through error messages
- **Authorization Bypass**: Column manipulation can bypass access controls and retrieve unauthorized data

Unlike parameter SQL injection (which PDO protects against), column name injection occurs when user input dictates which columns are used in SQL queries. Since PDO can only bind values, not column or table names, this creates a vulnerability that Laravel's query builder cannot automatically protect against.

## How to Fix

### Quick Fix (2 minutes)

Use a whitelist of allowed columns instead of passing user input directly:

```php
// app/Http/Controllers/UserController.php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        // ❌ VULNERABLE: Direct user input
        // $users = User::orderBy($request->input('sort'))->get();

        // ✅ SAFE: Whitelist allowed columns
        $allowedColumns = ['name', 'email', 'created_at'];
        $sortColumn = $request->input('sort', 'created_at');

        if (!in_array($sortColumn, $allowedColumns)) {
            $sortColumn = 'created_at';
        }

        $users = User::orderBy($sortColumn)->get();

        return response()->json($users);
    }
}
```

### Proper Fix (10 minutes)

**Option 1: Whitelist with Validation**

Use Laravel's validation to ensure only allowed column names are accepted:

```php
// app/Http/Controllers/UserController.php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'sort' => 'sometimes|in:name,email,created_at',
            'direction' => 'sometimes|in:asc,desc',
        ]);

        $sortColumn = $validated['sort'] ?? 'created_at';
        $direction = $validated['direction'] ?? 'asc';

        $users = User::orderBy($sortColumn, $direction)->get();

        return response()->json($users);
    }
}
```

**Option 2: Switch Statement Mapping**

Map user input to safe column names using a switch or match statement:

```php
// app/Http/Controllers/UserController.php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $sortInput = $request->input('sort', 'date');

        // Map user-friendly names to actual column names
        $sortColumn = match ($sortInput) {
            'date' => 'created_at',
            'name' => 'name',
            'email' => 'email',
            default => 'created_at',
        };

        $users = User::orderBy($sortColumn)->get();

        return response()->json($users);
    }
}
```

**Option 3: Schema Validation**

Validate against actual table columns using Laravel's Schema facade:

```php
// app/Http/Controllers/UserController.php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $sortColumn = $request->input('sort', 'created_at');

        // Validate column exists in users table
        if (!Schema::hasColumn('users', $sortColumn)) {
            abort(400, 'Invalid sort column');
        }

        // Optional: Whitelist allowed columns even after schema check
        $allowedColumns = ['name', 'email', 'created_at'];
        if (!in_array($sortColumn, $allowedColumns)) {
            abort(400, 'Column not allowed for sorting');
        }

        $users = User::orderBy($sortColumn)->get();

        return response()->json($users);
    }
}
```

**Option 4: Request Class Validation**

Create a dedicated Form Request for complex validation logic:

```php
// app/Http/Requests/UserIndexRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserIndexRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'sort' => ['sometimes', Rule::in(['name', 'email', 'created_at'])],
            'direction' => ['sometimes', Rule::in(['asc', 'desc'])],
        ];
    }

    public function getSortColumn(): string
    {
        return $this->validated('sort', 'created_at');
    }

    public function getSortDirection(): string
    {
        return $this->validated('direction', 'asc');
    }
}

// app/Http/Controllers/UserController.php
namespace App\Http\Controllers;

use App\Http\Requests\UserIndexRequest;
use App\Models\User;

class UserController extends Controller
{
    public function index(UserIndexRequest $request)
    {
        $users = User::orderBy(
            $request->getSortColumn(),
            $request->getSortDirection()
        )->get();

        return response()->json($users);
    }
}
```

## References

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [Laravel Query Builder Documentation](https://laravel.com/docs/queries)
- [PDO Prepared Statements](https://www.php.net/manual/en/pdo.prepared-statements.php)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)

## Related Analyzers

- [SQL Injection Analyzer](/analyzers/security/sql-injection) - Detects traditional SQL injection vulnerabilities
- [Mass Assignment Vulnerabilities Analyzer](/analyzers/security/mass-assignment-vulnerabilities) - Prevents unauthorized model attribute updates
- [Authentication & Authorization Analyzer](/analyzers/security/authentication-authorization) - Ensures proper access controls
