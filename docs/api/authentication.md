---
title: Authentication
description: How to authenticate requests to the ShieldCI REST API using Sanctum personal access tokens
icon: key
outline: [2, 2]
tags: api,v1,authentication,sanctum,bearer-token
---

# Authentication

All ShieldCI REST API v1 endpoints require a **personal access token** passed as a Bearer token in every request. Tokens are issued per user, scoped to specific abilities, and optionally time-limited.

## Creating a Token

### Via the dashboard (recommended)

The easiest way to create a token is through the ShieldCI dashboard:

1. Sign in and go to **Settings → API Tokens**.
2. Click **New Token**, enter a name, choose abilities, and set an optional expiration date.
3. Click **Create Token**.

::: warning Save your token immediately
The plain-text token is displayed **only once**. Copy it before closing the dialog; it cannot be retrieved afterwards.
:::

### Via the API

You can also create tokens programmatically by calling `POST /api/v1/tokens`. This requires an **existing token** that already has the `admin` ability.

```http
POST /api/v1/tokens
Authorization: Bearer shieldci_{your_admin_token}
Content-Type: application/json

{
  "name": "ci-pipeline",
  "abilities": ["read", "write"],
  "expires_at": "2027-01-01"
}
```

A successful `201` response includes the token metadata and a one-time `plain_text_token` field:

```json
{
  "token": {
    "id": 1,
    "name": "ci-pipeline",
    "abilities": ["read", "write"],
    "last_used_at": null,
    "expires_at": "2027-01-01T00:00:00.000000Z",
    "created_at": "2026-05-13T10:00:00.000000Z"
  },
  "plain_text_token": "shieldci_abc123...",
  "message": "Token created successfully. Save the token — it will only be shown once."
}
```

The limit is **10 tokens per user**.

## Abilities

Each token is granted one or more abilities that determine what it can do. Abilities form a strict hierarchy: a higher ability implicitly includes all lower ones.

| Ability | Includes | What it grants |
|---------|----------|----------------|
| `read` | none | View projects, reports, teams, and notifications |
| `write` | `read` | Create and update projects, reports, and teams (includes read) |
| `admin` | `write`, `read` | Manage tokens, delete resources, and team members (includes write) |
| `*` | everything | Satisfies all ability checks (wildcard) |

A token with `write` ability can call any `read` or `write` endpoint. A token with `admin` ability can call any endpoint, including token management and deletion operations.

## Using Your Token

Include the token in the `Authorization` header of every request:

```http
Authorization: Bearer shieldci_{your_token}
```

**curl example:**

```bash
curl https://shieldci.com/api/v1/user \
  -H "Authorization: Bearer shieldci_{your_token}" \
  -H "Accept: application/json"
```

The `shieldci_` prefix is part of the token value returned when the token is created. It is not added separately; include it exactly as returned. The prefix allows GitHub Secret Scanning and similar tools to detect accidentally committed tokens.

## Subscription Requirement

Every `/api/v1/*` endpoint requires the authenticated user to have an **active ShieldCI subscription**. Tokens belonging to users on a free plan or with a lapsed subscription are rejected before any ability check is performed.

```http
HTTP/1.1 403 Forbidden

{
  "error": "Subscription Required",
  "message": "An active subscription is required to access the API."
}
```

## Error Reference

| Status | Error | Message | Cause |
|--------|-------|---------|-------|
| `401` | `Unauthenticated` | `Authentication required.` | No token provided, token is invalid, or token has been revoked |
| `403` | `Forbidden` | `This token does not have the required '{ability}' ability.` | Token exists but lacks the ability required by the endpoint |
| `403` | `Subscription Required` | `An active subscription is required to access the API.` | Authenticated user has no active subscription |

All error responses use a consistent JSON envelope:

```json
{
  "error": "...",
  "message": "..."
}
```

## Related

- [Managing Tokens via API](/api/tokens) - List, create, and revoke tokens programmatically
- [Error Reference](/api/errors) - Full catalog of API error codes and recovery steps
