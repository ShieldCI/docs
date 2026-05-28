---
title: Command Eager Loading Analyzer
description: Detects Artisan commands without #[AsCommand] that are eagerly instantiated at artisan boot
icon: terminal
outline: [2, 3]
tags: artisan,commands,dependency-injection,lazy-loading,performance
pro: true
---

# Command Eager Loading Analyzer

| Analyzer ID               | Category       | Severity   | Time To Fix  |
| --------------------------| :------------: |:----------:| ------------:|
| `command-eager-loading`   | ⚡ Performance  | Low        | 10 minutes   |

## What This Checks

Detects Artisan commands that have a constructor but do not use the `#[AsCommand]` attribute. Checks for:

- Commands extending `Illuminate\Console\Command` with a constructor defined
- Constructor injection of class-typed dependencies (reported in the issue message)
- Absence of the `#[AsCommand]` attribute, which would make the command lazy

Commands without a constructor are skipped because their instantiation cost is negligible. Commands decorated with `#[AsCommand]` are skipped as they are already lazy.

## Why It Matters

- **Boot Time Overhead:** When you run any `php artisan` command, Laravel calls `resolve()` on every command loaded via `load()`, instantiating each class and its constructor dependencies, even for commands not being run
- **Memory Usage:** All injected dependencies are resolved into memory on every artisan invocation, not just when the command executes
- **Slow CLI Response:** Deployment scripts, schedulers, and `php artisan list` all pay the full resolution cost
- **Unnecessary Connections:** Commands with database or HTTP client dependencies may open connections even for unrelated artisan calls

In most small applications, the impact is negligible. It becomes meaningful with many commands (20+) or expensive constructor dependencies.

## How to Fix

### Option 1 — Add `#[AsCommand]`

Adding `#[AsCommand]` registers the command via Symfony's `ContainerCommandLoader`, which defers instantiation until the command is actually invoked. Constructor DI continues to work exactly as before. No restructuring needed.

```php
<?php

namespace App\Console\Commands;

use App\Services\HeavyService;
use App\Repositories\UserRepository;
use Illuminate\Console\Command;
use Symfony\Component\Console\Attribute\AsCommand;

#[AsCommand(name: 'users:process')]
class ProcessUsers extends Command
{
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

The `$signature` property becomes optional when using `#[AsCommand]`: the command name is declared on the attribute itself.

### Option 2 — Inject in `handle()`

If your dependencies are only used within `handle()` and nowhere else in the command, you can move them to method parameters. Laravel's service container injects them automatically when the command runs.

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

This works well for simple commands. For commands that use dependencies across multiple methods, `#[AsCommand]` is cleaner since it doesn't require restructuring.

## References

- [Laravel Artisan Commands](https://laravel.com/docs/artisan)
- [Laravel Service Container](https://laravel.com/docs/container)
- [Symfony AsCommand Attribute](https://symfony.com/doc/current/console.html#registering-the-command)

## Related Analyzers

- [Queue Timeout Analyzer](/analyzers/reliability/queue-timeout-configuration) - Ensures proper job timeouts
- [Horizon Suggestion Analyzer](/analyzers/performance/horizon-suggestion) - Recommends Horizon for queue management
