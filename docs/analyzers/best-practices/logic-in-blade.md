---
title: Logic in Blade Analyzer
description: Detects business logic in Blade templates that should be moved to controllers or view composers for proper MVC separation
icon: file-code
outline: [2, 3]
tags: laravel,blade,mvc,views,architecture,best-practices,separation-of-concerns,presentation-layer
---

# Logic in Blade Analyzer

| Analyzer ID                           | Category           | Severity | Time To Fix |
| ------------------------------------- | :----------------: |:--------:| -----------:|
| `logic-in-blade`                      | 🏅 Best Practices  | Medium   | 30 minutes  |

## What This Checks

Detects business logic in Blade templates that violates the MVC pattern. Checks for:

- **Complex @php blocks**: PHP blocks exceeding configurable line threshold (default: 10 lines)
- **Database queries**: Eloquent queries, DB facade calls, or query builder operations in views
- **API calls**: HTTP requests, cURL calls, or external service calls in templates
- **Business logic in directives**: Complex conditionals (4+ conditions), data transformations in @foreach loops
- **Complex calculations**: Multi-operation arithmetic, data manipulation in view layer
- **Inline PHP tags**: Use of `<?php` instead of Blade directives
- **Unclosed @php blocks**: Missing `@endphp` directives (the single-statement `@php($expr)` form is self-closing and is never flagged)

**Smart Detection Features:**
- ✅ **Hybrid regex + AST analysis** - structural checks on raw Blade, logic detection via compiled PHP AST
- ✅ Distinguishes between presentation logic and business logic
- ✅ Allows simple calculations (`{{ $price * $quantity }}`)
- ✅ Excludes config/session/cache helper calls
- ✅ Detects relationship queries (`$user->posts()->get()`)
- ✅ Tracks 9 different issue types with appropriate severity levels
- ✅ Configurable thresholds for @php block complexity and arithmetic operator sensitivity
- ✅ Recognises the single-statement `@php($expr)` form as self-closing — never emits a false-positive "Unclosed @php block" for this syntax

**Detected Operations by Severity:**

**Critical** - Database Queries:
- Eloquent: `User::where()`, `User::find()`, `User::create()`, `$user->save()`, `$model->update()`
- Query Builder: `DB::table()->get()`, `DB::insert()`, `DB::update()`, `DB::delete()`
- Relationships: `$user->posts()->get()`, `$user->posts()->count()`

**High** - API Calls:
- HTTP: `Http::get()`, `Http::post()`, Guzzle client
- cURL: `curl_init()`, `curl_exec()`
- File operations: `file_get_contents()` with URLs

**Medium** - Business Logic:
- Complex conditionals (4+ conditions)
- Array manipulation (`array_filter()`, `array_map()`, `array_reduce()`)
- Collection transformations in loops
- @php blocks exceeding line threshold

**Low** - Complex Calculations:
- Multi-operation arithmetic
- Nested calculations

## Why It Matters

Business logic in Blade templates violates the **Model-View-Controller (MVC)** architecture pattern, leading to serious maintainability and performance issues:

- **Tight Coupling**: Views become dependent on database structure and business rules, making refactoring difficult
- **Untestable Code**: Logic in templates is nearly impossible to unit test
- **Performance Issues**: Queries in loops create N+1 problems, API calls block rendering
- **Maintenance Nightmare**: Business logic scattered across multiple view files instead of centralized
- **Code Duplication**: Same logic repeated in multiple templates
- **Security Risks**: Direct database access bypasses authorization checks and policies

## How to Fix

### Quick Fix (5 minutes)

Move database queries and business logic from Blade to your controller:

**Before (❌):**
```blade
{{-- resources/views/dashboard.blade.php --}}
@php
    $activeUsers = User::where('status', 'active')->count();
    $recentOrders = Order::where('created_at', '>', now()->subDays(7))->get();
@endphp

<div>Active Users: {{ $activeUsers }}</div>
```

**After (✅):**
```php
// app/Http/Controllers/DashboardController.php
public function index()
{
    return view('dashboard', [
        'activeUsers' => User::where('status', 'active')->count(),
        'recentOrders' => Order::with('user')
            ->where('created_at', '>', now()->subDays(7))
            ->get(),
    ]);
}
```

```blade
{{-- resources/views/dashboard.blade.php --}}
<div>Active Users: {{ $activeUsers }}</div>
```

### Proper Fix (30 minutes)

Implement comprehensive separation of concerns using controllers, view composers, model accessors, and service classes:

**1. Use Controllers for Data Fetching**

```php
// app/Http/Controllers/DashboardController.php
class DashboardController extends Controller
{
    public function index()
    {
        return view('dashboard', [
            'activeUsers' => User::where('status', 'active')->count(),
            'recentOrders' => Order::with('user')
                ->where('created_at', '>', now()->subDays(7))
                ->get(),
            'topProducts' => Product::orderBy('sales', 'desc')
                ->limit(5)
                ->get(),
        ]);
    }
}
```

```blade
{{-- resources/views/dashboard.blade.php --}}
<div class="dashboard">
    <div class="stat">Active Users: {{ $activeUsers }}</div>

    <h3>Recent Orders</h3>
    <ul>
        @foreach($recentOrders as $order)
            {{-- ✅ No N+1 - user is eager loaded --}}
            <li>{{ $order->user->name }} - ${{ $order->total }}</li>
        @endforeach
    </ul>
</div>
```

**2. Use View Composers for Shared Data**

```php
// app/Http/View/Composers/NavigationComposer.php
namespace App\Http\View\Composers;

use Illuminate\View\View;
use App\Models\Category;

class NavigationComposer
{
    public function compose(View $view): void
    {
        $view->with([
            'categories' => Category::active()->orderBy('name')->get(),
            'cartCount' => auth()->check() ? auth()->user()->cart->count() : 0,
            'unreadNotifications' => auth()->check()
                ? auth()->user()->unreadNotifications()->count()
                : 0,
        ]);
    }
}
```

```php
// app/Providers/ViewServiceProvider.php
use App\Http\View\Composers\NavigationComposer;
use Illuminate\Support\Facades\View;

public function boot(): void
{
    // Compose for all views
    View::composer('*', NavigationComposer::class);

    // Or specific views/patterns
    View::composer(['layouts.app', 'layouts.admin'], NavigationComposer::class);
}
```

```blade
{{-- resources/views/layouts/app.blade.php --}}
<nav>
    @foreach($categories as $category)
        <a href="/category/{{ $category->slug }}">{{ $category->name }}</a>
    @endforeach
    <span>Cart ({{ $cartCount }})</span>
</nav>
```

**3. Use Model Accessors for Calculated Values**

```php
// app/Models/Order.php
class Order extends Model
{
    // ✅ GOOD - Calculated property in model
    public function getTotalWithTaxAttribute(): float
    {
        return $this->subtotal * (1 + $this->tax_rate)
            + $this->shipping_cost
            - $this->discount;
    }

    public function getFormattedTotalAttribute(): string
    {
        return '$' . number_format($this->total_with_tax, 2);
    }

    public function getIsExpensiveAttribute(): bool
    {
        return $this->total_with_tax > 1000;
    }
}
```

```blade
{{-- resources/views/orders/show.blade.php --}}
{{-- ✅ GOOD: Use model accessors --}}
<div>Total: {{ $order->formatted_total }}</div>

@if($order->is_expensive)
    <span class="badge">High Value Order</span>
@endif

{{-- ❌ BAD: Calculate in view --}}
<div>Total: ${{ number_format(($order->subtotal * (1 + $order->tax_rate)) + $order->shipping_cost - $order->discount, 2) }}</div>
```

**4. Use Service Classes for Complex Logic**

```php
// app/Services/SalesReportService.php
namespace App\Services;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class SalesReportService
{
    public function generateMonthlySalesReport(Carbon $startDate, Carbon $endDate): array
    {
        $orders = Order::whereBetween('created_at', [$startDate, $endDate])
            ->with('items')
            ->get();

        $monthlySales = $this->calculateMonthlySales($orders);

        return [
            'monthly_sales' => $monthlySales,
            'total_sales' => array_sum($monthlySales),
            'average_sales' => array_sum($monthlySales) / 12,
            'best_month' => array_search(max($monthlySales), $monthlySales),
            'worst_month' => array_search(min($monthlySales), $monthlySales),
            'top_products' => $this->getTopProducts($orders),
        ];
    }

    private function calculateMonthlySales(Collection $orders): array
    {
        return Order::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, SUM(total) as sales')
            ->where('created_at', '>', now()->subYear())
            ->groupBy('month')
            ->pluck('sales', 'month')
            ->toArray();
    }

    private function getTopProducts(Collection $orders): Collection
    {
        return $orders->flatMap->items
            ->groupBy('product_id')
            ->map->sum('quantity')
            ->sortDesc()
            ->take(10);
    }
}
```

```php
// app/Http/Controllers/ReportController.php
class ReportController extends Controller
{
    public function sales(SalesReportService $reportService)
    {
        $report = $reportService->generateMonthlySalesReport(
            now()->subMonth(),
            now()
        );

        return view('reports.sales', $report);
    }
}
```

```blade
{{-- resources/views/reports/sales.blade.php --}}
<div class="report">
    <h2>Sales Report</h2>
    <div>Total Sales: ${{ number_format($total_sales) }}</div>
    <div>Average: ${{ number_format($average_sales) }}</div>
    <div>Best Month: {{ $best_month }}</div>
</div>
```

**5. Move API Calls to Controllers with Caching**

```php
// app/Http/Controllers/WeatherController.php
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class WeatherController extends Controller
{
    public function show(string $city)
    {
        // Cache API results for 1 hour
        $weather = Cache::remember("weather.{$city}", 3600, function () use ($city) {
            $response = Http::timeout(5)->get('https://api.weather.com/forecast', [
                'city' => $city,
                'apiKey' => config('services.weather.key'),
            ]);

            return $response->json();
        });

        return view('weather-widget', ['weather' => $weather]);
    }
}
```

```blade
{{-- resources/views/weather-widget.blade.php --}}
{{-- ✅ GOOD: Data fetched in controller with caching --}}
<div class="weather">
    <div>Temperature: {{ $weather['temp'] }}°C</div>
    <div>Condition: {{ $weather['condition'] }}</div>
</div>

{{-- ❌ BAD: API call in template --}}
@php
    $response = Http::get('https://api.weather.com/forecast');
    $weather = $response->json();
@endphp
```

**6. Use Eager Loading to Prevent N+1 Queries**

```php
// app/Http/Controllers/UserController.php
public function index()
{
    // ✅ GOOD - Eager load relationships
    $users = User::with(['posts', 'comments'])
        ->withCount(['posts', 'orders'])
        ->withSum('orders', 'total')
        ->get();

    return view('users.index', ['users' => $users]);
}
```

```blade
{{-- resources/views/users/index.blade.php --}}
@foreach($users as $user)
    <tr>
        <td>{{ $user->name }}</td>
        {{-- ✅ GOOD: Already loaded, no queries --}}
        <td>{{ $user->posts_count }} posts</td>
        <td>{{ $user->orders_count }} orders</td>
        <td>${{ number_format($user->orders_sum_total, 2) }}</td>
    </tr>
@endforeach

{{-- ❌ BAD: N+1 query problem --}}
@foreach($users as $user)
    <tr>
        <td>{{ $user->name }}</td>
        {{-- Each line executes a new query! --}}
        <td>{{ $user->posts()->count() }} posts</td>
        <td>{{ $user->orders()->count() }} orders</td>
        <td>${{ number_format($user->orders()->sum('total'), 2) }}</td>
    </tr>
@endforeach
```

**7. Extract Complex Conditionals to Model Methods**

```php
// app/Models/User.php
class User extends Model
{
    public function isVipCustomer(): bool
    {
        return $this->orders()->count() > 10
            && $this->total_spent > 1000
            && $this->created_at < now()->subYear();
    }

    public function canAccessFeature(string $feature): bool
    {
        return $this->isAdmin()
            || $this->hasSubscription()
            || $this->hasPermission($feature);
    }
}
```

```blade
{{-- ✅ GOOD: Simple, readable, testable --}}
@if($user->isVipCustomer())
    <span class="vip-badge">VIP Customer</span>
@endif

@if($user->canAccessFeature('advanced-reports'))
    <a href="/reports/advanced">Advanced Reports</a>
@endif

{{-- ❌ BAD: Complex conditionals in view --}}
@if($user->orders()->count() > 10 && $user->total_spent > 1000 && $user->created_at < now()->subYear())
    <span class="vip-badge">VIP Customer</span>
@endif
```

**8. Configuration and Customization**

Customize the analyzer for your project, publish the config:
```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'best-practices' => [
        'enabled' => true,
        
        'logic-in-blade' => [
            // Maximum lines allowed in @php blocks before flagging
            // Default: 10
            'max_php_block_lines' => 10,

            // Minimum arithmetic operators to flag a calculation in {{ }} expressions
            // Default: 2 (e.g., {{ ($a * $b) + $c }} triggers, {{ $a * $b }} does not)
            'min_arithmetic_operators' => 2,
        ],
    ],
],
```

## References

- [Laravel Views Documentation](https://laravel.com/docs/views)
- [Laravel View Composers](https://laravel.com/docs/views#view-composers)
- [Blade Templates Best Practices](https://laravel.com/docs/blade)
- [MVC Architecture Pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)
- [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
- [Laravel Eloquent Eager Loading](https://laravel.com/docs/eloquent-relationships#eager-loading)

## Related Analyzers

- [Eloquent N+1 Query Analyzer](/analyzers/best-practices/eloquent-n-plus-one) - Detects relationship loading without eager loading
- [Missing Database Transactions Analyzer](/analyzers/best-practices/missing-database-transactions) - Ensures data integrity for multiple writes
- [Fat Model Analyzer](/analyzers/best-practices/fat-model) - Detects business logic that should be extracted from models
