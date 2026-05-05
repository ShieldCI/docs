---
title: Cashier Paddle Analyzer
description: Validates Laravel Cashier Paddle webhook verification, sandbox detection, and configuration security
icon: lock
outline: [2, 3]
tags: security,cashier,paddle,payments,billing
pro: true
---

# Cashier Paddle Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `cashier-paddle` | 🛡️ Security  | High    | 10 minutes   |

## What This Checks

Validates Laravel Cashier Paddle integration security. Supports both Paddle Classic (`vendor_id`, `auth_code`) and Paddle Billing v2 (`seller_id`, `api_key`). Checks for:

- Webhook routes verify signatures via Paddle middleware (routes/web.php, routes/api.php, bootstrap/app.php)
- Cashier Paddle v2 auto-registered webhook routes are recognized (no false positives)
- Sandbox mode is not enabled in production
- Vendor/seller ID and API key use `env()` rather than hardcoded values
- Price IDs are stored in config/env rather than hardcoded in source (Controllers, Services, Actions, Livewire components)
- Webhook secret (`webhook_secret`) is configured and not hardcoded or empty
- Server-side Paddle credentials (API key, webhook secret) are not present in Blade, JS, Vue, or TypeScript frontend files
- Return URL passed to `returnTo()` in checkout flows is not derived from user-controlled request input (open redirect prevention)

## Why It Matters

- **Payment Fraud:** Without webhook signature verification, attackers can forge payment events
- **Revenue Loss:** Sandbox mode in production means no real payments are processed
- **Credential Exposure:** Hardcoded vendor IDs in source code end up in version control
- **Environment Mismatch:** Hardcoded price IDs prevent switching between sandbox and production

## How to Fix

### Quick Fix (5 minutes)

Add webhook signature verification:

```php
// routes/web.php
Route::post('/paddle/webhook', WebhookController::class)
    ->middleware(\Laravel\Paddle\Http\Middleware\VerifyWebhookSignature::class);
```

### Proper Fix (10 minutes)

**1. Use Cashier's built-in webhook route:**

```php
// Cashier Paddle provides this automatically when configured properly
// Verify it's registered:
php artisan route:list --name=cashier
```

**2. Use environment variables for configuration:**

```php
// config/cashier.php — Paddle Classic
'vendor_id' => env('PADDLE_VENDOR_ID'),
'vendor_auth_code' => env('PADDLE_VENDOR_AUTH_CODE'),

// config/cashier.php — Paddle Billing v2
'seller_id' => env('PADDLE_SELLER_ID'),
'api_key' => env('PADDLE_API_KEY'),
```

```env
# .env
PADDLE_VENDOR_ID=your-vendor-id
PADDLE_API_KEY=your-api-key
PADDLE_WEBHOOK_SECRET=your-webhook-secret
PADDLE_SANDBOX=false  # true only in development
```

**3. Store price IDs in config:**

```php
// config/pricing.php
return [
    'monthly' => env('PADDLE_MONTHLY_PRICE_ID'),
    'yearly' => env('PADDLE_YEARLY_PRICE_ID'),
];

// Usage:
$user->subscribe(config('pricing.monthly'));
```

**4. Configure the webhook secret:**

```php
// config/cashier.php
'webhook_secret' => env('PADDLE_WEBHOOK_SECRET'),
```

Copy the signing secret from your Paddle dashboard under **Developer Tools → Notifications → your endpoint → Secret key** and set it in `.env`:

```env
PADDLE_WEBHOOK_SECRET=pdl_ntfset_your_secret_here
```

**5. Keep server-side credentials out of frontend files:**

Never place `api_key` or webhook secret values in Blade templates, JavaScript, Vue, or TypeScript files. Only client-side tokens belong in frontend code:

```js
// WRONG — exposes server key to browser
const apiKey = 'live_pdl_api_abc123';

// RIGHT — pass only what the client needs
const clientToken = "{{ config('cashier.client_side_token') }}";
```

**6. Use a fixed route for `returnTo()` in checkout flows:**

```php
// WRONG — open redirect risk after payment
return $request->user()->checkout('pri_monthly')
    ->returnTo($request->input('next'));

// RIGHT — always use an application-controlled route
return $request->user()->checkout('pri_monthly')
    ->returnTo(route('billing.success'));
```

## References

- [Laravel Cashier Paddle Documentation](https://laravel.com/docs/cashier-paddle)
- [Paddle Webhook Verification](https://developer.paddle.com/webhooks/signature-verification)
- [OWASP Payment Security](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Unvalidated Redirects and Forwards](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)

## Related Analyzers

- [Cashier Security](/analyzers/security/cashier-security) - Validates Cashier Stripe configuration
- [Hardcoded Credentials](/analyzers/security/hardcoded-credentials) - Detects hardcoded secrets
- [Environment File](/analyzers/security/env-file) - Checks .env file security
