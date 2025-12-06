---
title: Dead Code Analyzer
description: Detect unreachable code, unused variables, and statements that have no effect using  static analysis
icon: code
outline: [2, 3]
---

# Dead Code Analyzer

| Analyzer ID | Category       | Severity | Time To Fix |
| ------------| :------------: |:--------:| -----------:|
| `dead-code` | ✅ Reliability | Medium   | 5 minutes   |

## What This Checks

- Runs  at level 5 on your `app/` directory to detect dead code
- Identifies unreachable statements (code after `return`, `throw`, or `exit`)
- Finds unused variables, parameters, and imports
- Detects expressions that don't modify state or return values
- Catches redundant conditions that always evaluate to the same value (e.g., `true && true`)
- Reports dead catch blocks for exceptions that can never be thrown
- Limits output to first 50 issues to prevent overwhelming reports
- Automatically skips when  is not installed

## Why It Matters

- **Code readability**: Dead code confuses developers trying to understand logic flow; removing it clarifies intent
- **Maintenance burden**: Unreachable code accumulates during refactoring and creates false signals when searching the codebase
- **Performance**: While PHP won't execute unreachable code, unused variable assignments waste memory and CPU cycles
- **Debugging**: Dead code can mislead developers into thinking certain paths are active when they're not
- **Code reviews**: Reviewers waste time analyzing code that never runs

## How to Fix

### Quick Fix (5 minutes)

1. Run  locally to see the specific issues:

```bash
vendor/bin/ analyse app --level=5
```

2. For each dead code issue, apply the appropriate fix:

**Unreachable statements** - Remove code after early returns:

```php
// Before - Code after return is unreachable
public function process(): string
{
    if ($this->isValid()) {
        return 'valid';
        $this->log('validated'); // ❌ Never executed
    }
    return 'invalid';
}

// After - Remove unreachable code
public function process(): string
{
    if ($this->isValid()) {
        return 'valid';
    }
    return 'invalid';
}
```

**Unused variables** - Remove or use the variable:

```php
// Before - Variable assigned but never used
public function calculate(): int
{
    $result = $this->compute(); // ❌ Never used
    return 100;
}

// After - Use the variable or remove it
public function calculate(): int
{
    return $this->compute();
}
```

**Statements with no effect** - Use the result or remove:

```php
// Before - Expression does nothing
public function validate(): bool
{
    $this->value + 10; // ❌ Result discarded
    return true;
}

// After - Use the result
public function validate(): bool
{
    $this->value = $this->value + 10;
    return true;
}
```

**Always-true conditions** - Simplify logic:

```php
// Before - Condition always true
if (true && $this->isActive()) {  // ❌ Left side always true
    return 'active';
}

// After - Simplified condition
if ($this->isActive()) {
    return 'active';
}
```

**Dead catch blocks** - Remove catches for impossible exceptions:

```php
// Before - Exception never thrown
try {
    return true;
} catch (\InvalidArgumentException $e) {  // ❌ Never thrown
    $this->logError($e);
}

// After - Remove dead catch
try {
    return true;
} catch (\RuntimeException $e) {  // Only catch what's actually thrown
    $this->logError($e);
}
```

### Proper Fix (30 minutes)

1. **Install  in your project** if not already present:

```bash
composer require --dev /
```

2. **Configure  baseline** for existing dead code you want to track separately:

```bash
vendor/bin/ analyse --generate-baseline
```

3. **Add  to CI/CD** to prevent new dead code:

```yaml
# .github/workflows/ci.yml
- name:  Static Analysis
  run: vendor/bin/ analyse --level=5 --no-progress
```

4. **Set up pre-commit hooks** to catch dead code before pushing:

```bash
# .git/hooks/pre-commit
#!/bin/bash
vendor/bin/ analyse app --level=5 --no-progress
```

5. **Refactor systematically**:
   - Start with unused variables (easiest to fix)
   - Move to unreachable statements (may reveal logic bugs)
   - Address redundant conditions (often indicates over-defensive coding)
   - Remove dead catches last (may require rethinking error handling)

## Common Mistakes to Avoid

- Removing "dead code" that's actually defensive programming for edge cases (verify with tests first)
- Deleting code that's temporarily disabled during debugging (use feature flags or comments instead)
- Ignoring  errors because "the code works fine" (dead code indicates logic problems)
- Keeping unused parameters "for consistency" across method signatures (use `@-ignore-line` if intentional)
- Adding variables just to silence  without using them meaningfully

## References

- [ Documentation](https://.org/user-guide/getting-started)
- [ Level Guide](https://.org/user-guide/rule-levels)
- [Dead Code Detection in Static Analysis](https://.org/blog/find-unused-code)

## Related Analyzers

- [Deprecated Code Analyzer](/analyzers/reliability/deprecated-code) - Detects usage of deprecated methods, classes, and functions
- [Invalid Function Calls Analyzer](/analyzers/reliability/invalid-function-calls) - Detects invalid function calls in application code
- [Undefined Variable Usage Analyzer](/analyzers/reliability/undefined-variable) - Detects references to undefined variables
- [Missing Return Statements Analyzer](/analyzers/reliability/missing-return-statement) - Detects missing return statements in methods and functions
