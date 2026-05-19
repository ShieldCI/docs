---
title: Policy Authorization Analyzer
description: Validates that resource controllers have corresponding Policy classes for proper authorization enforcement
icon: check-circle
outline: [2, 3]
tags: best-practices,authorization,policies,controllers,laravel
pro: true
---

# Policy Authorization Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `policy-authorization` | 🏅 Best Practices  | Medium    | 20 minutes   |

## What This Checks

Validates that resource controllers use Laravel's Policy system for authorization. Checks for:

- Resource controllers without matching Policy classes in `app/Policies/`
- Resource controllers missing `authorizeResource()` or `authorize()` calls
- Policy classes that don't type-hint an Eloquent model (only flagged when at least one policy method has 2+ parameters; intentionally model-less policies are excluded)
- Policy files where the class name doesn't match the expected policy name
- `authorizeResource()` called with a model that doesn't match the controller name
- Recognizes multiple authorization patterns: `Gate` facades, `middleware('can:...')`, `$user->can()`, `Policy::class` references, and FormRequest `authorize()` methods
- Recognizes route-level authorization: controllers where `->middleware()` is chained directly on the route definition, or within a `Route::middleware()->group()` closure in `routes/*.php`

> [!TIP]
> A "model-less policy" is one whose methods only receive the `$user` parameter (e.g., `viewAny`, `create`). These are valid for user-scoped permissions and are not flagged by this analyzer.

## Why It Matters

- **Authorization Gaps:** Controllers without policies may allow unauthorized access to CRUD operations
- **Consistency:** Policies centralize authorization logic instead of scattering it across controllers
- **Maintainability:** Changes to authorization rules only need to be made in one place
- **Framework Integration:** Policies integrate with gates, Blade directives (`@can`), and FormRequests

## How to Fix

### Quick Fix (5 minutes)

Generate a policy for your model:

```bash
php artisan make:policy PostPolicy --model=Post
```

### Proper Fix (20 minutes)

**1. Create policies for all resource controllers:**

**Before (❌):**
```php
class PostController extends Controller
{
    public function update(Request $request, Post $post)
    {
        // No authorization check — anyone can update any post
        $post->update($request->validated());
    }

    public function destroy(Post $post)
    {
        $post->delete();
    }
}
```

**After (✅):**
```php
// app/Policies/PostPolicy.php
class PostPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Post $post): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('create-posts');
    }

    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }

    public function delete(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
}
```

**2. Use `authorizeResource()` in controllers:**

```php
class PostController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Post::class, 'post');
    }

    public function index() { /* ... */ }
    public function store(StorePostRequest $request) { /* ... */ }
    public function update(UpdatePostRequest $request, Post $post) { /* ... */ }
    public function destroy(Post $post) { /* ... */ }
}
```

**3. Or use `authorize()` per method:**

```php
public function update(Request $request, Post $post)
{
    $this->authorize('update', $post);

    $post->update($request->validated());

    return redirect()->route('posts.show', $post);
}
```

**4. Other accepted patterns:**

```php
// Gate facade
Gate::authorize('update', $post);

// User can() method
if (! $request->user()->can('update', $post)) {
    abort(403);
}

// Middleware-based (constructor or route definition)
public function __construct()
{
    $this->middleware('can:update,post')->only(['update', 'destroy']);
}

// Route-group middleware — all controllers inside are suppressed
Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('posts', PostController::class);
});
```

## References

- [Laravel Authorization Policies](https://laravel.com/docs/authorization#creating-policies)
- [Laravel Resource Controllers](https://laravel.com/docs/controllers#resource-controllers)
- [Laravel authorizeResource](https://laravel.com/docs/authorization#via-controller-helpers)

## Related Analyzers

- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
- [Form Request Validation](/analyzers/best-practices/form-request-validation) - Validates FormRequest usage
- [Filament Resource Authorization](/analyzers/security/filament-resource-authorization) - Validates Filament authorization
