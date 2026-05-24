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

- Webhook routes verify signatures via `VerifyWebhookSignature` middleware (only checked when the app calls `Cashier::ignoreRoutes()` — Cashier auto-registers the route by default)
- `STRIPE_WEBHOOK_SECRET` is configured with a valid webhook signing secret (`whsec_*`)
- `STRIPE_WEBHOOK_SECRET` is not accidentally set to an API key (`sk_*`, `pk_*`, or `rk_*`)
- `IncompletePaymentException` is handled for **synchronous** billing calls — `charge()` and `newSubscription()->create()` — Checkout Sessions (`checkout()`) are exempt because Stripe handles 3DS/SCA on their hosted page
- No Stripe secret keys (`sk_live_`, `sk_test_`) or restricted keys (`rk_*`) in Blade/JS/TS files
- No Stripe secret or restricted keys hardcoded in PHP config or source files
- Checkout and billing portal redirect URLs are not derived from user-controlled request input
- Payment fulfillment does not trust client-side success redirect params without server-side Stripe verification
- Cashier migrations are published and reviewed for your billing model

## Why It Matters

- **Payment Fraud:** Unverified webhooks allow attackers to forge subscription events and grant free access
- **Secret Key Exposure:** Stripe secret keys in frontend code give attackers full control of your Stripe account
- **SCA Compliance:** Without `IncompletePaymentException` handling, 3D Secure payments triggered by `charge()` or `newSubscription()->create()` fail silently
- **Data Integrity:** Default migrations may not capture all billing data your application needs

## How to Fix

### Quick Fix (5 minutes)

Set the webhook secret:

```ini
STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here
```

If you have called `Cashier::ignoreRoutes()` in a service provider, you must also register the webhook route manually:

```php
// routes/web.php — only needed when Cashier::ignoreRoutes() is used.
// Cashier registers this route automatically by default.
Route::post('/stripe/webhook', \Laravel\Cashier\Http\Controllers\WebhookController::class)
    ->middleware(\Laravel\Cashier\Http\Middleware\VerifyWebhookSignature::class);
```

### Proper Fix (15 minutes)

**1. Handle incomplete payments (3D Secure/SCA) for synchronous billing:**

`IncompletePaymentException` is only thrown by synchronous methods that perform an immediate charge. Wrap those calls in a `try/catch` or register a global handler:

```php
use Laravel\Cashier\Exceptions\IncompletePaymentException;

// newSubscription()->create() — synchronous subscription creation
try {
    $user->newSubscription('default', $priceId)->create($paymentMethod);
} catch (IncompletePaymentException $e) {
    return redirect()->route('cashier.payment', [
        $e->payment->id,
        'redirect' => route('billing'),
    ]);
}

// charge() — direct synchronous charge
try {
    $user->charge(1000, $paymentMethod);
} catch (IncompletePaymentException $e) {
    return redirect()->route('cashier.payment', [$e->payment->id]);
}
```

> **Checkout Sessions are exempt.** `$user->checkout()` and `$user->newSubscription()->checkout()` redirect the customer to Stripe's hosted page, where Stripe handles 3DS/SCA natively. `IncompletePaymentException` is never thrown for these flows.

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

**4. Use the correct webhook signing secret format:**

```ini
# CORRECT — webhook signing secret from Stripe Dashboard → Webhooks → Signing secret
STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here

# WRONG — these will be flagged as Critical issues
STRIPE_WEBHOOK_SECRET=sk_live_xxxxx    # API secret key
STRIPE_WEBHOOK_SECRET=pk_live_xxxxx    # Publishable key
STRIPE_WEBHOOK_SECRET=rk_live_xxxxx    # Restricted key
```

**5. Use fixed routes for checkout redirect URLs:**

```php
// WRONG — user-controlled URL is an open redirect risk
return $request->user()->checkout('price_monthly', [
    'success_url' => $request->input('return_to'),  // ❌ user input
]);

// CORRECT — fixed application route
return $request->user()->checkout('price_monthly', [
    'success_url' => route('billing.success'),       // ✅ fixed route
    'cancel_url'  => route('billing'),
]);
```

**6. Verify payments server-side before fulfilling orders:**

```php
// WRONG — trusting client-side redirect params for fulfillment
public function success(Request $request)
{
    $paymentIntentId = $request->input('payment_intent');
    Order::where('stripe_payment_id', $paymentIntentId)
        ->update(['status' => 'paid']); // ❌ no verification
}

// CORRECT — verify via Stripe API before fulfilling
public function success(Request $request)
{
    $intent = \Stripe\PaymentIntent::retrieve(
        $request->input('payment_intent')
    );

    if ($intent->status === 'succeeded') {
        Order::where('stripe_payment_id', $intent->id)
            ->update(['status' => 'paid']); // ✅ verified
    }
}

// BEST — use verified webhook events instead of success URL callbacks
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
