---
title: Rate Limits
description: Per-plan rate limits, request quotas, and retry strategies for the ShieldCI REST API v1 — avoid 429 errors in automated pipelines
icon: gauge
outline: [2, 2]
tags: api,v1,rate-limits,throttle
---

# Rate Limits

The ShieldCI REST API uses per-user rate limiting. Limits scale automatically with your subscription plan.

## Limits by Plan

| Plan | Requests per minute | Multiplier |
|------|---------------------|------------|
| Solo Dev | 120 | 1× |
| Business | 360 | 3× |
| Enterprise | 1,200 | 10× |

::: tip Unauthenticated requests
Requests without a valid token are limited to **10 requests per minute per IP address**. Authenticated requests are always counted against the user, not the IP.
:::

## Rate Limit Headers

Every response includes rate limit headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed in the current window |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `Retry-After` | Seconds to wait before retrying (only present on `429` responses) |

## Handling 429 Responses

When you exceed the limit the API returns HTTP `429`:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please wait before making more requests.",
  "retry_after": 43
}
```

The `retry_after` field (and the `Retry-After` header) indicate the number of seconds to wait before retrying. Use exponential backoff for resilience:

```bash
# Check the Retry-After header before retrying
curl -i https://shieldci.com/api/v1/projects \
  -H "Authorization: Bearer shieldci_{your_token}" \
  -H "Accept: application/json"

# Response headers on 429:
# HTTP/1.1 429 Too Many Requests
# Retry-After: 60
# X-RateLimit-Limit: 120
# X-RateLimit-Remaining: 0
```

## Retry Strategy

For automated clients:

1. Read the `Retry-After` header value from the `429` response.
2. Wait at least that many seconds before retrying.
3. For repeated failures, add jitter to spread concurrent retries.

```javascript
async function apiRequest(url, options, retries = 3, attempt = 0) {
  const response = await fetch(url, options);
  if (response.status === 429 && retries > 0) {
    const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60', 10);
    const jitter = Math.random() * 1000; // up to 1 second of random jitter
    const delay = retryAfter * 1000 * Math.pow(2, attempt) + jitter;
    await new Promise(resolve => setTimeout(resolve, delay));
    return apiRequest(url, options, retries - 1, attempt + 1);
  }
  return response;
}
```

## Related

- [Authentication](/api/authentication) - How to obtain and use API tokens
- [Errors](/api/errors) - Full error reference including 429 details
