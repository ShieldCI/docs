---
title: Fillable Foreign Key Analyzer
description: Detects foreign key fields in Eloquent models' fillable arrays that could allow unauthorized relationship manipulation
icon: shield-alert
outline: [2, 3]
tags: mass-assignment,foreign-keys,eloquent,security,relationships
---

# Fillable Foreign Key Analyzer

| Analyzer ID            | Category     | Severity   | Time To Fix  |
| -----------------------| :----------: |:----------:| ------------:|
| `fillable-foreign-key` | 🛡️ Security  | High       | 15 minutes   |

## What This Checks

Detects foreign key fields in Laravel Eloquent models' `$fillable` arrays that could allow unauthorized relationship manipulation and privilege escalation attacks. Flags critical patterns (`user_id`, `owner_id`, `tenant_id`, etc.) and generic `*_id` fields that enable mass assignment of foreign keys.

## Why It Matters

- **Security Risk:** CRITICAL - Foreign keys in `$fillable` allow attackers to impersonate users and bypass authorization
- **User Impersonation:** Setting `user_id` lets attackers create records as any user
- **Multi-Tenancy Breach:** Manipulating `tenant_id` or `organization_id` breaks tenant isolation
- **Privilege Escalation:** Changing ownership fields grants unauthorized access to resources
- **Data Integrity:** Arbitrary foreign keys corrupt relationships and hierarchical structures

Mass assignment of foreign keys is one of the most dangerous Laravel security vulnerabilities. It allows attackers to:
- Create posts as admin by setting `user_id=1`
- Access other tenants' data by changing `tenant_id`
- Claim ownership of any resource by manipulating `owner_id`
- Join any team by setting `team_id`

**Real-World Impact:**
- User impersonation in social media platforms
- Multi-tenancy data breaches in SaaS applications
- Privilege escalation in role-based systems
- Data corruption in hierarchical structures

## How to Fix

### Quick Fix (5 minutes)

**Scenario 1: Remove Foreign Keys from $fillable**

```php
// ❌ BEFORE: Vulnerable to impersonation
class Post extends Model
{
    protected $fillable = ['title', 'content', 'user_id'];
}

// ✅ AFTER: Safe
class Post extends Model
{
    protected $fillable = ['title', 'content'];
    // user_id removed from fillable
}

// Controller - set user_id explicitly
public function store(Request $request)
{
    $post = new Post($request->only(['title', 'content']));
    $post->user_id = auth()->id();  // Always use authenticated user
    $post->save();

    return $post;
}
```

**Scenario 2: Use $guarded Instead of $fillable**

```php
// ❌ BEFORE: Long fillable list, easy to miss dangerous fields
protected $fillable = ['title', 'content', 'category_id', 'user_id'];

// ✅ AFTER: Guard only sensitive fields
protected $guarded = ['id', 'user_id', 'created_at', 'updated_at'];
// All other fields fillable except guarded ones
```

**Scenario 3: Multi-Tenancy Protection**

```php
// ❌ BEFORE: tenant_id in fillable
class Document extends Model
{
    protected $fillable = ['name', 'content', 'tenant_id'];
}

// ✅ AFTER: Remove tenant_id and use global scope
class Document extends Model
{
    protected $fillable = ['name', 'content'];

    protected static function booted()
    {
        // Automatically set tenant_id on create
        static::creating(function ($document) {
            $document->tenant_id = auth()->user()->tenant_id;
        });

        // Filter all queries by tenant
        static::addGlobalScope('tenant', function ($builder) {
            $builder->where('tenant_id', auth()->user()->tenant_id);
        });
    }
}
```

### Proper Fix (15 minutes)

**1. Audit All Models for Foreign Keys**

```bash
# Find all _id fields in $fillable arrays
grep -r "protected \$fillable" app/Models/ | grep "_id"

# Review each one and remove dangerous patterns
```

**2. Use Form Requests for Validation**

```php
// app/Http/Requests/StorePostRequest.php
class StorePostRequest extends FormRequest
{
    public function rules()
    {
        return [
            'title' => 'required|max:255',
            'content' => 'required',
            // user_id NOT in rules - prevents mass assignment
        ];
    }

    public function validated($key = null, $default = null)
    {
        // Only return validated fields, excludes user_id
        return parent::validated($key, $default);
    }
}

// Controller
public function store(StorePostRequest $request)
{
    $post = new Post($request->validated());
    $post->user_id = auth()->id();
    $post->save();

    return $post;
}
```

**3. Create Relationship Methods Instead**

```php
// Instead of allowing category_id in fillable
class Post extends Model
{
    protected $fillable = ['title', 'content'];

    public function assignToCategory(Category $category)
    {
        // Add authorization check
        if (!auth()->user()->can('manage', $category)) {
            throw new AuthorizationException();
        }

        $this->category_id = $category->id;
        $this->save();
    }
}

// Controller
$post = Post::create($request->validated());
$post->assignToCategory($category);
```

**4. Use DTOs (Data Transfer Objects)**

```php
// app/DTOs/CreatePostDTO.php
class CreatePostDTO
{
    public function __construct(
        public string $title,
        public string $content,
        public int $userId  // Not from request!
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            title: $request->input('title'),
            content: $request->input('content'),
            userId: auth()->id()  // Set from auth, not request
        );
    }
}

// Controller
public function store(Request $request)
{
    $dto = CreatePostDTO::fromRequest($request);

    $post = Post::create([
        'title' => $dto->title,
        'content' => $dto->content,
        'user_id' => $dto->userId,
    ]);

    return $post;
}
```

**5. Configure Analyzer to Ignore Legitimate Cases**


If you have legitimate use cases for certain foreign keys in `$fillable` or need to customize which patterns are flagged, publish the config:

```bash
php artisan vendor:publish --tag=shieldci-config
```

Then in `config/shieldci.php`:

```php
'analyzers' => [
    'security' => [
        'enabled' => true,
        
        'fillable-foreign-key' => [
            // Customize dangerous patterns (defaults: user_id, owner_id, tenant_id, etc.)
            'dangerous_patterns' => [
                'user_id' => 'user ownership',
                'admin_id' => 'admin relationship',
                'tenant_id' => 'tenant isolation',
                // Add your critical patterns
            ],
        ],
    ],
],
```

::: warning Use with Caution
The default dangerous patterns (`user_id`, `owner_id`, `tenant_id`, etc.) are based on common security vulnerabilities. Only customize this if you have a specific, well-documented reason.
:::

## References

- [Laravel Mass Assignment Documentation](https://laravel.com/docs/eloquent#mass-assignment)
- [OWASP Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
- [Laravel Security Best Practices](https://laravel.com/docs/security)
- [Multi-Tenancy in Laravel](https://laravel.com/docs/eloquent#global-scopes)

## Related Analyzers

- [Mass Assignment Vulnerabilities Analyzer](/analyzers/security/mass-assignment-vulnerabilities) - Validates $fillable/$guarded configuration
- [Authentication & Authorization Analyzer](/analyzers/security/authentication-authorization) - Checks for proper authorization
- [Unguarded Models Analyzer](/analyzers/security/unguarded-models) - Detects Model::unguard() usage
