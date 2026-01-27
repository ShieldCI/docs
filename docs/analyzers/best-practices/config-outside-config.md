---
title: Hardcoded Configuration Analyzer
description: Detects configuration values hardcoded in code instead of config files, improving maintainability and environment flexibility
icon: settings
outline: [2, 3]
tags: laravel,configuration,maintainability,testability,best-practices,environment
---

# Hardcoded Configuration Analyzer

| Analyzer ID              | Category           | Severity | Time To Fix |
| -------------------------| :----------------: |:--------:| -----------:|
| `config-outside-config`  | ⚡ Best Practices  | Medium   | 10 minutes  |

## What This Checks

Detects configuration values hardcoded directly in your code that should be externalized to config files. Checks:

- **Hardcoded URLs**: Production API endpoints, webhook URLs, service URLs
- **API Keys & Secrets**: Long alphanumeric strings that look like API keys (with smart hash exclusion)
- **Localhost URLs**: Development URLs that should be configured (`http://localhost`, `127.0.0.1`)
- **Private IP Addresses**: Internal network IPs (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`)

**Smart Detection Features:**
- ✅ Excludes documentation URLs (`laravel.com`, `github.com`, `stackoverflow.com`, `example.com`)
- ✅ Excludes hash values (MD5, SHA1, SHA256) to prevent false positives
- ✅ Detects common API key patterns (`sk_`, `pk_`, `live_`, `test_` prefixes)
- ✅ Skips config directory files (configuration in config files is expected)

## Why It Matters

- **Environment Flexibility:** Hardcoded values make it difficult to use different configurations per environment (local, staging, production)
- **Security Risk:** API keys and secrets hardcoded in source code are visible in version control and to all developers
- **Maintainability:** Changing a hardcoded value requires code changes and redeployment instead of just config updates
- **Testing Difficulty:** Hardcoded values make it harder to test with different configurations or mock external services
- **Team Collaboration:** Different team members may need different local configurations
- **Deployment Issues:** Production URLs hardcoded in code prevent easy environment switching

**Real-world impact:**
- A hardcoded API URL means you can't easily switch between staging and production APIs
- Hardcoded localhost URLs break on deployed servers
- API keys in code are exposed in git history forever (even if later removed)
- Different developers need different local database URLs but can't configure them

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: Move Hardcoded URL to Config**

```php
// ❌ BAD - Hardcoded production URL
class PaymentService
{
    public function processPayment()
    {
        $apiUrl = 'https://api.stripe.com/v1/charges';
        // Use $apiUrl...
    }
}

// ✅ GOOD - Use config file
// In config/services.php
return [
    'stripe' => [
        'url' => env('STRIPE_API_URL', 'https://api.stripe.com/v1'),
    ],
];

// In your service
class PaymentService
{
    public function processPayment()
    {
        $apiUrl = config('services.stripe.url').'/charges';
        // Use $apiUrl...
    }
}
```

**Scenario 2: Move API Key to Environment Variables**

```php
// ❌ BAD - Hardcoded API key (security risk!)
class MailService
{
    private $apiKey = 'sk_live_4eC39HqLyjWDarjtT1zdp7dc';
}

// ✅ GOOD - Use environment variables via config
// In .env
MAILGUN_SECRET=sk_live_4eC39HqLyjWDarjtT1zdp7dc

// In config/services.php
return [
    'mailgun' => [
        'secret' => env('MAILGUN_SECRET'),
    ],
];

// In your service
class MailService
{
    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.mailgun.secret');
    }
}
```

**Scenario 3: Fix Localhost URLs**

```php
// ❌ BAD - Hardcoded localhost (breaks in production)
class WebhookService
{
    public function getCallbackUrl()
    {
        return 'http://localhost:8000/webhook/callback';
    }
}

// ✅ GOOD - Use APP_URL from environment
// In .env (local)
APP_URL=http://localhost:8000

// In .env (production)
APP_URL=https://app.production.com

// In your service
class WebhookService
{
    public function getCallbackUrl()
    {
        return config('app.url').'/webhook/callback';
    }
}
```

### Proper Fix (10 minutes)

Implement comprehensive configuration management:

**1. Create Environment-Specific Config**

```php
// config/services.php
return [
    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'api_version' => env('STRIPE_API_VERSION', '2023-10-16'),
    ],

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'slack' => [
        'webhook_url' => env('SLACK_WEBHOOK_URL'),
        'channel' => env('SLACK_CHANNEL', '#general'),
    ],
];
```

**2. Use Config Throughout Your Application**

```php
// ❌ BAD - Multiple hardcoded values
class NotificationService
{
    public function sendSlackNotification($message)
    {
        $webhookUrl = 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX';
        $channel = '#alerts';

        Http::post($webhookUrl, [
            'channel' => $channel,
            'text' => $message,
        ]);
    }
}

// ✅ GOOD - All values from config
class NotificationService
{
    public function sendSlackNotification($message)
    {
        Http::post(config('services.slack.webhook_url'), [
            'channel' => config('services.slack.channel'),
            'text' => $message,
        ]);
    }
}
```

**3. Set Environment Variables**

```ini
# .env.example (committed to git)
APP_URL=http://localhost
STRIPE_KEY=
STRIPE_SECRET=
MAILGUN_DOMAIN=
MAILGUN_SECRET=
SLACK_WEBHOOK_URL=

# .env (not committed, per environment)
# Development
APP_URL=http://localhost:8000
STRIPE_KEY=pk_test_51H...
STRIPE_SECRET=sk_test_51H...
MAILGUN_DOMAIN=sandbox123.mailgun.org
MAILGUN_SECRET=key-abc123...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Production
APP_URL=https://app.production.com
STRIPE_KEY=pk_live_51H...
STRIPE_SECRET=sk_live_51H...
MAILGUN_DOMAIN=mg.production.com
MAILGUN_SECRET=key-live123...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

**4. Use Dependency Injection for Testability**

```php
// ✅ BEST - Inject configuration, easy to test
class PaymentService
{
    public function __construct(
        private string $apiKey,
        private string $apiUrl
    ) {}

    public static function fromConfig(): self
    {
        return new self(
            apiKey: config('services.stripe.secret'),
            apiUrl: config('services.stripe.url')
        );
    }
}

// In production
$service = PaymentService::fromConfig();

// In tests
$service = new PaymentService(
    apiKey: 'test_key',
    apiUrl: 'http://localhost:8000/mock-stripe'
);
```

**5. Document Configuration in .env.example**

```ini
# .env.example
# Application URL (used for links in emails, webhooks, etc.)
APP_URL=http://localhost

# Stripe Payment Configuration
STRIPE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Mailgun Email Service
MAILGUN_DOMAIN=sandbox123.mailgun.org
MAILGUN_SECRET=key-your_mailgun_secret_here

# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#general
```

## References

- [Laravel Configuration](https://laravel.com/docs/configuration) - Official configuration documentation
- [Laravel Environment Variables](https://laravel.com/docs/configuration#environment-configuration) - Environment variable guide
- [The Twelve-Factor App: Config](https://12factor.net/config) - Configuration best practices
- [Laravel Configuration Caching](https://laravel.com/docs/configuration#configuration-caching) - Performance optimization

## Related Analyzers

- [App Key Analyzer](/analyzers/security/app-key) - Validates APP_KEY security
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Detects debug mode in production

