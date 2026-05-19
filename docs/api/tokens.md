---
title: Tokens
description: Manage personal access tokens for the ShieldCI REST API v1
icon: fingerprint
outline: [2, 2]
tags: api,v1,tokens,authentication,personal-access-tokens
---

# Tokens

Manage the personal access tokens used to authenticate REST API requests. Tokens can have one or more abilities (`read`, `write`, `admin`) and an optional expiration date.

All endpoints require a valid Sanctum token. See [Authentication](/api/authentication) for ability details.

---

## List Tokens

<Badge type="info" text="GET" /> `/api/v1/tokens`

Requires ability: **read**

Returns all personal access tokens belonging to the authenticated user, ordered by creation date descending.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Accept` | `application/json` | Recommended |

```bash
curl https://shieldci.com/api/v1/tokens \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Accept: application/json"
```

### Response

```json
{
  "data": [
    {
      "id": 1,
      "name": "ci-pipeline",
      "abilities": ["read", "write"],
      "last_used_at": "2026-05-12T09:00:00+00:00",
      "expires_at": null,
      "created_at": "2026-01-10T08:00:00+00:00"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Token ID (used to revoke the token) |
| `name` | string | Descriptive name given at creation |
| `abilities` | string[] | Abilities granted to this token |
| `last_used_at` | string\|null | ISO 8601 timestamp of last use |
| `expires_at` | string\|null | ISO 8601 expiration timestamp; null means no expiry |
| `created_at` | string\|null | ISO 8601 creation timestamp |

::: info Plain-text value not returned
The `plain_text_token` is only returned when the token is **created**. This endpoint returns token metadata only; the actual token string cannot be retrieved after creation.
:::

### Errors

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |
| `403` | Token lacks the `read` ability |

---

## Create Token

<Badge type="tip" text="POST" /> `/api/v1/tokens`

Requires ability: **admin**

Creates a new personal access token. The plain-text token value is returned **only once** in the response; copy it immediately.

Maximum of **10 tokens per user**.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Content-Type` | `application/json` | Yes |

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Descriptive name (max 255 characters) |
| `abilities` | string[] | Yes | At least one of `read`, `write`, `admin` |
| `expires_at` | string | No | ISO 8601 or date string; must be a future date |

```bash
curl -X POST https://shieldci.com/api/v1/tokens \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ci-pipeline",
    "abilities": ["read", "write"],
    "expires_at": "2027-01-01"
  }'
```

### Response

HTTP `201 Created`

::: warning Save the token immediately
`plain_text_token` is displayed **only once**. It cannot be retrieved after this response. If lost, [revoke the token](#revoke-token) and create a new one.
:::

```json
{
  "token": {
    "id": 2,
    "name": "ci-pipeline",
    "abilities": ["read", "write"],
    "last_used_at": null,
    "expires_at": "2027-01-01T00:00:00+00:00",
    "created_at": "2026-05-13T10:00:00+00:00"
  },
  "plain_text_token": "shieldci_abc123...",
  "message": "Token created successfully. Save the token — it will only be shown once."
}
```

### Errors

| Status | Condition |
|--------|-----------|
| `403` | Token limit reached - maximum 10 tokens per user |
| `422` | Validation failed (`name` missing, `abilities` empty or invalid, `expires_at` in the past) |

**403 response when limit is reached:**

```json
{
  "error": "Forbidden",
  "message": "You can have a maximum of 10 API tokens."
}
```

---

## Revoke Token

<Badge type="danger" text="DELETE" /> `/api/v1/tokens/{token}`

Requires ability: **admin**

Permanently revokes a token. All API requests using the revoked token will immediately return `401`.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | integer | The `id` of the token to revoke (from [List Tokens](#list-tokens)) |

```bash
curl -X DELETE https://shieldci.com/api/v1/tokens/2 \
  -H "Authorization: Bearer shieldci_{token}"
```

### Response

```json
{
  "message": "Token revoked successfully."
}
```

### Errors

| Status | Condition |
|--------|-----------|
| `404` | Token not found or belongs to another user |

---

## Related

- [Authentication](/api/authentication) - Ability system and how tokens are used
- [Errors](/api/errors) - Full error reference
