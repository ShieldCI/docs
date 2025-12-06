---
title: Missing Model Relations Analyzer
description: Detects references to non-existent Eloquent model relations including typos, missing relationship methods, and invalid relation calls using PHPStan static analysis
icon: alert-triangle
outline: [2, 3]
---

# Missing Model Relations Analyzer

| Analyzer ID               | Category       | Severity | Time To Fix |
| --------------------------| :------------: |:--------:| -----------:|
| `missing-model-relation`  | ✅ Reliability | High     | 20 minutes  |

## What This Checks

- Detects calls to undefined model relations
- Identifies typos in relation names
- Catches missing relationship methods (hasMany, belongsTo, etc.)
- Detects attempts to access relations that don't exist
- Validates relation method calls across your entire application
- Uses PHPStan Level 5 static analysis to detect issues before runtime
- Reports exact file location and line number of each invalid relation access
- Identifies both eager loading and lazy loading relation issues

## Why It Matters

- **Runtime crashes**: Calling non-existent relations causes fatal errors: `Call to undefined method User::posts()`
- **Production outages**: Missing relations are common sources of Laravel application crashes
- **Silent failures**: Some relation errors return null instead of crashing, causing data inconsistencies
- **N+1 query problems**: Typos in eager loading prevent optimization: `$users->load('psts')` (typo)
- **Data integrity issues**: Missing relations can break data relationships and cascade operations
- **Refactoring risks**: Renaming relations without updating all references causes breakage
- **Team confusion**: Inconsistent relation names across the codebase lead to developer mistakes
- **Testing gaps**: Relation errors often slip through tests if not all code paths are covered
- **API contract violations**: Missing relations break API responses expecting related data
- **Performance degradation**: Fallback queries due to missing eager loading cause N+1 problems

## How to Fix

### Quick Fix (5 minutes)

If you have a specific missing relation error:

```php
// ❌ Before: Calling undefined relation
$user = User::find(1);
$posts = $user->posts;  // Relation 'posts' is not found

// ✅ After: Define the relation method
class User extends Model
{
    public function posts()
    {
        return $this->hasMany(Post::class);
    }
}
```

### Proper Fix (20 minutes)

#### Fix #1: Define Missing Relations

Always define relationship methods in your Eloquent models:

```php
// ❌ Before: No relation defined
class User extends Model
{
    // Missing posts() relation
}

// Trying to access it causes error
$user->posts;  // Error: Relation posts is not found

// ✅ After: Define the relation
class User extends Model
{
    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }
}

// Now you can access relations safely
$user->posts;
$user->profile;
$user->roles;
```

#### Fix #2: Fix Typos in Relation Names

Ensure relation names match exactly:

```php
// ❌ Before: Typo in relation name
class User extends Model
{
    public function posts()
    {
        return $this->hasMany(Post::class);
    }
}

// Accessing with typo
$user->load('psts');  // Typo: 'psts' instead of 'posts'
$user->post;  // Typo: 'post' instead of 'posts'

// ✅ After: Use correct relation name
$user->load('posts');  // Correct
$user->posts;  // Correct

// ✅ After: Use IDE autocomplete to prevent typos
/** @var User $user */
$user->posts;  // IDE will suggest correct property
```

#### Fix #3: Check for Case Sensitivity

Relation names are case-sensitive:

```php
// ❌ Before: Wrong case
class User extends Model
{
    public function blogPosts()  // camelCase
    {
        return $this->hasMany(Post::class);
    }
}

$user->blogposts;  // Wrong case
$user->BlogPosts;  // Wrong case

// ✅ After: Match exact case
$user->blogPosts;  // Correct camelCase

// ✅ Or: Use snake_case accessor (Laravel converts automatically)
$user->blog_posts;  // Laravel converts to blogPosts()
```

#### Fix #4: Inverse Relations

Ensure both sides of relationships are defined:

```php
// ❌ Before: Only one side defined
class Post extends Model
{
    public function author()
    {
        return $this->belongsTo(User::class);
    }
}

class User extends Model
{
    // Missing inverse relation!
}

$post->author;  // Works
$user->posts;   // Error: Relation posts is not found

// ✅ After: Define both sides
class Post extends Model
{
    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

class User extends Model
{
    public function posts()
    {
        return $this->hasMany(Post::class, 'user_id');
    }
}

$post->author;  // Works
$user->posts;   // Works
```

#### Fix #5: Polymorphic Relations

Ensure polymorphic relations are properly defined:

```php
// ❌ Before: Missing morphable relation
class Comment extends Model
{
    // Missing commentable() relation
}

$comment->commentable;  // Error: Relation commentable is not found

// ✅ After: Define polymorphic relation
class Comment extends Model
{
    public function commentable()
    {
        return $this->morphTo();
    }
}

class Post extends Model
{
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

class Video extends Model
{
    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

// Now it works
$comment->commentable;  // Returns Post or Video
$post->comments;        // Returns comments for post
```

#### Fix #6: Many-to-Many Relations

Define pivot table relations correctly:

```php
// ❌ Before: Missing belongsToMany
class User extends Model
{
    // Missing roles() relation
}

$user->roles;  // Error: Relation roles is not found

// ✅ After: Define many-to-many relation
class User extends Model
{
    public function roles()
    {
        return $this->belongsToMany(Role::class)
            ->withPivot('assigned_at')
            ->withTimestamps();
    }
}

class Role extends Model
{
    public function users()
    {
        return $this->belongsToMany(User::class)
            ->withPivot('assigned_at')
            ->withTimestamps();
    }
}

// Migration for pivot table
Schema::create('role_user', function (Blueprint $table) {
    $table->foreignId('role_id')->constrained();
    $table->foreignId('user_id')->constrained();
    $table->timestamp('assigned_at')->nullable();
    $table->timestamps();
});
```

## PHPStan Integration

This analyzer uses PHPStan Level 5 (included with ShieldCI) to detect missing relations:

```bash
# Run ShieldCI analysis
php artisan shield:analyze --analyzer=missing-model-relation

# Or run all reliability analyzers
php artisan shield:analyze --category=reliability
```

### PHPStan Configuration

PHPStan is included as a required dependency in ShieldCI. If you want to run PHPStan directly:

```bash
# Check for missing model relations
vendor/bin/phpstan analyse app --level=5
```

## Related Analyzers

- [Invalid Method Calls Analyzer](/analyzers/reliability/invalid-method-calls) - Detects invalid method calls
- [Invalid Property Access Analyzer](/analyzers/reliability/invalid-property-access) - Detects invalid property access
- [Invalid Offset Access Analyzer](/analyzers/reliability/invalid-offset-access) - Detects invalid array access
- [Undefined Variable Usage Analyzer](/analyzers/reliability/undefined-variable) - Detects undefined variables

## References

- [Laravel Eloquent Relationships](https://laravel.com/docs/eloquent-relationships)
- [Laravel Eager Loading](https://laravel.com/docs/eloquent-relationships#eager-loading)
- [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)
- [Laravel IDE Helper](https://github.com/barryvdh/laravel-ide-helper)
- [Eloquent: Collections](https://laravel.com/docs/eloquent-collections)
