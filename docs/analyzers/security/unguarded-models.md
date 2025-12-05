---
title: Unguarded Models Analyzer
description: Scans for Model::unguard() calls that disable Laravel's mass-assignment protection
icon: shield-alert
outline: [2, 3]
---

# Unguarded Models Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `unguarded-models` | 🛡️ Security  | High       | 20 minutes   |

## What This Checks

- Scans your codebase for `Model::unguard()` / `Eloquent::unguard()` static calls that disable Laravel’s mass-assignment protection.
- Ensures every `unguard()` is immediately followed by a corresponding `Model::reguard()`.
- Flags lingering unguarded sections in controllers, services, jobs, models, and seeders with severity mapped to the file’s context.
- Ignores vendor code and custom methods so only your application’s misuse is reported.

## Why It Matters

- **Mass-assignment vulnerabilities**: Unguarded models let attackers set attributes like `is_admin` or `balance` through crafted requests.
- **Invisible regressions**: Once added, `Model::unguard()` quietly affects every subsequent `Model::create()` call until `reguard()` is executed.
- **Code readability**: Force-filling explicit fields (`forceFill`/`forceCreate`) makes intent obvious and safer for reviewers.
- **Compliance**: Many security reviews (SOC2, ISO 27001) require demonstrating that sensitive models remain protected by default.

## How to Fix

### Quick Fix (5 minutes)

1. Remove the blanket `Model::unguard()` call when possible and rely on `$fillable` / `$guarded` properties.

```php
// ❌ Before: global unguard in a controller
Model::unguard();
User::create($request->all());

// ✅ After: validate + mass assign only what is allowed
$user = User::create($request->validated());
```

2. If you must import raw payloads, limit the scope and re-guard immediately:

```php
Model::unguard();
User::forceCreate($payload);
Model::reguard();
```

### Proper Fix (20 minutes)

1. **Audit every unguard**: search for `::unguard` and confirm why it exists; remove it entirely for HTTP-facing code.
2. **Use `$fillable` / `$guarded`** on each model so only trusted attributes can be mass-assigned.
3. **Choose force-fill when necessary**:
   ```php
   $user->forceFill([
       'name' => $payload['name'],
       'email' => $payload['email'],
   ])->save();
   ```
4. **Wrap imports**: if a seeder or migration needs unguarded writes, wrap the block and call `Model::reguard()` in a `finally` clause to guarantee re-guarding even on exceptions.
5. **Add tests** around your import/service layers to ensure no requests can set privileged flags without authorization.

## References

- [Laravel Mass Assignment Docs](https://laravel.com/docs/eloquent#mass-assignment)
- [forceFill & forceCreate](https://laravel.com/docs/eloquent#mass-assignment)
- [OWASP Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)

## Related Analyzers

- [Mass Assignment Vulnerabilities Analyzer](/analyzers/security/mass-assignment-vulnerabilities) — detects missing `$fillable`/`$guarded` definitions.
- [Fillable Foreign Key Analyzer](/analyzers/security/fillable-foreign-key) — ensures relationship IDs aren't mass assignable.
- [Stable Dependencies Analyzer](/analyzers/security/stable-dependencies) — keeps your vendor libraries on predictable, secure releases.
