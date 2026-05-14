---
title: Errors
description: Standard error format and HTTP status codes for the ShieldCI REST API v1
icon: triangle-alert
outline: [2, 2]
tags: api,v1,errors,http-status
---

# Errors

The ShieldCI API uses conventional HTTP response codes and a consistent JSON error envelope.

## Error Format

All non-2xx responses return a JSON body with at least two fields:

```json
{
  "error": "ErrorType",
  "message": "A human-readable description of what went wrong."
}
```

Validation errors (HTTP `422`) add an `errors` object with per-field messages. The `message` field reflects the first validation failure:

```json
{
  "error": "Validation Failed",
  "message": "A project name is required.",
  "errors": {
    "name": ["A project name is required."]
  }
}
```

## HTTP Status Codes

| Status | Meaning | When it occurs |
|--------|---------|----------------|
| `200` | OK | Request succeeded; response contains requested data |
| `201` | Created | Resource created successfully |
| `202` | Accepted | Request accepted for async processing (e.g., data export) |
| `401` | Unauthenticated | No token, invalid token, or revoked token |
| `403` | Forbidden | Valid token but insufficient ability, or no active subscription |
| `404` | Not Found | Resource does not exist or belongs to another user |
| `409` | Conflict | Operation conflicts with current state (e.g., duplicate export) |
| `422` | Unprocessable Entity | Validation failed — `errors` object contains field-level details |
| `405` | Method Not Allowed | HTTP verb not supported for this endpoint |
| `429` | Too Many Requests | Rate limit exceeded; see `Retry-After` header |
| `500` | Server Error | Unexpected server-side failure |

## Common Errors

### 401 — Unauthenticated

```json
{
  "error": "Unauthenticated",
  "message": "Authentication required."
}
```

Returned when no token is present, the token is malformed, or the token has been revoked. Check that you are including `Authorization: Bearer shieldci_{your_token}` in the request.

### 403 — Insufficient Ability

```json
{
  "error": "Forbidden",
  "message": "This token does not have the required '{ability}' ability."
}
```

The token is valid but lacks the ability required by the endpoint. [Create a new token](/api/tokens) with the appropriate ability, or use an existing `admin` token which satisfies all ability checks.

### 403 — Subscription Required

```json
{
  "error": "Subscription Required",
  "message": "An active subscription is required to access the API."
}
```

The authenticated user has no active ShieldCI subscription. REST API access is available on all paid plans.

### 404 — Not Found

```json
{
  "error": "Not Found",
  "message": "The requested resource was not found."
}
```

The resource does not exist, has been deleted, or belongs to a different user's account. Route model binding also returns 404 when access is denied (to avoid exposing resource existence).

### 422 — Validation Failed

```json
{
  "error": "Validation Failed",
  "message": "The name field is required.",
  "errors": {
    "name": ["A project name is required."]
  }
}
```

One or more request fields failed validation. Inspect the `errors` object — each key is a field name, and the value is an array of error messages for that field.

### 429 — Too Many Requests

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please wait before making more requests.",
  "retry_after": 60
}
```

You have exceeded your plan's rate limit. The `Retry-After` response header contains the number of seconds to wait; the `retry_after` field in the JSON body mirrors this value for clients that cannot easily inspect headers. See [Rate Limits](/api/rate-limits) for per-plan allowances.

## Related

- [Authentication](/api/authentication) — How to obtain and use API tokens
- [Rate Limits](/api/rate-limits) — Per-plan request limits and retry guidance
