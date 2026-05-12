---
title: Livewire Security Analyzer
description: Validates Livewire component security including property exposure, authorization checks, and file uploads
icon: lock
outline: [2, 3]
tags: security,livewire,components,property-exposure,file-upload
pro: true
---

# Livewire Security Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `livewire-security` | 🛡️ Security  | High    | 15 minutes   |

## What This Checks

Validates Livewire component security. Checks for:

- Public properties with sensitive names (password, token, apiKey, etc.)
- Missing authorization in components that perform write operations
- File uploads without validation (`WithFileUploads` trait without rules)
- Identity properties missing `#[Locked]` attribute (userId, orderId, isAdmin, etc.)
- Livewire v3 Form Object scanning — sensitive property detection extends into Form classes
- Version-aware identity property handling: v3 requires `#[Locked]`; v2 warns about unprotected mutable properties

## Why It Matters

- **Property Tampering:** All public properties can be modified from the browser via Livewire's wire protocol
- **Unauthorized Actions:** Components without authorization checks allow any authenticated user to perform actions
- **Malicious Uploads:** File uploads without validation allow attackers to upload executable files or oversized content
- **Privilege Escalation:** Unlocked identity properties like `$isAdmin` can be changed by the client

## How to Fix

### Quick Fix (5 minutes)

Lock identity properties:

**Before (❌):**
```php
class EditOrder extends Component
{
    public $orderId;     // Can be changed by the client!
    public $userId;      // Can be changed by the client!
    public bool $isAdmin = false; // Can be set to true!
}
```

**After (✅):**
```php
use Livewire\Attributes\Locked;

class EditOrder extends Component
{
    #[Locked]
    public $orderId;

    #[Locked]
    public $userId;

    #[Locked]
    public bool $isAdmin = false;
}
```

### Proper Fix (15 minutes)

**1. Add file upload validation:**

```php
use Livewire\WithFileUploads;

class UploadAvatar extends Component
{
    use WithFileUploads;

    public $photo;

    protected $rules = [
        'photo' => 'required|image|max:2048', // 2MB max, images only
    ];

    public function save()
    {
        $this->validate();
        $this->photo->store('avatars');
    }
}
```

**2. Add authorization to write operations:**

```php
class EditPost extends Component
{
    #[Locked]
    public int $postId;

    public string $title;

    public function save()
    {
        $this->authorize('update', Post::find($this->postId));

        Post::find($this->postId)->update([
            'title' => $this->title,
        ]);
    }

    public function delete()
    {
        $this->authorize('delete', Post::find($this->postId));

        Post::find($this->postId)->delete();
    }
}
```

**3. Never expose sensitive data as public properties:**

```php
// Move sensitive operations to methods, not properties
class ProcessPayment extends Component
{
    #[Locked]
    public int $orderId;

    // Don't do this:
    // public string $apiKey;
    // public string $stripeToken;

    public function charge()
    {
        $order = Order::findOrFail($this->orderId);
        $this->authorize('pay', $order);

        // Use config/env for sensitive values
        $stripe = new StripeClient(config('services.stripe.secret'));
    }
}
```

## References

- [Livewire Security](https://livewire.laravel.com/docs/properties#security)
- [Livewire Locked Properties](https://livewire.laravel.com/docs/locked)
- [Livewire File Uploads](https://livewire.laravel.com/docs/uploads)
- [OWASP Insecure Direct Object Reference](https://owasp.org/www-project-web-security-testing-guide/)

## Related Analyzers

- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
- [XSS Vulnerabilities](/analyzers/security/xss-vulnerabilities) - Detects cross-site scripting
- [CSRF Protection](/analyzers/security/csrf-protection) - Validates CSRF configuration
