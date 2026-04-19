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

## References

- [Laravel Cashier Paddle Documentation](https://laravel.com/docs/cashier-paddle)
- [Paddle Webhook Verification](https://developer.paddle.com/webhooks/signature-verification)
- [OWASP Payment Security](https://owasp.org/www-project-web-security-testing-guide/)

## Related Analyzers

- [Cashier Security](/analyzers/security/cashier-security) - Validates Cashier Stripe configuration
- [Hardcoded Credentials](/analyzers/security/hardcoded-credentials) - Detects hardcoded secrets
- [Environment File](/analyzers/security/env-file) - Checks .env file security
