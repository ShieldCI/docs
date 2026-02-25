---
title: Test Quality Analyzer
description: Checks test files for quality issues like missing assertions, empty test methods, and poor test practices
icon: code
outline: [2, 3]
tags: code-quality,testing,assertions,test-quality,best-practices
pro: true
---

# Test Quality Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `test-quality` | 💻 Code Quality  | Medium    | 15 minutes   |

## What This Checks

Validates test files for quality issues that reduce their effectiveness. Supports both PHPUnit class-based tests and Pest PHP function-based tests.

**PHPUnit:**
- Test classes with no test methods
- Empty test methods (no body)
- Test methods with no assertions
- Test methods that only assert `assertTrue(true)` (placeholder tests)
- Excessively long test methods that should be split
- `test_` prefix, `@test` annotation, and `#[Test]` attribute (PHPUnit 10+)
- All calling styles: `$this->`, `self::`, and `static::`

**Pest PHP:**
- Empty test closures
- `it()`/`test()` calls without assertions
- `expect()` chains recognized as valid assertions
- `->skip()` chained tests correctly ignored
- `describe()` block nesting supported

## Why It Matters

- **False Confidence:** Tests without assertions pass but verify nothing, giving a false sense of security
- **Wasted CI Time:** Empty or placeholder tests consume CI resources without providing value
- **Maintainability:** Long test methods are harder to understand and maintain
- **Bug Detection:** Only tests with meaningful assertions catch regressions

## How to Fix

### Quick Fix (5 minutes)

Replace placeholder assertions with meaningful ones:

**Before (❌):**
```php
public function test_user_can_register(): void
{
    $this->assertTrue(true);
}
```

**After (✅):**
```php
public function test_user_can_register(): void
{
    $response = $this->postJson('/api/register', [
        'name' => 'John',
        'email' => 'john@example.com',
        'password' => 'password123',
    ]);

    $response->assertCreated();
    $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
}
```

### Pest PHP

**Before (❌):**
```php
it('registers a user', function () {
    $this->postJson('/api/register', [
        'name' => 'John',
        'email' => 'john@example.com',
        'password' => 'password123',
    ]);
});
```

**After (✅):**
```php
it('registers a user', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'John',
        'email' => 'john@example.com',
        'password' => 'password123',
    ]);

    $response->assertCreated();
    expect(User::where('email', 'john@example.com')->exists())->toBeTrue();
});
```

### Proper Fix (15 minutes)

**1. Add assertions to all test methods:**

```php
public function test_order_total_is_calculated_correctly(): void
{
    $order = Order::factory()->create();
    $order->items()->createMany([
        ['price' => 1000, 'quantity' => 2],
        ['price' => 500, 'quantity' => 1],
    ]);

    $this->assertEquals(2500, $order->calculateTotal());
}
```

**2. Split long test methods:**

```php
// Instead of one 50-line test, break into focused tests
public function test_validates_required_fields(): void { /* ... */ }
public function test_validates_email_format(): void { /* ... */ }
public function test_creates_user_on_success(): void { /* ... */ }
public function test_sends_welcome_email(): void { /* ... */ }
```

**3. Remove or implement empty test classes:**

```bash
# Find empty test classes
grep -rn "class.*Test.*{" tests/ | while read line; do
    # Check if it has any test methods
done
```

## References

- [PHPUnit Assertions](https://docs.phpunit.de/en/11.0/assertions.html)
- [Pest PHP Expectations](https://pestphp.com/docs/expectations)
- [Laravel Testing Documentation](https://laravel.com/docs/testing)
- [Testing Best Practices](https://laravel.com/docs/testing#introduction)

## Related Analyzers

- [Test Coverage](/analyzers/code-quality/test-coverage) - Checks that critical modules have test files
- [Test Data Management](/analyzers/code-quality/test-data-management) - Validates test data practices
- [Method Length](/analyzers/code-quality/method-length) - Flags methods exceeding recommended length
