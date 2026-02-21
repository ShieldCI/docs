---
title: Hardcoded Credentials Analyzer
description: Detects hardcoded passwords, API keys, and other secrets embedded in source code that should be stored in environment variables
icon: key
outline: [2, 3]
tags: credentials,secrets,hardcoded,api-key,password,security
pro: true
---

# Hardcoded Credentials Analyzer

| Analyzer ID              | Category     | Severity   | Time To Fix  |
| ------------------------ | :----------: |:----------:| ------------:|
| `hardcoded-credentials`  | 🛡️ Security  | Critical   | 15 minutes   |

## What This Checks

This analyzer scans your Laravel application source code for hardcoded credentials, secrets, and sensitive tokens that should never be committed to version control.

**Detected Credential Patterns (9):**

#### Authentication Credentials
- **Passwords** - Variables or assignments containing `password`, `passwd`, `pwd` with literal string values
- **API Keys** - `api_key`, `apikey`, `api_token`, `access_token` with long alphanumeric strings
- **Bearer Tokens** - `Bearer` authorization headers with embedded tokens
- **Basic Auth** - `Basic` authorization headers with embedded credentials

#### Cloud & Infrastructure Secrets
- **AWS Access Keys** - AWS access key IDs (starting with `AKIA`) and secret access keys
- **Private Keys** - PEM-formatted private keys (`-----BEGIN PRIVATE KEY-----`)
- **Database URLs** - Connection strings containing embedded usernames and passwords
- **Connection Strings** - Server/Data Source strings with inline passwords

#### Application Secrets
- **JWT Secrets** - `jwt_secret`, `jwt_key` with hardcoded values

**Variable Name Detection:**

The analyzer also detects suspicious variable assignments by name, checking both `snake_case` and `camelCase` patterns for: `password`, `secret`, `api_key`, `aws_key`, `private_key`, `encryption_key`, `app_key`, `jwt_secret`, `webhook_secret`, and their variants.

::: tip What's NOT Flagged
The analyzer correctly recognizes these as **safe**:
- Environment variable usage: `env('API_KEY')`, `config('services.key')`, `getenv('SECRET')`
- References to `.env` files
- Placeholder values: `example`, `test`, `fake`, `dummy`, `placeholder`, `your_`, `xxx`, `todo`, `fixme`
- Config directory files (intended to have defaults with `env()` fallbacks)
- Test files (often contain fake credentials for testing)
- Database migration files (often contain example data)
:::

## Why It Matters

Hardcoded credentials in source code pose severe security risks that are difficult to remediate after exposure:

- **Version Control Exposure** - Secrets committed to Git persist in history forever, even after deletion
- **Broad Access** - Every developer with repository access can see production credentials
- **Rotation Difficulty** - Changing a hardcoded secret requires a code deployment, not just a config change
- **Accidental Public Exposure** - Repositories accidentally made public immediately leak all embedded secrets
- **Compliance Violations** - PCI DSS, SOC 2, HIPAA, and GDPR all prohibit hardcoded credentials
- **Supply Chain Risk** - Forked repositories carry the embedded secrets to other organizations

## How to Fix

### Quick Fix (5 minutes)

Move hardcoded values to environment variables:

**Before:**
```php
class PaymentService
{
    // VULNERABLE: API key hardcoded in source code
    private string $apiKey = 'sk_live_4eC39HqLyjWDarjtT1zdp7dc';

    // VULNERABLE: Password hardcoded in source code
    private string $dbPassword = 'super_secret_password_123';

    public function charge(float $amount): void
    {
        $client = new \GuzzleHttp\Client();
        $client->post('https://api.stripe.com/v1/charges', [
            'headers' => [
                // VULNERABLE: Bearer token hardcoded
                'Authorization' => 'Bearer sk_live_4eC39HqLyjWDarjtT1zdp7dc',
            ],
            'form_params' => ['amount' => $amount * 100],
        ]);
    }
}
```

**After:**
```php
class PaymentService
{
    // SAFE: Read from environment
    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.stripe.secret');
    }

    public function charge(float $amount): void
    {
        $client = new \GuzzleHttp\Client();
        $client->post('https://api.stripe.com/v1/charges', [
            'headers' => [
                // SAFE: Token from config/environment
                'Authorization' => 'Bearer ' . $this->apiKey,
            ],
            'form_params' => ['amount' => $amount * 100],
        ]);
    }
}
```

### Proper Fix (15 minutes)

Use Laravel's configuration system with environment variables and a secret management service:

**Step 1: Add to `.env` (never commit this file):**
```env
STRIPE_SECRET=sk_live_4eC39HqLyjWDarjtT1zdp7dc
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
JWT_SECRET=your-jwt-secret-here
```

**Step 2: Reference in config files:**
```php
// config/services.php
return [
    'stripe' => [
        'secret' => env('STRIPE_SECRET'),
    ],
];
```

**Step 3: Use config() in application code:**
```php
class PaymentService
{
    public function __construct(
        private readonly string $apiKey = '',
    ) {
        $this->apiKey = config('services.stripe.secret');
    }
}
```

**Step 4: Add `.env` to `.gitignore`:**
```gitignore
.env
.env.backup
.env.production
```

**Best Practice: Use Laravel's Encrypted Environment:**
```bash
# Encrypt your .env file for safe storage
php artisan env:encrypt --env=production

# Decrypt at deployment
php artisan env:decrypt --env=production --key=base64:your-encryption-key
```

**For AWS credentials, use IAM roles instead:**
```php
// config/filesystems.php
'disks' => [
    's3' => [
        'driver' => 's3',
        // SAFE: IAM role provides credentials automatically on AWS
        // No need for access keys when running on EC2/ECS/Lambda
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
        'bucket' => env('AWS_BUCKET'),
    ],
],
```


## References

- [OWASP Hard Coded Credentials](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password)
- [CWE-798: Use of Hard-coded Credentials](https://cwe.mitre.org/data/definitions/798.html)
- [CWE-259: Use of Hard-coded Password](https://cwe.mitre.org/data/definitions/259.html)
- [Laravel Configuration Documentation](https://laravel.com/docs/configuration)
- [Laravel Environment Encryption](https://laravel.com/docs/configuration#encrypting-environment-files)
- [AWS IAM Roles Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

## Related Analyzers

- [Env File Analyzer](/analyzers/security/env-file) - Ensures .env files are properly configured and not exposed
- [Debug Mode Analyzer](/analyzers/security/debug-mode) - Debug mode can leak credentials in error messages
- [Env HTTP Accessibility Analyzer](/analyzers/security/env-http-accessibility) - Prevents .env files from being publicly accessible
- [App Key Analyzer](/analyzers/security/app-key-security) - Ensures the application encryption key is properly set

---
