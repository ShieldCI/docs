---
title: Form Request Validation Analyzer
description: Validates that controllers use FormRequest classes instead of inline validation for cleaner architecture
icon: check-circle
outline: [2, 3]
tags: best-practices,validation,form-request,controllers
pro: true
---

# Form Request Validation Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `form-request-validation` | 🏅 Best Practices  | Medium    | 15 minutes   |

## What This Checks

Validates that controllers follow Laravel's FormRequest pattern. Checks for:

- Inline validation in controllers (`$request->validate()` or `$this->validate()`)
- FormRequest classes without a proper `authorize()` override
- Controller `store()`/`update()` methods missing FormRequest type-hints

## Why It Matters

- **Separation of Concerns:** Validation logic mixed into controllers makes them harder to maintain and test
- **Reusability:** FormRequest classes can be reused across multiple controllers
- **Authorization:** FormRequest's `authorize()` method provides a clean hook for authorization logic
- **Testability:** FormRequest classes can be unit tested independently

## How to Fix

### Quick Fix (5 minutes)

Generate a FormRequest class:

```bash
php artisan make:request StoreUserRequest
```

### Proper Fix (15 minutes)

**1. Extract inline validation to FormRequest:**

**Before (❌):**
```php
class UserController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
        ]);

        User::create($validated);
    }
}
```

**After (✅):**
```php
// app/Http/Requests/StoreUserRequest.php
class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', User::class);
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
        ];
    }
}

// app/Http/Controllers/UserController.php
class UserController extends Controller
{
    public function store(StoreUserRequest $request)
    {
        User::create($request->validated());
    }
}
```

**2. Override authorize() properly:**

```php
class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $order = $this->route('order');

        return $this->user()->can('update', $order);
    }

    public function rules(): array
    {
        return [
            'status' => 'required|in:pending,processing,completed',
        ];
    }
}
```

## References

- [Laravel Form Request Validation](https://laravel.com/docs/validation#form-request-validation)
- [Laravel Authorization](https://laravel.com/docs/authorization)
- [Laravel Validation Rules](https://laravel.com/docs/validation#available-validation-rules)

## Related Analyzers

- [Policy Authorization](/analyzers/best-practices/policy-authorization) - Validates resource controller policies
- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
- [Filament Form Validation](/analyzers/security/filament-form-validation) - Validates Filament form rules
