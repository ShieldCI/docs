---
title: Fat Model Analyzer
description: Detects Eloquent models with too much business logic that violate Single Responsibility Principle and should be refactored into service classes
icon: package
outline: [2, 3]
tags: laravel,eloquent,architecture,solid,srp,best-practices,maintainability,service-layer,refactoring
---

# Fat Model Analyzer

| Analyzer ID              | Category           | Severity | Time To Fix |
| -------------------------| :----------------: |:--------:| -----------:|
| `fat-model`              | 🏅 Best Practices  | Medium   | 45 minutes  |

## What This Checks

Detects Eloquent models that have grown too large and contain too much business logic. Checks:

- **Method count**: Models with more than 15 public business methods (excluding scopes, relationships, accessors/mutators)
- **Lines of code**: Models exceeding 300 lines of actual code (properties + methods)
- **Method complexity**: Individual methods with cyclomatic complexity above 10
- **Smart exclusions**: Automatically excludes Laravel magic methods, scopes, relationships, accessors/mutators, and lifecycle hooks

**Dynamic Severity:**
- **Low**: 16-19 methods or 301-399 lines (slightly over threshold)
- **Medium**: 20-29 methods or 400-499 lines (concerning)
- **High**: 30+ methods or 500+ lines (severe violation)

**Customizable thresholds** via configuration file for different project standards.

## Why It Matters

- **Single Responsibility Violation**: Fat models violate SOLID principles by handling too many responsibilities
- **Hard to Test**: Models with complex business logic are difficult to unit test properly
- **Poor Maintainability**: Large models become overwhelming to understand and modify
- **Code Reusability**: Business logic trapped in models can't be easily reused across different contexts
- **Team Collaboration**: Multiple developers working on the same large model leads to merge conflicts
- **Unclear Boundaries**: Fat models blur the line between data representation and business operations

**Real-world impact:**
- A 500-line User model handling authentication, profile management, notifications, and billing is unmaintainable
- Models with 30+ methods become "god objects" that violate separation of concerns
- Complex methods (complexity > 10) are hard to reason about and prone to bugs
- Refactoring fat models into service classes improves testability by 3-5x

**Anti-pattern Example:**
```php
// ❌ Fat model doing everything (500+ lines)
class User extends Model
{
    // Authentication logic
    public function attemptLogin($credentials) { /* 50 lines */ }
    public function resetPassword($token) { /* 40 lines */ }

    // Profile management
    public function updateProfile($data) { /* 60 lines */ }
    public function uploadAvatar($file) { /* 45 lines */ }

    // Billing
    public function createSubscription($plan) { /* 70 lines */ }
    public function cancelSubscription() { /* 50 lines */ }

    // Notifications
    public function sendWelcomeEmail() { /* 30 lines */ }
    public function notifyAdmins() { /* 25 lines */ }

    // 20+ more business methods...
}
```

## How to Fix

### Quick Fix (15 minutes)

Extract the most complex or frequently used business logic to a dedicated service class:

```php
// ❌ BAD - All billing logic in model
class User extends Model
{
    public function createSubscription($planId, $paymentMethod)
    {
        // Validate plan
        $plan = Plan::findOrFail($planId);

        // Create Stripe customer
        $customer = \Stripe\Customer::create([
            'email' => $this->email,
            'payment_method' => $paymentMethod,
        ]);

        // Create subscription
        $subscription = \Stripe\Subscription::create([
            'customer' => $customer->id,
            'items' => [['price' => $plan->stripe_price_id]],
        ]);

        // Update database
        $this->update([
            'stripe_customer_id' => $customer->id,
            'stripe_subscription_id' => $subscription->id,
        ]);

        // Send confirmation email
        Mail::to($this)->send(new SubscriptionConfirmation());

        return $subscription;
    }
}

// ✅ GOOD - Extract to service class
class SubscriptionService
{
    public function createSubscription(User $user, $planId, $paymentMethod)
    {
        $plan = Plan::findOrFail($planId);

        $customer = $this->createStripeCustomer($user, $paymentMethod);
        $subscription = $this->createStripeSubscription($customer, $plan);

        $user->update([
            'stripe_customer_id' => $customer->id,
            'stripe_subscription_id' => $subscription->id,
        ]);

        Mail::to($user)->send(new SubscriptionConfirmation());

        return $subscription;
    }

    private function createStripeCustomer(User $user, $paymentMethod)
    {
        return \Stripe\Customer::create([
            'email' => $user->email,
            'payment_method' => $paymentMethod,
        ]);
    }

    private function createStripeSubscription($customer, Plan $plan)
    {
        return \Stripe\Subscription::create([
            'customer' => $customer->id,
            'items' => [['price' => $plan->stripe_price_id]],
        ]);
    }
}

// Usage in controller
class SubscriptionController
{
    public function store(SubscriptionService $subscriptionService)
    {
        $subscription = $subscriptionService->createSubscription(
            auth()->user(),
            request('plan_id'),
            request('payment_method')
        );

        return response()->json(['subscription' => $subscription]);
    }
}
```

### Proper Fix (45 minutes)

Implement a comprehensive service layer architecture:

**1. Extract Business Logic to Services**

```php
// ❌ BAD - Model handles everything
class Order extends Model
{
    public function processPayment($paymentData) { /* 80 lines */ }
    public function calculateShipping() { /* 50 lines */ }
    public function applyDiscounts() { /* 60 lines */ }
    public function sendConfirmation() { /* 40 lines */ }
    public function generateInvoice() { /* 70 lines */ }
}

// ✅ GOOD - Separate services for each domain
class Order extends Model
{
    // Only data representation and relationships
    protected $fillable = ['user_id', 'total', 'status'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}

class PaymentService
{
    public function processOrderPayment(Order $order, array $paymentData)
    {
        // Payment processing logic
    }
}

class ShippingService
{
    public function calculateShipping(Order $order)
    {
        // Shipping calculation logic
    }
}

class DiscountService
{
    public function applyDiscounts(Order $order)
    {
        // Discount application logic
    }
}

class OrderNotificationService
{
    public function sendConfirmation(Order $order)
    {
        // Notification logic
    }
}

class InvoiceService
{
    public function generateInvoice(Order $order)
    {
        // Invoice generation logic
    }
}
```

**2. Use Action Classes for Single-Purpose Operations**

```php
// ❌ BAD - Complex logic in model
class User extends Model
{
    public function upgradeToPremi um($plan, $paymentMethod)
    {
        // 100 lines of upgrade logic
    }
}

// ✅ GOOD - Dedicated action class
class UpgradeUserToPremium
{
    public function __construct(
        private SubscriptionService $subscriptionService,
        private NotificationService $notificationService
    ) {}

    public function execute(User $user, Plan $plan, $paymentMethod)
    {
        DB::transaction(function () use ($user, $plan, $paymentMethod) {
            $subscription = $this->subscriptionService->create($user, $plan, $paymentMethod);

            $user->update([
                'account_type' => 'premium',
                'premium_since' => now(),
            ]);

            $this->notificationService->sendUpgradeConfirmation($user);

            return $subscription;
        });
    }
}

// Usage
class UpgradeController
{
    public function store(UpgradeUserToPremium $upgradeAction)
    {
        $subscription = $upgradeAction->execute(
            auth()->user(),
            Plan::find(request('plan_id')),
            request('payment_method')
        );

        return redirect()->route('premium.success');
    }
}
```

**3. Use Traits for Reusable Model Behavior**

```php
// ❌ BAD - Duplicate logic across models
class User extends Model
{
    public function markAsActive() { /* logic */ }
    public function markAsInactive() { /* logic */ }
}

class Product extends Model
{
    public function markAsActive() { /* same logic */ }
    public function markAsInactive() { /* same logic */ }
}

// ✅ GOOD - Reusable trait
trait HasActiveStatus
{
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    public function activate()
    {
        $this->update(['is_active' => true, 'activated_at' => now()]);
    }

    public function deactivate()
    {
        $this->update(['is_active' => false, 'deactivated_at' => now()]);
    }
}

class User extends Model
{
    use HasActiveStatus;
}

class Product extends Model
{
    use HasActiveStatus;
}
```

**4. Use Repository Pattern for Complex Queries**

```php
// ❌ BAD - Query logic in model
class Post extends Model
{
    public static function getPublishedPostsWithStats()
    {
        return static::where('status', 'published')
            ->withCount('comments', 'likes')
            ->with('user', 'categories')
            ->orderByDesc('published_at')
            ->get();
    }
}

// ✅ GOOD - Repository pattern
interface PostRepositoryInterface
{
    public function getPublishedWithStats();
}

class PostRepository implements PostRepositoryInterface
{
    public function getPublishedWithStats()
    {
        return Post::where('status', 'published')
            ->withCount('comments', 'likes')
            ->with('user', 'categories')
            ->orderByDesc('published_at')
            ->get();
    }

    public function findBySlug(string $slug)
    {
        return Post::where('slug', $slug)->firstOrFail();
    }
}

// Model stays clean
class Post extends Model
{
    protected $fillable = ['title', 'content', 'status', 'published_at'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

**5. Customize ShieldCI Custom Settings (Optional)**

To customize the thresholds for detecting fat models, publish the config:
```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'best-practices' => [
        'enabled' => true,
        
        'fat-model' => [
            'method_threshold' => 15,       // Default: 15 methods
            'loc_threshold' => 300,         // Default: 300 lines
            'complexity_threshold' => 10,   // Default: 10 complexity
        ],
    ],
],
```

::: tip
The default thresholds are based on industry best practices and SOLID principles. Models exceeding these limits typically violate the Single Responsibility Principle and should be refactored into service classes.
:::

::: info Excluded Methods
The analyzer automatically excludes Laravel magic methods (scopes, relationships, accessors/mutators, lifecycle hooks) from the method count. Only business logic methods are counted toward the threshold.
:::

## References

- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html) - Martin Fowler's service layer explanation
- [Laravel Service Container](https://laravel.com/docs/container) - Dependency injection in Laravel
- [SOLID Principles](https://www.digitalocean.com/community/conceptual_articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design) - Single Responsibility Principle
- [Action Classes in Laravel](https://freek.dev/1371-refactoring-to-actions) - Freek Van der Herten's action pattern
- [Laravel Best Practices](https://github.com/alexeymezenin/laravel-best-practices) - Community best practices guide

## Related Analyzers

- [Service Container Resolution](/analyzers/best-practices/service-container-resolution) - Encourages dependency injection
- [Eloquent N+1 Query](/analyzers/best-practices/eloquent-n-plus-one) - Performance issues in models
