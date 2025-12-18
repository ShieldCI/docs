---
title: Eloquent N+1 Query Analyzer
description: Identifies missing eager loading that causes N+1 query performance problems, ensuring efficient database access patterns
icon: zap
outline: [2, 3]
tags: laravel,performance,eloquent,database,n+1,optimization,eager-loading,best-practices
---

# Eloquent N+1 Query Analyzer

| Analyzer ID              | Category           | Severity | Time To Fix |
| -------------------------| :----------------: |:--------:| -----------:|
| `eloquent-n-plus-one`    | ⚡ Best Practices  | High     | 30 minutes  |

## What This Checks

Detects missing eager loading that causes N+1 query performance problems in Eloquent. Checks:

- **Relationship access inside loops**: Accessing relationships like `$post->user` inside `foreach`, `for`, `while`, or `do-while` loops
- **Missing with() calls**: Queries without eager loading using `->with()` before the loop
- **Missing load() calls**: Collections without lazy eager loading using `->load()` after fetching
- **Common N+1 patterns**: Typical code patterns like `$post->user->name` or `$post->comments->count()` in loops

**Smart Detection Features:**
- ✅ Excludes common model properties (`id`, `name`, `email`, `created_at`, etc.) that aren't relationships
- ✅ Detects both property access (`$post->user`) and method calls (`$post->user()`)
- ✅ Tracks eager loading from `with()` and `load()` methods
- ✅ Supports nested loops with proper variable tracking
- ✅ Deduplicates same relationship accessed multiple times

## Why It Matters

- **Performance Degradation:** N+1 queries are the #1 performance killer in Laravel applications, causing exponential query growth
- **Database Load:** A loop with 100 posts without eager loading triggers 101 queries (1 for posts + 100 for users) instead of 2 queries
- **Slow Response Times:** What should take 50ms can take 5+ seconds with N+1 queries
- **Server Resource Waste:** Each query consumes database connections, CPU, and network bandwidth
- **Scalability Issues:** Code works fine with 10 records but becomes unusable with 1,000+ records
- **Poor User Experience:** Slow page loads frustrate users and increase bounce rates

**Real-world impact:**
- A blog listing 50 posts without eager loading can trigger 150+ queries (posts, authors, categories)
- Using `Post::with(['user', 'comments'])->get()` reduces 150+ queries to just 3 queries
- Production applications with N+1 issues often experience 10-100x slower response times
- Database servers become overwhelmed during traffic spikes due to query storms

**Example Performance Impact:**

| Records | Without Eager Loading | With Eager Loading | Speedup |
|---------|----------------------|-------------------|---------|
| 10      | 11 queries (100ms)   | 2 queries (20ms)  | 5x      |
| 100     | 101 queries (1s)     | 2 queries (25ms)  | 40x     |
| 1,000   | 1,001 queries (10s+) | 2 queries (50ms)  | 200x+   |

## How to Fix

### Quick Fix (10 minutes)

**Scenario 1: Add Eager Loading with with()**

```php
// ❌ BAD - N+1 query problem (101 queries for 100 posts)
class PostController
{
    public function index()
    {
        $posts = Post::all(); // 1 query

        foreach ($posts as $post) {
            echo $post->user->name;  // 100 queries (one per post)
        }
    }
}

// ✅ GOOD - Use eager loading (2 queries total)
class PostController
{
    public function index()
    {
        $posts = Post::with('user')->get(); // 2 queries (posts + users)

        foreach ($posts as $post) {
            echo $post->user->name; // No additional queries
        }
    }
}
```

**Scenario 2: Multiple Relationships**

```php
// ❌ BAD - N+1 on multiple relationships (201 queries)
$posts = Post::all();

foreach ($posts as $post) {
    echo $post->user->name;      // 100 queries
    echo $post->comments->count(); // 100 queries
}

// ✅ GOOD - Eager load multiple relationships (3 queries)
$posts = Post::with(['user', 'comments'])->get();

foreach ($posts as $post) {
    echo $post->user->name;      // No queries
    echo $post->comments->count(); // No queries
}
```

**Scenario 3: Lazy Eager Loading with load()**

```php
// ❌ BAD - Already fetched data, but forgot eager loading
$posts = Post::all();

// Later in code...
foreach ($posts as $post) {
    echo $post->user->name; // N+1 query
}

// ✅ GOOD - Use lazy eager loading
$posts = Post::all();
$posts->load('user'); // Load relationships after fetching

foreach ($posts as $post) {
    echo $post->user->name; // No additional queries
}
```

### Proper Fix (30 minutes)

Implement comprehensive eager loading patterns across your application:

**1. Eager Load All Needed Relationships**

```php
// ❌ BAD - Multiple N+1 problems
class PostController
{
    public function show(Post $post)
    {
        foreach ($post->comments as $comment) {
            echo $comment->user->name; // N+1
            echo $comment->user->profile->bio; // N+1 on profile
        }
    }
}

// ✅ GOOD - Eager load all relationships
class PostController
{
    public function show(Post $post)
    {
        $post->load('comments.user.profile'); // Nested eager loading

        foreach ($post->comments as $comment) {
            echo $comment->user->name; // No queries
            echo $comment->user->profile->bio; // No queries
        }
    }
}
```

**2. Use Eager Loading in Eloquent Relationships**

```php
// ❌ BAD - N+1 in relationship definition
class Post extends Model
{
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
}

// Later in blade template:
@foreach($post->comments as $comment)
    {{ $comment->user->name }} {{-- N+1 query --}}
@endforeach

// ✅ GOOD - Eager load in relationship or query
class Post extends Model
{
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function commentsWithUser()
    {
        return $this->hasMany(Comment::class)->with('user');
    }
}

// Or in controller:
$post = Post::with('comments.user')->find($id);
```

**3. Eager Load Conditionally**

```php
// ❌ BAD - Loading relationships you don't always need
$posts = Post::with(['user', 'comments', 'tags', 'category'])->get();

// ✅ GOOD - Conditional eager loading
$query = Post::query();

if ($includeAuthor) {
    $query->with('user');
}

if ($includeComments) {
    $query->with('comments.user');
}

$posts = $query->get();
```

**4. Use withCount() for Relationship Counts**

```php
// ❌ BAD - Loading all comments just to count them
$posts = Post::with('comments')->get();

foreach ($posts as $post) {
    echo $post->comments->count(); // Loaded all comments unnecessarily
}

// ✅ GOOD - Use withCount() for efficient counting
$posts = Post::withCount('comments')->get();

foreach ($posts as $post) {
    echo $post->comments_count; // Efficient COUNT() query
}
```

**5. Select Only Needed Columns**

```php
// ❌ BAD - Loading all columns from related models
$posts = Post::with('user')->get();

foreach ($posts as $post) {
    echo $post->user->name; // Only need name, but loaded all user columns
}

// ✅ GOOD - Specify columns to load
$posts = Post::with('user:id,name')->get();

foreach ($posts as $post) {
    echo $post->user->name; // Only loaded id and name columns
}
```

**6. Use Query Scopes for Reusability**

```php
// ❌ BAD - Repeating eager loading everywhere
class PostController
{
    public function index()
    {
        return Post::with(['user', 'comments.user', 'tags'])->get();
    }

    public function show($id)
    {
        return Post::with(['user', 'comments.user', 'tags'])->find($id);
    }
}

// ✅ GOOD - Use query scopes
class Post extends Model
{
    public function scopeWithAllRelations($query)
    {
        return $query->with(['user', 'comments.user', 'tags']);
    }
}

class PostController
{
    public function index()
    {
        return Post::withAllRelations()->get();
    }

    public function show($id)
    {
        return Post::withAllRelations()->find($id);
    }
}
```

**7. Monitor and Debug N+1 Queries**

```php
// ✅ Use Laravel Debugbar in development
composer require barryvdh/laravel-debugbar --dev

// ✅ Use Telescope in development
php artisan telescope:install

// ✅ Enable query logging to detect N+1
DB::enableQueryLog();

// Your code here
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->user->name;
}

// See all queries
dd(DB::getQueryLog());

// ✅ Use N+1 detection packages
composer require beyondcode/laravel-query-detector --dev
```

**8. API Resources with Eager Loading**

```php
// ❌ BAD - N+1 in API resource
class PostResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'author' => $this->user->name, // N+1
            'comments_count' => $this->comments->count(), // N+1
        ];
    }
}

// ✅ GOOD - Eager load in controller
class PostController
{
    public function index()
    {
        $posts = Post::with('user')
            ->withCount('comments')
            ->get();

        return PostResource::collection($posts);
    }
}
```

## References

- [Laravel Eager Loading](https://laravel.com/docs/eloquent-relationships#eager-loading) - Official Laravel documentation
- [Lazy Eager Loading](https://laravel.com/docs/eloquent-relationships#lazy-eager-loading) - Load relationships after fetching
- [Eager Loading Specific Columns](https://laravel.com/docs/eloquent-relationships#eager-loading-specific-columns) - Load only needed columns
- [Laravel Debugbar](https://github.com/barryvdh/laravel-debugbar) - Debug N+1 queries in development
- [Laravel Telescope](https://laravel.com/docs/telescope) - Monitor database queries
- [Query Detector](https://github.com/beyondcode/laravel-query-detector) - Automatically detect N+1 queries

## Related Analyzers

- [Missing Chunk Analyzer](/analyzers/best-practices/chunk-missing) - Detects queries without chunking for large datasets
- [Select Asterisk Analyzer](/analyzers/best-practices/select-asterisk) - Detects inefficient SELECT * queries
- [PHP Side Filtering Analyzer](/analyzers/best-practices/php-side-filtering) - Detects filtering done in PHP vs database
- [Query Builder in Controller](/analyzers/best-practices/query-builder-in-controller) - Promotes repository pattern
