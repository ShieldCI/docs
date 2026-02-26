---
title: Accessibility Analyzer
description: Validates that Blade templates follow basic accessibility best practices for inclusive web applications
icon: check-circle
outline: [2, 3]
tags: best-practices,accessibility,a11y,blade
pro: true
---

# Accessibility Analyzer

| Analyzer ID        | Category     | Severity   | Time To Fix  |
| -------------------| :----------: |:----------:| ------------:|
| `accessibility` | 🏅 Best Practices  | Medium    | 10 minutes   |

## What This Checks

Validates that Blade templates follow basic accessibility standards. Checks for:

- Images without `alt` attributes
- Form inputs without associated labels or `aria` attributes
- Missing `lang` attribute on `<html>` tags
- Empty links without accessible text
- Empty buttons without accessible text

## Why It Matters

- **Legal Compliance:** Many jurisdictions require web accessibility (ADA, EAA, Section 508)
- **User Inclusivity:** ~15% of the world's population has some form of disability
- **SEO Benefits:** Search engines use alt text and semantic HTML for indexing
- **Usability:** Accessibility improvements benefit all users (keyboard navigation, screen readers, etc.)

## How to Fix

### Quick Fix (5 minutes)

Add alt attributes to images:

**Before (❌):**
```html
<img src="/logo.png">
```

**After (✅):**
```html
<img src="/logo.png" alt="Company Logo">
<!-- For decorative images: -->
<img src="/divider.png" alt="">
```

### Proper Fix (10 minutes)

**1. Add labels to form inputs:**

**Before (❌):**
```html
<input type="email" name="email" placeholder="Email">
```

**After (✅):**
```html
<label for="email">Email Address</label>
<input type="email" id="email" name="email" placeholder="Email">

<!-- Or wrap the input inside a label: -->
<label>Email Address <input type="email" name="email"></label>

<!-- Or use aria-label for icon-only inputs: -->
<input type="search" aria-label="Search products">
```

**2. Add lang attribute:**

```html
<html lang="en">
```

**3. Add accessible text to links and buttons:**

**Before (❌):**
```html
<a href="/settings"><i class="icon-gear"></i></a>
<button><i class="icon-delete"></i></button>
```

**After (✅):**
```html
<a href="/settings" aria-label="Settings"><i class="icon-gear"></i></a>
<button aria-label="Delete item"><i class="icon-delete"></i></button>
```

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Laravel Blade Templates](https://laravel.com/docs/blade)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Related Analyzers

- [Logic in Blade](/analyzers/best-practices/logic-in-blade) - Detects business logic in Blade templates
- [XSS Vulnerabilities](/analyzers/security/xss-vulnerabilities) - Detects cross-site scripting in templates
- [Frontend Dependencies](/analyzers/security/frontend-vulnerable-dependencies) - Checks frontend dependency security
