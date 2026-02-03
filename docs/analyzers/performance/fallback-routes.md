---
title: Fallback Route SEO Check
description: Detects fallback routes that can cause soft 404 issues and hurt SEO
icon: route
outline: [2, 3]
tags: seo,routes,fallback,404,performance
---

# Fallback Route SEO Check

| Analyzer ID        | Category       | Severity   | Time To Fix  |
| -------------------| :------------: |:----------:| ------------:|
| `fallback-routes`  | ⚡ Performance  | Low        | 15 minutes   |

## What This Checks

Detects the use of `Route::fallback()` and catch-all routes that can cause "soft 404" issues, negatively impacting SEO by returning 200 OK status codes for non-existent pages.

## Why It Matters

- **SEO Impact:** Search engines like Google will index garbage URLs because they receive 200 OK instead of 404
- **Crawl Budget Waste:** Search engine bots waste crawl budget on non-existent pages
- **Search Console Warnings:** Google Search Console will report "soft 404" issues
- **User Experience:** Users may be confused when non-existent URLs don't show proper 404 pages

When a fallback route returns 200 OK for any URL, search engines assume the content is valid and index it. This can result in thousands of junk pages appearing in search results.

## How to Fix

### Remove Fallback Routes

**Before (problematic):**
```php
// routes/web.php
Route::fallback(function () {
    return view('not-found');  // Returns 200 OK!
});
```

**After (proper 404 handling):**
```php
// Remove the fallback route and let Laravel handle 404s naturally
// Laravel will return proper 404 status codes

// If you need a custom 404 page, use app/Exceptions/Handler.php
```

### Custom 404 Page with Proper Status

**In app/Exceptions/Handler.php:**
```php
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

public function render($request, Throwable $exception)
{
    if ($exception instanceof NotFoundHttpException) {
        return response()->view('errors.404', [], 404);  // Proper 404 status!
    }

    return parent::render($request, $exception);
}
```

**Or create a custom 404 view:**
```blade
{{-- resources/views/errors/404.blade.php --}}
@extends('layouts.app')

@section('content')
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="{{ url('/') }}">Go Home</a>
@endsection
```

### SPA (Single Page Application) Routes

For SPAs, you often need a catch-all route. Ensure your frontend handles 404s properly:

**routes/web.php:**
```php
// Catch-all for SPA - but handle 404s in your frontend
Route::get('/{any}', function () {
    return view('spa');
})->where('any', '^(?!api).*$');  // Exclude API routes
```

**In your Vue/React app:**
```javascript
// Vue Router example
const routes = [
  // ... your routes
  { path: '/:pathMatch(.*)*', component: NotFound }  // Handle 404 in frontend
]
```

For proper SEO with SPAs, consider:
1. Server-side rendering (SSR)
2. Pre-rendering static pages
3. Returning 404 status from the server for known non-existent routes

### API Routes (Acceptable)

Catch-all routes in API prefixes are generally acceptable since APIs aren't indexed:

```php
// routes/api.php - This is OK
Route::fallback(function () {
    return response()->json(['error' => 'Not Found'], 404);  // Returns 404!
});
```

## What Gets Detected

| Pattern | Example | Issue |
|---------|---------|-------|
| `Route::fallback()` | `Route::fallback(fn() => view('404'))` | Soft 404 |
| `/{any}` catch-all | `Route::get('/{any}', ...)` | Potential soft 404 |
| `/{path?}` optional | `Route::get('/{path?}', ...)` | Potential soft 404 |
| `/{slug}` at root | `Route::get('/{slug}', ...)` | Potential soft 404 |

**Ignored:**
- API routes (`/api/*`) - Not indexed by search engines
- Routes with `api` middleware

## ShieldCI Configuration

This analyzer runs in **all environments including CI** since it checks route definitions in code, not runtime behavior.

## References

- [Google Soft 404 Documentation](https://developers.google.com/search/docs/advanced/crawling/soft-404-errors)
- [Laravel Error Handling](https://laravel.com/docs/errors)
- [HTTP Status Codes for SEO](https://developers.google.com/search/docs/crawling-indexing/http-network-errors)

## Related Analyzers

- [Dead Route Analyzer](/analyzers/reliability/dead-routes) - Detects routes pointing to non-existent controllers
- [Route Caching Analyzer](/analyzers/performance/route-caching) - Ensures routes are cached in production
