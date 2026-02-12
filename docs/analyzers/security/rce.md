---
title: Remote Code Execution (RCE) Analyzer
description: Detects remote code execution vulnerabilities including dangerous system calls, variable functions, and unsafe code patterns
icon: terminal
outline: [2, 3]
tags: rce,remote-code-execution,security,code-execution
pro: true
---

# Remote Code Execution (RCE) Analyzer

| Analyzer ID | Category     | Severity   | Time To Fix  |
| ----------- | :----------: |:----------:| ------------:|
| `rce`       | 🛡️ Security  | Critical   | 20 minutes   |

## What This Checks

This analyzer detects Remote Code Execution (RCE) vulnerabilities by identifying dangerous function calls and code patterns that allow attackers to run arbitrary code on the server.

**Detected Vulnerable Patterns:**

#### Code Execution Functions (3)
- `eval()` - Runs a string as PHP code (language construct, detected via AST `Eval_` node)
- `assert()` - Can run code when passed a string argument
- `create_function()` - Deprecated function that internally uses dynamic evaluation

#### System Command Functions (6)
- `system()` - Runs command and displays output
- `exec()` - Runs command and returns last line of output
- `passthru()` - Runs command and passes raw output
- `shell_exec()` - Runs command via shell and returns complete output
- `proc_open()` - Runs a command with full I/O control
- `popen()` - Opens a process file pointer

#### Variable Functions (1)
- **Variable function calls** - `$func()` where the function name is stored in a variable (potential RCE if user-controlled)

**Severity Classification:**
- **Critical** - Any dangerous function called with user input (`$_GET`, `$_POST`, `$_REQUEST`, `$_COOKIE`, `request()`, `$request->`)
- **High** - Any use of dangerous functions without detected user input (still a risk if data flows from untrusted sources)

::: tip AST-Based Analysis
This analyzer uses PHP-Parser AST analysis for precise detection. It distinguishes between language constructs and regular function calls, recursively traces user input through expressions, and detects variable function patterns like `$func()`.
:::

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

**Before:**
```php
public function executeTemplate(Request $request)
{
    $code = $request->input('template');

    // VULNERABLE: dynamic code execution with user input - Critical RCE
    // Do not pass user input to functions that run arbitrary code
}
```

**After:**
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

**Replace system command execution with PHP native functions:**

**Before:**
```php
public function convertImage(Request $request)
{
    $file = $request->input('file');

    // VULNERABLE: system() with user input
    system("convert {$file} output.png");
}
```

**After:**
```php
use Intervention\Image\Facades\Image;

public function convertImage(Request $request)
{
    $validated = $request->validate([
        'file' => 'required|file|image|max:10240',
    ]);

    // SAFE: Use a PHP image library instead of shell commands
    $image = Image::make($validated['file']);
    $image->save(storage_path('app/output.png'));

    return response()->json(['status' => 'converted']);
}
```

**Replace variable functions with explicit dispatch:**

**Before:**
```php
public function handle(Request $request)
{
    $action = $request->input('action');

    // VULNERABLE: Variable function - user controls which function runs
    $func = $action;
    $result = $func($request->input('data'));
}
```

**After:**
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

**If shell commands are unavoidable, use Symfony Process with array arguments:**

**Before:**
```php
use Symfony\Component\Process\Process;

public function runCommand(Request $request)
{
    $arg = $request->input('argument');

    // VULNERABLE: String interpolation in shell command
    $process = Process::fromShellCommandline("ffmpeg -i {$arg} output.mp4");
    $process->run();
}
```

**After:**
```php
use Symfony\Component\Process\Process;

public function runCommand(Request $request)
{
    $validated = $request->validate([
        'argument' => 'required|string|regex:/^[a-zA-Z0-9_\-\.]+$/',
    ]);

    // SAFE: Array arguments prevent shell interpretation
    $process = new Process([
        'ffmpeg',
        '-i',
        storage_path('app/uploads/' . $validated['argument']),
        storage_path('app/output/output.mp4'),
    ]);

    $process->setTimeout(120);
    $process->run();

    if (!$process->isSuccessful()) {
        throw new \RuntimeException('Conversion failed: ' . $process->getErrorOutput());
    }

    return response()->json(['status' => 'success']);
}
```


## References

- [OWASP Code Injection](https://owasp.org/www-community/attacks/Code_Injection)
- [CWE-94: Improper Control of Generation of Code](https://cwe.mitre.org/data/definitions/94.html)
- [CWE-78: OS Command Injection](https://cwe.mitre.org/data/definitions/78.html)
- [CWE-95: Eval Injection](https://cwe.mitre.org/data/definitions/95.html)
- [PHP Variable Functions](https://www.php.net/manual/en/functions.variable-functions.php)
- [Symfony Process Component](https://symfony.com/doc/current/components/process.html)
- [OWASP Top 10 - Injection](https://owasp.org/www-project-top-ten/)

## Related Analyzers

- [Eval Usage Analyzer](/analyzers/security/eval) - Focused detection of dynamic code execution functions
- [Command Injection Analyzer](/analyzers/security/command-injection) - Detects shell command injection with escaping analysis
- [Object Injection Analyzer](/analyzers/security/object-injection) - Detects unsafe deserialization leading to code execution
- [SQL Injection Analyzer](/analyzers/security/sql-injection) - Detects SQL injection vulnerabilities
- [SSRF Analyzer](/analyzers/security/ssrf) - Detects server-side request forgery

---
