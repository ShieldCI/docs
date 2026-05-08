---
title: Eval Usage Analyzer
description: Detects usage of eval() and other dynamic code execution functions that allow arbitrary PHP code execution
icon: code
outline: [2, 3]
tags: eval,code-execution,security,dynamic-code,unserialize,deserialization,rce,blade,dynamic-class,object-injection
pro: true
---

# Eval Usage Analyzer

| Analyzer ID    | Category     | Severity   | Time To Fix  |
| -------------- | :----------: |:----------:| ------------:|
| `eval-usage`   | 🛡️ Security  | Critical   | 20 minutes   |

## What This Checks

Detects `eval()` and related dynamic code execution patterns. Severity escalates to Critical when tainted user-input variables (tracked from `$_GET`, `request()`, `$request->`, etc.) flow into any dangerous call — including pre-assigned variables like `$fn = request('x'); ob_start($fn)`.

**Detected Patterns:**

#### Code Execution Functions (4)
- `eval()` — executes arbitrary PHP code
- `assert()` with a string literal — treated as code in PHP < 8.3
- `create_function()` — deprecated (PHP 7.2), removed (PHP 8.0); uses `eval` internally
- `preg_replace()` with `/e` modifier — executes replacement as PHP code (removed PHP 7.0)

#### Dynamic Invocation with User Input (5)
Flagged when the callable or class name is tainted by user input:
- `call_user_func()` / `call_user_func_array()` with a user-controlled function name
- `$func()` — variable function calls
- `$obj->$method()` — dynamic method dispatch
- `Class::$method()` — dynamic static dispatch
- `new $class()` — dynamic class instantiation

#### Unsafe Deserialization (1)
- `unserialize()` with user input — Critical; PHP object injection / RCE
- `unserialize()` without `['allowed_classes' => false]` — Medium; flagged even without user input

#### User-Controlled Callbacks and Templates (4)
- `ob_start()` with a user-supplied callable
- `register_shutdown_function()` with a user-supplied callable
- `register_tick_function()` with a user-supplied callable
- `Blade::compileString()` with user input — `@php` directives allow arbitrary PHP execution

## Why It Matters

Dynamic code execution is one of the most dangerous vulnerability classes, allowing attackers to run arbitrary PHP code on your server:

- **Remote Code Execution (RCE)** - Complete server takeover by injecting malicious PHP code
- **Data Exfiltration** - Reading sensitive files, environment variables, database credentials
- **Backdoor Installation** - Persistent server access by writing malicious files
- **Privilege Escalation** - Executing system commands as the web server user
- **Lateral Movement** - Using the compromised server to attack internal services
- **PHP Object Injection** - Triggering `__wakeup`, `__destruct`, or magic methods on existing classes via `unserialize()`

A single dynamic code execution call with user input gives attackers the same access as your PHP process, making it one of the most critical security vulnerabilities possible.

## How to Fix

### Quick Fix (5 minutes)

Replace dynamic code execution with proper control structures or callbacks:

**Before:**
```php
public function calculate(Request $request)
{
    $formula = $request->input('formula');
    eval($formula); // VULNERABLE
}
```

**After:**
```php
public function calculate(Request $request)
{
    $validated = $request->validate([
        'operand1' => 'required|numeric',
        'operand2' => 'required|numeric',
        'operator' => 'required|in:add,subtract,multiply,divide',
    ]);

    $result = match ($validated['operator']) {
        'add'      => $validated['operand1'] + $validated['operand2'],
        'subtract' => $validated['operand1'] - $validated['operand2'],
        'multiply' => $validated['operand1'] * $validated['operand2'],
        'divide'   => $validated['operand2'] != 0
            ? $validated['operand1'] / $validated['operand2']
            : throw new \InvalidArgumentException('Division by zero'),
    };

    return response()->json(['result' => $result]);
}
```

### Proper Fix (20 minutes)

**Replace `create_function()` with closures:**

**Before:**
```php
// VULNERABLE: create_function() uses dynamic evaluation internally
$sorter = create_function('$a, $b', 'return $a["name"] <=> $b["name"];');
usort($items, $sorter);
```

**After:**
```php
// SAFE: Arrow function (PHP 7.4+)
usort($items, fn($a, $b) => $a['name'] <=> $b['name']);
```

**Replace `preg_replace()` with `/e` modifier:**

**Before:**
```php
// VULNERABLE: /e modifier executes replacement as PHP code
$result = preg_replace('/\{(\w+)\}/e', '$data["$1"]', $template);
```

**After:**
```php
// SAFE: preg_replace_callback() with closure
$result = preg_replace_callback('/\{(\w+)\}/', function ($matches) use ($data) {
    return $data[$matches[1]] ?? '';
}, $template);
```

**Replace `assert()` with string argument:**

**Before:**
```php
// VULNERABLE: assert() with string executes code
assert('$user->isValid()');
```

**After:**
```php
// SAFE: assert() with boolean expression
assert($user->isValid());

// In production, disable assertions entirely:
// zend.assertions = 0
```

**Secure `call_user_func()` usage:**

**Before:**
```php
public function execute(Request $request)
{
    $callback = $request->input('action');
    call_user_func($callback, $request->input('data')); // VULNERABLE
}
```

**After:**
```php
public function execute(Request $request)
{
    $validated = $request->validate([
        'action' => 'required|in:process,validate,transform',
        'data'   => 'required|string',
    ]);

    $callbacks = [
        'process'   => [$this, 'processData'],
        'validate'  => [$this, 'validateData'],
        'transform' => [$this, 'transformData'],
    ];

    call_user_func($callbacks[$validated['action']], $validated['data']);
}
```

**Fix `unserialize()` usage:**

**Before:**
```php
// VULNERABLE: user-controlled data
$object = unserialize($request->input('payload'));

// UNSAFE: no class restriction
$cached = unserialize($data);
```

**After:**
```php
// SAFE: reject user input entirely — use JSON instead
$data = json_decode($request->input('payload'), true);

// SAFE: restrict allowed classes when deserializing internal data
$cached = unserialize($data, ['allowed_classes' => false]);

// SAFE: allow only specific trusted classes
$cached = unserialize($data, ['allowed_classes' => [MyValueObject::class]]);
```

**Fix dynamic class instantiation:**

**Before:**
```php
$class = $request->input('driver');
$instance = new $class(); // VULNERABLE
```

**After:**
```php
$validated = $request->validate(['driver' => 'required|in:mysql,sqlite,pgsql']);

$drivers = [
    'mysql'  => MySqlDriver::class,
    'sqlite' => SqliteDriver::class,
    'pgsql'  => PgsqlDriver::class,
];

$instance = new $drivers[$validated['driver']]();
```

**Fix callback registration with user input:**

**Before:**
```php
// VULNERABLE: user controls the callback
ob_start($request->input('handler'));
register_shutdown_function($request->input('fn'));
```

**After:**
```php
// SAFE: use a fixed, static callback
ob_start(function () {
    // process output
});

// SAFE: register only known, internal functions
register_shutdown_function([$this, 'cleanup']);
```

**Fix Blade::compileString() with user input:**

**Before:**
```php
// VULNERABLE: user-controlled Blade template compiles arbitrary @php blocks
$html = Blade::compileString(request('template'));
```

**After:**
```php
// SAFE: pass user data as variables, never as the template itself
return view('templates.user-content', [
    'content' => $request->input('content'),
]);
```


## References

- [OWASP Code Injection](https://owasp.org/www-community/attacks/Code_Injection)
- [CWE-94: Improper Control of Generation of Code](https://cwe.mitre.org/data/definitions/94.html)
- [CWE-95: Eval Injection](https://cwe.mitre.org/data/definitions/95.html)
- [CWE-502: Deserialization of Untrusted Data](https://cwe.mitre.org/data/definitions/502.html)
- [PHP eval() Documentation](https://www.php.net/manual/en/function.eval.php)
- [PHP assert() Documentation](https://www.php.net/manual/en/function.assert.php)
- [PHP preg_replace_callback Documentation](https://www.php.net/manual/en/function.preg-replace-callback.php)
- [PHP unserialize() Documentation](https://www.php.net/manual/en/function.unserialize.php)

## Related Analyzers

- [Command Injection Analyzer](/analyzers/security/command-injection) - Detects shell command injection vulnerabilities
- [RCE Analyzer](/analyzers/security/rce) - Detects remote code execution via variable functions and deserialization
- [Object Injection Analyzer](/analyzers/security/object-injection) - Detects unsafe deserialization leading to code execution
- [SQL Injection Analyzer](/analyzers/security/sql-injection) - Detects SQL injection vulnerabilities
- [XSS Vulnerabilities Analyzer](/analyzers/security/xss-vulnerabilities) - Detects cross-site scripting
