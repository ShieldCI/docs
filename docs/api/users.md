---
title: Users
description: Manage your ShieldCI user profile, data exports, and notifications via the REST API v1
icon: user
outline: [2,2]
tags: api,v1,users,profile,notifications
---

# Users

Endpoints for managing the authenticated user's profile, account, data exports, and notifications.

All endpoints require a valid Sanctum token. See [Authentication](/api/authentication) for details.

---

## Get Profile

<Badge type="info" text="GET" /> `/api/v1/user`

Requires ability: **read**

Returns the authenticated user's profile.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Accept` | `application/json` | Recommended |

```bash
curl https://shieldci.com/api/v1/user \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Accept: application/json"
```

### Response

```json
{
  "data": {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "avatar_url": "https://gravatar.com/...",
    "email_verified_at": "2026-01-10T08:00:00+00:00",
    "current_team_id": 3,
    "created_at": "2026-01-05T12:00:00+00:00"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | User ID |
| `name` | string | Display name |
| `email` | string | Email address |
| `avatar_url` | string\|null | Gravatar or uploaded avatar URL |
| `email_verified_at` | string\|null | ISO 8601 timestamp when email was verified |
| `current_team_id` | integer\|null | ID of the team currently active for this user |
| `created_at` | string\|null | ISO 8601 account creation timestamp |

---

## Update Profile

<Badge type="warning" text="PUT" /> `/api/v1/user`

Requires ability: **write**

Updates the authenticated user's display name.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Content-Type` | `application/json` | Yes |

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name (max 255 characters) |

```bash
curl -X PUT https://shieldci.com/api/v1/user \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Smith"}'
```

### Response

Returns the updated user profile in the same shape as [Get Profile](#get-profile).

### Errors

| Status | Condition |
|--------|-----------|
| `422` | `name` is missing or exceeds 255 characters |

---

## Delete Account

<Badge type="danger" text="DELETE" /> `/api/v1/user`

Requires ability: **admin**

Permanently deletes the authenticated user's account and all associated data. This action is irreversible.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Content-Type` | `application/json` | Yes |

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `password` | string | Yes | Current account password (used to confirm the deletion) |

```bash
curl -X DELETE https://shieldci.com/api/v1/user \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Content-Type: application/json" \
  -d '{"password": "your-password"}'
```

### Response

```json
{
  "message": "Account deleted successfully."
}
```

### Errors

| Status | Condition |
|--------|-----------|
| `422` | Password is missing or incorrect |

---

## Request Data Export

<Badge type="tip" text="POST" /> `/api/v1/user/export-data`

Requires ability: **write**

Enqueues a full data export for the authenticated user. An email notification is sent when the export is ready to download. Only one export can be in progress at a time within a 24-hour window.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |

No request body required.

```bash
curl -X POST https://shieldci.com/api/v1/user/export-data \
  -H "Authorization: Bearer shieldci_{token}"
```

### Response

HTTP `202 Accepted`

```json
{
  "message": "Data export requested. You will be notified when it is ready."
}
```

### Errors

| Status | Condition |
|--------|-----------|
| `409` | A data export is already in progress (within the last 24 hours) |

---

## List Notifications

<Badge type="info" text="GET" /> `/api/v1/user/notifications`

Requires ability: **read**

Returns a paginated list of notifications for the authenticated user, ordered by most recent first.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Accept` | `application/json` | Recommended |

```bash
curl "https://shieldci.com/api/v1/user/notifications?page=1" \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Accept: application/json"
```

### Response

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "App\\Notifications\\ReportReady",
      "data": { "report_uuid": "...", "project_name": "my-app" },
      "read_at": null,
      "created_at": "2026-05-13T10:00:00+00:00"
    }
  ],
  "links": { "first": "...", "last": "...", "prev": null, "next": null },
  "meta": { "current_page": 1, "per_page": 20, "total": 1 }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique notification ID |
| `type` | string | Fully-qualified notification class name |
| `data` | object | Notification payload (varies by type) |
| `read_at` | string\|null | ISO 8601 timestamp when notification was read; null if unread |
| `created_at` | string\|null | ISO 8601 creation timestamp |

---

## Mark Notification Read

<Badge type="warning" text="PUT" /> `/api/v1/user/notifications/{notification}/read`

Requires ability: **write**

Marks a specific notification as read.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Accept` | `application/json` | Recommended |

| Parameter | Type | Description |
|-----------|------|-------------|
| `notification` | UUID string | The `id` of the notification to mark as read |

```bash
curl -X PUT "https://shieldci.com/api/v1/user/notifications/550e8400-e29b-41d4-a716-446655440000/read" \
  -H "Authorization: Bearer shieldci_{token}"
```

### Response

```json
{
  "message": "Notification marked as read."
}
```

### Errors

| Status | Condition |
|--------|-----------|
| `404` | Notification not found or belongs to another user |

---

## Related

- [Authentication](/api/authentication) — How to create and use API tokens
- [Tokens](/api/tokens) — Manage personal access tokens
- [Errors](/api/errors) — Full error reference
