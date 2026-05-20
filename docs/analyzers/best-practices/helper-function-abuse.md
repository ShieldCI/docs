---
title: Helper Function Abuse Analyzer
description: Detects excessive use of Laravel helper functions that hide dependencies and make unit testing difficult
icon: sparkles
outline: [2, 3]
tags: laravel,testability,dependency-injection,best-practices,helpers,code-quality,solid
---

# Helper Function Abuse Analyzer

| Analyzer ID                 | Category           | Severity | Time To Fix |
| ----------------------------| :----------------: |:--------:| -----------:|
| `helper-function-abuse`     | 🏅 Best Practices  |   Low    | 25 minutes  |

## What This Checks

Detects excessive use of Laravel helper functions that hide dependencies and violate SOLID principles. Tracks:

- **Dependency-hiding helper calls**: Counts calls to helpers that create implicit dependencies like `auth()`, `request()`, `cache()`, `config()`, `session()`, etc.
- **Threshold violations**: Flags classes exceeding the configured threshold (default: 5 helpers)
- **Severity escalation**: Low severity for moderate violations, Medium for 10+ over threshold, High for 20+ over threshold
- **Per-helper tracking**: Shows which specific helpers are used and how many times

**Tracked Helpers** (23 dependency-hiding helpers):

`app`, `auth`, `cache`, `config`, `cookie`, `event`, `logger`, `old`, `redirect`, `request`, `response`, `session`, `storage_path`, `view`, `abort`, `abort_if`, `abort_unless`, `dispatch`, `info`, `policy`, `resolve`, `validator`, `report`

**Not Tracked** (intentionally excluded):

- **URL helpers**: `route`, `url` - stateless URL-generation utilities that don't hide testable dependencies
- **Utility helpers**: `collect`, `tap`, `value`, `optional`, `now`, `today`, `retry`, `throw_if`, `throw_unless` - pure utilities that don't hide dependencies
- **Debug helpers**: `dd`, `dump` - handled by [Debug Mode Analyzer](/analyzers/security/debug-mode)
- **Low priority**: `bcrypt` - simple utility, rarely abused

## Why It Matters

- **Hidden Dependencies**: Helper functions hide what a class actually depends on, making dependencies invisible
- **Testing Difficulty**: Impossible to mock or stub helper functions, making unit testing extremely difficult
- **Violates SOLID**: Breaks Dependency Inversion Principle by depending on global functions instead of abstractions
- **Maintenance Burden**: Difficult to track what services a class uses when they're hidden behind helpers
- **Coupling**: Creates tight coupling to Laravel's global scope instead of explicit dependencies
- **Refactoring Resistance**: Hard to refactor when dependencies aren't explicit in constructors

**Real-world impact:**
- Services with 10+ helper calls become untestable without full application bootstrap
- Repositories using helpers can't be instantiated independently for unit testing
- Code reviews miss dependency violations because helpers hide them
- Refactoring becomes risky without comprehensive integration tests

## How to Fix

### Quick Fix (10 minutes)

**Scenario 1: Inject Common Dependencies**

```php
// ❌ BAD - Helper abuse (6 helpers)
class UserController
{
    public function update($id)
    {
        $user = auth()->user();
        $data = request()->validate([...]);

        cache()->forget("user.{$id}");
        event(new UserUpdated($user));
        session()->flash('success', 'Updated!');

        return redirect()->back();
    }
}

// ✅ GOOD - Dependency injection
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class UserController
{
    public function update(Request $request, $id)
    {
        $user = Auth::user();  // Or inject AuthManager
        $data = $request->validate([...]);

        Cache::forget("user.{$id}");
        event(new UserUpdated($user));

        return redirect()->back()
            ->with('success', 'Updated!');
    }
}
```

**Scenario 2: Use Facades for Global Services**

```php
// ❌ BAD - Helper functions everywhere
class ReportGenerator
{
    public function generate()
    {
        $data = cache()->remember('report', 3600, function() {
            return $this->getData();
        });

        logger()->info('Report generated');

        return $data;
    }
}

// ✅ GOOD - Use Facades (still testable via fake())
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ReportGenerator
{
    public function generate()
    {
        $data = Cache::remember('report', 3600, function() {
            return $this->getData();
        });

        Log::info('Report generated');

        return $data;
    }
}
```

### Proper Fix (25 minutes)

Implement comprehensive dependency injection across your application:

**1. Constructor Injection for Core Dependencies**

```php
// ❌ BAD - Heavy helper usage
class OrderService
{
    public function process($order)
    {
        $user = auth()->user();

        if (!$user->can('process', $order)) {
            abort(403);
        }

        cache()->put("order.{$order->id}", $order, 3600);
        event(new OrderProcessed($order));
        logger()->info("Order {$order->id} processed");

        return response()->json($order);
    }
}

// ✅ GOOD - Explicit dependencies
use Illuminate\Contracts\Auth\Access\Gate;
use Illuminate\Contracts\Cache\Repository as Cache;
use Illuminate\Contracts\Events\Dispatcher;
use Psr\Log\LoggerInterface;

class OrderService
{
    public function __construct(
        private Gate $gate,
        private Cache $cache,
        private Dispatcher $events,
        private LoggerInterface $logger
    ) {}

    public function process(User $user, Order $order)
    {
        if (!$this->gate->allows('process', $order)) {
            throw new AuthorizationException();
        }

        $this->cache->put("order.{$order->id}", $order, 3600);
        $this->events->dispatch(new OrderProcessed($order));
        $this->logger->info("Order {$order->id} processed");

        return $order;
    }
}
```

**2. Acceptable Helper Usage**

Some helpers are fine to use (and are not tracked by default):

```php
// ✅ ACCEPTABLE - Utility helpers (not tracked)
public function transform(array $data)
{
    return collect($data)           // collect() is a utility, not tracked
        ->map(fn($item) => $this->process($item))
        ->filter()
        ->values()
        ->all();
}

// ✅ ACCEPTABLE - Date helpers (not tracked)
public function getReportPeriod()
{
    return [
        'start' => now()->startOfMonth(),   // now() is a utility, not tracked
        'end' => today()->endOfMonth(),     // today() is a utility, not tracked
    ];
}

// ✅ ACCEPTABLE - Response helpers at controller return
public function store(Request $request)
{
    $result = $this->service->create($request->validated());

    return response()->json($result, 201); // OK - just for response formatting
}

// ✅ ACCEPTABLE - Route helpers in routes file
Route::get('/posts', [PostController::class, 'index'])->name('posts.index');
Route::redirect('/home', '/dashboard');
```

**3. Configuration Options**

Customize the analyzer for your project. Publish the config:
```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'best-practices' => [
        'enabled' => true,

        'helper-function-abuse' => [
            // Threshold before flagging (default: 5)
            'threshold' => 5,

            // Directories to skip (supports partial paths)
            'whitelist_dirs' => [
                'tests',
                'database/migrations',
                'database/seeders',
                'database/factories',
                'app/Jobs',
                'app/Listeners',
                'app/Http/Middleware',
                'app/Console/Commands',  // Add custom directories
            ],

            // Class name patterns to skip (supports wildcards)
            'whitelist_classes' => [
                '*ServiceProvider',
                '*Command',
                '*Controller',
                '*Job',
                '*Listener',
                '*Middleware',
                '*Seeder',
                '*Test',
                '*TestCase',
                '*Handler',  // Add custom patterns
            ],

            // Override the default helper list (advanced)
            // Only set this if you want complete control
            'helper_functions' => [
                'auth', 'request', 'cache', 'config', 'session',
                'event', 'logger', 'app', 'resolve',
                // Add or remove helpers as needed
            ],
        ],
    ],
],
```

**4. Gradual Migration Strategy**

For legacy codebases:

```php
// Step 1: Identify worst offenders
// Run analyzer to find classes with 15+ helpers

// Step 2: Start with services layer
// Refactor services first as they're easiest to test

// Step 3: Move to repositories and actions
// Inject contracts, use Facades for occasional needs

// Step 4: Use baseline to ignore legacy code
php artisan shield:baseline

// Step 5: Enforce on new code
// Set lower threshold for new classes
```

## References

- [Laravel Dependency Injection](https://laravel.com/docs/container) - Official guide to DI in Laravel
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID) - Dependency Inversion Principle
- [Laravel Testing](https://laravel.com/docs/testing) - Why explicit dependencies matter for testing
- [Laravel Facades](https://laravel.com/docs/facades) - Alternative to helpers with better testability
- [Service Container](https://laravel.com/docs/container) - Understanding Laravel's DI container

## Related Analyzers

- [Fat Model Analyzer](/analyzers/best-practices/fat-model) - Detects models with too much business logic
- [Framework Override Analyzer](/analyzers/best-practices/framework-override) - Detects dangerous framework method overrides
- [Config Outside Config](/analyzers/best-practices/config-outside-config) - Detects hardcoded configuration values
- [Service Container Resolution](/analyzers/best-practices/service-container-resolution) - Detects manual service container resolution
