---
title: Validation SQL Injection Analyzer
description: Detects SQL injection vulnerabilities in custom validation rules and validators where raw user input is interpolated into database queries
icon: shield-x
outline: [2, 3]
tags: sql-injection,validation,security,database
pro: true
---

# Validation SQL Injection Analyzer

| Analyzer ID                | Category      | Severity | Time To Fix |
| -------------------------- | :-----------: | :------: | ----------: |
| `validation-sql-injection` | 🛡️ Security  | High     | 15 minutes  |

## What This Checks

Detects SQL injection vulnerabilities that arise specifically through Laravel's validation system. While Laravel's built-in validation is generally safe, custom validation rules and dynamic rule construction can introduce injection risks.

**Detected patterns:**

- **Dynamic table/column names** in `exists` and `unique` rules — e.g., `"exists:$table,col"` or `"unique:{$var},col"`
- **Request input in rule strings** — e.g., `"exists:users,$request->column"`
- **`Rule` builder with string concatenation** — e.g., `Rule::exists('table_' . $var)` or `Rule::unique('table_' . $var)` — reported at **Critical** severity
- **`Validator::extend()` closures** that contain database queries without parameter binding
- **Public and protected `validate*()` methods** that contain database queries (`DB::` static calls or Eloquent query execution) — private helper methods are excluded as they cannot be registered as Laravel validators

## Why It Matters

- **Overlooked attack surface** — Developers trust Laravel's validation as inherently safe, but custom rules bypass those protections
- **Data exfiltration** — Attackers can manipulate column names to extract data from arbitrary tables
- **Schema reconnaissance** — Dynamic table/column names allow attackers to probe database structure
- **Authorization bypass** — Validation-layer injection can circumvent login and authorization logic
- **Compliance violations** — SQL injection vulnerabilities violate PCI-DSS, SOC 2, and similar standards

## How to Fix

### Quick Fix (5 minutes)

Replace dynamic table/column names with hardcoded values:

```php
// ❌ Vulnerable: user-controlled column name
public function rules(Request $request)
{
    return [
        'value' => "exists:users,{$request->column}",
    ];
}

// ✅ Safe: hardcoded column name
public function rules(Request $request)
{
    return [
        'value' => 'exists:users,email',
    ];
}
```

### Proper Fix (15 minutes)

Use the `Rule` builder with fluent constraints instead of string concatenation:

```php
use Illuminate\Validation\Rule;

// ❌ Vulnerable: string concatenation in Rule builder
public function rules(Request $request)
{
    return [
        'email' => Rule::exists('users_' . $request->table_suffix),
        'name'  => "unique:users,{$request->input('field')}",
    ];
}

// ✅ Safe: static table/column names with where() constraints
public function rules(Request $request)
{
    return [
        'email' => Rule::exists('users', 'email')
            ->where('account_id', $request->user()->account_id),

        'name' => Rule::unique('users', 'name')
            ->ignore($request->user()->id),
    ];
}
```

**Custom validators — use parameterized queries:**

```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

// ❌ Vulnerable: raw SQL with user input
Validator::extend('unique_in_org', function ($attribute, $value, $parameters) {
    return DB::select("SELECT * FROM {$parameters[0]} WHERE {$parameters[1]} = '{$value}'")->isEmpty();
});

// ✅ Safe: parameterized Eloquent query
Validator::extend('unique_in_org', function ($attribute, $value, $parameters) {
    return DB::table('users')
        ->where('email', $value)
        ->where('organization_id', $parameters[0])
        ->doesntExist();
});
```

## References

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [Laravel Validation Rules](https://laravel.com/docs/validation#available-validation-rules)
- [Laravel Rule Builder](https://laravel.com/docs/validation#rule-objects)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)

## Related Analyzers

- [SQL Injection Analyzer](/analyzers/security/sql-injection) - Detects SQL injection in general database queries
- [Column Name SQL Injection Analyzer](/analyzers/security/column-name-sql-injection) - Detects SQL injection via dynamic column names
- [Mass Assignment Vulnerabilities Analyzer](/analyzers/security/mass-assignment-vulnerabilities) - Protects against mass assignment attacks
