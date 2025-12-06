---
title: Foreach Iterable Analyzer
description: Detects invalid foreach usage with non-iterable values using PHPStan static analysis to prevent runtime errors
icon: repeat
outline: [2, 3]
---

# Foreach Iterable Analyzer

| Analyzer ID               | Category       | Severity | Time To Fix |
| --------------------------| :------------: |:--------:| -----------:|
| `foreach-iterable`        | ✅ Reliability | High     | 10 minutes  |

## What This Checks

- Detects foreach loops attempting to iterate over non-iterable values (strings, integers, null, booleans, objects)
- Identifies type mismatches where variables are not arrays, Traversable, or Iterator
- Catches cases where return types don't specify iterable but are used in foreach
- Uses PHPStan static analysis to detect issues before runtime
- Reports exact file location and line number of each issue
- Validates foreach with both simple and keyed iterations
- Checks nested foreach loops and conditional iterations
- Provides pattern-specific recommendations based on the error type

## Why It Matters

- **Runtime crashes**: Attempting to iterate over non-iterable values causes fatal errors: `Warning: Invalid argument supplied for foreach()`
- **Production outages**: These errors can crash your application in production, causing downtime and data loss
- **Difficult debugging**: Foreach errors on dynamic data are hard to reproduce in development but appear in production with real data
- **Type safety violations**: Missing type hints allow non-iterable values to reach foreach loops silently
- **Data processing failures**: ETL pipelines and batch jobs fail silently when processing unexpected data types
- **API integration issues**: External API responses with unexpected formats crash foreach loops processing results
- **User-generated content**: Processing user uploads or inputs without validation can trigger foreach errors
- **Database result handling**: Assuming query results are always iterable can fail with empty or malformed responses

## How to Fix

### Quick Fix (5 minutes)

If you have a specific foreach error:

```php
// ❌ Before: Will crash if $items is not iterable
$items = getItems();
foreach ($items as $item) {
    processItem($item);
}

// ✅ After: Add type check
$items = getItems();
if (is_iterable($items)) {
    foreach ($items as $item) {
        processItem($item);
    }
}
```

### Proper Fix (10 minutes)

#### Fix #1: Add Type Hints

```php
// ❌ Before: No type hint, PHPStan can't verify
function getItems() {
    return fetchFromApi();
}

foreach (getItems() as $item) {
    echo $item;
}

// ✅ After: Add array type hint
function getItems(): array {
    return fetchFromApi() ?? [];
}

foreach (getItems() as $item) {
    echo $item;
}
```

#### Fix #2: Use Guard Clauses

```php
// ❌ Before: Assumes $data is always iterable
public function processData($data): void
{
    foreach ($data as $row) {
        $this->process($row);
    }
}

// ✅ After: Validate before iterating
public function processData($data): void
{
    if (!is_array($data) && !$data instanceof \Traversable) {
        throw new \InvalidArgumentException('Data must be iterable');
    }

    foreach ($data as $row) {
        $this->process($row);
    }
}
```

#### Fix #3: Fix Function Return Types

```php
// ❌ Before: Returns string on error
public function getUserIds(): array|string
{
    if ($this->hasError()) {
        return "Error occurred";
    }
    return [1, 2, 3];
}

// ✅ After: Always return array
public function getUserIds(): array
{
    if ($this->hasError()) {
        return [];  // Return empty array instead of string
    }
    return [1, 2, 3];
}
```

#### Fix #4: Use Null Coalescing

```php
// ❌ Before: Can be null
public function getResults(): ?array
{
    return $this->results;
}

foreach (getResults() as $result) {  // Error if null
    echo $result;
}

// ✅ After: Provide default
foreach (getResults() ?? [] as $result) {
    echo $result;
}
```

## PHPStan Integration

This analyzer uses PHPStan Level 5 (included with ShieldCI) to detect foreach issues:

```bash
# Run ShieldCI analysis
php artisan shield:analyze --analyzer=foreach-iterable

# Or run all reliability analyzers
php artisan shield:analyze --category=reliability
```

### PHPStan Configuration

PHPStan is included as a required dependency in ShieldCI. If you want to run PHPStan directly:

```bash
# Check for foreach iterable issues
vendor/bin/phpstan analyse app --level=5
```

## Related Analyzers

- [Undefined Variable Usage Analyzer](/analyzers/reliability/undefined-variable) - Detects references to undefined variables
- [Invalid Method Calls Analyzer](/analyzers/reliability/invalid-method-calls) - Detects invalid method calls
- [Invalid Function Calls Analyzer](/analyzers/reliability/invalid-function-calls) - Detects invalid function calls
- [Missing Return Statements Analyzer](/analyzers/reliability/missing-return-statement) - Detects missing return statements

## References

- [PHP foreach Documentation](https://www.php.net/manual/en/control-structures.foreach.php)
- [PHP Iterator Interface](https://www.php.net/manual/en/class.iterator.php)
- [PHP Traversable Interface](https://www.php.net/manual/en/class.traversable.php)
- [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)
- [Laravel Collections](https://laravel.com/docs/collections)
- [PHP Generators](https://www.php.net/manual/en/language.generators.overview.php)
