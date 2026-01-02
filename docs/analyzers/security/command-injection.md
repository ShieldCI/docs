---
title: Command Injection Analyzer
description: Detects command injection vulnerabilities where user input is passed to shell execution functions without proper escaping, preventing remote code execution attacks
icon: terminal
outline: [2, 3]
tags: command-injection,rce,shell,exec,security,remote-code-execution
---

# Command Injection Analyzer

| Analyzer ID         | Category     | Severity   | Time To Fix  |
| ------------------- | :----------: |:----------:| ------------:|
| `command-injection` | 🛡️ Security  | High       | 5 minutes    |

## What This Checks

This analyzer detects command injection vulnerabilities in your Laravel application by identifying unsafe shell execution patterns where user input can be exploited to execute arbitrary system commands.

**Detected Vulnerable Patterns:**

#### Shell Execution Functions (7)
- `system()` - Executes command and outputs result
- `exec()` - Executes command and returns last line
- `passthru()` - Executes command and passes output directly
- `shell_exec()` - Executes command via shell and returns output
- `popen()` - Opens a process file pointer
- `proc_open()` - Executes command with full I/O control
- `pcntl_exec()` - Replaces current process with command

#### Shell Operators (1)
- **Backtick operator** (\`cmd\`) - Executes shell command (often overlooked!)

#### Process Classes (1)
- **Symfony Process** - Laravel's wrapper for shell commands


::: tip What's NOT Flagged
The analyzer correctly recognizes these as **safe**:
- Static string literals: `system('php artisan config:cache')`
- Properly escaped input: `system(escapeshellarg($request->input('file')))`
- All arguments escaped: `$file = escapeshellarg($input); system($file);`
- No user input: `exec('composer dump-autoload')`
:::

## Why It Matters

Command injection is a critical security vulnerability (OWASP Top 10) that allows attackers to execute arbitrary operating system commands on your server, leading to:

- **Remote Code Execution (RCE)** - Complete server compromise
- **Data Exfiltration** - Stealing sensitive files, databases, environment variables
- **System Manipulation** - Creating backdoors, deleting files, installing malware
- **Lateral Movement** - Using compromised server to attack other systems
- **Denial of Service** - Crashing services or consuming resources

A single command injection vulnerability can give attackers complete control of your server, making it one of the most dangerous security issues.

## How to Fix

### Quick Fix (5 minutes)

Use `escapeshellarg()` or `escapeshellcmd()` to escape user input:

**Before (❌):**
```php
public function processFile(Request $request)
{
    $filename = $request->input('file');

    // VULNERABLE: User input passed directly to shell
    system("cat {$filename}");
}
```

**After (✅):**
```php
public function processFile(Request $request)
{
    $filename = $request->input('file');

    // SAFE: User input properly escaped
    $escaped = escapeshellarg($filename);
    system("cat {$escaped}");
}
```

### Proper Fix (15 minutes)

**Avoid shell execution entirely** - Use PHP native functions:

**Before (❌):**
```php
public function listFiles(Request $request)
{
    $directory = $request->input('dir');

    // VULNERABLE: Using shell to list files
    $output = shell_exec("ls -la {$directory}");
    return response()->json(['files' => $output]);
}
```

**After (✅):**
```php
public function listFiles(Request $request)
{
    $directory = $request->input('dir');

    // SAFE: Using PHP native functions
    $validated = realpath($directory);

    if (!$validated || !is_dir($validated)) {
        abort(400, 'Invalid directory');
    }

    $files = scandir($validated);
    return response()->json(['files' => $files]);
}
```

**Best Practice for Process Execution (✅✅):**

When shell execution is unavoidable, use Symfony Process with array arguments:

**Before (❌):**
```php
use Symfony\Component\Process\Process;

public function deploy(Request $request)
{
    $branch = $request->input('branch');

    // VULNERABLE: String command with interpolation
    $process = Process::fromShellCommandline("git pull origin {$branch}");
    $process->run();
}
```

**After (✅):**
```php
use Symfony\Component\Process\Process;

public function deploy(Request $request)
{
    // Validate input first
    $validated = $request->validate([
        'branch' => 'required|alpha_dash|max:50',
    ]);

    // SAFE: Array arguments prevent shell interpretation
    $process = new Process([
        'git',
        'pull',
        'origin',
        $validated['branch']
    ]);

    $process->run();

    if (!$process->isSuccessful()) {
        throw new ProcessFailedException($process);
    }
}
```

## References

- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [CWE-77: Command Injection](https://cwe.mitre.org/data/definitions/77.html)
- [CWE-78: OS Command Injection](https://cwe.mitre.org/data/definitions/78.html)
- [PHP escapeshellarg Documentation](https://www.php.net/manual/en/function.escapeshellarg.php)
- [PHP escapeshellcmd Documentation](https://www.php.net/manual/en/function.escapeshellcmd.php)
- [Symfony Process Component](https://symfony.com/doc/current/components/process.html)
- [OWASP Top 10 - Injection](https://owasp.org/www-project-top-ten/)

## Related Analyzers

- [SQL Injection Analyzer](/analyzers/security/sql-injection) - Detects SQL injection vulnerabilities
- [XSS Vulnerabilities Analyzer](/analyzers/security/xss-vulnerabilities) - Detects cross-site scripting
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Debug mode can leak command execution details
- [File Permissions Analyzer](/analyzers/security/file-permissions) - Ensures proper file permissions
- [CSRF Protection Analyzer](/analyzers/security/csrf-protection) - Protects against CSRF attacks

---
