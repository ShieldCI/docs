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

Validates test files for quality issues that reduce their effectiveness. Supports PHPUnit class-based tests, Pest PHP function-based tests, and the full range of Laravel assertion styles.

**PHPUnit:**
- Test classes with no test methods
- Empty test methods (no body)
- Test methods with no assertions
- Test methods that only assert `assertTrue(true)` (placeholder tests)
- Test methods exceeding 80 lines (configurable)
- `test_` prefix, `@test` annotation, and `#[Test]` attribute (PHPUnit 10+)

**Pest PHP:**
- Empty test closures
- `it()`/`test()` calls without assertions
- `->skip()` and `->todo()` chained tests correctly ignored
- `describe()` block nesting supported

**Recognized assertion styles (PHPUnit and Pest):**
- Direct PHPUnit: `$this->assert*()`, `self::assert*()`, `static::assert*()`
- Pest expectations: `expect()->toBe()`, `expect()->toBeTrue()`, etc.
- HTTP response assertions: `$response->assertOk()`, `$response->assertStatus()`, `$response->assertInertia()`, etc.
- Chained HTTP assertions: `$this->get('/')->assertOk()`, `$this->postJson(...)->assertStatus(422)`
- Static facade assertions: `Http::assertSent()`, `Mail::assertNothingSent()`, `Queue::assertPushed()`, `Event::assertDispatched()`, etc.
- Mockery expectations: `$mock->shouldReceive()`, `Log::shouldReceive()`, `$spy->shouldHaveReceived()`

::: tip Assertion Detection Scope
The analyzer checks assertions within each test method body. Assertions delegated entirely to private helper methods (with no direct assertion in the test itself) are not detected. If you centralise assertions in helpers, ensure each test method also has at least one direct assertion call.
:::

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

**Pest PHP**

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

**2. Use facade assertions for side effects:**

```php
public function test_welcome_email_sent_after_registration(): void
{
    Mail::fake();

    $this->postJson('/api/register', ['email' => 'john@example.com', ...]);

    Mail::assertSent(WelcomeMail::class, fn ($mail) => $mail->hasTo('john@example.com'));
}
```

**3. Use Mockery to assert on logged warnings or service calls:**

```php
it('logs a warning when the payment gateway fails', function () {
    Log::shouldReceive('warning')
        ->once()
        ->with('Payment failed', Mockery::subset(['order_id' => 42]));

    (new ProcessPayment(42))->handle();
});
```

**4. Split long test methods:**

```php
// Instead of one 50-line test, break into focused tests
public function test_validates_required_fields(): void { /* ... */ }
public function test_validates_email_format(): void { /* ... */ }
public function test_creates_user_on_success(): void { /* ... */ }
public function test_sends_welcome_email(): void { /* ... */ }
```

## ShieldCI Configuration

To customize the test method length threshold, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'code-quality' => [
        'enabled' => true,
        
        'test-quality' => [
            'max_method_lines' => 80,  // Default: 80. Increase for data-heavy integration tests.
        ],
    ],
],
```

::: tip When to Change the Threshold
The default of 80 lines suits most unit and feature tests. Integration tests or tests with large inline fixtures may legitimately exceed this. Raise the threshold rather than splitting tests that lose clarity when broken apart.
:::

## References

- [PHPUnit Assertions](https://docs.phpunit.de/en/11.0/assertions.html)
- [Pest PHP Expectations](https://pestphp.com/docs/expectations)
- [Laravel HTTP Tests](https://laravel.com/docs/testing#testing-json-apis)
- [Laravel Fake Facades](https://laravel.com/docs/mocking)
- [Mockery Documentation](https://docs.mockery.io/en/latest/)

## Related Analyzers

- [Test Coverage](/analyzers/code-quality/test-coverage) - Checks that critical modules have test files
- [Test Data Management](/analyzers/code-quality/test-data-management) - Validates test data practices
- [Method Length](/analyzers/code-quality/method-length) - Flags methods exceeding recommended length
