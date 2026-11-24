---
title: Logic in Routes Analyzer
description: Detects business logic in route files that violates MVC separation and should be moved to controllers
icon: route
outline: [2, 3]
tags: laravel,mvc,routes,architecture,best-practices,separation-of-concerns
---

# Logic in Routes Analyzer

| Analyzer ID                 | Category           | Severity | Time To Fix |
| ----------------------------| :----------------: |:--------:| -----------:|
| `logic-in-routes`           | 🏅 Best Practices  |   High   | 20 minutes  |

## What This Checks

Detects business logic in Laravel route files that violates MVC separation of concerns. Identifies these types of violations:

- **Database Writes and Raw Queries**: `create()`, `update()`, `delete()`, `restore()` and other writes, and `DB` facade calls, in route closures (High severity)
- **Complex Database Queries**: Reads with joins, `whereIn()`, `groupBy()` and similar, or long query chains (Medium severity). `whereIn()` on an in-memory collection, such as `collect($items)->whereIn('type', ['book'])`, is not a database query
- **Simple Reads**: A read such as `User::where('active', true)->get()` or `Post::paginate(15)` is not reported unless `allow_simple_reads` is disabled (Low severity)
- **Complex Business Logic**: Nested conditionals, loops (foreach/for/while), business facades and calls, and long method chains (High severity)
- **Long Closures**: Route closures exceeding configurable line threshold (default: 5 lines) (Medium severity)

A closure that only reads is graded only as a database read. That covers:

- A read rooted at a model, such as `fn () => Post::latest()->paginate(15)->withQueryString()`, including local scopes and query callbacks such as `whereHas('tags', fn ($q) => $q->where('name', 'php'))` or `with(['tags' => fn ($q) => $q->latest()])`
- A read rooted at the signed-in user, such as `auth()->user()`, `auth()->guard('api')->user()`, `Auth::guard('api')->user()` or `$request->user()`, or at a route-bound model parameter, such as `fn (Team $team) => $team->members()->latest()->get()`
- A read returned through `view('name', [...])` or `compact()`
- Several statements that only assign plain values (literals, `request()` or `config()` reads), the signed-in user or reads to variables, or call `session()` with plain arguments, before returning the read

A closure with any other statement, a write, or a per-row callback such as `->each(...)` beside the read is graded for business logic as well. A write through any of the roots above, including one inside a query callback, is graded as a database write.

**Problem Detection:**
- **DB Facade**: `DB::table()`, `DB::select()`, `DB::raw()` calls
- **Eloquent Models**: `User::where()`, `Product::find()`, `Order::create()`, etc.
- **Query Builder**: `->select()`, `->where()`, `->join()`, `->orderBy()`, `->limit()`
- **Loops**: `foreach`, `for`, `while`, `do-while`
- **Nested Logic**: If statements nested 2+ levels deep
- **Line Count**: Closures exceeding threshold (opening brace to closing brace)

**Consolidated Reporting**: Multiple problems in the same closure are consolidated into a single issue with the highest severity.

## Why It Matters

- **Violates MVC**: Business logic belongs in controllers, services, or actions - not route files
- **Hard to Test**: Route closures are difficult to unit test in isolation
- **Poor Maintainability**: Route files become cluttered and hard to navigate
- **Code Duplication**: Similar logic often duplicated across multiple routes
- **Performance**: Database queries in routes bypass controller middleware and caching
- **Security Risk**: Direct DB access in routes can bypass authorization logic

**Real-world impact:**
- Route files with 20+ closures containing DB queries become unmaintainable
- Testing route logic requires full application bootstrap and database seeding
- Similar queries duplicated across routes lead to inconsistent behavior
- Authorization checks often forgotten when logic is in routes instead of controllers

## How to Fix

### Quick Fix (10 minutes)

**Scenario 1: Move Simple Logic to Controllers**

```php
// ❌ BAD - Database query in route
Route::get('/users', function () {
    return User::whereIn('role', ['admin', 'editor'])->orderBy('name')->get();
});

// ✅ GOOD - Controller handles logic
Route::get('/users', [UserController::class, 'index']);

// app/Http/Controllers/UserController.php
class UserController extends Controller
{
    public function index()
    {
        $users = User::whereIn('role', ['admin', 'editor'])->orderBy('name')->get();
        return response()->json($users);
    }
}
```

**Scenario 2: Extract Complex Logic to Single-Action Controllers**

```php
// ❌ BAD - Complex business logic in route
Route::post('/orders', function () {
    $order = Order::create([
        'user_id' => auth()->id(),
        'total' => request('total'),
    ]);

    foreach ($order->items as $item) {
        if ($item->quantity > $item->stock) {
            return response()->json(['error' => 'Insufficient stock'], 400);
        }
    }

    event(new OrderCreated($order));
    return response()->json($order, 201);
});

// ✅ GOOD - Single-action controller
Route::post('/orders', StoreOrderController::class);

// app/Http/Controllers/StoreOrderController.php
class StoreOrderController extends Controller
{
    public function __invoke(Request $request)
    {
        $order = Order::create([
            'user_id' => auth()->user()->id,
            'total' => $request->input('total'),
        ]);

        foreach ($order->items as $item) {
            if ($item->quantity > $item->stock) {
                return response()->json(['error' => 'Insufficient stock'], 400);
            }
        }

        event(new OrderCreated($order));
        return response()->json($order, 201);
    }
}
```

### Proper Fix (20 minutes)

Implement comprehensive separation of concerns with services and repositories:

**1. Service Layer for Business Logic**

```php
// ❌ BAD - All logic in route closure
Route::post('/checkout', function () {
    $cart = Cart::where('user_id', auth()->id())->first();

    if (!$cart || $cart->items->isEmpty()) {
        return response()->json(['error' => 'Empty cart'], 400);
    }

    $total = 0;
    foreach ($cart->items as $item) {
        $total += $item->price * $item->quantity;

        if ($item->product->stock < $item->quantity) {
            return response()->json(['error' => 'Insufficient stock'], 400);
        }
    }

    $order = Order::create([
        'user_id' => auth()->id(),
        'total' => $total,
        'status' => 'pending',
    ]);

    event(new OrderPlaced($order));

    return response()->json($order, 201);
});

// ✅ GOOD - Service handles business logic
Route::post('/checkout', [CheckoutController::class, 'store']);

// app/Http/Controllers/CheckoutController.php
class CheckoutController extends Controller
{
    public function __construct(
        private CheckoutService $checkoutService
    ) {}

    public function store(Request $request)
    {
        try {
            $order = $this->checkoutService->processCheckout(auth()->user());
            return response()->json($order, 201);
        } catch (EmptyCartException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (InsufficientStockException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}

// app/Services/CheckoutService.php
class CheckoutService
{
    public function __construct(
        private CartRepository $carts,
        private OrderRepository $orders
    ) {}

    public function processCheckout(User $user): Order
    {
        $cart = $this->carts->findByUser($user);

        if (!$cart || $cart->items->isEmpty()) {
            throw new EmptyCartException('Cart is empty');
        }

        $this->validateStock($cart);

        $order = $this->orders->createFromCart($cart);

        event(new OrderPlaced($order));

        return $order;
    }

    private function validateStock(Cart $cart): void
    {
        foreach ($cart->items as $item) {
            if ($item->product->stock < $item->quantity) {
                throw new InsufficientStockException(
                    "Insufficient stock for {$item->product->name}"
                );
            }
        }
    }
}
```

**2. Acceptable Route Closures**

Some simple closures are fine:

```php
// ✅ ACCEPTABLE - Simple view return
Route::get('/', function () {
    return view('welcome');
});

// ✅ ACCEPTABLE - Simple redirect
Route::get('/home', function () {
    return redirect('/dashboard');
});

// ✅ ACCEPTABLE - Static response
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// ✅ ACCEPTABLE - Simple parameter-based view
Route::get('/pages/{slug}', function ($slug) {
    return view("pages.{$slug}");
});
```

**3. Configuration and Customization**

Customize the analyzer for your project, publish the config:
```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'best-practices' => [
        'enabled' => true,
        
        'logic-in-routes' => [
            // Maximum closure lines before flagging (default: 5)
            'max_closure_lines' => 5,

            // For stricter enforcement
            'max_closure_lines' => 3,

            // For legacy codebases
            'max_closure_lines' => 10,

            // Report simple reads too, at Low severity (default: true)
            'allow_simple_reads' => false,
        ],
    ],
],
```

**4. Gradual Migration Strategy**

For legacy codebases with many route closures:

```php
// Step 1: Identify critical violations
// Focus on routes with database writes and business logic first (High severity)

// Step 2: Extract to controllers
// Move each closure to a dedicated controller method

// Step 3: Refactor complex closures
// Break down nested logic into service methods

// Step 4: Use baseline to track progress
php artisan shield:baseline

// Step 5: Enforce on new routes
// Prevent new violations while cleaning up legacy code
```

**5. Resource Controllers Pattern**

```php
// ❌ BAD - Multiple route closures with logic
Route::get('/posts', function () {
    return Post::where('published', true)->orderBy('created_at', 'desc')->get();
});

Route::get('/posts/{id}', function ($id) {
    $post = Post::find($id);
    if (!$post) {
        abort(404);
    }
    return $post;
});

Route::post('/posts', function () {
    $post = Post::create(request()->all());
    return response()->json($post, 201);
});

// ✅ GOOD - Resource controller
Route::resource('posts', PostController::class);

// app/Http/Controllers/PostController.php
class PostController extends Controller
{
    public function index()
    {
        $posts = Post::where('published', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($posts);
    }

    public function show(Post $post)
    {
        return response()->json($post);
    }

    public function store(StorePostRequest $request)
    {
        $post = Post::create($request->validated());
        return response()->json($post, 201);
    }
}
```

**6. Issue Codes and Severity**

The analyzer provides specific issue codes for each violation type:

- `route-has-db-writes` (High): Database write operations in route closure
- `route-has-raw-queries` (High): `DB` facade queries in route closure
- `route-has-business-logic` (High): Complex logic like loops, nested conditionals or long method chains
- `route-has-complex-queries` (Medium): Joins, `whereIn()`, `groupBy()` or long query chains
- `route-closure-too-long` (Medium): Closure exceeds line threshold
- `route-has-db-queries` (Low): Simple reads, only when `allow_simple_reads` is disabled

**Consolidated Issues**: If a route has multiple problems (e.g., DB queries AND nested logic), they're combined into one issue with the highest severity.

## References

- [Laravel Routing](https://laravel.com/docs/routing) - Official routing documentation
- [Laravel Controllers](https://laravel.com/docs/controllers) - Controller patterns and best practices
- [MVC Pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) - Separation of concerns principle
- [Single Action Controllers](https://laravel.com/docs/controllers#single-action-controllers) - Clean invokable controllers
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html) - Business logic organization

## Related Analyzers

- [Helper Function Abuse](/analyzers/best-practices/helper-function-abuse) - Detects excessive helper usage that hides dependencies
- [Fat Model Analyzer](/analyzers/best-practices/fat-model) - Detects models with too much business logic
