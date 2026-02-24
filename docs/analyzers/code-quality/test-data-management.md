---
title: Test Data Management Analyzer
description: Checks test files for proper test data management practices including factory usage and database cleanup
icon: code
outline: [2, 3]
tags: code-quality,testing,factories,data-management,best-practices
pro: true
---

# Test Data Management Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `test-data-management` | 💻 Code Quality  | Low    | 15 minutes   |

## What This Checks

Validates that test files follow proper data management practices. Works with **PHPUnit**, **Pest PHP**, and **PHPUnit 10 attributes**. Checks for:

- Hardcoded model creation instead of using factories
- Missing database cleanup traits (`RefreshDatabase`, `DatabaseMigrations`, `DatabaseTransactions`)
- Raw SQL used in test files for data setup
- Large factory sequences (count > 50) that may slow tests
- Seeder usage in tests that couples tests to seeder state

### Framework Support

| Framework | Detection Method |
|-----------|-----------------|
| PHPUnit (class-based) | `extends TestCase`, `function test_` prefix |
| PHPUnit 10+ | `#[Test]` attribute |
| Pest PHP | `it()`, `test()`, `describe()` functions |

The analyzer also checks `tests/TestCase.php` and `tests/Pest.php` for globally applied database traits, so individual test files don't need to redeclare them.

## Why It Matters

- **Test Isolation:** Without proper cleanup, tests can affect each other through shared database state
- **Maintainability:** Hardcoded test data is fragile and must be updated when schemas change
- **Performance:** Large factory sequences slow down test suites unnecessarily
- **Reliability:** Seeder-dependent tests break when seeders change

## How to Fix

### Quick Fix (5 minutes)

Use factories instead of hardcoded data:

**Before:**
```php
$user = User::create([
    'name' => 'Test User',
    'email' => 'test@example.com',
    'password' => bcrypt('password'),
]);
```

**After:**
```php
$user = User::factory()->create();
```

### Proper Fix (15 minutes)

**1. Add database cleanup trait:**

::: code-group

```php [PHPUnit]
use Illuminate\Foundation\Testing\RefreshDatabase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_can_be_placed(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 1999]);

        // Test logic...
    }
}
```

```php [Pest (per-file)]
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can place an order', function () {
    $user = User::factory()->create();
    $product = Product::factory()->create(['price' => 1999]);

    // Test logic...
});
```

```php [Pest (global via tests/Pest.php)]
// tests/Pest.php
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class)->in('Feature');
```

:::

**2. Replace raw SQL with Eloquent/factories:**

**Before:**
```php
DB::insert('INSERT INTO users (name, email) VALUES (?, ?)', ['Test', 'test@test.com']);
```

**After:**
```php
User::factory()->create(['name' => 'Test', 'email' => 'test@test.com']);
```

**3. Remove seeder dependencies:**

**Before:**
```php
public function setUp(): void
{
    parent::setUp();
    $this->seed(RolesSeeder::class);
}
```

**After:**
```php
public function test_admin_can_access_dashboard(): void
{
    $role = Role::factory()->create(['name' => 'admin']);
    $user = User::factory()->create()->assignRole($role);

    // Test logic...
}
```

### Dynamic Generators (Not Flagged)

The analyzer recognizes these as dynamic data and will **not** flag `Model::create()` calls that use them:

- `fake()` / `fake()->` (Laravel 9+ helper)
- `$this->faker` (WithFaker trait)
- `$faker->` (manual Faker variable)
- `Faker\Factory::create()` (pre-Laravel 9)
- `Str::random()`, `Uuid::`, `Carbon::`, `now()`
- `factory()` (legacy factory helper)

## References

- [Laravel Database Testing](https://laravel.com/docs/database-testing)
- [Laravel Model Factories](https://laravel.com/docs/eloquent-factories)
- [Pest PHP Documentation](https://pestphp.com/docs/configuring-tests)
- [PHPUnit Data Providers](https://docs.phpunit.de/en/11.0/writing-tests-for-phpunit.html#data-providers)

## Related Analyzers

- [Test Coverage](/analyzers/code-quality/test-coverage) - Checks that critical modules have test files
- [Test Quality](/analyzers/code-quality/test-quality) - Checks test files for quality issues
- [Missing Transactions](/analyzers/best-practices/missing-database-transactions) - Detects missing transaction protection
