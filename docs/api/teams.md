---
title: Teams
description: Create and manage ShieldCI teams and their members via the REST API v1
icon: users
outline: [2, 2]
tags: api,v1,teams
---

# Teams

Manage teams that group projects and users together. Every ShieldCI account has a **personal team** created on signup. Business and Enterprise plans can create additional shared teams with multiple members.

All endpoints require a valid Sanctum token. See [Authentication](/api/authentication) for ability details.

---

## List Teams

<Badge type="info" text="GET" /> `/api/v1/teams`

Requires ability: **read**

Returns all teams the authenticated user belongs to, including their personal team.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Accept` | `application/json` | Recommended |

```bash
curl https://shieldci.com/api/v1/teams \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Accept: application/json"
```

### Response

```json
{
  "data": [
    {
      "id": 1,
      "name": "Jane's Team",
      "personal_team": true,
      "owner_id": 5,
      "member_count": 1,
      "project_count": 2,
      "created_at": "2026-01-05T12:00:00+00:00"
    },
    {
      "id": 3,
      "name": "Acme Corp",
      "personal_team": false,
      "owner_id": 5,
      "member_count": 4,
      "project_count": 7,
      "created_at": "2026-02-10T09:00:00+00:00"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Team ID - use in all team URLs |
| `name` | string | Team display name |
| `personal_team` | boolean | `true` if this is the user's automatically-created personal team |
| `owner_id` | integer\|null | User ID of the team owner |
| `member_count` | integer | Total number of team members |
| `project_count` | integer | Total number of projects in this team |
| `created_at` | string\|null | ISO 8601 creation timestamp |

### Errors

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |
| `403` | Token lacks `read` ability or no active subscription |

---

## Create Team

<Badge type="tip" text="POST" /> `/api/v1/teams`

Requires ability: **write**

Creates a new shared team and switches the authenticated user's active context to it. The authenticated user becomes the team owner. Creating shared teams requires a **Business or Enterprise** plan.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Content-Type` | `application/json` | Yes |

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Team name (max 255 characters) |

```bash
curl -X POST https://shieldci.com/api/v1/teams \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp"}'
```

### Response

HTTP `201 Created`

```json
{
  "team": {
    "id": 3,
    "name": "Acme Corp",
    "personal_team": false,
    "owner_id": 5,
    "member_count": 1,
    "project_count": 0,
    "created_at": "2026-05-13T10:00:00+00:00"
  },
  "message": "Team created successfully."
}
```

### Errors

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |
| `403` | Plan does not allow creating shared teams |
| `422` | Validation failed - `name` missing or exceeds 255 characters |

---

## Get Team

<Badge type="info" text="GET" /> `/api/v1/teams/{team}`

Requires ability: **read**

Returns the team's details and its full member list.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Accept` | `application/json` | Recommended |

| Parameter | Type | Description |
|-----------|------|-------------|
| `team` | integer | Team ID (from `data[].id` in the list response) |

```bash
curl "https://shieldci.com/api/v1/teams/3" \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Accept: application/json"
```

### Response

```json
{
  "team": {
    "id": 3,
    "name": "Acme Corp",
    "personal_team": false,
    "owner_id": 5,
    "member_count": 2,
    "project_count": 5,
    "created_at": "2026-02-10T09:00:00+00:00"
  },
  "members": [
    {
      "id": 5,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "avatar_url": null,
      "role": "owner",
      "joined_at": "2026-02-10T09:00:00+00:00"
    },
    {
      "id": 8,
      "name": "Bob Jones",
      "email": "bob@example.com",
      "avatar_url": "https://gravatar.com/...",
      "role": "member",
      "joined_at": "2026-03-01T11:00:00+00:00"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | User ID - use in member management URLs |
| `name` | string | Display name |
| `email` | string | Email address |
| `avatar_url` | string\|null | Avatar URL |
| `role` | string\|null | Team role: `owner`, `admin`, `member`, or `readonly` |
| `joined_at` | string\|null | ISO 8601 timestamp when the user joined the team |

### Errors

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |
| `403` | Token lacks `read` ability or no active subscription |
| `404` | Team not found or user is not a member |

---

## Update Team

<Badge type="warning" text="PUT" /> `/api/v1/teams/{team}`

Requires ability: **write**

Renames a team.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Content-Type` | `application/json` | Yes |

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | New team name (max 255 characters) |

```bash
curl -X PUT "https://shieldci.com/api/v1/teams/3" \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp Ltd"}'
```

### Response

Returns the updated team in the same shape as the `team` object in [Get Team](#get-team).

### Errors

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |
| `403` | Token lacks permission to update this team |
| `404` | Team not found |
| `422` | Validation failed |

---

## Delete Team

<Badge type="danger" text="DELETE" /> `/api/v1/teams/{team}`

Requires ability: **write**

Permanently deletes a team. Cannot delete your personal team.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |

```bash
curl -X DELETE "https://shieldci.com/api/v1/teams/3" \
  -H "Authorization: Bearer shieldci_{token}"
```

### Response

```json
{
  "message": "Team deleted successfully."
}
```

### Errors

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |
| `403` | Token lacks permission to delete this team, or team is a personal team |
| `404` | Team not found |

---

## Invite Member

<Badge type="tip" text="POST" /> `/api/v1/teams/{team}/members`

Requires ability: **admin**

Sends a team invitation email to the specified address. The invitation must be accepted by the recipient. Inviting someone who already has a pending invitation purges the old invitation and resends it.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Content-Type` | `application/json` | Yes |

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Email address to invite (max 255 characters) |
| `role` | string | Yes | Role to assign: `admin`, `member`, or `readonly` - cannot be `owner` |

```bash
curl -X POST "https://shieldci.com/api/v1/teams/3/members" \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Content-Type: application/json" \
  -d '{"email": "new@example.com", "role": "member"}'
```

### Response

HTTP `201 Created`

```json
{
  "message": "Invitation sent to new@example.com."
}
```

### Errors

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |
| `403` | Token lacks `admin` ability or user lacks permission to invite members |
| `404` | Team not found |
| `422` | Email is already an active team member, role is `owner`, or email is invalid |

---

## Update Member Role

<Badge type="warning" text="PUT" /> `/api/v1/teams/{team}/members/{user}`

Requires ability: **admin**

Changes the role of an existing team member.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Content-Type` | `application/json` | Yes |

| Parameter | Type | Description |
|-----------|------|-------------|
| `team` | integer | Team ID |
| `user` | integer | User ID of the member to update (from `members[].id` in Get Team) |

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | Yes | New role: `admin`, `member`, or `readonly` - cannot be `owner` |

```bash
curl -X PUT "https://shieldci.com/api/v1/teams/3/members/8" \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### Response

```json
{
  "message": "Member role updated to Admin."
}
```

### Errors

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |
| `403` | Target user is the team owner; or you are trying to change your own role |
| `404` | User is not a member of this team |
| `422` | Role is invalid or set to `owner` |

---

## Remove Member

<Badge type="danger" text="DELETE" /> `/api/v1/teams/{team}/members/{user}`

Requires ability: **admin**

Removes a member from the team. Cannot remove the team owner or yourself (use account deletion to leave a team you own).

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |

| Parameter | Type | Description |
|-----------|------|-------------|
| `team` | integer | Team ID |
| `user` | integer | User ID of the member to remove |

```bash
curl -X DELETE "https://shieldci.com/api/v1/teams/3/members/8" \
  -H "Authorization: Bearer shieldci_{token}"
```

### Response

```json
{
  "message": "Member removed from team."
}
```

### Errors

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |
| `403` | Target is the team owner; or you are trying to remove yourself |
| `404` | User is not a member of this team |

---

## Team Roles

| Role | Value | Permissions |
|------|-------|-------------|
| Owner | `owner` | Full access including billing and team deletion. Assigned at team creation; not assignable via API. |
| Admin | `admin` | Can manage projects and team members |
| Member | `member` | Can create and edit projects |
| Read Only | `readonly` | Can only view projects and reports |

---

## Related

- [Projects](/api/projects) - Manage projects within a team
- [Authentication](/api/authentication) - How to create and use API tokens
- [Errors](/api/errors) - Full error reference
