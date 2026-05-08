---
title: Extract Function Analyzer
description: Detects use of PHP extract() function which can overwrite variables, leading to authentication bypass, variable pollution, and code injection
icon: alert-triangle
outline: [2, 3]
tags: extract,variable-overwrite,security,php
pro: true
---

# Extract Function Analyzer

| Analyzer ID    | Category     | Severity   | Time To Fix  |
| -------------- | :----------: |:----------:| ------------:|
| `extract-usage`| 🛡️ Security  | High       | 10 minutes   |

## What This Checks

Detects dangerous usage of PHP's `extract()` function and related scope-polluting functions that import variables from an array into the current symbol table. Checks for:

- `extract()` called with direct user input (`$_GET`, `$_POST`, `$request->all()`, `Request::all()`)
- `extract()` called with a variable tainted by user input (`$data = $request->all(); extract($data)`)
- `extract()` called without safe flags — missing `EXTR_SKIP`, `EXTR_IF_EXISTS`, `EXTR_PREFIX_ALL`, `EXTR_PREFIX_SAME`, or `EXTR_PREFIX_INVALID`
- `extract()` called with dangerous flags — `EXTR_OVERWRITE`, `EXTR_REFS`, or BitOr combinations
- `compact()` called with user-controlled variable names or a spread operator
- `parse_str()` called without a result argument (imports variables directly into scope)
- `parse_str()` called with user input as the first argument

## Why It Matters

The `extract()` function is one of the most dangerous built-in PHP functions because it silently overwrites variables in the current scope:

- **Authentication Bypass** - Overwrite `$isAdmin`, `$isAuthenticated`, or `$user` variables
- **Variable Pollution** - Replace any existing variable including configuration values
- **Code Injection** - Modify variables used in dynamic function calls or includes
- **Authorization Bypass** - Overwrite permission flags and role checks
- **Logic Manipulation** - Change control flow by overwriting boolean flags
- **Session Hijacking** - Overwrite session-related variables

## How to Fix

### Quick Fix (5 minutes)

Replace `extract()` with explicit variable assignment:

**Before (❌):**
```php
public function processForm(Request $request)
{
    // VULNERABLE: All request data becomes local variables
    extract($request->all());

    // $name, $email, $isAdmin are now variables from user input!
    User::create([
        'name' => $name,
        'email' => $email,
        'is_admin' => $isAdmin, // Attacker can set this!
    ]);
}
```

**After (✅):**
```php
public function processForm(Request $request)
{
    // SAFE: Explicit variable assignment with validation
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
    ]);

    User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'is_admin' => false, // Hardcoded, never from user input
    ]);
}
```

### Proper Fix (10 minutes)

**If extract() is genuinely needed, use safe flags:**

**Before (❌):**
```php
public function renderTemplate(array $data)
{
    // VULNERABLE: Can overwrite existing variables
    extract($data);

    // Variables from $data are now in scope
    include 'template.php';
}
```

**After (✅):**
```php
public function renderTemplate(array $data)
{
    // SAFE: EXTR_SKIP prevents overwriting existing variables
    extract($data, EXTR_SKIP);

    include 'template.php';
}
```

**Best Practice: Avoid extract() Entirely (✅✅):**

```php
// Option 1: Use Laravel's validated input directly
public function store(StoreUserRequest $request)
{
    $validated = $request->validated();

    User::create($validated);
}

// Option 2: Destructure with list() for specific variables
public function processData(array $data)
{
    ['name' => $name, 'email' => $email] = $data;

    // Only $name and $email are available
}

// Option 3: Access array keys explicitly
public function renderView(array $data)
{
    return view('template', [
        'name' => $data['name'] ?? '',
        'email' => $data['email'] ?? '',
    ]);
}

// Option 4: For Blade templates, pass data directly
public function show(User $user)
{
    // Laravel handles variable extraction safely in Blade
    return view('users.show', compact('user'));
}
```

**Replace compact() with user data:**

**Before (❌):**
```php
public function exportData(Request $request)
{
    $keys = $request->input('fields');

    // VULNERABLE: User controls which variables are exported
    $data = compact(...$keys);
}
```

**After (✅):**
```php
public function exportData(Request $request)
{
    $allowedFields = ['name', 'email', 'created_at'];
    $requestedFields = $request->input('fields', []);

    // SAFE: Whitelist allowed field names
    $fields = array_intersect($requestedFields, $allowedFields);

    $data = [];
    foreach ($fields as $field) {
        $data[$field] = $$field ?? null;
    }
}
```

**Fix parse_str() usage:**

**Before (❌):**
```php
// VULNERABLE: imports variables directly into the current scope
parse_str($_GET['filter']);
// $name, $sort, $order are now global variables from user input!
```

**After (✅):**
```php
// SAFE: result goes into an isolated array
parse_str($_GET['filter'], $params);

// Validate before use
$allowedSort = ['name', 'email', 'created_at'];
$sort = in_array($params['sort'] ?? '', $allowedSort, true)
    ? $params['sort']
    : 'name';
```


## References

- [PHP extract() Documentation](https://www.php.net/manual/en/function.extract.php)
- [CWE-621: Variable Extraction Error](https://cwe.mitre.org/data/definitions/621.html)
- [CWE-473: PHP External Variable Modification](https://cwe.mitre.org/data/definitions/473.html)
- [OWASP PHP Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/PHP_Configuration_Cheat_Sheet.html)

## Related Analyzers

- [Mass Assignment Vulnerabilities Analyzer](/analyzers/security/mass-assignment-vulnerabilities) - Detects unprotected mass assignment
- [Unguarded Models Analyzer](/analyzers/security/unguarded-models) - Detects models without $fillable or $guarded
- [SQL Injection Analyzer](/analyzers/security/sql-injection) - Detects SQL injection from user input
- [XSS Vulnerabilities Analyzer](/analyzers/security/xss-vulnerabilities) - Detects cross-site scripting from user input

---
