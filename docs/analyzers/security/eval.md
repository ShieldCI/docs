---
title: Eval Usage Analyzer
description: Detects usage of eval() and other dynamic code execution functions that allow arbitrary PHP code execution
icon: code
outline: [2, 3]
tags: eval,code-execution,security,dynamic-code
pro: true
---

# Eval Usage Analyzer

| Analyzer ID    | Category     | Severity   | Time To Fix  |
| -------------- | :----------: |:----------:| ------------:|
| `eval-usage`   | 🛡️ Security  | Critical   | 20 minutes   |

## What This Checks

This analyzer detects the use of `eval()` and other dynamic code execution functions in your Laravel application that can lead to arbitrary PHP code execution.

**Detected Vulnerable Patterns:**

#### Dynamic Code Execution Functions (3)
- `eval()` - Executes a string as PHP code
- `assert()` with string arguments - Can execute code when passed a string instead of a boolean expression
- `create_function()` - Deprecated in PHP 7.2, removed in PHP 8.0, internally uses dynamic evaluation

#### Dangerous Modifiers (1)
- `preg_replace()` with `/e` modifier - Executes replacement string as PHP code (removed in PHP 7.0)

#### Indirect Code Execution (1)
- `call_user_func()` / `call_user_func_array()` with user-controlled function names

**User Input Tracking:**

The analyzer tracks variables assigned from user input sources (`$request->`, `request()`, `$_GET`, `$_POST`, `$_REQUEST`, `$_COOKIE`, `Request::`) and escalates severity to Critical when these tainted variables are used in any of the dangerous functions.

::: tip What's NOT Flagged
The analyzer correctly recognizes these as **safe**:
- Comments containing function names
- `assert()` with boolean expressions: `assert($x > 5)`
- `assert()` with comparison operators: `assert($a === $b)`
- `call_user_func()` without user input
:::

## Why It Matters

Dynamic code execution is one of the most dangerous vulnerability classes, allowing attackers to run arbitrary PHP code on your server:

- **Remote Code Execution (RCE)** - Complete server takeover by injecting malicious PHP code
- **Data Exfiltration** - Reading sensitive files, environment variables, database credentials
- **Backdoor Installation** - Persistent server access by writing malicious files
- **Privilege Escalation** - Executing system commands as the web server user
- **Lateral Movement** - Using the compromised server to attack internal services

A single dynamic code execution call with user input gives attackers the same access as your PHP process, making it one of the most critical security vulnerabilities possible.

## How to Fix

### Quick Fix (5 minutes)

Replace dynamic code execution with proper control structures or callbacks:

**Before:**
```php
public function calculate(Request $request)
{
    $formula = $request->input('formula');

    // VULNERABLE: User input passed directly to dynamic code execution
    $result = null;
    // Dangerous: dynamically evaluates $formula as PHP code
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

    // SAFE: Use a whitelist of allowed operations
    $result = match ($validated['operator']) {
        'add' => $validated['operand1'] + $validated['operand2'],
        'subtract' => $validated['operand1'] - $validated['operand2'],
        'multiply' => $validated['operand1'] * $validated['operand2'],
        'divide' => $validated['operand2'] != 0
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
// SAFE: Anonymous function (closure)
usort($items, function ($a, $b) {
    return $a['name'] <=> $b['name'];
});

// Or even better with arrow functions (PHP 7.4+)
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
// SAFE: Use preg_replace_callback() instead
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

// In production, disable assertions entirely in php.ini:
// zend.assertions = 0
```

**Secure `call_user_func()` usage:**

**Before:**
```php
public function execute(Request $request)
{
    $callback = $request->input('action');

    // VULNERABLE: User controls which function is called
    call_user_func($callback, $request->input('data'));
}
```

**After:**
```php
public function execute(Request $request)
{
    $validated = $request->validate([
        'action' => 'required|in:process,validate,transform',
        'data' => 'required|string',
    ]);

    // SAFE: Whitelist of allowed callbacks
    $callbacks = [
        'process' => [$this, 'processData'],
        'validate' => [$this, 'validateData'],
        'transform' => [$this, 'transformData'],
    ];

    $callback = $callbacks[$validated['action']];
    call_user_func($callback, $validated['data']);
}
```


## References

- [OWASP Code Injection](https://owasp.org/www-community/attacks/Code_Injection)
- [CWE-94: Improper Control of Generation of Code](https://cwe.mitre.org/data/definitions/94.html)
- [CWE-95: Eval Injection](https://cwe.mitre.org/data/definitions/95.html)
- [PHP eval() Documentation](https://www.php.net/manual/en/function.eval.php)
- [PHP assert() Documentation](https://www.php.net/manual/en/function.assert.php)
- [PHP preg_replace_callback Documentation](https://www.php.net/manual/en/function.preg-replace-callback.php)

## Related Analyzers

- [Command Injection Analyzer](/analyzers/security/command-injection) - Detects shell command injection vulnerabilities
- [RCE Analyzer](/analyzers/security/rce) - Detects remote code execution via variable functions and deserialization
- [Object Injection Analyzer](/analyzers/security/object-injection) - Detects unsafe deserialization leading to code execution
- [SQL Injection Analyzer](/analyzers/security/sql-injection) - Detects SQL injection vulnerabilities
- [XSS Vulnerabilities Analyzer](/analyzers/security/xss-vulnerabilities) - Detects cross-site scripting

---
