---
title: GDPR Compliance Analyzer
description: Validates basic GDPR compliance patterns including data deletion capability, encryption at rest, privacy policy route, data export, and PII protection in logs
icon: lock
outline: [2, 3]
tags: compliance,gdpr,privacy,data-protection,security
pro: true
---

# GDPR Compliance Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `gdpr-compliance` | 🛡️ Security  | Medium    | 30 minutes   |

## What This Checks

Scans `app/Models/User.php`, `app/Models/Profile.php`, `app/Models/Customer.php`,
`database/migrations/`, `routes/web.php`, `routes/api.php`, and `config/logging.php`
for technical GDPR compliance signals. Checks for:

- **Data deletion capability (Article 17)** - `SoftDeletes` trait, anonymize/purge method on the User model, or a dedicated `UserDeletionService` / `UserErasureService`
- **Encryption at rest** - `encrypted` casts in `User`, `Profile`, and `Customer` models for sensitive personal fields that are actually present and not already encrypted (e.g. `phone`, `address`, `national_id`). Identifier fields such as `email`, `password`, and `remember_token` are intentionally excluded, and a model with no encryptable sensitive field (e.g. a thin auth model with only `name`, `email`, `password`) is not flagged.
- **Privacy policy route** - a `/privacy` or `/privacy-policy` route in web or API route files
- **Data export capability (Article 20)** - an export controller, export route, `app/Exports/` directory, or `export` / `downloadData` method on the User model
- **PII protection in logs** - log sanitization (`SanitizeLog`, `mask`, `redact`, `scrub`, `replace_placeholders`) in `config/logging.php` or a custom processor in `app/Logging/`

::: tip SoftDeletes is not sufficient for true erasure
`SoftDeletes` preserves all personal data in the database: soft-deleted records are still
readable by database admins and analytical tools. GDPR Article 17 requires that data be
**truly erased or anonymized**. Add an `anonymize()` method alongside `SoftDeletes`, or
use the `Prunable` / `MassPrunable` traits to schedule automatic hard-deletion of
soft-deleted records after a retention period.
:::

## Why It Matters

- **Legal Obligation:** GDPR fines can reach 4% of annual global turnover or EUR 20 million
- **Right to Erasure (Art. 17):** Users must be able to request deletion or anonymization of their personal data
- **Data Protection (Art. 25):** Sensitive personal data must be encrypted at rest
- **Lawful Basis (Art. 6):** All processing requires a documented lawful basis — typically contractual necessity for SaaS core features, or consent for marketing and non-essential processing
- **Transparency (Art. 13/14):** Users must be informed about how their data is processed via a privacy policy

## How to Fix

### Quick Fix (10 minutes)

Add a privacy policy route and data deletion capability:

```php
// routes/web.php
Route::get('/privacy-policy', [PageController::class, 'privacy'])
    ->name('privacy-policy');

// app/Models/User.php
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use SoftDeletes;

    public function anonymize(): void
    {
        $this->update([
            'name' => 'Deleted User',
            'email' => 'deleted-' . $this->id . '@anonymized.local',
        ]);
        $this->delete();
    }
}
```

### Proper Fix (30 minutes)

**1. Encrypt sensitive personal data:**

```php
class User extends Authenticatable
{
    protected $casts = [
        'phone'         => 'encrypted',
        'address'       => 'encrypted',
        'date_of_birth' => 'encrypted:date',
    ];
}
```

::: warning Do not encrypt login or unique identifier fields
Laravel's `encrypted` cast is **non-deterministic** — it uses a random IV per write,
so the same plaintext encrypts to a different ciphertext each time. Applying it to
`email` (or any field you query by equality or enforce a `unique` constraint on)
breaks `where('email', ...)` lookups, authentication, and the unique index. These
fields need **deterministic or blind-index encryption**, which Laravel does not ship
out of the box. The analyzer never recommends encrypting `email`, `password`, or
`remember_token` for this reason.
:::

**2. Implement true erasure alongside SoftDeletes:**

```php
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use SoftDeletes;

    public function anonymize(): void
    {
        $this->update([
            'name'  => 'Deleted User',
            'email' => 'deleted-' . $this->id . '@anonymized.local',
            'phone' => null,
        ]);
        $this->delete(); // soft-delete after anonymization
    }
}
```

**3. Add data export endpoint (Article 20: Right to Data Portability):**

```php
// app/Http/Controllers/UserDataExportController.php
class UserDataExportController extends Controller
{
    public function export(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = [
            'personal' => $user->only(['name', 'email', 'phone']),
            'orders'   => $user->orders->toArray(),
            'consents' => $user->consents->toArray(),
        ];

        return response()->json($data)
            ->header('Content-Disposition', 'attachment; filename="my-data.json"');
    }
}
```

```php
// routes/web.php
Route::get('/user/export', [UserDataExportController::class, 'export'])
    ->middleware('auth')
    ->name('user.data.export');
```

**4. Add PII protection to logging:**

```php
// app/Logging/SanitizePiiProcessor.php
use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;

class SanitizePiiProcessor implements ProcessorInterface
{
    private array $keys = ['email', 'phone', 'ip', 'password', 'token'];

    public function __invoke(LogRecord $record): LogRecord
    {
        $extra = $record->extra;
        foreach ($this->keys as $key) {
            if (isset($extra[$key])) {
                $extra[$key] = '***';
            }
        }

        return $record->with(extra: $extra);
    }
}
```

```php
// config/logging.php — register the processor on your default channel
'channels' => [
    'stack' => [
        'driver'     => 'stack',
        'channels'   => ['daily'],
        'processors' => [SanitizePiiProcessor::class],
    ],
],
```

## References

- [GDPR Official Text](https://gdpr-info.eu/)
- [GDPR Article 17 - Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)
- [GDPR Article 20 - Right to Data Portability](https://gdpr-info.eu/art-20-gdpr/)
- [Laravel Encryption Casts](https://laravel.com/docs/eloquent-mutators#encrypted-casting)
- [Laravel Model Pruning (SoftDeletes)](https://laravel.com/docs/eloquent#pruning-models)
- [OWASP Privacy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/User_Privacy_Protection_Cheat_Sheet.html)

## Related Analyzers

- [Audit Logging](/analyzers/security/audit-logging) - Validates audit trail logging
- [Cookie](/analyzers/security/cookie) - Checks cookie security configuration
- [Telescope Security](/analyzers/security/telescope-security) - Validates debug tool security
