---
title: Service Container Resolution Analyzer
description: Detects manual service container resolution (Service Locator anti-pattern) and recommends constructor dependency injection for testability and maintainability
icon: shield-alert
outline: [2, 3]
tags: dependency-injection,architecture,testability,laravel,ioc,service-locator
---

# Service Container Resolution Analyzer

| Analyzer ID                    |      Category      | Severity | Time To Fix |
|--------------------------------|:------------------:|:--------:|------------:|
| `service-container-resolution` | 🏅 Best Practices   |  Medium  |  25 minutes |

## What This Checks

The Service Container Resolution Analyzer identifies usage of `app()`, `resolve()`, `App::make()`, and `Container::getInstance()` in application code where constructor dependency injection should be used instead. It detects manual container resolution patterns that hide dependencies and make code harder to test.

**Detected Patterns:**
- `app(OrderRepository::class)` - Shorthand resolution
- `app()->make()`, `app()->makeWith()` - Direct container methods
- `resolve(PaymentGateway::class)` - Global resolve helper
- `App::make()`, `App::makeWith()` - Static facade calls
- `Container::getInstance()->make()` - Container singleton access
- `app()->bind()`, `app()->singleton()` outside service providers - Binding in wrong location

## Why It Matters

Manual container resolution is a recognized anti-pattern that creates several problems:

1. **Hidden Dependencies** - Class dependencies are not visible in the constructor signature, making it unclear what a class needs to function
2. **Difficult Testing** - Cannot easily inject mocks or stubs for testing since dependencies are resolved internally
3. **Tight Coupling** - Creates direct dependency on Laravel's container, making code less portable
4. **Violation of SOLID** - Breaks the Dependency Inversion Principle by depending on concrete implementations

## How to Fix

### Quick Fix (~5 minutes per class)

For simple cases with few dependencies, refactor to use constructor injection:

**Before (❌):**
```php
class UserController extends Controller
{
    public function index()
    {
        $repository = app(UserRepository::class);
        return $repository->all();
    }
}
```

**After (✅):**
```php
class UserController extends Controller
{
    public function __construct(
        private UserRepository $repository
    ) {}

    public function index()
    {
        return $this->repository->all();
    }
}
```

### Proper Fix (~25 minutes per class)

For complex classes with multiple dependencies, properly refactor to follow SOLID principles:

**Before (❌):**
```php
class OrderService
{
    public function create(array $data)
    {
        $validator = app(OrderValidator::class);
        $repository = resolve(OrderRepository::class);
        $mailer = App::make('mailer');
        $logger = app(LoggerInterface::class);

        $validator->validate($data);
        $order = $repository->create($data);
        $mailer->send(new OrderCreated($order));
        $logger->info('Order created', ['id' => $order->id]);

        return $order;
    }
}
```

**After (✅):**
```php
class OrderService
{
    public function __construct(
        private OrderValidator $validator,
        private OrderRepository $repository,
        private Mailer $mailer,
        private LoggerInterface $logger
    ) {}

    public function create(array $data)
    {
        $this->validator->validate($data);
        $order = $this->repository->create($data);
        $this->mailer->send(new OrderCreated($order));
        $this->logger->info('Order created', ['id' => $order->id]);

        return $order;
    }
}
```

## ShieldCI Configuration

This analyzer runs in all environments. To customize which directories and classes to skip, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'best-practices' => [
        'enabled' => true,

        'service-container-resolution' => [
            // Directories to skip entirely
            'whitelist_dirs' => [
                'tests',                // Tests legitimately resolve services
                'database/migrations',  // Migrations don't support constructor DI
                'database/seeders',     // Seeders need to resolve factories
                'database/factories',   // Factories may resolve services
                'routes',               // Route files use closures without DI support
            ],

            // Class name patterns to skip (wildcards supported)
            'whitelist_classes' => [
                '*Command',     // Artisan commands
                '*Seeder',      // Database seeders
                'DatabaseSeeder',
                '*Job',         // Queued jobs
                '*Listener',    // Event listeners
                '*Middleware',  // HTTP middleware
                '*Observer',    // Model observers
                '*Factory',     // Model factories
                '*Handler',     // Various handler classes
            ],

            // app() methods to skip (environment checks, container inspection)
            'whitelist_methods' => [
                'environment',        // app()->environment()
                'isLocal',            // app()->isLocal()
                'isProduction',       // app()->isProduction()
                'runningInConsole',   // app()->runningInConsole()
                'runningUnitTests',   // app()->runningUnitTests()
                'bound',              // app()->bound()
                'has',                // app()->has()
                'call',               // app()->call() - method injection
            ],

            // Service aliases that are legitimate to resolve by string
            'whitelist_services' => [
                'config', 'request', 'log', 'cache', 'session',
                'view', 'validator', 'translator', 'events',
                'router', 'db', 'auth', 'hash', 'url',
            ],

            // Detect PSR-11 ->get() calls (default: false)
            'detect_psr_get' => false,

            // Detect manual instantiation of service-like classes (default: false)
            'detect_manual_instantiation' => false,

            // Class patterns to flag for manual instantiation
            'manual_instantiation_patterns' => [
                '*Service',
                '*Repository',
                '*Handler',
            ],

            // Exclusions for manual instantiation (DTOs, value objects, etc.)
            'manual_instantiation_exclude_patterns' => [
                '*DTO',
                '*Data',
                '*ValueObject',
                '*Request',
                '*Response',
                '*Entity',
                '*Model',
            ],
        ],
    ],
],
```

## References

- [Laravel Dependency Injection](https://laravel.com/docs/container#dependency-injection) - Official Laravel documentation on DI
- [Service Container](https://laravel.com/docs/container) - Understanding Laravel's IoC container
- [Service Locator is an Anti-Pattern](https://blog.ploeh.dk/2010/02/03/ServiceLocatorisanAnti-Pattern/) - Martin Fowler's explanation
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID) - Object-oriented design principles
- [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle) - The "D" in SOLID
- [Testing with Mocks](https://laravel.com/docs/mocking) - Laravel testing documentation

---

## Related Analyzers

- **[Helper Function Abuse](/analyzers/best-practices/helper-function-abuse)** - Detects overuse of global helper functions
- **[Logic in Routes](/analyzers/best-practices/logic-in-routes)** - Detects business logic in route files that should be in controllers
- **[Fat Model](/analyzers/best-practices/fat-model)** - Detects models with too many responsibilities
