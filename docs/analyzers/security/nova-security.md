---
title: Nova Security Analyzer
description: Validates that Laravel Nova admin panel is properly secured with authentication, authorization gates, and resource-level policies
icon: shield
outline: [2, 3]
tags: nova,admin,authentication,security,authorization
pro: true
---

# Nova Security Analyzer

| Analyzer ID     | Category     | Severity   | Time To Fix  |
| --------------- | :----------: |:----------:| ------------:|
| `nova-security` | 🛡️ Security  | Critical   | 15 minutes   |

## What This Checks

This analyzer validates the security configuration of Laravel Nova to ensure the admin panel is not publicly accessible and has proper authorization controls at multiple levels.

**Checks Performed:**

#### Service Provider Validation
- **NovaServiceProvider existence** - Verifies `app/Providers/NovaServiceProvider.php` exists
- **Nova::auth() gate** - Checks that an authorization gate is defined to restrict panel access
- **Gate callback presence** - Verifies the auth gate has a proper closure or arrow function
- **Hardcoded boolean returns** - Flags `return true;` or `return false;` in the auth gate as insecure
- **User permission checks** - Validates that the gate checks user roles or permissions (`$request->user()`, `->can()`, `->isAdmin()`, `->hasRole()`)

#### Configuration File Validation
- **Middleware configuration** - Flags when `config/nova.php` only includes `web` middleware without `auth`
- **Predictable path** - Warns when Nova uses predictable paths like `/nova` or `/admin`

#### User Model Validation
- **viewNova policy method** - Checks if the User model has a `viewNova()` method for fine-grained authorization

::: tip When This Analyzer Runs
This analyzer only runs when Laravel Nova is installed (detected via `"laravel/nova"` in `composer.json`). If Nova is not installed, the analyzer is automatically skipped.
:::

## Why It Matters

An unsecured Nova admin panel provides complete administrative access to your application, exposing:

- **Full Database Access** - CRUD operations on all application resources and sensitive data
- **User Management** - Ability to create, modify, and delete user accounts including administrators
- **Application Configuration** - Settings, feature flags, and system configuration changes
- **File Management** - Upload, download, and delete files through Nova file fields
- **Custom Actions** - Execution of bulk operations, data exports, and administrative actions
- **Sensitive Data** - Payment records, personal information, and business-critical data

A publicly accessible Nova panel is equivalent to giving an attacker full database admin access with a user-friendly interface.

## How to Fix

### Quick Fix (5 minutes)

Add a `Nova::auth()` gate in your `NovaServiceProvider`:

**Before:**
```php
// app/Providers/NovaServiceProvider.php
class NovaServiceProvider extends NovaApplicationServiceProvider
{
    protected function gate(): void
    {
        // NO AUTHORIZATION - Nova admin panel is publicly accessible!
    }
}
```

**After:**
```php
// app/Providers/NovaServiceProvider.php
use Laravel\Nova\Nova;

class NovaServiceProvider extends NovaApplicationServiceProvider
{
    protected function gate(): void
    {
        Nova::auth(function ($request) {
            return $request->user()?->can('viewNova') ?? false;
        });
    }
}
```

### Proper Fix (15 minutes)

Implement multi-layered authorization with user policies and environment-aware checks:

**Step 1: Add `viewNova()` policy to User model:**

```php
// app/Models/User.php
class User extends Authenticatable
{
    public function viewNova(): bool
    {
        return $this->hasRole('admin') || $this->hasRole('super-admin');
    }
}
```

**Step 2: Configure the auth gate with user checks:**

```php
// app/Providers/NovaServiceProvider.php
use Laravel\Nova\Nova;

class NovaServiceProvider extends NovaApplicationServiceProvider
{
    protected function gate(): void
    {
        Nova::auth(function ($request) {
            // Require authentication AND specific permission
            return $request->user()?->can('viewNova') ?? false;
        });
    }
}
```

**Step 3: Secure the Nova configuration:**

```php
// config/nova.php
return [
    // Use environment variable for path (less predictable)
    'path' => env('NOVA_PATH', 'admin-panel'),

    // Require both web session AND authentication
    'middleware' => [
        'web',
        'auth',
        \Laravel\Nova\Http\Middleware\Authenticate::class,
        \Laravel\Nova\Http\Middleware\Authorize::class,
    ],

    // ...other config
];
```

**Best Practice: Add resource-level policies:**

```php
// app/Policies/UserPolicy.php
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('super-admin');
    }

    public function view(User $user, User $model): bool
    {
        return $user->hasRole('super-admin') || $user->id === $model->id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('super-admin');
    }

    public function delete(User $user, User $model): bool
    {
        // Prevent users from deleting themselves
        return $user->hasRole('super-admin') && $user->id !== $model->id;
    }
}
```

```php
// app/Nova/User.php
class User extends Resource
{
    // Nova automatically uses UserPolicy for authorization
    public static string $model = \App\Models\User::class;
}
```


## References

- [Laravel Nova Documentation](https://nova.laravel.com/docs)
- [Laravel Nova Authorization](https://nova.laravel.com/docs/resources/authorization.html)
- [Laravel Authorization (Policies)](https://laravel.com/docs/authorization)
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
- [CWE-284: Improper Access Control](https://cwe.mitre.org/data/definitions/284.html)
- [CWE-306: Missing Authentication for Critical Function](https://cwe.mitre.org/data/definitions/306.html)
- [CWE-862: Missing Authorization](https://cwe.mitre.org/data/definitions/862.html)

## Related Analyzers

- [Horizon Security Analyzer](/analyzers/security/horizon-security) - Validates Laravel Horizon dashboard security
- [Authentication Authorization Analyzer](/analyzers/security/authentication-authorization) - Checks authentication and authorization configuration
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Ensures debug mode is disabled in production
- [Mass Assignment Vulnerabilities Analyzer](/analyzers/security/mass-assignment-vulnerabilities) - Protects against mass assignment in models

---
