---
title: Test Coverage Analyzer
description: Checks that critical application modules have corresponding test files for adequate code coverage
icon: code
outline: [2, 3]
tags: code-quality,testing,coverage,tests,best-practices
pro: true
---

# Test Coverage Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `test-coverage` | 💻 Code Quality  | Medium    | 30 minutes   |

## What This Checks

Validates that critical application modules have test coverage — using a PHPUnit/Pest coverage report when one is available, and otherwise checking each PHP class in four key directories against your `tests/` directory:

- Missing `tests/` directory entirely
- Models (`app/Models`) without test coverage
- Controllers (`app/Http/Controllers`) without test coverage, including nested subdirectories like `Api/`
- Services (`app/Services`) without test coverage
- Policies (`app/Policies`) without test coverage

**Flexible test matching:** Test files don't need to exactly mirror the class name. PascalCase boundary matching handles all common Laravel naming conventions:

| Pattern | Test file | Matches class |
|---|---|---|
| Exact | `UserTest.php` | `User.php` |
| Suffix | `ManagePostControllerTest.php` | `PostController.php` |
| Prefix | `UserModelTest.php` | `User.php` |
| Reverse prefix | `EmailVerificationTest.php` | `EmailVerificationPromptController.php` |

The reverse-prefix rule accommodates Laravel Breeze's convention of naming tests after features rather than individual controller classes.

**Per-directory breakdown:** Results include a per-layer summary so you can see exactly which areas need attention:

> 2 of 4 critical modules have a dedicated test file (50%). Models: 1/2, Controllers: 1/1, Services: 0/1

**Coverage Thresholds**

| Coverage | Result | Issue Severity |
|----------|--------|---------------|
| >= 75% | Pass | - |
| 25–74% | Warning | Low |
| < 25% | Warning | Medium |

## Why It Matters

- **Unreliable Deployments:** Untested code is more likely to contain bugs that reach production
- **Regression Prevention:** Without tests, code changes can break existing functionality silently
- **Confidence in Deployments:** Adequate test coverage enables faster, safer deployments
- **Code Documentation:** Tests serve as living documentation of expected behavior

## How to Fix

### Quick Fix (5 minutes)

Create your first test:

```bash
# Generate a test for a specific feature
php artisan make:test UserRegistrationTest

# Generate a unit test
php artisan make:test Models/UserTest --unit
```

### Proper Fix (30 minutes)

**1. Ensure critical modules have test coverage:**

```php
// tests/Feature/Http/Controllers/UserControllerTest.php
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_users(): void
    {
        User::factory()->count(3)->create();

        $response = $this->getJson('/api/users');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }
}
```

**2. Add model tests:**

```php
// tests/Unit/Models/UserTest.php
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserTest extends TestCase
{
    public function test_user_has_orders_relationship(): void
    {
        $user = User::factory()->create();

        $this->assertInstanceOf(HasMany::class, $user->orders());
    }
}
```

**3. Generate a coverage report for ShieldCI to read:**

```bash
php artisan test --coverage-clover coverage.xml
```

## ShieldCI Configuration

The coverage report path and per-file threshold are configurable. To customize them, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'code-quality' => [
        'enabled' => true,

        'test-coverage' => [
            'clover_path' => 'build/reports/clover.xml', // Default: auto-discovered
            'min_file_coverage' => 80, // Default: 0 — flag critical classes below this line coverage
        ],
    ],
],
```

::: tip Coverage Report Discovery
When `clover_path` is unset, ShieldCI auto-discovers the report at `coverage.xml`, `clover.xml`, `build/logs/clover.xml`, `coverage/clover.xml`, or `build/coverage/clover.xml`. Generate one with `php artisan test --coverage-clover coverage.xml`.
:::

## References

- [Laravel Testing Documentation](https://laravel.com/docs/testing)
- [PHPUnit Documentation](https://docs.phpunit.de/)
- [Pest PHP Testing Framework](https://pestphp.com/docs/writing-tests)

## Related Analyzers

- [Test Quality](/analyzers/code-quality/test-quality) - Checks test files for quality issues
- [Test Data Management](/analyzers/code-quality/test-data-management) - Validates test data practices
- [Missing Error Tracking](/analyzers/best-practices/missing-error-tracking) - Detects missing error tracking
