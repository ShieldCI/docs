---
title: Cashier Security Analyzer
description: Validates Laravel Cashier Stripe webhook verification, key exposure, and payment handling security
icon: lock
outline: [2, 3]
tags: security,cashier,stripe,payments,billing
pro: true
---

# Cashier Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `cashier-security` | 🛡️ Security  | High    | 15 minutes   |

## What This Checks

Validates Laravel Cashier Stripe integration security. Checks for:

- Webhook routes verify signatures via `VerifyWebhookSignature` middleware
- `STRIPE_WEBHOOK_SECRET` is configured
- `IncompletePaymentException` is handled for subscribe/charge calls
- No Stripe secret keys (`sk_live_`, `sk_test_`) in Blade/JS files
- Cashier migrations are published and customized

## Why It Matters

- **Payment Fraud:** Unverified webhooks allow attackers to forge subscription events and grant free access
- **Secret Key Exposure:** Stripe secret keys in frontend code give attackers full control of your Stripe account
- **SCA Compliance:** Without `IncompletePaymentException` handling, 3D Secure payments fail silently
- **Data Integrity:** Default migrations may not capture all billing data your application needs

## How to Fix

### Quick Fix (5 minutes)

Add webhook verification:

```php
// routes/web.php
Route::post('/stripe/webhook', WebhookController::class)
    ->middleware(\Laravel\Cashier\Http\Middleware\VerifyWebhookSignature::class);
```

Set the webhook secret:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here
```

### Proper Fix (15 minutes)

**1. Handle incomplete payments (3D Secure/SCA):**

```php
use Laravel\Cashier\Exceptions\IncompletePaymentException;

try {
    $user->newSubscription('default', $priceId)->create($paymentMethod);
} catch (IncompletePaymentException $e) {
    return redirect()->route('cashier.payment', [
        $e->payment->id,
        'redirect' => route('billing'),
    ]);
}
```

**2. Remove secret keys from frontend files:**

```php
// Only use publishable keys in Blade/JS:
<script>
    const stripe = Stripe('{{ config('cashier.key') }}'); // pk_live_ or pk_test_
</script>
```

**3. Publish and customize migrations:**

```bash
php artisan vendor:publish --tag=cashier-migrations
```

## References

- [Laravel Cashier Documentation](https://laravel.com/docs/billing)
- [Stripe Webhook Signatures](https://stripe.com/docs/webhooks/signatures)
- [Stripe SCA/3D Secure](https://stripe.com/docs/strong-customer-authentication)
- [OWASP Payment Security](https://owasp.org/www-project-web-security-testing-guide/)

## Related Analyzers

- [Cashier Paddle](/analyzers/security/cashier-paddle) - Validates Cashier Paddle configuration
- [Hardcoded Credentials](/analyzers/security/hardcoded-credentials) - Detects hardcoded secrets
- [Environment File](/analyzers/security/env-file) - Checks .env file security
