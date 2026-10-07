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

- Authentication event logging (Login, Logout, Failed, Registered, PasswordReset) - supports any service provider in `app/Providers`, bootstrap/app.php (Laravel 11+), and dedicated Listener classes
- Model activity logging on sensitive models (User, Order, Payment, Transaction, Invoice, Role, Permission, Setting), anywhere under `app/Models` - detects audit traits and Observer-based logging
- Admin action logging across the admin surface: every controller a route reaches through privileged middleware (`can:` with an ability or on the `User`, `Role` or `Permission` class, spatie/laravel-permission's `role:` or `permission:`, or an `auth:` guard over a separate user provider), wherever it lives, and every Filament resource, page, widget and cluster
- Dedicated audit/security log channel configuration (any channel whose name contains `audit`, `security`, `activity` or `compliance`)
- API token lifecycle logging - Sanctum/Passport `createToken()`, `->revoke()`, and `tokens()->delete()` should be audited for SOC 2/PCI-DSS compliance
- Data export/download operations - `Excel::download()`, `streamDownload()`, `ExportAction`, and `ExportBulkAction` should be logged with actor, scope, and format for GDPR compliance
- `saveQuietly()` and `withoutEvents()` calls that bypass model observers without explicit logging at the call site
- A Filament cluster whose syntax error stopped it parsing

An `activity()` call counts as logging only where it reaches `->log()`: a widget that reads the log with `activity()->latest()->get()` displays an audit trail rather than writing one.

## Why It Matters

- **Incident Response:** Without audit logs, security breaches cannot be investigated or understood
- **Compliance:** SOC 2, HIPAA, PCI-DSS, and GDPR all require audit trails for sensitive operations
- **Forensics:** Audit logs provide the timeline needed to understand what happened during a breach
- **Accountability:** Logging admin actions creates accountability and deters misuse
- **Token security:** Unlogged token creation/revocation means credential theft may go undetected for months
- **Data sovereignty:** GDPR Article 30 requires records of data processing activities, including exports

## How to Fix

### Quick Fix (5 minutes)

Register authentication event listeners:

::: code-group
```php [Laravel 9–10]
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

```php [Laravel 11+]
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
:::

### Proper Fix (20 minutes)

**1. Create a dedicated audit log channel:**

Choose the driver that suits your deployment environment:

::: code-group
```php [Traditional server (daily)]
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

```php [Serverless / Laravel Cloud / Vapor]
// config/logging.php
// stderr is captured by CloudWatch on Lambda, Vapor, and Laravel Cloud
'channels' => [
    'audit' => [
        'driver' => 'errorlog',
        'level' => 'info',
    ],
],
```
:::

Any channel whose name contains `audit`, `security`, `activity` or `compliance` is recognised, such as `audit_trail`.

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

**4. Log admin actions in each controller behind privileged middleware, and in Filament resources.** A controller that writes through a model audited as in steps 2 or 3 needs no logging of its own:

```php
// routes/web.php
Route::middleware(['auth', 'can:manage-users'])->group(function () {
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);
});
```

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

**5. Log API token lifecycle (Sanctum):**

```php
// In your token creation controller
public function createToken(Request $request)
{
    $token = $request->user()->createToken($request->name, $request->abilities ?? ['*']);

    Log::channel('audit')->info('API token created', [
        'user_id' => $request->user()->id,
        'token_name' => $request->name,
        'abilities' => $request->abilities ?? ['*'],
        'ip' => $request->ip(),
    ]);

    return response()->json(['token' => $token->plainTextToken]);
}

// In your token revocation controller
public function revokeToken(Request $request)
{
    $request->user()->currentAccessToken()->delete();

    Log::channel('audit')->info('API token revoked', [
        'user_id' => $request->user()->id,
        'ip' => $request->ip(),
    ]);
}
```

**6. Log data export operations:**

```php
// In your export controller or Filament action
public function export(Request $request)
{
    Log::channel('audit')->info('Data exported', [
        'user_id' => auth()->id(),
        'format' => 'xlsx',
        'filters' => $request->only(['date_from', 'date_to', 'status']),
        'ip' => $request->ip(),
    ]);

    return Excel::download(new UsersExport($request->filters), 'users.xlsx');
}
```

**7. Log bulk operations that bypass observers:**

```php
// When you must use saveQuietly(), add explicit logging
Log::channel('audit')->info('User saved quietly (observers bypassed)', [
    'user_id' => $user->id,
    'changes' => $user->getChanges(),
    'actor_id' => auth()->id(),
]);
$user->saveQuietly();

// When you must use withoutEvents()
Log::channel('audit')->info('Bulk user status change (events bypassed)', [
    'count' => $users->count(),
    'actor_id' => auth()->id(),
]);
User::withoutEvents(function () use ($users) {
    $users->each->update(['status' => 'inactive']);
});
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
