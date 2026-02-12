---
title: Validation SQL Injection Analyzer
description: Detects SQL injection vulnerabilities in validation rules and custom validators
icon: database
outline: [2, 3]
tags: sql-injection,validation,security,database
pro: true
---

# Validation SQL Injection Analyzer

| Analyzer ID                | Category      | Severity | Time To Fix |
| -------------------------- | :-----------: | :------: | ----------: |
| `validation-sql-injection` | 🛡️ Security  | High     | 15 minutes  |

## What This Checks

This analyzer detects SQL injection vulnerabilities that arise specifically through Laravel's validation system. While Laravel's built-in validation is generally safe, custom validation rules and dynamic rule construction can introduce injection risks:

- **Dynamic table/column names** in `exists` and `unique` rules (e.g., `"exists:$table,col"` or `"unique:{$var},col"`)
- **Request input in validation rules** (e.g., `"exists:users,$request->column"`)
- **Rule builder with string concatenation** (e.g., `Rule::exists('table' . $var)` or `Rule::unique("table" . $var)`)
- **Custom validation functions** that contain database queries (`DB::`, `->get()`, `->first()`)
- **Validator::extend()** calls that include database queries without parameter binding

::: tip What's NOT Flagged
The analyzer correctly recognizes these as **safe**:
- Hardcoded `exists:users,email` rules with static table and column names
- `Rule::exists('users', 'email')` with static string arguments
- Standard Laravel validation rules like `required`, `string`, `max:255`
- Eloquent queries in custom validators that use parameter binding
:::

## Why It Matters

Validation-layer SQL injection is particularly dangerous because:

- **Overlooked attack surface** - Developers trust Laravel's validation as inherently safe, but custom rules bypass those protections
- **Data exfiltration** - Attackers can manipulate column names to extract data from arbitrary tables
- **Schema reconnaissance** - Dynamic table/column names allow attackers to probe database structure
- **Bypass authentication** - Validation-layer injection can circumvent login and authorization logic
- **Compliance violations** - SQL injection vulnerabilities violate PCI-DSS, SOC 2, and similar standards

## How to Fix

### Quick Fix

Replace dynamic table/column names with hardcoded values:

**Before (❌):**
```php
use Illuminate\Http\Request;

public function rules(Request $request)
{
    return [
        // Vulnerable: user-controlled column name
        'value' => "exists:users,{$request->column}",
    ];
}
```

**After (✅):**
```php
use Illuminate\Http\Request;

public function rules(Request $request)
{
    return [
        // Safe: hardcoded column name
        'value' => 'exists:users,email',
    ];
}
```

### Proper Fix

Use the `Rule` builder with `where()` constraints instead of string concatenation:

**Before (❌):**
```php
use Illuminate\Validation\Rule;

public function rules(Request $request)
{
    return [
        // Vulnerable: string concatenation in Rule builder
        'email' => Rule::exists('users' . $request->table_suffix),

        // Vulnerable: dynamic column in validation string
        'name'  => "unique:users,{$request->input('field')}",
    ];
}
```

**After (✅):**
```php
use Illuminate\Validation\Rule;

public function rules(Request $request)
{
    return [
        // Safe: static table name with where() constraints
        'email' => Rule::exists('users', 'email')
            ->where('account_id', $request->user()->account_id),

        // Safe: hardcoded column name
        'name' => Rule::unique('users', 'name')
            ->ignore($request->user()->id),
    ];
}
```

**Custom Validators (✅):**
```php
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

// Before (❌): Custom validator with unsafe query
Validator::extend('unique_in_org', function ($attribute, $value, $parameters) {
    return DB::select("SELECT * FROM {$parameters[0]} WHERE {$parameters[1]} = '{$value}'")->isEmpty();
});

// After (✅): Custom validator with parameterized query
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

---
