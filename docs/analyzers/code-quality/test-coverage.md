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

Validates that critical application modules have corresponding test files. Recursively scans four key directories and checks each PHP class against your `tests/` directory:

- Missing `tests/` directory entirely
- Models (`app/Models`) without matching test files
- Controllers (`app/Http/Controllers`) without matching test files, including nested subdirectories like `Api/`
- Services (`app/Services`) without matching test files
- Policies (`app/Policies`) without matching test files

**Automatically skipped:** Abstract/Base-prefixed classes, traits, enums, and interfaces are excluded from the count since they typically don't need dedicated tests.

**Flexible test matching:** Test files don't need to match exactly — `UserModelTest.php` and `ManagePostControllerTest.php` will match `User.php` and `PostController.php` respectively (PascalCase boundary matching).

**Per-directory breakdown:** Results include a per-layer summary so you can see exactly which areas need attention:

> 2 of 4 critical files have tests (50% coverage). Models: 1/2, Controllers: 1/1, Services: 0/1

### Coverage Thresholds

| Coverage | Result | Issue Severity |
|----------|--------|---------------|
| >= 75% | Pass | — |
| 25–74% | Warning | Low |
| < 25% | Warning | Medium |

## Why It Matters

- **Reliability Risk:** Medium - Untested code is more likely to contain bugs that reach production
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
class UserTest extends TestCase
{
    public function test_user_has_orders_relationship(): void
    {
        $user = User::factory()->create();

        $this->assertInstanceOf(HasMany::class, $user->orders());
    }
}
```

**3. Run coverage report:**

```bash
php artisan test --coverage --min=80
```

## References

- [Laravel Testing Documentation](https://laravel.com/docs/testing)
- [PHPUnit Documentation](https://docs.phpunit.de/)
- [Laravel Testing Best Practices](https://laravel.com/docs/testing#introduction)

## Related Analyzers

- [Test Quality](/analyzers/code-quality/test-quality) - Checks test files for quality issues
- [Test Data Management](/analyzers/code-quality/test-data-management) - Validates test data practices
- [Missing Error Tracking](/analyzers/best-practices/missing-error-tracking) - Detects missing error tracking
