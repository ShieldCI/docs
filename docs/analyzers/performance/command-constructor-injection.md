---
title: Command Constructor Injection Analyzer
description: Detects constructor dependency injection in Artisan commands that prevents lazy loading
icon: terminal
outline: [2, 3]
tags: artisan,commands,dependency-injection,lazy-loading,performance
pro: true
---

# Command Constructor Injection Analyzer

| Analyzer ID                      | Category       | Severity   | Time To Fix  |
| ---------------------------------| :------------: |:----------:| ------------:|
| `command-constructor-injection`  | ⚡ Performance  | Low        | 10 minutes   |

## What This Checks

Detects Artisan commands that inject dependencies via the constructor instead of the `handle()` method, preventing lazy loading and causing unnecessary overhead when the command isn't executed.

## Why It Matters

- **Boot Time Overhead:** Constructor dependencies are resolved when Artisan boots, not when the command runs
- **Memory Usage:** Unused commands still have their dependencies instantiated in memory
- **Slow CLI Response:** Every `php artisan` invocation pays the cost of resolving all command dependencies
- **Unnecessary Database Connections:** Commands with database dependencies may open connections even for `php artisan list`

When you run any Artisan command, Laravel resolves all registered commands and their constructor dependencies. If a command has heavy dependencies (database, external services), this adds overhead even if you're running a completely different command.

## How to Fix

### Move Dependencies to handle()

**Before (eager loading - all dependencies resolved at boot):**
```php
<?php

namespace App\Console\Commands;

use App\Services\HeavyService;
use App\Repositories\UserRepository;
use Illuminate\Console\Command;

class ProcessUsers extends Command
{
    protected $signature = 'users:process';

    public function __construct(
        private HeavyService $service,
        private UserRepository $repository
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $users = $this->repository->all();
        $this->service->process($users);

        return Command::SUCCESS;
    }
}
```

**After (lazy loading - dependencies resolved only when command runs):**
```php
<?php

namespace App\Console\Commands;

use App\Services\HeavyService;
use App\Repositories\UserRepository;
use Illuminate\Console\Command;

class ProcessUsers extends Command
{
    protected $signature = 'users:process';

    public function handle(
        HeavyService $service,
        UserRepository $repository
    ): int {
        $users = $repository->all();
        $service->process($users);

        return Command::SUCCESS;
    }
}
```

### Keep Constructor for Lightweight Dependencies

Some dependencies are acceptable in constructors:

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Contracts\Config\Repository as ConfigRepository;

class ShowConfig extends Command
{
    protected $signature = 'config:show {key}';

    // Config repository is lightweight and already instantiated
    public function __construct(
        private ConfigRepository $config
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info($this->config->get($this->argument('key')));

        return Command::SUCCESS;
    }
}
```

**Acceptable in constructor:**
- `ConfigRepository` (already booted)
- `Application` container
- Simple value objects

**Move to handle():**
- Database repositories
- External service clients
- Heavy classes with their own dependencies

### Using Lazy Proxy Pattern

For complex commands with many methods needing the same dependency:

```php
<?php

namespace App\Console\Commands;

use App\Services\HeavyService;
use Illuminate\Console\Command;

class ComplexCommand extends Command
{
    protected $signature = 'complex:run';

    private ?HeavyService $service = null;

    public function handle(): int
    {
        $this->doStep1();
        $this->doStep2();

        return Command::SUCCESS;
    }

    private function getService(): HeavyService
    {
        // Lazy load the service only when first accessed
        return $this->service ??= app(HeavyService::class);
    }

    private function doStep1(): void
    {
        $this->getService()->step1();
    }

    private function doStep2(): void
    {
        $this->getService()->step2();
    }
}
```

## Performance Impact

**With 50 commands using constructor injection:**
```
$ time php artisan list
real    0m0.450s  # Slow due to resolving all dependencies
```

**With handle() injection:**
```
$ time php artisan list
real    0m0.120s  # Fast, only resolves when command runs
```

## Common Patterns to Refactor

| Pattern | Issue | Solution |
|---------|-------|----------|
| `__construct(Repository $repo)` | Eager DB connection | Move to `handle()` |
| `__construct(ApiClient $client)` | Eager HTTP client init | Move to `handle()` |
| `__construct(Cache $cache)` | Less impactful but still eager | Move to `handle()` |
| `__construct(Logger $log)` | Usually acceptable | Can keep in constructor |

## ShieldCI Configuration

This analyzer:
- Runs in **all environments including CI**
- Scans `app/Console/Commands` directory
- Ignores primitive type constructor parameters
- Reports command name and dependency types

## Verification

```bash
# Check boot time impact
php artisan list --profile

# Time a simple command
time php artisan inspire

# After refactoring, compare times
```

## References

- [Laravel Artisan Commands](https://laravel.com/docs/artisan)
- [Service Container Injection](https://laravel.com/docs/container)
- [PHP Lazy Loading Patterns](https://refactoring.guru/design-patterns/lazy-initialization)

## Related Analyzers

- [Service Container Resolution Analyzer](/analyzers/best-practices/service-container-resolution) - Checks service resolution patterns
- [Queue Timeout Analyzer](/analyzers/reliability/queue-timeout-configuration) - Ensures proper job timeouts
