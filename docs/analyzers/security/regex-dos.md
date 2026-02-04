---
title: Regular Expression DoS Analyzer
description: Detects regular expressions vulnerable to catastrophic backtracking (ReDoS)
icon: clock
outline: [2, 3]
tags: regex,redos,denial-of-service,security,performance
---

# Regular Expression DoS Analyzer

| Analyzer ID | Category      | Severity | Time To Fix |
| ----------- | :-----------: | :------: | ----------: |
| `regex-dos` | 🛡️ Security  | Medium   | 15 minutes  |

## What This Checks

This analyzer detects Regular Expression Denial of Service (ReDoS) vulnerabilities by scanning PHP files for regex patterns that are susceptible to catastrophic backtracking:

- **Nested quantifiers** - Patterns like `(a+)+`, `(a*)*`, or `(a+){2,}` that cause exponential backtracking
- **Overlapping alternatives** - Patterns like `(a|ab)*` where alternatives share common prefixes
- **Dangerous `.* `repetitions** - Patterns like `(.*)*`, `(.*)+ `, or `.*.*` that match everything multiple times
- **Multiple consecutive quantifiers** - Patterns like `**`, `*+`, `+*`, or `++`
- **Greedy/lazy conflicts** - Patterns combining greedy and lazy quantifiers like `*?+`
- **Laravel validation regex** - Checks `'regex:/pattern/'` validation rules for vulnerable patterns
- **User input escalation** - Flags higher severity (High) when vulnerable regex is used with user input (`$request->`, `$_GET`, `$_POST`)

The analyzer extracts regex patterns from `preg_match()`, `preg_match_all()`, `preg_replace()`, `Str::match()`, and `Str::matchAll()` calls.

::: tip Safe Patterns Recognized
The analyzer skips patterns that use safe constructs:
- **Atomic grouping** `(?>...)` - prevents backtracking
- **Possessive quantifiers** `*+`, `++` - greedy without backtracking
:::

## Why It Matters

ReDoS occurs when specially crafted input causes a regular expression engine to enter catastrophic backtracking, consuming exponentially increasing CPU time:

- **Application freeze** - A single malicious input can freeze the application for seconds or minutes
- **CPU exhaustion** - All available CPU resources are consumed by regex evaluation
- **Denial of service** - Legitimate users cannot access the application while it processes the malicious input
- **Resource starvation** - Other processes on the same server are starved of resources
- **Easy to exploit** - Attackers only need to submit a specially crafted string to any input validated by the vulnerable regex

A pattern like `(a+)+` matching against the string `aaaaaaaaaaaaaaaaaaaX` can take seconds to evaluate despite being only 20 characters long.

## How to Fix

### Quick Fix

Simplify nested quantifiers and overlapping alternatives:

**Before (❌):**
```php
// Vulnerable: nested quantifiers - (a+)+ causes catastrophic backtracking
$pattern = '/^([a-zA-Z0-9]+)*@[a-zA-Z0-9]+\.[a-zA-Z]+$/';
if (preg_match($pattern, $request->input('email'))) {
    // validate email
}

// Vulnerable: overlapping alternatives
$pattern = '/^(http|https|http:\/\/)+/';
preg_match($pattern, $userInput);
```

**After (✅):**
```php
// Safe: simple character class without nested quantifiers
$pattern = '/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/';
if (preg_match($pattern, $request->input('email'))) {
    // validate email
}

// Safe: non-overlapping alternatives
$pattern = '/^https?:\/\//';
preg_match($pattern, $userInput);
```

### Proper Fix

Use possessive quantifiers, atomic grouping, or avoid regex altogether:

**Before (❌):**
```php
// Vulnerable: (.*) with repetition
$pattern = '/<([a-z]+)*>/';
preg_match($pattern, $request->input('html'));

// Vulnerable validation regex
$rules = [
    'code' => 'regex:/^([A-Z]+)*-[0-9]+$/',
];
```

**After (✅):**
```php
// Safe: use possessive quantifier (++) to prevent backtracking
$pattern = '/<([a-z]++)*>/';
preg_match($pattern, $request->input('html'));

// Safe: use atomic grouping to prevent backtracking
$pattern = '/<(?>([a-z]+))*>/';
preg_match($pattern, $request->input('html'));

// Safe: simplified validation regex without nested quantifiers
$rules = [
    'code' => 'regex:/^[A-Z]+-[0-9]+$/',
];
```

**Best Practice - Validate input length first:**
```php
// Limit input length before regex to mitigate ReDoS impact
$input = $request->input('pattern');

if (strlen($input) > 1000) {
    return response('Input too long', 422);
}

// Now regex is bounded by input length
preg_match('/^[a-zA-Z0-9]+$/', $input);
```

**Best Practice - Use built-in Laravel validation:**
```php
// Instead of custom regex, use built-in rules where possible
$rules = [
    'email' => 'email:rfc,dns',          // instead of custom email regex
    'url'   => 'url',                     // instead of custom URL regex
    'code'  => 'alpha_dash|max:50',       // instead of regex pattern
    'phone' => 'digits_between:10,15',    // instead of phone regex
];
```


## References

- [OWASP ReDoS](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)
- [CWE-1333: Inefficient Regular Expression Complexity](https://cwe.mitre.org/data/definitions/1333.html)
- [PHP PCRE Patterns](https://www.php.net/manual/en/reference.pcre.pattern.syntax.php)
- [Regex101 - Test and debug regex](https://regex101.com/)

## Related Analyzers

- [SQL Injection Analyzer](/analyzers/security/sql-injection) - Detects SQL injection from user input
- [Command Injection Analyzer](/analyzers/security/command-injection) - Detects OS command injection vulnerabilities
- [XSS Vulnerabilities Analyzer](/analyzers/security/xss-vulnerabilities) - Detects cross-site scripting vulnerabilities

---
