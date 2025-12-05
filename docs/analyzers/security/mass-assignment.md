---
title: Mass Assignment Vulnerability Detection
description: Detects mass assignment vulnerabilities where unfiltered user input is passed to Eloquent models or query builders
icon: shield-alert
outline: [2, 3]
---

# Mass Assignment Vulnerability Detection

| Analyzer ID       | Category     | Severity   | Time To Fix  |
| ------------------| :----------: |:----------:| ------------:|
| `mass-assignment` | 🛡️ Security  | High       | 25 minutes   |

## What This Checks

Detects mass assignment vulnerabilities where unfiltered user input is passed to Eloquent models or query builders, allowing attackers to modify unintended database fields. This analyzer checks for models without `$fillable` or `$guarded` protection, dangerous method calls with `request()->all()`, query builder operations with raw request data, and multiple unsafe request data retrieval patterns.

## Why It Matters

Mass assignment is one of the most dangerous security vulnerabilities in Laravel applications because it allows attackers to:

- **Privilege Escalation:** Set `is_admin = 1` to gain administrative access
- **Account Takeover:** Modify email addresses or passwords of other users
- **Data Manipulation:** Update protected fields like prices, status, or verification timestamps
- **Bypass Business Logic:** Circumvent validation rules and access controls

### Real-World Impact: GitHub 2012

In March 2012, GitHub suffered a mass assignment vulnerability that allowed attackers to add SSH keys to any repository, including Rails's own codebase. This single vulnerability led to:

- Complete system compromise requiring emergency shutdown
- Forced suspension of GitHub services for security audit
- Major architectural security overhaul

The attack exploited unprotected mass assignment by sending:

```bash
POST /repositories
{
  "public_key[id]": "attacker_key_id"
}
```

Modern Laravel applications face identical risks when using `request()->all()` without proper model protection.

## How to Fix

### Quick Fix (5 minutes)

Add mass assignment protection to all Eloquent models immediately:

**Before (❌):**
```php
class User extends Model
{
    // No protection - vulnerable to mass assignment
}
```

**After (✅):**
```php
class User extends Model
{
    // Whitelist approach (recommended)
    protected $fillable = ['name', 'email', 'bio', 'avatar'];

    // OR blacklist approach
    protected $guarded = ['id', 'is_admin', 'role', 'created_at', 'updated_at'];
}
```

**Controller update:**

**Before (❌):**
```php
public function update(Request $request, User $user)
{
    $user->update($request->all()); // Dangerous
}
```

**After (✅):**
```php
public function update(Request $request, User $user)
{
    $user->update($request->only(['name', 'email', 'bio'])); // Safe
}
```

### Proper Fix (25 minutes)

**Step 1: Define model protection strategy**

Choose between `$fillable` (whitelist - recommended) or `$guarded` (blacklist):

```php
// RECOMMENDED: Whitelist approach
class User extends Model
{
    protected $fillable = [
        'name',
        'email',
        'bio',
        'avatar',
    ];
}

// ALTERNATIVE: Blacklist approach
class User extends Model
{
    protected $guarded = [
        'id',
        'is_admin',
        'role',
        'email_verified_at',
        'remember_token',
        'created_at',
        'updated_at',
    ];
}
```

**Best Practice:** Use `$fillable` for better security - new fields are protected by default.

**Step 2: Create Form Request validation**

Generate validated request class:

```bash
php artisan make:request UpdateUserRequest
```

**Before (❌):**
```php
public function update(Request $request, User $user)
{
    $user->update($request->all());
    return $user;
}
```

**After (✅):**
```php
// app/Http/Requests/UpdateUserRequest.php
class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->id === $this->route('user')->id;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,'.$this->user()->id,
            'bio' => 'nullable|string|max:1000',
            'avatar' => 'nullable|url',
        ];
    }
}

// Controller
public function update(UpdateUserRequest $request, User $user)
{
    $user->update($request->validated()); // Only validated fields
    return $user;
}
```

**Step 3: Fix all dangerous patterns**

**Pattern 1: Eloquent create/update with request()->all()**

**Before (❌):**
```php
User::create($request->all());
Product::create($request->input());
$user->update($request->post());
$user->fill($request->get())->save();
```

**After (✅):**
```php
User::create($request->validated());
Product::create($request->only(['name', 'description', 'price']));
$user->update($request->validated());
$user->fill($request->validated())->save();
```

**Pattern 2: Query Builder operations**

**Before (❌):**
```php
DB::table('users')->update($request->all());
DB::table('products')->insert($request->all());
```

**After (✅):**
```php
DB::table('users')->update([
    'name' => $request->validated('name'),
    'email' => $request->validated('email'),
    'updated_at' => now(),
]);

DB::table('products')->insert([
    'name' => $request->validated('name'),
    'price' => $request->validated('price'),
    'created_at' => now(),
]);
```

**Pattern 3: Empty $guarded array**

**Before (❌):**
```php
class Product extends Model
{
    protected $guarded = []; // Allows mass assignment of ALL fields
}
```

**After (✅):**
```php
class Product extends Model
{
    protected $fillable = ['name', 'description', 'price', 'stock'];
}
```

**Step 4: Test your implementation**

Create automated tests:

```php
// tests/Feature/MassAssignmentTest.php
public function test_cannot_mass_assign_admin_role()
{
    $response = $this->postJson('/api/users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'is_admin' => 1,  // Attempt to set admin
    ]);

    $user = User::where('email', 'john@example.com')->first();

    $this->assertFalse($user->is_admin); // Should NOT be admin
}
```

Manual testing with curl:

```bash
# Attempt malicious request
curl -X POST http://localhost/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","is_admin":1,"role":"admin"}'

# Verify in database
php artisan tinker
>>> User::latest()->first()
>>> # is_admin and role should NOT be set
```

## References

### Laravel Documentation
- [Eloquent: Mass Assignment](https://laravel.com/docs/eloquent#mass-assignment)
- [Validation: Form Request Validation](https://laravel.com/docs/validation#form-request-validation)
- [Request: Retrieving Input](https://laravel.com/docs/requests#retrieving-input)

### Security Resources
- [OWASP: Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
- [CWE-915: Improperly Controlled Modification of Dynamically-Determined Object Attributes](https://cwe.mitre.org/data/definitions/915.html)
- [GitHub Mass Assignment Incident (2012)](https://github.blog/2012-03-04-public-key-security-vulnerability-and-mitigation/)

### Additional Reading
- [Mass Assignment: A New Software Vulnerability (OWASP PDF)](https://owasp.org/www-pdf-archive/Mass_Assignment_-_OWASP_AppSecUSA2012.pdf)
- [Laravel Security Best Practices](https://laravel-news.com/laravel-security-best-practices)

## Related Analyzers

- [SQL Injection Detection](/analyzers/security/sql-injection) - Detects raw SQL queries with user input
- [XSS Prevention](/analyzers/security/xss-detection) - Prevents cross-site scripting attacks
- [CSRF Protection](/analyzers/security/csrf-protection) - Validates CSRF token protection
- [Input Validation](/analyzers/security/input-validation) - Ensures proper validation rules
- [Authorization Checks](/analyzers/security/authorization) - Validates policy and gate checks
