---
title: Todo Comment Analyzer
description: Finds TODO/FIXME/HACK comments that should be addressed or tracked in issue tracker
icon: code
outline: [2, 3]
tags: maintainability,code-quality,technical-debt,comments
---

# Todo Comment Analyzer

| Analyzer ID     | Category         | Severity | Time To Fix |
| ----------------| :--------------: |:--------:| -----------:|
| `todo-comment`  | ✅ Code Quality  | Low      | 5 minutes   |

## What This Checks

- Detects TODO comments (planned work that needs to be done)
- Identifies FIXME comments (code that needs to be fixed)
- Flags HACK comments (temporary workarounds that should be refactored)
- Detects XXX comments (warnings or important notes)
- Catches BUG comments (known bugs that need attention)
- Case-insensitive matching
- Reports exact file location and line number of each issue

## Why It Matters

- **Technical debt**: TODO comments accumulate and create maintenance burden
- **Code quality**: Comments indicate incomplete or problematic code
- **Team communication**: TODOs should be tracked in issue trackers, not code
- **Code review**: Reviewers need to know about temporary workarounds
- **Documentation**: Important notes should be in proper documentation
- **Project management**: TODOs in code are hard to track and prioritize
- **Code clarity**: Comments clutter code and reduce readability
- **Accountability**: TODOs without owners or deadlines are rarely addressed

## How to Fix

### Proper Fix (5 minutes)

#### Fix #1: Create Issue and Link

```php
// ❌ Before: Vague TODO
// TODO: Optimize this query

// ✅ After: Link to issue tracker
// See issue #456: Optimize user query performance
// Or remove if already fixed
```

#### Fix #2: Remove Completed TODOs

```php
// ❌ Before: Old TODO that's already done
// TODO: Add error handling
try {
    // Error handling already added
} catch (Exception $e) {
    // Handle error
}

// ✅ After: Remove completed TODO
try {
    // Process
} catch (Exception $e) {
    // Handle error
}
```

#### Fix #3: Replace HACK with Proper Solution

```php
// ❌ Before: HACK comment
// HACK: Temporary workaround for API limitation
$result = $this->processData($data);
$result = array_merge($result, ['hack' => true]);

// ✅ After: Proper solution or documented workaround
// Workaround for API limitation (see issue #789)
// TODO: Remove when API v2 is available
$result = $this->processData($data);
$result = $this->applyApiWorkaround($result);

private function applyApiWorkaround(array $data): array
{
    // Documented workaround logic
    return array_merge($data, ['api_version' => 'v1']);
}
```

#### Fix #4: Convert FIXME to Proper Error Handling

```php
// ❌ Before: FIXME comment
// FIXME: This should handle null values
public function processUser(?User $user)
{
    return $user->name; // May throw error if null
}

// ✅ After: Proper null handling
public function processUser(?User $user): ?string
{
    if ($user === null) {
        return null;
    }
    
    return $user->name;
}
```

#### Fix #5: Document XXX Comments Properly

```php
// ❌ Before: XXX comment
// XXX: This is a performance bottleneck
public function slowMethod()
{
    // Slow code
}

// ✅ After: Proper documentation or fix
/**
 * Performance note: This method processes large datasets.
 * Consider caching results for frequently accessed data.
 * See performance analysis: docs/performance.md#slow-method
 */
public function slowMethod()
{
    // Documented slow code
}
```

#### Fix #6: Convert BUG to Issue Tracker

```php
// ❌ Before: BUG comment
// BUG: This doesn't handle edge case when user is null
public function calculateTotal(User $user)
{
    return $user->orders->sum('total');
}

// ✅ After: Fix the bug or create issue
// Fixed in PR #234 - Added null check
public function calculateTotal(?User $user): float
{
    if ($user === null) {
        return 0.0;
    }
    
    return $user->orders->sum('total');
}
```

## References

- [Technical Debt Management](https://martinfowler.com/bliki/TechnicalDebt.html)
- [GitHub Issues Best Practices](https://guides.github.com/features/issues/)
- [PSR-12 Coding Standard](https://www.php-fig.org/psr/psr-12/)

## Related Analyzers

- [Commented Code Analyzer](/analyzers/code-quality/commented-code) - Detects commented-out code
- [Missing DocBlock Analyzer](/analyzers/code-quality/missing-docblock) - Ensures proper documentation
- [Method Length Analyzer](/analyzers/code-quality/method-length) - Detects methods that are too long
- [Naming Convention Analyzer](/analyzers/code-quality/naming-convention) - Validates naming standards

