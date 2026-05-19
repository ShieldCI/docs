---
title: Middleware Misuse Analyzer
description: Detects business logic in middleware that should be in controllers or services for proper separation of concerns
icon: check-circle
outline: [2, 3]
tags: best-practices,middleware,separation-of-concerns,architecture
pro: true
---

# Middleware Misuse Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `middleware-misuse` | 🏅 Best Practices  | Medium    | 30 minutes   |

## What This Checks

Detects business logic in middleware that violates separation of concerns. Checks for:

- **Database write operations** - instance calls (`->save()`, `->delete()`, `->update()`, `->create()`, `->destroy()`, `->insert()`, `->upsert()`, `->updateOrCreate()`, `->firstOrCreate()`, `->forceDelete()`, `->truncate()`, `->updateOrInsert()`, `->restore()`, `->saveQuietly()`) and equivalent static model calls
- **Email/notification sending** - `Mail::send()`, `Mail::queue()`, `Mail::later()`, `Mail::sendNow()`, `Notification::send()`, `Notification::sendNow()`, `->notify()`, `->notifyNow()`
- **Event/job dispatching via facades** - `Event::dispatch()`, `Event::fire()`, `Bus::dispatch()`, `Bus::dispatchSync()`, `Bus::dispatchNow()`
- **Direct model instantiation** - `new Model()` in middleware (responses (`Response`, `JsonResponse`, `RedirectResponse`), exceptions (`RuntimeException`, `ValidationException`, HTTP exceptions, etc.), dates (`Carbon`, `DateTime`), and utilities (`Closure`, `stdClass`, `Collection`) are allowed)
- **Complex conditional logic** - if-statement nesting 4+ levels deep, suggesting embedded business rules

| Check | Issue Severity |
| ----- | :------------: |
| Database write operations | Medium |
| Email / notification sending | Medium |
| Event / job dispatching via facades | Low |
| Direct model instantiation | Low |
| Complex conditional logic (4+ levels) | Low |

::: tip What is NOT flagged
- **Safe infrastructure facades** (for write method names): `Schema`, `Gate`, `Auth`, `Log`, `Cache`, `Config`, `Session`, `Cookie`, `Hash`, `Crypt`, `Storage`, `Route`, `View`, `Redirect`, `Validator`, `Queue`, `Event`, `Http`, `Request`, `Str`, `Arr`, `Collection`, `Response`, `JsonResponse`, `RedirectResponse`, `Carbon`, `CarbonImmutable`, `DateTime`, `DateTimeImmutable`
- **`Mail::to()`** alone - it's a builder, not a send action
- **`dispatch()` / `dispatch_sync()` global helpers** - dispatching async jobs from middleware is the accepted Laravel pattern for offloading work (e.g., background tracking)
:::

## Why It Matters

- **Separation of Concerns:** Middleware should handle cross-cutting concerns (auth, CORS, logging), not business logic
- **Testability:** Business logic in middleware is harder to unit test than in dedicated service classes
- **Reusability:** Middleware runs on every matching request; business logic should be in controllers for precise control
- **Debugging:** When business logic is scattered across middleware, bugs are harder to trace

## How to Fix

### Quick Fix (10 minutes)

Move database writes from middleware to a queued job:

**Before (❌):**
```php
class TrackVisitMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        Visit::create([
            'user_id' => $request->user()?->id,
            'path' => $request->path(),
            'ip' => $request->ip(),
        ]);

        return $next($request);
    }
}
```

**After (✅):**
```php
// Middleware: dispatch a job instead
class TrackVisitMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        dispatch(new TrackVisitJob(
            $request->user()?->id,
            $request->path(),
            $request->ip(),
        ));

        return $response;
    }
}
```

### Proper Fix (30 minutes)

**1. Move email/notification sending to events:**

**Before (❌):**
```php
class WelcomeMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user() && !$request->user()->welcomed) {
            // Mail::send() is flagged — sending belongs in an event listener
            Mail::send(new WelcomeEmail($request->user()));
            $request->user()->update(['welcomed' => true]);
        }
        return $next($request);
    }
}
```

**After (✅):**
```php
// Use an event listener instead
class SendWelcomeEmail
{
    public function handle(Registered $event): void
    {
        Mail::send(new WelcomeEmail($event->user));
        $event->user->update(['welcomed' => true]);
    }
}
```

**2. Move complex logic to services:**

**Before (❌):**
```php
class SubscriptionMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if ($user) {
            if ($user->subscription) {
                if ($user->subscription->isExpired()) {
                    if ($user->subscription->isGracePeriod()) {
                        // Complex renewal logic... (4+ levels deep = flagged)
                    }
                }
            }
        }
        return $next($request);
    }
}
```

**After (✅):**
```php
// Simple guard in middleware
class EnsureActiveSubscription
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user()?->hasActiveSubscription()) {
            return redirect()->route('subscription.expired');
        }

        return $next($request);
    }
}
```

**3. Configuration and Customization**

Customize the nesting depth threshold for your project, publish the config:
```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'best-practices' => [
        'enabled' => true,
        
        'middleware-misuse' => [
            'max_nesting_depth' => 4, // default; increase to reduce sensitivity
        ],
    ],
],
```

## References

- [Laravel Middleware](https://laravel.com/docs/middleware)
- [Laravel Service Classes](https://laravel.com/docs/architecture)
- [SOLID Principles - Single Responsibility](https://en.wikipedia.org/wiki/Single-responsibility_principle)

## Related Analyzers

- [Logic in Routes](/analyzers/best-practices/logic-in-routes) - Detects business logic in route files
- [Logic in Blade](/analyzers/best-practices/logic-in-blade) - Detects business logic in templates
- [Fat Model](/analyzers/best-practices/fat-model) - Detects models with too much logic
