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

- Hardcoded model creation instead of using factories (requires 2 or more hardcoded string field values)
- Missing database cleanup traits (`RefreshDatabase`, `DatabaseMigrations`, `DatabaseTransactions`)
- Raw SQL used in test files for data setup (`DB::insert()`, `DB::statement()`, `DB::unprepared()`, `DB::table()->insert()`)
- Large factory sequences (count > 50) that may slow tests - both `->count(N)` and `Model::factory(N)` syntax
- Seeder usage in tests via `$this->seed()` or `Artisan::call('db:seed')`

**Framework Support**

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

**Before (❌):**
```php
$user = User::create([
    'name' => 'Test User',
    'email' => 'test@example.com',
    'password' => bcrypt('password'),
]);
```

**After (✅):**
```php
$user = User::factory()->create();
```

### Proper Fix (15 minutes)

**1. Add database cleanup trait:**

::: code-group

```php [PHPUnit - RefreshDatabase]
use Illuminate\Foundation\Testing\RefreshDatabase;

class OrderTest extends TestCase
{
    use RefreshDatabase; // Rolls back and re-migrates after each test

    public function test_order_can_be_placed(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 1999]);

        // Test logic...
    }
}
```

```php [PHPUnit - DatabaseTransactions]
use Illuminate\Foundation\Testing\DatabaseTransactions;

class OrderTest extends TestCase
{
    use DatabaseTransactions; // Wraps each test in a transaction and rolls back

    public function test_order_can_be_placed(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 1999]);

        // Test logic...
    }
}
```

```php [PHPUnit - DatabaseMigrations]
use Illuminate\Foundation\Testing\DatabaseMigrations;

class OrderTest extends TestCase
{
    use DatabaseMigrations; // Runs fresh migrations before each test

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

**Before (❌):**
```php
DB::insert('INSERT INTO users (name, email) VALUES (?, ?)', ['Test', 'test@test.com']);
```

**After (✅):**
```php
User::factory()->create(['name' => 'Test', 'email' => 'test@test.com']);
```

**3. Remove seeder dependencies:**

**Before (❌):**
```php
public function setUp(): void
{
    parent::setUp();
    $this->seed(RolesSeeder::class);
    // Also flagged: Artisan::call('db:seed', ['--class' => 'RolesSeeder']);
}
```

**After (✅):**
```php
public function test_admin_can_access_dashboard(): void
{
    $role = Role::factory()->create(['name' => 'admin']);
    $user = User::factory()->create()->assignRole($role);

    // Test logic...
}
```

**4. Customize ShieldCI Settings (Optional)**

The factory sequence threshold is configurable. To customize it, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'code-quality' => [
        'enabled' => true,
    
        'test-data-management' => [
            'factory_count_threshold' => 50, // Default: flag sequences with count > 50
        ],
    ],
],
```

::: tip When to Change the Threshold
The default of 50 works well for most projects. You may want to increase it if your integration test suite legitimately creates larger datasets (e.g. pagination tests that need > 50 rows). Keep in mind that large factory sequences slow your CI, so consider whether the test truly needs that many records.
:::

## References

- [Laravel Database Testing](https://laravel.com/docs/database-testing)
- [Laravel Model Factories](https://laravel.com/docs/eloquent-factories)
- [Pest PHP Documentation](https://pestphp.com/docs/configuring-tests)
- [PHPUnit Data Providers](https://docs.phpunit.de/en/11.0/writing-tests-for-phpunit.html#data-providers)

## Related Analyzers

- [Test Coverage](/analyzers/code-quality/test-coverage) - Checks that critical modules have test files
- [Test Quality](/analyzers/code-quality/test-quality) - Checks test files for quality issues
- [Missing Transactions](/analyzers/best-practices/missing-database-transactions) - Detects missing transaction protection
