---
title: Contributing
description: Learn how to contribute to ShieldCI - bug reports, feature requests, documentation improvements, and code contributions.
tags: contributing,open-source,community,pull-requests,bug-reports
---

# Contributing to ShieldCI

We welcome contributions from the community! Whether you're reporting bugs, suggesting features, improving documentation, or contributing code, your help makes ShieldCI better for everyone.

## Ways to Contribute

### Report Bugs

Found a bug? Please help us fix it:

1. **Search existing issues** - Check if the bug has already been reported on [GitHub Issues](https://github.com/shieldci/laravel/issues)
2. **Create a new issue** - If not found, [open a new issue](https://github.com/shieldci/laravel/issues/new)
3. **Include details**:
   - ShieldCI version
   - Laravel version
   - PHP version
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages (if any)

**Good bug report example:**

```
Title: False positive in SQL Injection analyzer with Query Builder

ShieldCI: 1.0.0
Laravel: 11.x
PHP: 8.3

Steps to reproduce:
1. Create a query using `DB::table('users')->where('id', $id)`
2. Run `php artisan shieldci:analyze`
3. Analyzer incorrectly flags this as SQL injection

Expected: No warning (parameterized query is safe)
Actual: SQL injection warning triggered
```

### Suggest Features

Have an idea to improve ShieldCI?

1. **Check existing discussions** - Your idea might already be under consideration
2. **Open a feature request** - [Create an issue](https://github.com/shieldci/laravel/issues/new) with the `enhancement` label
3. **Describe the use case**:
   - What problem does it solve?
   - Who would benefit?
   - How would it work?

### Improve Documentation

Documentation improvements are always welcome:

1. **Edit directly** - Click "Edit this page on GitHub" at the bottom of any page
2. **Submit a PR** - Make changes and submit a pull request
3. **Report issues** - [Open an issue](https://github.com/shieldci/docs/issues) for documentation problems

**Documentation guidelines:**

- Write clearly and concisely
- Include code examples where helpful
- Test code examples before submitting
- Follow existing formatting conventions

### Contribute Code

Ready to contribute code? Here's how:

1. **Fork the repository** - [shieldci/laravel](https://github.com/shieldci/laravel)
2. **Create a branch** - `git checkout -b feature/your-feature-name`
3. **Write tests** - All new features need tests
4. **Follow coding standards** - Run `composer format` before committing
5. **Submit a PR** - Include a clear description of changes

## Development Setup

### Requirements

- PHP 8.1+
- Composer 2.x
- Git

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/laravel.git shieldci-laravel
cd shieldci-laravel

# Install dependencies
composer install

# Run tests
composer test

# Run static analysis
composer analyse

# Fix code style
composer format
```

### Running Tests

```bash
# All tests
composer test

# Specific test file
vendor/bin/phpunit tests/Analyzers/Security/SqlInjectionTest.php

# With coverage
composer test-coverage
```

### Code Quality

All contributions must pass:

- **PHPStan Level 9** - `composer analyse`
- **Laravel Pint** - `composer format`
- **All tests** - `composer test`

## Code of Conduct

We are committed to providing a welcoming and inclusive community. Please:

- **Be respectful** - Treat everyone with respect and kindness
- **Be constructive** - Focus on helpful feedback and collaboration
- **Be patient** - Remember that maintainers are volunteers
- **Be inclusive** - Welcome newcomers and help them contribute

Unacceptable behavior includes:

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing private information without consent
- Any conduct inappropriate in a professional setting

Violations may result in temporary or permanent bans from the community.

## Getting Help

- **Discord** - Join our [Discord community](https://discord.gg/JtYHEAS2aK) for real-time help
- **GitHub Discussions** - For questions and general discussions
- **Documentation** - Check the docs for answers to common questions

## Recognition

Contributors are recognized in:

- Release notes for significant contributions
- Our community Discord

Thank you for contributing to ShieldCI!
