---
title: Authentication & Authorization Analyzer
description: Detects missing authentication and authorization protection throughout your Laravel application
icon: lock
outline: [2, 3]
tags: authentication,authorization,security,middleware
---

# Authentication & Authorization Analyzer

| Analyzer ID                     | Category     | Severity | Time To Fix  |
|---------------------------------| :----------: |:--------:| ------------:|
| `authentication-authorization`  | 🛡️ Security  | Critical | 25 minutes   |

## What This Checks

Detects missing authentication and authorization protection throughout your Laravel application. Scans routes, controllers, and code for authentication vulnerabilities including unprotected routes (POST, PUT, PATCH, DELETE), controllers with sensitive methods lacking authentication, missing authorization checks, and unsafe `Auth::user()`, `auth()->user()`, and `$request->user()` usage without null safety checks.

## Why It Matters

- **Security Risk:** CRITICAL - Unprotected routes allow unauthorized access to sensitive operations
- **Data Integrity:** Users could modify or delete data they shouldn't have access to
- **Privacy Violations:** Unprotected routes expose private user data and functionality
- **Application Crashes:** `Auth::user()`, `auth()->user()`, and `$request->user()` can return null, causing runtime errors when accessed by unauthenticated users

Authentication and authorization are the first line of defense for your application. Missing protection can lead to:
- Unauthorized data modification or deletion by anyone accessing unprotected endpoints
- User impersonation and account takeover through authentication bypass
- Data breaches exposing private user information and violating compliance regulations
- Application crashes from null pointer exceptions when accessing user properties without checks

A missing auth check on a DELETE endpoint could allow anyone to delete any user's data. Unprotected admin routes could give visitors full admin access. `Auth::user()->email` without checks crashes when accessed by guests.

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: Route Without Authentication**

```php
// BAD - Unprotected route
Route::post('/posts', [PostController::class, 'store']);
Route::delete('/posts/{id}', [PostController::class, 'destroy']);

// GOOD - Protected with auth middleware
Route::post('/posts', [PostController::class, 'store'])->middleware('auth');
Route::delete('/posts/{id}', [PostController::class, 'destroy'])->middleware('auth');
```

**Scenario 2: Multiple Routes Need Protection**

```php
// BAD - Repetitive middleware
Route::post('/posts', [PostController::class, 'store'])->middleware('auth');
Route::put('/posts/{id}', [PostController::class, 'update'])->middleware('auth');
Route::delete('/posts/{id}', [PostController::class, 'destroy'])->middleware('auth');

// GOOD - Group routes with middleware
Route::middleware(['auth'])->group(function () {
    Route::post('/posts', [PostController::class, 'store']);
    Route::put('/posts/{id}', [PostController::class, 'update']);
    Route::delete('/posts/{id}', [PostController::class, 'destroy']);
});
```

**Scenario 3: Unsafe Auth User Access**

All three patterns are flagged when used in an unprotected context:

```php
// BAD - Any of these can crash if the user is not authenticated
public function show()
{
    $name = Auth::user()->name;       // Null pointer if not logged in!
    $name = auth()->user()->name;     // Same risk
    $name = $request->user()->name;   // Same risk
    return view('profile', ['name' => $name]);
}
```

**Option 1: Protect with auth middleware (recommended)**

When the enclosing controller method is protected by auth middleware (either at the route level or via the controller constructor), the analyzer understands this context and will **not** flag direct property access:

```php
// Route-level middleware
Route::get('/profile', [ProfileController::class, 'show'])->middleware('auth');

// OR constructor-level middleware
public function __construct()
{
    $this->middleware('auth');
}

// Now safe — the analyzer recognizes the auth-protected context
public function show()
{
    $name = Auth::user()->name;      // Not flagged: method is auth-gated
    $email = auth()->user()->email;  // Not flagged: method is auth-gated
    return view('profile', compact('name', 'email'));
}
```

**Option 2: Use null-safe operator for mixed contexts (PHP 8.0+)**

```php
// Safe regardless of middleware — works for guest-accessible routes too
public function show()
{
    $name = Auth::user()?->name ?? 'Guest';
    $email = auth()->user()?->email ?? '';
    $userId = $request->user()?->id;
    return view('profile', compact('name', 'email'));
}
```

**Scenario 4: FormRequest With Unconditional Authorization**

The analyzer flags `FormRequest::authorize()` methods that return `true` unconditionally, meaning _any_ user (including unauthenticated ones) can submit the form. This is only flagged when the FormRequest is injected into a sensitive, unprotected controller action; orphaned FormRequests and those used in auth-gated actions are skipped.

```php
// BAD - Anyone can submit, no real authorization check
class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Flagged: anyone can call this action
    }

    public function rules(): array
    {
        return ['title' => 'required|string|max:255'];
    }
}
```

```php
// GOOD - Check that the user actually owns the resource
class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        $post = $this->route('post');
        return $this->user()->can('update', $post);
    }

    public function rules(): array
    {
        return ['title' => 'required|string|max:255'];
    }
}

// GOOD - Delegate to a Gate or Policy
class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update-post', $this->route('post'));
    }
}
```

::: tip
If the controller action is already protected by `auth` middleware, the FormRequest `authorize()` returning `true` is not flagged (the middleware already guarantees the user is authenticated). The flag only appears when there is no surrounding auth context.
:::

### Proper Fix (25 minutes)

Implement comprehensive authentication and authorization across your application:

**1. Protect Routes with Middleware**

```php
// routes/web.php

// Public routes (no auth required)
Route::get('/', [HomeController::class, 'index']);
Route::get('/about', [PageController::class, 'about']);

// Authentication routes (public)
Route::get('/login', [AuthController::class, 'showLogin']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes - Require authentication
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::resource('posts', PostController::class);
});

// Admin routes - Require authentication + admin role
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::get('/users', [Admin\UserController::class, 'index']);
    Route::delete('/users/{id}', [Admin\UserController::class, 'destroy']);
});

// API routes with Sanctum
Route::middleware(['auth:sanctum'])->prefix('api')->group(function () {
    Route::get('/user', fn() => Auth::user());
    Route::apiResource('posts', Api\PostController::class);
});
```

**2. Add Controller-Level Authentication**

```php
// app/Http/Controllers/PostController.php

namespace App\Http\Controllers;

class PostController extends Controller
{
    public function __construct()
    {
        // Require auth for all methods
        $this->middleware('auth');

        // Or require auth only for specific methods
        $this->middleware('auth')->only(['create', 'store', 'edit', 'update', 'destroy']);

        // Or require auth except for specific methods
        $this->middleware('auth')->except(['index', 'show']);
    }

    public function destroy($id)
    {
        // Now safe - middleware ensures user is authenticated
        $post = Post::findOrFail($id);
        $post->delete();
        return redirect('/posts');
    }
}
```

**3. Implement Authorization with Policies**

```php
// app/Policies/PostPolicy.php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    public function update(User $user, Post $post): bool
    {
        // Only the post owner can update
        return $user->id === $post->user_id;
    }

    public function delete(User $user, Post $post): bool
    {
        // Owner or admin can delete
        return $user->id === $post->user_id || $user->isAdmin();
    }
}

// Register in AuthServiceProvider
protected $policies = [
    Post::class => PostPolicy::class,
];

// Use in controller
public function update(Request $request, Post $post)
{
    $this->authorize('update', $post);
    $post->update($request->validated());
    return redirect('/posts');
}

public function destroy(Post $post)
{
    $this->authorize('delete', $post);
    $post->delete();
    return redirect('/posts');
}
```

**4. Use Gates for Simple Authorization**

```php
// app/Providers/AuthServiceProvider.php

use Illuminate\Support\Facades\Gate;

public function boot()
{
    Gate::define('manage-users', function (User $user) {
        return $user->role === 'admin';
    });

    Gate::define('publish-posts', function (User $user) {
        return $user->role === 'editor' || $user->role === 'admin';
    });
}

// Use in controllers
public function publish(Post $post)
{
    Gate::authorize('publish-posts');
    $post->published_at = now();
    $post->save();
    return redirect('/posts');
}
```

**5. Resource Controllers with Authorization**

```php
// Automatic authentication and authorization for resource routes
Route::middleware(['auth'])->group(function () {
    Route::resource('posts', PostController::class);
});

class PostController extends Controller
{
    public function __construct()
    {
        // Automatically authorize using policies
        $this->authorizeResource(Post::class, 'post');
    }

    // Laravel automatically calls policy methods:
    // - viewAny for index
    // - view for show
    // - create for create/store
    // - update for edit/update
    // - delete for destroy
}
```

**6. Testing Authentication**

```php
// tests/Feature/AuthenticationTest.php

use Tests\TestCase;
use App\Models\User;

class AuthenticationTest extends TestCase
{
    public function test_guests_cannot_access_protected_routes()
    {
        $response = $this->post('/posts', ['title' => 'Test']);
        $response->assertRedirect('/login');
    }

    public function test_authenticated_users_can_create_posts()
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->post('/posts', [
            'title' => 'Test Post'
        ]);
        $response->assertSuccessful();
    }

    public function test_users_cannot_delete_others_posts()
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($otherUser)->delete("/posts/{$post->id}");
        $response->assertForbidden();
    }
}
```

## ShieldCI Configuration

#### Public Routes (Exact Path Matching)

By default, the analyzer recognizes these exact public route paths and skips them:

`/login`, `/register`, `/password/reset`, `/password/email`, `/forgot-password`, `/reset-password`, `/email/verify`, `/health`, `/status`, `/up`

Each entry is an **exact path**: `/login` matches only `Route::post('/login', ...)`, not `/auth/login` or `/api/v1/login`.

To add custom public routes, publish the config and add exact paths to the `public_routes` array:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'security' => [
        'enabled' => true,

        'authentication-authorization' => [
            'public_routes' => [
                '/webhooks/stripe',
                '/webhooks/github',
                '/satis/auth',
                '/auth/login',         // If your login route is nested
                '/api/oauth/token',
            ],
        ],
    ],
],
```

::: tip
Each entry must be an exact route path starting with `/`. For example, `/webhooks/stripe` matches only `Route::post('/webhooks/stripe', ...)`.
:::

#### Custom Auth Middleware Detection

The analyzer automatically detects custom middleware classes used via `->middleware(YourMiddleware::class)`. It introspects the middleware source file for authentication signals:

- `$request->bearerToken()` - bearer token extraction
- `$request->getPassword()` - HTTP Basic Auth password extraction
- `AuthenticationException` - Laravel's auth exception
- `AuthenticatesRequests` - Laravel's auth interface
- `Illuminate\Contracts\Auth\Factory` - Auth factory injection
- `Auth $auth` - Auth factory injected via constructor type-hint

```php
// This route will NOT be flagged — ValidateApiToken uses bearerToken()
Route::post('/reports', [ReportController::class, 'store'])
    ->middleware(ValidateApiToken::class);
```

## References

- [Laravel Authentication Documentation](https://laravel.com/docs/authentication)
- [Laravel Authorization Documentation](https://laravel.com/docs/authorization)
- [Laravel Policies](https://laravel.com/docs/authorization#creating-policies)
- [Laravel Gates](https://laravel.com/docs/authorization#gates)
- [Laravel Sanctum (API Authentication)](https://laravel.com/docs/sanctum)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Related Analyzers

- [CSRF Protection Analyzer](/analyzers/security/csrf-protection) - Validates CSRF token requirements
- [Application Key Analyzer](/analyzers/security/app-key-security) - Ensures encryption keys are secure
- [Cookie Analyzer](/analyzers/security/cookie) - Validates session cookie security configuration
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Prevents debug mode in production
