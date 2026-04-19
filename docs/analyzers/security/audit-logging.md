---
title: Audit Logging Analyzer
description: Validates that security-sensitive operations have proper audit logging for compliance and incident response
icon: lock
outline: [2, 3]
tags: security,audit,logging,compliance,monitoring
pro: true
---

# Audit Logging Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `audit-logging` | 🛡️ Security  | Medium    | 20 minutes   |

## What This Checks

Validates that security-sensitive operations have proper audit logging. Checks for:

- Authentication event logging (Login, Logout, Failed, Registered, PasswordReset) — supports EventServiceProvider (Laravel 9/10), AppServiceProvider, bootstrap/app.php (Laravel 11+), and dedicated Listener classes
- Model activity logging on sensitive models (User, Order, Payment, Transaction, Invoice, Role, Permission, Setting) — detects audit traits and Observer-based logging
- Admin action logging in admin controllers, backend controllers, and Filament resources
- Dedicated audit/security log channel configuration

## Why It Matters

- **Incident Response:** Without audit logs, security breaches cannot be investigated or understood
- **Compliance:** SOC 2, HIPAA, PCI-DSS, and GDPR all require audit trails for sensitive operations
- **Forensics:** Audit logs provide the timeline needed to understand what happened during a breach
- **Accountability:** Logging admin actions creates accountability and deters misuse

## How to Fix

### Quick Fix (5 minutes)

Register authentication event listeners:

**Laravel 9/10 (EventServiceProvider):**

```php
// app/Providers/EventServiceProvider.php
protected $listen = [
    \Illuminate\Auth\Events\Login::class => [
        \App\Listeners\LogSuccessfulLogin::class,
    ],
    \Illuminate\Auth\Events\Failed::class => [
        \App\Listeners\LogFailedLogin::class,
    ],
    \Illuminate\Auth\Events\Logout::class => [
        \App\Listeners\LogSuccessfulLogout::class,
    ],
];
```

**Laravel 11+ (AppServiceProvider or bootstrap/app.php):**

```php
// Option A: bootstrap/app.php with event discovery
return Application::configure(basePath: dirname(__DIR__))
    ->withEvents(discover: [
        __DIR__.'/../app/Listeners',
    ])
    ->create();

// Option B: AppServiceProvider::boot()
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;

public function boot(): void
{
    Event::listen(Login::class, function ($event) {
        logger()->info('User logged in', ['user_id' => $event->user->id]);
    });
}
```
```

### Proper Fix (20 minutes)

**1. Create a dedicated audit log channel:**

```php
// config/logging.php
'channels' => [
    'audit' => [
        'driver' => 'daily',
        'path' => storage_path('logs/audit.log'),
        'level' => 'info',
        'days' => 90,
    ],
],
```

**2. Add activity logging to sensitive models:**

```bash
composer require spatie/laravel-activitylog
```

```php
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class User extends Authenticatable
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'role'])
            ->logOnlyDirty();
    }
}
```

**3. Alternative: Use Model Observers for audit logging:**

```php
// app/Observers/UserObserver.php
class UserObserver
{
    public function created(User $user): void
    {
        Log::channel('audit')->info('User created', ['user_id' => $user->id]);
    }

    public function updated(User $user): void
    {
        Log::channel('audit')->info('User updated', [
            'user_id' => $user->id,
            'changes' => $user->getChanges(),
        ]);
    }

    public function deleted(User $user): void
    {
        Log::channel('audit')->info('User deleted', ['user_id' => $user->id]);
    }
}
```

**4. Log admin actions (controllers and Filament resources):**

```php
class AdminUserController extends Controller
{
    public function destroy(User $user)
    {
        Log::channel('audit')->info('Admin deleted user', [
            'admin_id' => auth()->id(),
            'deleted_user_id' => $user->id,
            'deleted_user_email' => $user->email,
        ]);

        $user->delete();
    }
}
```

## References

- [Laravel Events](https://laravel.com/docs/events)
- [Spatie Laravel Activitylog](https://spatie.be/docs/laravel-activitylog)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [CWE-778: Insufficient Logging](https://cwe.mitre.org/data/definitions/778.html)

## Related Analyzers

- [GDPR Compliance](/analyzers/security/gdpr-compliance) - Validates data protection compliance
- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
- [Alerting Configuration](/analyzers/reliability/alerting-config) - Validates alerting mechanisms
