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
| `middleware-misuse` | ✅ Best Practices  | Medium    | 30 minutes   |

## What This Checks

Detects business logic in middleware that violates separation of concerns. Checks for:

- Database write operations in middleware (create, update, delete, save)
- Email or notification sending in middleware
- Direct model instantiation (`new Model`) in middleware
- Complex conditional logic (deeply nested conditions) suggesting business logic

## Why It Matters

- **Separation of Concerns:** Middleware should handle cross-cutting concerns (auth, CORS, logging), not business logic
- **Testability:** Business logic in middleware is harder to unit test than in dedicated service classes
- **Reusability:** Middleware runs on every matching request — business logic should be in controllers for precise control
- **Debugging:** When business logic is scattered across middleware, bugs are harder to trace

## How to Fix

### Quick Fix (10 minutes)

Move database writes from middleware to controllers:

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
            Mail::to($request->user())->send(new WelcomeEmail());
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
        Mail::to($event->user)->send(new WelcomeEmail());
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
                        // Complex renewal logic...
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

## References

- [Laravel Middleware](https://laravel.com/docs/middleware)
- [Laravel Service Classes](https://laravel.com/docs/architecture)
- [SOLID Principles - Single Responsibility](https://en.wikipedia.org/wiki/Single-responsibility_principle)

## Related Analyzers

- [Logic in Routes](/analyzers/best-practices/logic-in-routes) - Detects business logic in route files
- [Logic in Blade](/analyzers/best-practices/logic-in-blade) - Detects business logic in templates
- [Fat Model](/analyzers/best-practices/fat-model) - Detects models with too much logic
