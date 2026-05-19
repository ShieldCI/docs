---
title: Remote Code Execution (RCE) Analyzer
description: Detects remote code execution vulnerabilities including eval, preg_replace /e modifier, variable functions, unsafe callbacks, and Reflection-based execution
icon: terminal
outline: [2, 3]
tags: rce,remote-code-execution,security,code-execution,eval
pro: true
---

# Remote Code Execution (RCE) Analyzer

| Analyzer ID | Category     | Severity   | Time To Fix  |
| ----------- | :----------: |:----------:| ------------:|
| `rce`       | 🛡️ Security  | Critical   | 20 minutes   |

## What This Checks

This analyzer detects Remote Code Execution (RCE) vulnerabilities by identifying dangerous function calls and code patterns that allow attackers to run arbitrary code on the server:

- **`eval()`** - executes string argument as PHP code
- **`assert()`** - string argument evaluates as PHP code in PHP < 8.0; only flagged when argument is a string or user-controlled
- **`create_function()`** - creates a function from a string body; inherently dangerous
- **Variable function calls** (`$func()`) - flagged when the function name is user-controlled
- **`preg_replace()` with `/e` modifier** - replacement string is evaluated as PHP code (deprecated PHP 5.5, removed PHP 7.0)
- **`call_user_func()`** / **`call_user_func_array()`** - flagged when callback is user-controlled or a plain variable
- **`new ReflectionFunction()`** / **`new ReflectionMethod()`** - invokes arbitrary function or method when arguments are user-controlled

**Severity Classification:**
- **Critical** - dangerous pattern called with user input (`$_GET`, `$_POST`, `$_REQUEST`, `$_COOKIE`, `request()`, `$request->`)
- **High** - dangerous pattern without detected user input (still a risk if data flows from untrusted sources)

## Why It Matters

Remote Code Execution is consistently ranked as one of the most critical vulnerability types, as it allows an attacker to gain full control of the server:

- **Complete Server Compromise** - Attackers can run any PHP code, system commands, or scripts
- **Data Breach** - Access to all files, databases, environment variables, and secrets on the server
- **Backdoor Installation** - Persistent access by writing web shells or cron jobs
- **Lateral Movement** - Pivoting from the compromised server to attack other systems on the network
- **Cryptomining** - Using server resources for cryptocurrency mining
- **Ransomware** - Encrypting files and demanding payment

A single RCE vulnerability can result in complete infrastructure compromise, making it the highest-priority class of security issue.

## How to Fix

### Quick Fix (5 minutes)

Remove or replace dangerous function calls:

**Before (❌):**
```php
public function executeTemplate(Request $request)
{
    $code = $request->input('template');

    // VULNERABLE: dynamic code execution with user input - Critical RCE
    // Do not pass user input to functions that run arbitrary code
}
```

**After (✅):**
```php
public function executeTemplate(Request $request)
{
    $validated = $request->validate([
        'template' => 'required|string|in:welcome,invoice,report',
    ]);

    // SAFE: Use Blade templates instead of dynamic code execution
    return view('templates.' . $validated['template']);
}
```

### Proper Fix (20 minutes)

**Replace variable functions with explicit dispatch:**

**Before (❌):**
```php
public function handle(Request $request)
{
    $action = $request->input('action');

    // VULNERABLE: Variable function - user controls which function runs
    $func = $action;
    $result = $func($request->input('data'));
}
```

**After (✅):**
```php
public function handle(Request $request)
{
    $validated = $request->validate([
        'action' => 'required|in:process,validate,transform',
        'data' => 'required|string',
    ]);

    // SAFE: Explicit match with whitelisted actions
    $result = match ($validated['action']) {
        'process' => $this->processData($validated['data']),
        'validate' => $this->validateData($validated['data']),
        'transform' => $this->transformData($validated['data']),
    };

    return response()->json(['result' => $result]);
}
```

**Replace `preg_replace()` /e with `preg_replace_callback()`:**

**Before (❌):**
```php
// VULNERABLE: /e modifier evaluates replacement as PHP code
$output = preg_replace('/\{(\w+)\}/e', '$this->resolve("$1")', $template);
```

**After (✅):**
```php
// SAFE: callback receives the match array, no code evaluation
$output = preg_replace_callback('/\{(\w+)\}/', function (array $m) {
    return $this->resolve($m[1]);
}, $template);
```

**Replace user-controlled `call_user_func()` with an allowlist:**

**Before (❌):**
```php
public function format(Request $request)
{
    // VULNERABLE: user controls which function executes
    $result = call_user_func($_GET['formatter'], $data);
}
```

**After (✅):**
```php
public function format(Request $request)
{
    $validated = $request->validate([
        'formatter' => 'required|in:html,json,plain',
    ]);

    // SAFE: explicit map — user can only pick from known safe callables
    $result = match ($validated['formatter']) {
        'html'  => $this->formatHtml($data),
        'json'  => $this->formatJson($data),
        'plain' => $this->formatPlain($data),
    };
}
```


## References

- [OWASP Code Injection](https://owasp.org/www-community/attacks/Code_Injection)
- [CWE-94: Improper Control of Generation of Code](https://cwe.mitre.org/data/definitions/94.html)
- [CWE-95: Eval Injection](https://cwe.mitre.org/data/definitions/95.html)
- [CWE-470: Use of Externally-Controlled Input to Select Classes or Code](https://cwe.mitre.org/data/definitions/470.html)
- [PHP Variable Functions](https://www.php.net/manual/en/functions.variable-functions.php)
- [OWASP Top 10 - Injection](https://owasp.org/www-project-top-ten/)

## Related Analyzers

- [Eval Usage Analyzer](/analyzers/security/eval) - Focused detection of dynamic code execution functions
- [Command Injection Analyzer](/analyzers/security/command-injection) - Detects shell command injection with escaping analysis
- [Object Injection Analyzer](/analyzers/security/object-injection) - Detects unsafe deserialization leading to code execution
- [SQL Injection Analyzer](/analyzers/security/sql-injection) - Detects SQL injection vulnerabilities
- [SSRF Analyzer](/analyzers/security/ssrf) - Detects server-side request forgery

---
