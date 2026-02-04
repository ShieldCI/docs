---
title: Dead Route Analyzer
description: Detects routes pointing to non-existent or invalid controllers and actions
icon: link-2
outline: [2, 3]
tags: routes,dead-code,controllers,reliability
---

# Dead Route Analyzer

| Analyzer ID    | Category       | Severity | Time To Fix |
| ---------------| :------------: |:--------:| -----------:|
| `dead-routes`  | ✅ Reliability |   High   | 10 minutes  |

## What This Checks

- Validates that every registered route points to an existing controller class
- Ensures referenced controller methods exist and are public
- Detects routes with invalid HTTP verbs (outside GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS)
- Checks invokable controllers have a valid `__invoke` method
- Validates route model binding types exist (type-hinted classes in method parameters)
- Identifies routes with empty or invalid action configurations
- Skips closure-based routes (always valid by definition)
- Reports specific error details for each dead route found

## Why It Matters

- **500 errors in production**: Dead routes cause immediate HTTP 500 errors when users visit them, leading to a poor user experience and potential data loss
- **Broken refactoring**: Renaming or moving controllers without updating routes leaves behind dead routes that compile fine but fail at runtime
- **False API documentation**: Dead routes appear in route lists and auto-generated API docs, misleading developers and consumers
- **Security surface**: Dead routes that reference missing controllers may bypass middleware expectations, creating unexpected behavior
- **Technical debt**: Accumulated dead routes make the route file harder to maintain and increase confusion during onboarding
- **Deployment failures**: Dead routes may not be caught by tests if the route is rarely visited, causing production-only failures

## How to Fix

### Quick Fix

Identify and remove or fix dead routes:

```bash
# List all registered routes to spot issues
php artisan route:list
```

```php
// ❌ Before: Route pointing to non-existent controller
Route::get('/users', [UserController::class, 'index']);
// UserController class does not exist or was renamed

// ✅ After: Fix the controller reference
use App\Http\Controllers\UserController;
Route::get('/users', [UserController::class, 'index']);
```

```php
// ❌ Before: Route referencing non-existent method
Route::get('/reports', [ReportController::class, 'generate']);
// 'generate' method does not exist in ReportController

// ✅ After: Use the correct method name
Route::get('/reports', [ReportController::class, 'index']);
```

### Proper Fix

#### 1: Fix non-public method references

```php
// ❌ Before: Method is private/protected
class OrderController extends Controller
{
    private function show(Order $order)
    {
        return view('orders.show', compact('order'));
    }
}

// ✅ After: Method is public
class OrderController extends Controller
{
    public function show(Order $order)
    {
        return view('orders.show', compact('order'));
    }
}
```

#### 2: Fix invokable controllers

```php
// ❌ Before: Missing __invoke method
class ProcessPaymentController extends Controller
{
    public function handle()
    {
        // ...
    }
}

Route::post('/payments', ProcessPaymentController::class);

// ✅ After: Implement __invoke
class ProcessPaymentController extends Controller
{
    public function __invoke()
    {
        // ...
    }
}
```

#### 3: Fix route model binding types

```php
// ❌ Before: Type-hinted class does not exist
public function show(NonExistentModel $model)
{
    // ...
}

// ✅ After: Use a valid model class
use App\Models\Product;

public function show(Product $product)
{
    return view('products.show', compact('product'));
}
```

#### 4: Clean up stale routes after refactoring

```php
// ❌ Before: Old route file with references to deleted controllers
Route::resource('legacy-items', 'LegacyItemController');

// ✅ After: Remove dead routes or redirect to new endpoints
Route::redirect('/legacy-items', '/items', 301);
Route::resource('items', ItemController::class);
```

#### 5: Add route tests to prevent future dead routes

```php
// tests/Feature/RouteTest.php
public function test_all_routes_are_reachable(): void
{
    $routes = Route::getRoutes();

    foreach ($routes as $route) {
        if ($route->getActionName() === 'Closure') {
            continue;
        }

        $action = $route->getAction();
        $uses = $action['uses'] ?? null;

        if (is_string($uses) && str_contains($uses, '@')) {
            [$controller, $method] = explode('@', $uses);
            $this->assertTrue(
                class_exists($controller),
                "Controller {$controller} does not exist for route {$route->uri()}"
            );
            $this->assertTrue(
                method_exists($controller, $method),
                "Method {$method} does not exist in {$controller}"
            );
        }
    }
}
```


## References

- [Laravel Routing Documentation](https://laravel.com/docs/routing)
- [Laravel Controllers](https://laravel.com/docs/controllers)
- [Route Model Binding](https://laravel.com/docs/routing#route-model-binding)
- [Resource Controllers](https://laravel.com/docs/controllers#resource-controllers)

## Related Analyzers

- [Up-to-Date Migrations Analyzer](/analyzers/reliability/up-to-date-migrations) - Ensures all database migrations are up to date
- [Composer Validation Analyzer](/analyzers/reliability/composer-validation) - Validates composer.json structure and dependencies
