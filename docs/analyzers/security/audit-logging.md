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

- Authentication event logging (Login, Logout, Failed, Registered, PasswordReset)
- Model activity logging on sensitive models (User, Order, Payment, Transaction, Invoice)
- Admin action logging in admin controllers
- Dedicated audit/security log channel configuration

## Why It Matters

- **Incident Response:** Without audit logs, security breaches cannot be investigated or understood
- **Compliance:** SOC 2, HIPAA, PCI-DSS, and GDPR all require audit trails for sensitive operations
- **Forensics:** Audit logs provide the timeline needed to understand what happened during a breach
- **Accountability:** Logging admin actions creates accountability and deters misuse

## How to Fix

### Quick Fix (5 minutes)

Register authentication event listeners:

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

**3. Log admin actions:**

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
