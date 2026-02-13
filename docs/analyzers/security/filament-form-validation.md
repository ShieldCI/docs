---
title: Filament Form Validation Analyzer
description: Validates that Filament form fields have proper validation rules to prevent invalid or malicious input
icon: lock
outline: [2, 3]
tags: security,filament,forms,validation,input
pro: true
---

# Filament Form Validation Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `filament-form-validation` | 🛡️ Security  | Medium    | 15 minutes   |

## What This Checks

Validates that Filament form fields have proper validation rules. Checks for:

- Fields without any validation rules
- Rich text editors without sanitization or length constraints
- File uploads without type or size restrictions
- Important fields (email, password, name, title) missing `required()`

## Why It Matters

- **XSS via Rich Text:** Rich editors without sanitization allow script injection through stored XSS
- **Unrestricted Uploads:** File uploads without restrictions can be used to upload malware or oversized files
- **Data Integrity:** Fields without validation accept any input, corrupting your database
- **User Experience:** Missing required validation leads to incomplete records

## How to Fix

### Quick Fix (5 minutes)

Add validation to common fields:

```php
TextInput::make('name')
    ->required()
    ->maxLength(255),

TextInput::make('email')
    ->required()
    ->email()
    ->unique(ignoreRecord: true),
```

### Proper Fix (15 minutes)

**1. Validate rich text editors:**

```php
RichEditor::make('content')
    ->required()
    ->maxLength(65535)
    ->disableToolbarButtons(['codeBlock']),
```

**2. Restrict file uploads:**

```php
FileUpload::make('avatar')
    ->image()
    ->maxSize(2048) // 2MB
    ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])
    ->directory('avatars'),

FileUpload::make('document')
    ->maxSize(10240) // 10MB
    ->acceptedFileTypes(['application/pdf', 'application/msword']),
```

**3. Add validation to all fields:**

```php
public static function form(Form $form): Form
{
    return $form->schema([
        TextInput::make('title')
            ->required()
            ->maxLength(255),

        TextInput::make('slug')
            ->required()
            ->unique(ignoreRecord: true)
            ->maxLength(255),

        Select::make('status')
            ->required()
            ->options(['draft' => 'Draft', 'published' => 'Published']),

        DatePicker::make('published_at')
            ->after('today'),
    ]);
}
```

## References

- [Filament Form Fields](https://filamentphp.com/docs/forms/fields/getting-started)
- [Filament File Upload](https://filamentphp.com/docs/forms/fields/file-upload)
- [Laravel Validation Rules](https://laravel.com/docs/validation#available-validation-rules)

## Related Analyzers

- [Filament Panel Security](/analyzers/security/filament-panel-security) - Validates panel authentication
- [Form Request Validation](/analyzers/best-practices/form-request-validation) - Validates FormRequest usage
- [XSS Vulnerabilities](/analyzers/security/xss-vulnerabilities) - Detects cross-site scripting
