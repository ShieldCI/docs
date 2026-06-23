---
title: Login Throttling Analyzer
description: Detects missing rate limiting on authentication endpoints to prevent brute force attacks
icon: shield-alert
outline: [2, 3]
tags: authentication,rate-limiting,brute-force,security,throttling
---

# Login Throttling Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `login-throttling` | 🛡️ Security  | High       | 20 minutes   |

## What This Checks

Detects missing rate limiting on authentication endpoints to prevent brute force attacks. Validates that login routes have throttle middleware, controllers use Laravel's throttling traits, a form request throttles via `RateLimiter` (such as the official starter kits' `App\Http\Requests\Auth\LoginRequest::ensureIsNotRateLimited()`), or `RateLimiter` is implemented to restrict failed login attempts.

## Why It Matters

- **Security Risk:** HIGH - Without rate limiting, attackers can attempt unlimited password combinations
- **Brute Force Attacks:** Automated tools can try thousands of password combinations per minute
- **Credential Stuffing:** Leaked credentials from other breaches can be tested against your app
- **Account Takeover:** Successful brute force attacks lead to unauthorized account access
- **Resource Exhaustion:** Unlimited login attempts can overwhelm your authentication system

Brute force attacks are one of the most common attack vectors against web applications. Without throttling, an attacker can:
- Try 10,000+ password combinations in minutes
- Use credential stuffing attacks with millions of leaked username/password pairs
- Bypass weak passwords through systematic enumeration
- Cause denial of service by overwhelming authentication endpoints

**Real-World Impact:**
- In 2023, brute force attacks accounted for 20% of all web application breaches
- Average brute force attack attempts 300-1000 passwords per minute
- Credential stuffing attacks succeeded against 0.1% of accounts (high volume = significant impact)
- Unthrottled endpoints are discovered and exploited within hours of deployment

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: Add Throttle Middleware to Route**

```php
// routes/web.php

// ❌ BAD - No rate limiting
Route::post('/login', [LoginController::class, 'login']);

// ✅ GOOD - Throttle to 5 attempts per minute
Route::post('/login', [LoginController::class, 'login'])
     ->middleware('throttle:5,1');
```

**Scenario 2: Apply Throttle to Route Group**

```php
// routes/web.php

// Throttle all auth routes together
Route::middleware(['throttle:5,1'])->group(function () {
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/register', [RegisterController::class, 'register']);
    Route::post('/password/email', [ForgotPasswordController::class, 'sendResetLink']);
});
```

**Scenario 3: Use Laravel UI Traits (Built-in Throttling)**

```php
// app/Http/Controllers/Auth/LoginController.php

use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Foundation\Auth\ThrottlesLogins;

class LoginController extends Controller
{
    use AuthenticatesUsers;  // Includes ThrottlesLogins automatically

    // No additional code needed - throttling is built-in!
}
```

### Proper Fix (20 minutes)

**1. Configure Named Rate Limiters**

::: code-group
```php [Laravel 11+]
// app/Providers/AppServiceProvider.php

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    // Login throttling: 5 attempts per minute
    RateLimiter::for('login', function (Request $request) {
        return Limit::perMinute(5)->by($request->input('email'));
    });

    // Stricter throttling for failed attempts
    RateLimiter::for('login-strict', function (Request $request) {
        return [
            Limit::perMinute(3)->by($request->input('email')),
            Limit::perHour(10)->by($request->ip()),
        ];
    });
}
```

```php [Laravel 9–10]
// app/Providers/RouteServiceProvider.php

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

public function boot()
{
    // Login throttling: 5 attempts per minute
    RateLimiter::for('login', function (Request $request) {
        return Limit::perMinute(5)->by($request->input('email'));
    });

    // Stricter throttling for failed attempts
    RateLimiter::for('login-strict', function (Request $request) {
        return [
            Limit::perMinute(3)->by($request->input('email')),
            Limit::perHour(10)->by($request->ip()),
        ];
    });
}
```
:::

**2. Apply Named Limiter to Routes**

```php
// routes/web.php

Route::post('/login', [LoginController::class, 'login'])
     ->middleware('throttle:login');

// Or use the stricter version
Route::post('/admin/login', [AdminLoginController::class, 'login'])
     ->middleware('throttle:login-strict');
```

**3. Implement Custom Controller Throttling**

```php
// app/Http/Controllers/Auth/LoginController.php

use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $key = 'login.' . $request->input('email');

        // Check if too many attempts
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            throw ValidationException::withMessages([
                'email' => [
                    "Too many login attempts. Please try again in {$seconds} seconds."
                ],
            ]);
        }

        // Attempt authentication
        if (Auth::attempt($request->only('email', 'password'))) {
            // Clear rate limiter on success
            RateLimiter::clear($key);

            return redirect()->intended('dashboard');
        }

        // Increment failed attempts
        RateLimiter::hit($key, 60);  // Lock for 60 seconds after 5 attempts

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ]);
    }
}
```

**4. Progressive Rate Limiting (Recommended)**

::: code-group
```php [Laravel 11+]
// app/Providers/AppServiceProvider.php

RateLimiter::for('login', function (Request $request) {
    $email = $request->input('email');

    return [
        // First 3 attempts: 1 minute lockout
        Limit::perMinute(3)->by($email)->response(function () {
            return response('Please wait 1 minute before trying again.', 429);
        }),

        // Next 5 attempts: 10 minute lockout
        Limit::perMinutes(10, 5)->by($email),

        // After that: 1 hour lockout
        Limit::perHour(10)->by($email),

        // Also limit by IP to prevent distributed attacks
        Limit::perHour(20)->by($request->ip()),
    ];
});
```

```php [Laravel 9–10]
// app/Providers/RouteServiceProvider.php

RateLimiter::for('login', function (Request $request) {
    $email = $request->input('email');

    return [
        // First 3 attempts: 1 minute lockout
        Limit::perMinute(3)->by($email)->response(function () {
            return response('Please wait 1 minute before trying again.', 429);
        }),

        // Next 5 attempts: 10 minute lockout
        Limit::perMinutes(10, 5)->by($email),

        // After that: 1 hour lockout
        Limit::perHour(10)->by($email),

        // Also limit by IP to prevent distributed attacks
        Limit::perHour(20)->by($request->ip()),
    ];
});
```
:::

**5. Add User-Friendly Lockout Messages**

```php
// app/Http/Middleware/ThrottleRequests.php (override)

protected function buildException($request, $key, $maxAttempts, $responseCallback = null)
{
    $retryAfter = $this->limiter->availableIn($key);

    $message = "Too many login attempts. Please try again in " .
               gmdate('i:s', $retryAfter) . " (mm:ss).";

    return new ThrottleRequestsException($message, null, [], $retryAfter);
}
```

**6. Monitor Failed Attempts**

```php
// app/Http/Controllers/Auth/LoginController.php

use Illuminate\Support\Facades\Log;

protected function sendFailedLoginResponse(Request $request)
{
    $email = $request->input('email');
    $attempts = RateLimiter::attempts('login.' . $email);

    // Log suspicious activity
    if ($attempts >= 3) {
        Log::warning('Multiple failed login attempts', [
            'email' => $email,
            'ip' => $request->ip(),
            'attempts' => $attempts,
            'user_agent' => $request->userAgent(),
        ]);
    }

    throw ValidationException::withMessages([
        'email' => [trans('auth.failed')],
    ]);
}
```

## References

- [Laravel Routing - Rate Limiting](https://laravel.com/docs/routing#rate-limiting)
- [Laravel Authentication - Throttling](https://laravel.com/docs/authentication#login-throttling)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#account-lockout)
- [OWASP Brute Force Prevention](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [Laravel RateLimiter Documentation](https://laravel.com/docs/cache#rate-limiting)
- [CWE-307: Improper Restriction of Excessive Authentication Attempts](https://cwe.mitre.org/data/definitions/307.html)

## Related Analyzers

- [CSRF Protection Analyzer](/analyzers/security/csrf-protection) - Prevents cross-site request forgery
- [Cookie Analyzer](/analyzers/security/cookie) - Validates secure session cookie configuration
- [Password Security Analyzer](/analyzers/security/password-security) - Ensures strong password hashing, policies, and rehash usage
- [Authentication & Authorization Analyzer](/analyzers/security/authentication-authorization) - Validates authentication implementation
