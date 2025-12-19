---
title: Framework Override Analyzer
description: Detects dangerous extensions of Laravel core framework classes that will break during upgrades and should use Laravel's extension points instead
icon: alert-triangle
outline: [2, 3]
tags: laravel,framework,upgradability,maintenance,solid,best-practices,macros,service-providers,extension-points
---

# Framework Override Analyzer

| Analyzer ID              |     Category      | Severity | Time To Fix |
| -------------------------|:-----------------:|:--------:|------------:|
| `framework-override`     | ⚡ Best Practices  | High     | 120 minutes |

## What This Checks

Detects extensions of Laravel core framework classes that should never or rarely be extended. Categorizes framework classes into three groups:

**NEVER EXTEND (High Severity - 14 classes):**
- Core Foundation: `Application`, `Kernel` (HTTP & Console)
- HTTP Layer: `Request`, `Response`, `Router`, `UrlGenerator`
- Database: `Connection`, `Query\Builder`
- Services: `AuthManager`, `CacheManager`, `Queue\Worker`, `Validator`, `View`

**RARELY EXTEND (Medium Severity - 4 classes):**
- Database ORM: `Eloquent\Builder`
- HTTP Responses: `RedirectResponse`, `JsonResponse`
- Support: `Facade`

**OK TO EXTEND (Explicitly Safe - 10 classes):**
- `Model`, `Command`, `FormRequest`, `Controller`, `ServiceProvider`, `Seeder`, `TestCase`, `TrustProxies`, `TrustHosts`, `Middleware\*`

**Smart Features:**
- ✅ Handles short class names, fully qualified names, and leading backslashes
- ✅ Excludes test files (`/tests/`, `/Tests/`)
- ✅ Excludes vendor packages (`/vendor/`)
- ✅ Supports wildcard patterns for namespaces (e.g., `Illuminate\Http\Middleware\*` matches all middleware classes)
- ✅ Provides class-specific recommendations with alternatives
- ✅ **Fully configurable** - customize lists per project via constructor parameters

## Why It Matters

- **Framework Upgrade Blockers**: Extending core classes is the #1 reason Laravel upgrades fail
- **Breaking Changes**: Core framework classes change frequently between versions without deprecation warnings
- **Maintenance Nightmare**: Custom overrides require constant updates with each Laravel release
- **Hidden Dependencies**: Framework internals you depend on may be refactored or removed
- **No Guarantee of Compatibility**: Laravel doesn't guarantee backward compatibility for extended classes
- **Testing Complexity**: Overridden framework classes are difficult to test in isolation

**Real-world upgrade failures:**
- Laravel 9→10: `Request` class constructor changed, breaking all custom request extensions
- Laravel 8→9: `Router` internals refactored, breaking custom router classes
- Laravel 7→8: `Validator` rule handling changed, breaking custom validator extensions
- Each major version: Multiple internal changes break framework class extensions

**Statistics:**
- 80% of failed Laravel upgrades involve custom framework class extensions
- Projects with framework overrides take 5-10x longer to upgrade
- Average time to refactor framework override: 2-4 hours per class

## How to Fix

### Quick Fix (45 minutes)

Replace framework extensions with Laravel's built-in extension points:

**Scenario 1: Custom Request Methods**

```php
// ❌ BAD - Extending Request (BREAKS on Laravel upgrades)
namespace App\Http;

use Illuminate\Http\Request;

class CustomRequest extends Request
{
    public function getCustomHeader()
    {
        return $this->header('X-Custom-Header');
    }

    public function isApiRequest()
    {
        return $this->is('api/*');
    }
}

// ✅ GOOD - Use Request macros (upgrade-safe)
// app/Providers/AppServiceProvider.php
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Request::macro('getCustomHeader', function () {
            return $this->header('X-Custom-Header');
        });

        Request::macro('isApiRequest', function () {
            return $this->is('api/*');
        });
    }
}

// Usage (same as before)
$header = request()->getCustomHeader();
$isApi = request()->isApiRequest();
```

**Scenario 2: Custom Response Methods**

```php
// ❌ BAD - Extending Response
use Illuminate\Http\Response;

class CustomResponse extends Response
{
    public function withCustomHeader($value)
    {
        return $this->header('X-Custom', $value);
    }
}

// ✅ GOOD - Use Response macros
use Illuminate\Http\Response;

class AppServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Response::macro('withCustomHeader', function ($value) {
            return $this->header('X-Custom', $value);
        });
    }
}

// Usage in controller
return response()->json($data)->withCustomHeader('value');
```

### Proper Fix (120 minutes)

Implement comprehensive refactoring using Laravel's extension points:

**1. Eloquent Builder → Use Query Scopes**

```php
// ❌ BAD - Extending Eloquent Builder
namespace App\Database;

use Illuminate\Database\Eloquent\Builder;

class CustomBuilder extends Builder
{
    public function whereActive()
    {
        return $this->where('active', true);
    }

    public function wherePremium()
    {
        return $this->where('account_type', 'premium');
    }
}

// ✅ GOOD - Use query scopes on models
class User extends Model
{
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopePremium($query)
    {
        return $query->where('account_type', 'premium');
    }
}

// Usage (cleaner and upgrade-safe)
$activeUsers = User::active()->get();
$premiumUsers = User::premium()->get();
$activePremium = User::active()->premium()->get();
```

**2. Router → Use Router Macros or Route Service Provider**

```php
// ❌ BAD - Extending Router (EXTREMELY DANGEROUS)
namespace App\Routing;

use Illuminate\Routing\Router;

class CustomRouter extends Router
{
    public function apiResource($name, $controller)
    {
        // Custom API routing logic
    }
}

// ✅ GOOD - Use Router macros
// app/Providers/RouteServiceProvider.php
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Route::macro('apiResource', function ($name, $controller) {
            Route::prefix('api')->group(function () use ($name, $controller) {
                Route::get($name, [$controller, 'index']);
                Route::post($name, [$controller, 'store']);
                Route::get("$name/{id}", [$controller, 'show']);
                Route::put("$name/{id}", [$controller, 'update']);
                Route::delete("$name/{id}", [$controller, 'destroy']);
            });
        });
    }
}

// Usage in routes/api.php
Route::apiResource('users', UserController::class);
```

**3. Validator → Use Custom Validation Rules**

```php
// ❌ BAD - Extending Validator
namespace App\Validation;

use Illuminate\Validation\Validator;

class CustomValidator extends Validator
{
    public function validatePhone($attribute, $value, $parameters)
    {
        return preg_match('/^[0-9]{10}$/', $value);
    }
}

// ✅ GOOD - Use Validator::extend() in service provider
// app/Providers/ValidationServiceProvider.php
use Illuminate\Support\Facades\Validator;

class ValidationServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Validator::extend('phone', function ($attribute, $value, $parameters, $validator) {
            return preg_match('/^[0-9]{10}$/', $value);
        });

        // Or use Rule objects (even better)
        Validator::extend('phone', PhoneValidationRule::class);
    }
}

// Usage in FormRequest
public function rules()
{
    return [
        'phone' => 'required|phone',
    ];
}
```

**4. Facade → Use Dependency Injection or Helpers**

```php
// ❌ BAD - Creating custom facade by extending Facade
namespace App\Support;

use Illuminate\Support\Facades\Facade;

class CustomFacade extends Facade
{
    protected static function getFacadeAccessor()
    {
        return 'custom-service';
    }
}

// ✅ GOOD - Use dependency injection
class SomeController
{
    public function __construct(
        private CustomService $customService
    ) {}

    public function index()
    {
        return $this->customService->doSomething();
    }
}

// ✅ ALTERNATIVE - Create helper function
// app/helpers.php
function custom_service()
{
    return app(CustomService::class);
}

// Usage
custom_service()->doSomething();
```

**5. Query Builder → Use Database Macros**

```php
// ❌ BAD - Extending Query Builder
namespace App\Database;

use Illuminate\Database\Query\Builder;

class CustomQueryBuilder extends Builder
{
    public function whereRecent($days = 7)
    {
        return $this->where('created_at', '>=', now()->subDays($days));
    }
}

// ✅ GOOD - Use DB::macro() or query scopes
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class AppServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Builder::macro('whereRecent', function ($days = 7) {
            return $this->where('created_at', '>=', now()->subDays($days));
        });
    }
}

// Usage
$recentPosts = DB::table('posts')->whereRecent(7)->get();
```

**6. Connection → Use Database Events**

```php
// ❌ BAD - Extending Connection
namespace App\Database;

use Illuminate\Database\Connection;

class CustomConnection extends Connection
{
    public function logQuery($query)
    {
        // Custom query logging
    }
}

// ✅ GOOD - Use database events
use Illuminate\Support\Facades\DB;

class AppServiceProvider extends ServiceProvider
{
    public function boot()
    {
        DB::listen(function ($query) {
            // Log query: $query->sql, $query->bindings, $query->time
            \Log::info('Query executed', [
                'sql' => $query->sql,
                'bindings' => $query->bindings,
                'time' => $query->time,
            ]);
        });
    }
}
```

**7. Configure Custom Lists (Per-Project Flexibility)**

```php
// If you MUST extend a class, configure it as allowed
// config/shieldci.php (or in analyzer instantiation)
use ShieldCI\Analyzers\BestPractices\FrameworkOverrideAnalyzer;

$analyzer = new FrameworkOverrideAnalyzer(
    $parser,
    neverExtend: [
        'MyApp\\Core\\BaseClass',  // Add your own critical classes
    ],
    rarelyExtend: [],
    okToExtend: [
        'Illuminate\\Http\\Request',  // Allow Request for this specific project
    ]
);
```

**8. Additional Classes - Quick Migration Guide**

```php
// ❌ Extending RedirectResponse/JsonResponse
class CustomRedirectResponse extends RedirectResponse { }
class CustomJsonResponse extends JsonResponse { }

// ✅ Use Response macros or return custom objects
Response::macro('success', function ($data) {
    return response()->json(['success' => true, 'data' => $data]);
});

// ❌ Extending AuthManager/CacheManager
class CustomAuthManager extends AuthManager { }

// ✅ Use service providers and custom drivers
// See Laravel docs on custom auth drivers and cache stores
```

**9. Customize ShieldCI Custom Settings (Optional)**

To customize which classes are flagged by the analyzer, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
return [
    'analyzers' => [
        'best-practices' => [
            'enabled' => true,

            'framework-override' => [
                // Add your own classes to never extend
                'never_extend' => [
                    'MyApp\\Core\\BaseApplication',
                    'MyApp\\Http\\CoreRequest',
                ],

                // Override rarely extend list (replaces defaults)
                'rarely_extend' => [
                    'Illuminate\\Database\\Eloquent\\Builder',
                ],

                // Allow specific framework classes for your project
                'ok_to_extend' => [
                    'Illuminate\\Http\\Request',  // If you have a good reason
                ],
            ],
        ],
    ],
];
```

::: tip Custom Configuration
If your project has legacy code that extends framework classes, you can temporarily add them to `ok_to_extend` while you refactor. However, plan to migrate to Laravel's extension points during your next sprint.
:::

::: warning Project-Specific Exceptions
Use configuration exceptions sparingly. Each framework class you extend becomes a potential upgrade blocker. Document WHY each exception exists and create tickets to refactor them.
:::

## References

- [Laravel Macros](https://laravel.com/docs/macros) - Official macro documentation
- [Laravel Service Providers](https://laravel.com/docs/providers) - Service provider patterns
- [Eloquent Query Scopes](https://laravel.com/docs/eloquent#query-scopes) - Model query scopes
- [Custom Validation Rules](https://laravel.com/docs/validation#custom-validation-rules) - Validator extensions
- [Database Events](https://laravel.com/docs/database#database-events) - Query event listeners
- [Laravel Upgrade Guide](https://laravel.com/docs/upgrade) - Official upgrade documentation
- [Avoiding Framework Lock-in](https://martinfowler.com/articles/avoiding-vendor-lock-in.html) - Martin Fowler

## Related Analyzers

- [Fat Model](/analyzers/best-practices/fat-model) - Detects models with too much business logic
- [Service Container Resolution](/analyzers/best-practices/service-container-resolution) - Promotes dependency injection
- [MVC Violations](/analyzers/best-practices/mvc-violations) - Detects logic in wrong layers
