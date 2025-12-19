---
title: Service Container Resolution Analyzer
description: Detects manual service container resolution (Service Locator anti-pattern) and recommends constructor dependency injection for improved testability and maintainability.
icon: shield-alert
outline: [2, 3]
tags: dependency-injection,architecture,testability,laravel,ioc,service-locator
---

# Service Container Resolution Analyzer

| Analyzer ID                    |      Category      | Severity | Time To Fix |
|--------------------------------|:------------------:|:--------:|------------:|
| `service-container-resolution` | ⚡ Best Practices   |  Medium  |  25 minutes |

Detects manual service container resolution (Service Locator anti-pattern) and recommends constructor dependency injection for improved testability and maintainability.

## What This Checks

The Service Container Resolution Analyzer identifies usage of `app()`, `resolve()`, `App::make()`, and `Container::getInstance()` in application code where constructor dependency injection should be used instead. It detects manual container resolution patterns that hide dependencies and make code harder to test.

**Detected Patterns:**
- `app(OrderRepository::class)` - Shorthand resolution
- `app()->make()`, `app()->makeWith()`, `app()->get()` - Direct container methods
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

**Example Problem:**

**Before (❌):**
```php
class OrderProcessor
{
    public function process($orderId)
    {
        // Hidden dependencies - you must read implementation to know what's needed
        $repository = app(OrderRepository::class);
        $payment = resolve(PaymentGateway::class);
        $mailer = App::make('mailer');

        $order = $repository->find($orderId);
        $result = $payment->charge($order);
        $mailer->send(new OrderConfirmation($order));

        return $result;
    }
}

// Testing is difficult - how do you inject mocks?
$processor = new OrderProcessor(); // No way to inject dependencies!
```

**After (✅):**
```php
class OrderProcessor
{
    public function __construct(
        private OrderRepository $repository,
        private PaymentGateway $payment,
        private Mailer $mailer
    ) {}

    public function process($orderId)
    {
        $order = $this->repository->find($orderId);
        $result = $this->payment->charge($order);
        $this->mailer->send(new OrderConfirmation($order));

        return $result;
    }
}

// Testing is easy with explicit dependencies
$mockPayment = Mockery::mock(PaymentGateway::class);
$processor = new OrderProcessor($repository, $mockPayment, $mailer);
```

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

**Steps:**
1. Add constructor with type-hinted dependencies
2. Store dependencies as private properties (PHP 8.0+) or assign in constructor
3. Replace `app()` calls with `$this->dependency`
4. Laravel automatically resolves constructor dependencies

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

**Steps:**
1. Identify all `app()`, `resolve()`, and `App::make()` calls
2. Create constructor with all dependencies as type-hinted parameters
3. Store dependencies as private properties
4. Replace all manual resolution with property access
5. Consider using interfaces instead of concrete classes for flexibility
6. Update tests to inject mocks/stubs

**Whitelist to reduce false positives:**

For legitimate cases where you need to whitelist, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'best-practices' => [
        'enabled' => true,

        'service-container-resolution' => [
            // Directories to skip
            'whitelist_dirs' => [
                'tests',                // Tests legitimately resolve services
                'database/migrations',  // Migrations don't support constructor DI
                'database/seeders',     // Seeders need to resolve factories
                'database/factories',   // Factories may resolve services
            ],

            // Class patterns to skip (wildcards supported)
            'whitelist_classes' => [
                '*Command',            // Artisan commands
                '*Seeder',            // Database seeders
                'DatabaseSeeder',     // Main seeder
            ],

            // Methods to skip (environment checks are OK)
            'whitelist_methods' => [
                'environment',        // app()->environment()
                'isLocal',           // app()->isLocal()
                'isProduction',      // app()->isProduction()
                'runningInConsole',  // app()->runningInConsole()
                'runningUnitTests',  // app()->runningUnitTests()
            ],
        ],
    ],
],
```

## References

- [Laravel Dependency Injection](https://laravel.com/docs/10.x/container#dependency-injection) - Official Laravel documentation on DI
- [Service Container](https://laravel.com/docs/10.x/container) - Understanding Laravel's IoC container
- [Service Locator is an Anti-Pattern](https://blog.ploeh.dk/2010/02/03/ServiceLocatorisanAnti-Pattern/) - Martin Fowler's explanation
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID) - Object-oriented design principles
- [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle) - The "D" in SOLID
- [Testing with Mocks](https://laravel.com/docs/10.x/mocking) - Laravel testing documentation

---

## Related Analyzers

- **[Helper Function Abuse](/analyzers/best-practices/helper-function-abuse)** - Detects overuse of global helper functions
- **[Logic in Routes](/analyzers/best-practices/logic-in-routes)** - Detects business logic in route files that should be in controllers
- **[Fat Model](/analyzers/best-practices/fat-model)** - Detects models with too many responsibilities
