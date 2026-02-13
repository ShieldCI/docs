---
title: GDPR Compliance Analyzer
description: Validates basic GDPR compliance patterns including data deletion, consent tracking, and encryption at rest
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

Validates basic GDPR compliance patterns in your Laravel application. Checks for:

- Data deletion capability (Article 17: Right to Erasure)
- Encryption at rest for sensitive personal data fields
- Consent tracking mechanism (models, migrations, or columns)
- Privacy policy route definition

## Why It Matters

- **Legal Obligation:** GDPR fines can reach 4% of annual global turnover or EUR 20 million
- **Right to Erasure:** Users must be able to request deletion of their personal data
- **Data Protection:** Sensitive personal data must be encrypted at rest
- **Consent:** Processing personal data requires documented, explicit consent
- **Transparency:** Users must be informed about how their data is processed

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
        'phone' => 'encrypted',
        'address' => 'encrypted',
        'date_of_birth' => 'encrypted:date',
    ];
}
```

**2. Implement consent tracking:**

```bash
php artisan make:model Consent -m
```

```php
// database/migrations/create_consents_table.php
Schema::create('consents', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('type'); // 'marketing', 'analytics', 'terms'
    $table->boolean('granted');
    $table->timestamp('granted_at')->nullable();
    $table->timestamp('revoked_at')->nullable();
    $table->string('ip_address')->nullable();
    $table->timestamps();
});
```

**3. Add data export (Article 20: Right to Portability):**

```php
class UserDataExportController extends Controller
{
    public function export(Request $request)
    {
        $user = $request->user();

        $data = [
            'personal' => $user->only(['name', 'email', 'phone']),
            'orders' => $user->orders->toArray(),
            'consents' => $user->consents->toArray(),
        ];

        return response()->json($data)
            ->header('Content-Disposition', 'attachment; filename="my-data.json"');
    }
}
```

## References

- [GDPR Official Text](https://gdpr-info.eu/)
- [GDPR Article 17 - Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)
- [Laravel Encryption](https://laravel.com/docs/encryption)
- [OWASP GDPR Checklist](https://owasp.org/www-project-web-security-testing-guide/)

## Related Analyzers

- [Audit Logging](/analyzers/security/audit-logging) - Validates audit trail logging
- [Cookie](/analyzers/security/cookie) - Checks cookie security configuration
- [Telescope Security](/analyzers/security/telescope-security) - Validates debug tool security
