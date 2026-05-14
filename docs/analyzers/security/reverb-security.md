---
title: Reverb Security Analyzer
description: Validates Laravel Reverb WebSocket configuration, channel authorization, and SSL/TLS settings
icon: lock
outline: [2, 3]
tags: security,reverb,websockets,broadcasting,real-time
pro: true
---

# Reverb Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `reverb-security` | 🛡️ Security  | High    | 10 minutes   |

## What This Checks

Validates Laravel Reverb WebSocket configuration. Checks for:

- Channel authorization callbacks defined for private/presence channels
- Presence channel callbacks returning minimal user data (not full `toArray()`)
- Hardcoded or weak-default app credentials in `config/reverb.php` (`key` / `secret`)
- SSL/TLS configured for production (wss:// secure WebSockets)
- Allowed origins explicitly listed (no wildcards)

## Why It Matters

- **Unauthorized Access:** Without channel authorization, anyone can listen to private channels
- **Data Exposure:** Presence channels returning full user data expose passwords and tokens to all subscribers
- **Credential Exposure:** Hardcoded Reverb secrets allow any client to forge events and impersonate the server
- **Man-in-the-Middle:** Unencrypted ws:// connections can be intercepted on public networks
- **Cross-Origin Abuse:** Wildcard origins allow malicious sites to connect to your WebSocket server — the official published config ships with `allowed_origins: ['*']` by default

## How to Fix

### Quick Fix (5 minutes)

Define channel authorization:

```php
// routes/channels.php
Broadcast::channel('orders.{orderId}', function (User $user, int $orderId) {
    return $user->orders()->where('id', $orderId)->exists();
});
```

### Proper Fix (10 minutes)

**1. Return minimal data in presence channels:**

**Before (❌):**
```php
Broadcast::channel('chat.{roomId}', function (User $user, int $roomId) {
    return $user->toArray(); // Exposes all user fields!
});
```

**After (✅):**
```php
Broadcast::channel('chat.{roomId}', function (User $user, int $roomId) {
    if (!$user->canJoinRoom($roomId)) {
        return false;
    }

    return ['id' => $user->id, 'name' => $user->name];
});
```

**2. Enable secure WebSockets:**

```php
'apps' => [
    'provider' => 'config',
    'apps' => [[
        'key'    => env('REVERB_APP_KEY'),
        'secret' => env('REVERB_APP_SECRET'),
        'app_id' => env('REVERB_APP_ID'),
        'options' => [
            'scheme' => env('REVERB_SCHEME', 'https'),
            'useTLS' => env('REVERB_SCHEME', 'https') === 'https',
        ],
    ]],
],
```

**3. Restrict allowed origins:**

```php
// config/reverb.php
// Note: the official published config defaults allowed_origins to ['*'] — always restrict this.
'apps' => [
    'provider' => 'config',
    'apps' => [
        [
            'allowed_origins' => [
                'https://app.example.com',
                'https://admin.example.com',
            ],
        ],
    ],
],
```

## References

- [Laravel Reverb Documentation](https://laravel.com/docs/reverb)
- [Laravel Broadcasting Authorization](https://laravel.com/docs/broadcasting#authorizing-channels)
- [WebSocket Security Best Practices](https://owasp.org/www-project-web-security-testing-guide/)

## Related Analyzers

- [CORS Configuration](/analyzers/security/cors-config) - Validates cross-origin settings
- [HSTS Header](/analyzers/security/hsts-header) - Validates HTTPS enforcement
- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
