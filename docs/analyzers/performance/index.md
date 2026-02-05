---
title: Performance Analyzers
description: Analyzers identifying bottlenecks and optimization opportunities in Laravel applications
icon: zap
outline: [2, 3]
---

# Performance Analyzers

**18 analyzers** identifying bottlenecks and optimization opportunities in Laravel applications.

## Overview

Performance analyzers focus on optimizing application speed, reducing resource consumption, and ensuring your Laravel application runs efficiently in production. These analyzers help identify configuration issues, caching problems, inefficient queries, and other performance bottlenecks that can slow down your application.

## Key Analyzers

### Caching & Optimization

- **[Composer Autoloader Optimization Analyzer](/analyzers/performance/autoloader-optimization)** - Ensures Composer autoloader is optimized for production performance
- **[Configuration Caching Analyzer](/analyzers/performance/config-caching)** - Ensures configuration caching is properly configured for each environment
- **[Route Caching Analyzer](/analyzers/performance/route-caching)** - Ensures route caching is properly configured for optimal performance
- **[View Caching Analyzer](/analyzers/performance/view-caching)** - Ensures Blade views are properly compiled and cached for optimal performance
- **[OPcache Enabled Analyzer](/analyzers/performance/opcache-enabled)** - Ensures OPcache is enabled for PHP bytecode caching and performance

### Cache & Session Configuration

- **[Cache Driver Configuration Analyzer](/analyzers/performance/cache-driver)** - Ensures a proper cache driver is configured for optimal performance
- **[Shared Cache Lock Store Analyzer](/analyzers/performance/shared-cache-lock)** - Detects cache lock usage on the default cache store, which can cause locks to be cleared when cache is flushed
- **[Session Driver Configuration Analyzer](/analyzers/performance/session-driver)** - Ensures a proper session driver is configured for scalability and performance

### Queue & Background Jobs

- **[Queue Driver Configuration Analyzer](/analyzers/performance/queue-driver)** - Ensures a proper queue driver is configured for optimal performance and reliability
- **[Horizon Suggestion Analyzer](/analyzers/performance/horizon-suggestion)** - Recommends using Laravel Horizon when Redis queues are configured

### Database & Queries

- **[MySQL Single Server Optimization Analyzer](/analyzers/performance/mysql-single-server-optimization)** - Ensures MySQL is configured optimally for single-server setups using Unix sockets
- **[Collection Call Optimization Analyzer](/analyzers/performance/collection-call-optimization)** - Detects inefficient collection operations that should be performed at the database query level

### Assets & Frontend

- **[Asset Minification Analyzer](/analyzers/performance/asset-minification)** - Ensures JavaScript and CSS assets are minified in production
- **[Asset Cache Headers Analyzer](/analyzers/performance/asset-cache-headers)** - Ensures compiled assets have appropriate cache headers for optimal browser caching

### Configuration & Environment

- **[Debug Log Level Analyzer](/analyzers/performance/debug-log-level)** - Ensures log level is not set to debug in production for optimal performance
- **[Env Calls Outside Config Analyzer](/analyzers/performance/env-call-outside-config)** - Detects env() function calls outside configuration files that break when config is cached
- **[Dev Dependencies in Production Analyzer](/analyzers/performance/dev-dependencies-production)** - Detects if development dependencies are installed in production environment
- **[Unused Global Middleware Analyzer](/analyzers/performance/unused-global-middleware)** - Detects global HTTP middleware that is registered but not being used, causing unnecessary overhead on every request

## How They Work

Performance analyzers use a combination of:

1. **Configuration Analysis:** Checks Laravel configuration files for optimal settings
2. **File System Checks:** Validates cache files, compiled views, and optimized autoloaders
3. **Code Analysis:** Detects inefficient patterns like collection operations that should be database queries
4. **Environment Validation:** Ensures production environments are properly configured
5. **Asset Analysis:** Checks frontend assets for minification and cache headers

## Severity Levels

| Severity | Description | Examples |
|----------|-------------|----------|
| **Critical** | Issues that severely impact performance | Missing OPcache, debug mode in production, no caching enabled |
| **High** | Issues that significantly slow down the application | Inefficient queries, missing route caching, wrong cache driver |
| **Medium** | Issues that reduce performance | Unminified assets, unused middleware, collection operations |
| **Low** | Optimization opportunities | Missing cache headers, suboptimal configuration |

## Running Performance Analyzers

### Run All Performance Analyzers

```bash
php artisan shield:analyze --category=performance
```

### Run Specific Analyzer

```bash
php artisan shield:analyze --analyzer=opcache-enabled
php artisan shield:analyze --analyzer=config-caching
php artisan shield:analyze --analyzer=collection-call-optimization
```

### Run Multiple Analyzers

```bash
php artisan shield:analyze --analyzer=opcache-enabled,config-caching,route-caching,view-caching
```

## Best Practices

### Development

- Run performance analyzers before deploying to production
- Fix Critical and High severity issues immediately
- Use performance analyzers to identify bottlenecks during development

### Production Deployment

- Ensure all caching is enabled (config, routes, views)
- Verify OPcache is enabled and configured
- Check that debug mode is disabled
- Validate cache drivers are production-ready (Redis, Memcached)

### CI/CD

- Run performance analyzers in staging environment
- Fail builds on Critical performance issues
- Monitor performance metrics over time

### Monitoring

- Track performance improvements after fixes
- Monitor cache hit rates
- Measure response times before and after optimizations

## Performance Checklist

Before deploying to production, ensure:

- ✅ OPcache is enabled and configured
- ✅ Configuration is cached (`php artisan config:cache`)
- ✅ Routes are cached (`php artisan route:cache`)
- ✅ Views are compiled (`php artisan view:cache`)
- ✅ Autoloader is optimized (`composer install --optimize-autoloader --no-dev`)
- ✅ Debug mode is disabled (`APP_DEBUG=false`)
- ✅ Cache driver is production-ready (Redis/Memcached)
- ✅ Session driver is production-ready (Redis/database)
- ✅ Queue driver is configured (Redis/database/SQS)
- ✅ Assets are minified and have cache headers
- ✅ No development dependencies in production
- ✅ No env() calls outside config files

## Related Categories

- **[Security Analyzers](/analyzers/security/)** - Prevent security vulnerabilities
- **[Reliability Analyzers](/analyzers/reliability/)** - Ensure application stability
- **[Best Practices Analyzers](/analyzers/best-practices/)** - Follow Laravel conventions
- **[Code Quality Analyzers](/analyzers/code-quality/)** - Maintain code quality standards
