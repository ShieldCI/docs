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

- Inline validation in controllers (`$request->validate()`, `$this->validate()`, or `Validator::make()`)
- Controller `store()`/`update()` methods missing a FormRequest type-hint

## Why It Matters

- **Separation of Concerns:** Validation logic mixed into controllers makes them harder to maintain and test
- **Reusability:** FormRequest classes can be reused across multiple controllers
- **Testability:** FormRequest classes can be unit tested independently from the controller

## How to Fix

### Quick Fix (5 minutes)

Generate a FormRequest class:

```bash
php artisan make:request StoreUserRequest
```

### Proper Fix (15 minutes)

**Extract inline validation to a FormRequest:**

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

Multi-line signatures are fully supported:

```php
public function store(
    StoreUserRequest $request,
    UserService $service,
): JsonResponse {
    return response()->json($service->create($request->validated()));
}
```

> [!TIP]
> The `authorize()` method is optional. Per the [Laravel docs](https://laravel.com/docs/validation#form-request-validation), you may remove it entirely or simply `return true` if authorization is handled elsewhere.

## References

- [Laravel Form Request Validation](https://laravel.com/docs/validation#form-request-validation)
- [Laravel Validation Rules](https://laravel.com/docs/validation#available-validation-rules)

## Related Analyzers

- [Policy Authorization](/analyzers/best-practices/policy-authorization) - Validates resource controller policies
- [Auth & Authorization](/analyzers/security/authentication-authorization) - Validates authentication patterns
- [Filament Form Validation](/analyzers/security/filament-form-validation) - Validates Filament form rules
