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

Detects missing authentication and authorization protection throughout your Laravel application. Scans routes, controllers, and code for authentication vulnerabilities including unprotected routes (POST, PUT, PATCH, DELETE), controllers with sensitive methods lacking authentication, missing authorization checks, and unsafe `Auth::user()` usage without null safety checks.

## Why It Matters

- **Security Risk:** CRITICAL - Unprotected routes allow unauthorized access to sensitive operations
- **Data Integrity:** Users could modify or delete data they shouldn't have access to
- **Privacy Violations:** Unprotected routes expose private user data and functionality
- **Application Crashes:** `Auth::user()` can return null, causing runtime errors

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

**Scenario 3: Unsafe Auth::user() Usage**

```php
// BAD - Can crash if user is not authenticated
public function show()
{
    $name = Auth::user()->name; // Null pointer if not logged in!
    return view('profile', ['name' => $name]);
}

// GOOD - Option 1: Use middleware to ensure authentication
Route::get('/profile', [ProfileController::class, 'show'])->middleware('auth');

public function show()
{
    $name = Auth::user()->name; // Safe because middleware ensures authentication
    return view('profile', ['name' => $name]);
}

// GOOD - Option 2: Use null-safe operator (PHP 8.1+)
public function show()
{
    $name = Auth::user()?->name ?? 'Guest';
    return view('profile', ['name' => $name]);
}
```

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
