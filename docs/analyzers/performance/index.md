---
title: Performance Analyzers
description: Analyzers identifying bottlenecks and optimization opportunities in Laravel applications
tags: performance,optimization,caching,opcache,laravel,queries,bottlenecks
icon: zap
outline: [2, 3]
---

# Performance Analyzers

**18 analyzers** identifying bottlenecks and optimization opportunities in Laravel applications.

## Overview

Performance analyzers focus on optimizing application speed, reducing resource consumption, and ensuring your Laravel application runs efficiently in production. These analyzers help identify configuration issues, caching problems, inefficient queries, and other performance bottlenecks that can slow down your application.

## Key Analyzers

### Caching & Optimization

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Composer Autoloader Optimization"
  description="Ensures Composer autoloader is optimized for production performance"
  severity="high"
  link="/analyzers/performance/autoloader-optimization"
/>

<AnalyzerCard
  title="Configuration Caching"
  description="Ensures configuration caching is properly configured for each environment"
  severity="high"
  link="/analyzers/performance/config-caching"
/>

<AnalyzerCard
  title="Route Caching"
  description="Ensures route caching is properly configured for optimal performance"
  severity="high"
  link="/analyzers/performance/route-caching"
/>

<AnalyzerCard
  title="View Caching"
  description="Ensures Blade views are properly compiled and cached for optimal performance"
  severity="medium"
  link="/analyzers/performance/view-caching"
/>

<AnalyzerCard
  title="OPcache Enabled"
  description="Ensures OPcache is enabled for PHP bytecode caching and performance"
  severity="high"
  link="/analyzers/performance/opcache-enabled"
/>

</div>

### Cache & Session Configuration

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Cache Driver Configuration"
  description="Ensures a proper cache driver is configured for optimal performance"
  severity="high"
  link="/analyzers/performance/cache-driver"
/>

<AnalyzerCard
  title="Shared Cache Lock Store"
  description="Detects cache lock usage on the default cache store, which can cause locks to be cleared when cache is flushed"
  severity="low"
  link="/analyzers/performance/shared-cache-lock"
/>

<AnalyzerCard
  title="Session Driver Configuration"
  description="Ensures a proper session driver is configured for scalability and performance"
  severity="critical"
  link="/analyzers/performance/session-driver"
/>

</div>

### Queue & Background Jobs

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Queue Driver Configuration"
  description="Ensures a proper queue driver is configured for optimal performance and reliability"
  severity="medium"
  link="/analyzers/performance/queue-driver"
/>

<AnalyzerCard
  title="Horizon Suggestion"
  description="Recommends using Laravel Horizon when Redis queues are configured"
  severity="low"
  link="/analyzers/performance/horizon-suggestion"
/>

</div>

### Database & Queries

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="MySQL Single Server Optimization"
  description="Ensures MySQL is configured optimally for single-server setups using Unix sockets"
  severity="medium"
  link="/analyzers/performance/mysql-single-server-optimization"
/>

<AnalyzerCard
  title="Collection Call Optimization"
  description="Detects inefficient collection operations that should be performed at the database query level"
  severity="high"
  link="/analyzers/performance/collection-call-optimization"
/>

</div>

### Assets & Frontend

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Asset Minification"
  description="Ensures JavaScript and CSS assets are minified in production"
  severity="medium"
  link="/analyzers/performance/asset-minification"
/>

<AnalyzerCard
  title="Asset Cache Headers"
  description="Ensures compiled assets have appropriate cache headers for optimal browser caching"
  severity="high"
  link="/analyzers/performance/asset-cache-headers"
/>

</div>

### Configuration & Environment

<div class="grid gap-4 md:grid-cols-2 mt-4">

<AnalyzerCard
  title="Debug Log Level"
  description="Ensures log level is not set to debug in production for optimal performance"
  severity="high"
  link="/analyzers/performance/debug-log-level"
/>

<AnalyzerCard
  title="Env Calls Outside Config"
  description="Detects env() function calls outside configuration files that break when config is cached"
  severity="high"
  link="/analyzers/performance/env-call-outside-config"
/>

<AnalyzerCard
  title="Dev Dependencies in Production"
  description="Detects if development dependencies are installed in production environment"
  severity="high"
  link="/analyzers/performance/dev-dependencies-production"
/>

<AnalyzerCard
  title="Unused Global Middleware"
  description="Detects global HTTP middleware that is registered but not being used, causing unnecessary overhead"
  severity="low"
  link="/analyzers/performance/unused-global-middleware"
/>

</div>

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
