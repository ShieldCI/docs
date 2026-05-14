---
title: Projects
description: Create, read, update, and delete ShieldCI projects and their API tokens via the REST API v1
icon: folder-open
outline: [2, 2]
tags: api,v1,projects
---

# Projects

Manage the projects that the ShieldCI Laravel package reports analysis results to. Each project has a unique UUID (used in all URLs) and a separate API token used by the package.

All endpoints require a valid Sanctum token. See [Authentication](/api/authentication) for ability details.

::: info Project IDs are UUIDs
The `{project}` URL parameter is always the project's **UUID** (`data.id` in list and show responses), not an integer.
:::

---

## List Projects

<Badge type="info" text="GET" /> `/api/v1/projects`

Requires ability: **read**

Returns a paginated list of projects belonging to the authenticated user's current team, ordered by creation date descending. Each project includes its latest report summary if one exists.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Accept` | `application/json` | Recommended |

```bash
curl "https://shieldci.com/api/v1/projects?page=1" \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Accept: application/json"
```

### Response

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "my-laravel-app",
      "description": "Production API",
      "repository_url": "https://github.com/org/repo",
      "laravel_version": "12",
      "team_id": 3,
      "archived_at": null,
      "created_at": "2026-01-10T08:00:00+00:00",
      "latest_report": {
        "id": 42,
        "uuid": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "score": 87,
        "total": 100,
        "passed": 87,
        "failed": 8,
        "warnings": 3,
        "skipped": 2,
        "errors": 0,
        "total_issues": 11,
        "issues_by_severity": {
          "critical": 0,
          "high": 1,
          "medium": 4,
          "low": 6,
          "info": 0
        },
        "laravel_version": "12",
        "package_version": "1.2.0",
        "total_execution_time": 14.8,
        "triggered_by": "api",
        "analyzed_at": "2026-05-12T09:00:00+00:00",
        "created_at": "2026-05-12T09:00:00+00:00"
      }
    }
  ],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": { "current_page": 1, "per_page": 20, "total": 5 }
}
```

**Project fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Project UUID — use this in all project URLs |
| `name` | string | Project display name |
| `description` | string\|null | Optional description |
| `repository_url` | string\|null | Repository URL |
| `laravel_version` | string | Laravel major version (`9`–`13`) |
| `team_id` | integer | ID of the owning team |
| `archived_at` | string\|null | ISO 8601 timestamp if archived |
| `created_at` | string\|null | ISO 8601 creation timestamp |
| `latest_report` | object\|null | Latest report summary; null if no reports yet |

**`latest_report` fields** (present when at least one report exists):

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Report database ID |
| `uuid` | string (UUID) | Report UUID — use this in [Report](/api/reports) URLs |
| `score` | integer | Overall score (0–100) |
| `total` | integer | Total number of analyzers run |
| `passed` | integer | Analyzers that passed |
| `failed` | integer | Analyzers that failed |
| `warnings` | integer | Analyzers with warnings |
| `skipped` | integer | Analyzers skipped |
| `errors` | integer | Analyzers that errored |
| `total_issues` | integer | Total number of issues found |
| `issues_by_severity` | object | Issue counts: `{critical, high, medium, low, info}` |
| `laravel_version` | string\|null | Laravel version of the analyzed project |
| `package_version` | string\|null | ShieldCI package version used |
| `total_execution_time` | float\|null | Analysis duration in seconds |
| `triggered_by` | string\|null | How the analysis was triggered (`api`, `webhook`, etc.) |
| `analyzed_at` | string\|null | ISO 8601 timestamp when analysis ran |
| `created_at` | string\|null | ISO 8601 record creation timestamp |

### Errors

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |
| `403` | Token lacks `read` ability or no active subscription |

---

## Create Project

<Badge type="tip" text="POST" /> `/api/v1/projects`

Requires ability: **write**

Creates a new project under the authenticated user's current team. Returns a one-time API token for use with the ShieldCI Laravel package.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Content-Type` | `application/json` | Yes |

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Project name (max 255 characters) |
| `description` | string | No | Description (max 1,000 characters) |
| `repository_url` | string | No | Repository URL (max 500 characters) |
| `laravel_version` | string | Yes | Laravel major version — one of `9`, `10`, `11`, `12`, `13` |

```bash
curl -X POST https://shieldci.com/api/v1/projects \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-laravel-app",
    "description": "Production API",
    "repository_url": "https://github.com/org/repo",
    "laravel_version": "12"
  }'
```

### Response

HTTP `201 Created`

::: warning Save the API token immediately
`api_token` is the token your ShieldCI Laravel package uses to submit analysis results. It is shown **only once** — if lost, regenerate it via [Regenerate Token](#regenerate-token).
:::

```json
{
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "my-laravel-app",
    ...
  },
  "api_token": "Abc123...(40 characters)",
  "message": "Project created successfully. Save the API token — it will only be shown once."
}
```

### Errors

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |
| `403` | No team associated with this user |
| `422` | Validation failed — `name` missing, `laravel_version` invalid, `repository_url` not a valid URL |

---

## Get Project

<Badge type="info" text="GET" /> `/api/v1/projects/{project}`

Requires ability: **read**

Returns a single project with its latest report summary.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Accept` | `application/json` | Recommended |

| Parameter | Type | Description |
|-----------|------|-------------|
| `project` | UUID string | Project UUID (from `data[].id` in the list response) |

```bash
curl "https://shieldci.com/api/v1/projects/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Accept: application/json"
```

### Response

Returns a `data` object with the same fields as the [List Projects](#list-projects) response.

### Errors

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |
| `404` | Project not found or user lacks permission to view it |

---

## Update Project

<Badge type="warning" text="PUT" /> `/api/v1/projects/{project}`

Requires ability: **write**

Updates a project's name, description, repository URL, Laravel version, or quality gate settings.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |
| `Content-Type` | `application/json` | Yes |

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Project name (max 255 characters) |
| `description` | string | No | Description (max 1,000 characters) |
| `repository_url` | string | No | Repository URL (max 500 characters) |
| `laravel_version` | string | Yes | Laravel major version — one of `9`, `10`, `11`, `12`, `13` |
| `settings` | object | No | Quality gate and tracker settings (see below) |

#### `settings` Object

| Field | Type | Description |
|-------|------|-------------|
| `settings.fail_on` | string\|null | Severity threshold for CI failure: `never`, `critical`, `high`, `medium`, `low` |
| `settings.fail_threshold` | integer\|null | Minimum score (0–100) required to pass |
| `settings.primary_tracker` | string\|null | Issue tracker: `internal` or a ticket provider value |
| `settings.ticket_target_project_key` | string\|null | Required when `primary_tracker` is a ticket provider (max 100 chars) |
| `settings.ticket_target_project_name` | string\|null | Display name for the ticket target project (max 255 chars) |

```bash
curl -X PUT "https://shieldci.com/api/v1/projects/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-laravel-app",
    "laravel_version": "12",
    "settings": {
      "fail_on": "high",
      "fail_threshold": 80
    }
  }'
```

### Response

Returns the updated project in the same shape as [Get Project](#get-project).

### Errors

| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid token |
| `404` | Project not found or user lacks permission to update it |
| `422` | Validation failed |

---

## Delete Project

<Badge type="danger" text="DELETE" /> `/api/v1/projects/{project}`

Requires ability: **write**

Permanently deletes a project and all its reports.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |

| Parameter | Type | Description |
|-----------|------|-------------|
| `project` | UUID string | Project UUID |

```bash
curl -X DELETE "https://shieldci.com/api/v1/projects/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer shieldci_{token}"
```

### Response

```json
{
  "message": "Project deleted successfully."
}
```

### Errors

| Status | Condition |
|--------|-----------|
| `404` | Project not found or user lacks permission to delete it |

---

## Regenerate Token

<Badge type="tip" text="POST" /> `/api/v1/projects/{project}/regenerate-token`

Requires ability: **write**

Generates a new API token for the project and immediately invalidates the previous one. Use this if your existing token is compromised.

### Request

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer shieldci_{token}` | Yes |

| Parameter | Type | Description |
|-----------|------|-------------|
| `project` | UUID string | Project UUID |

```bash
curl -X POST "https://shieldci.com/api/v1/projects/550e8400-e29b-41d4-a716-446655440000/regenerate-token" \
  -H "Authorization: Bearer shieldci_{token}"
```

### Response

::: warning Save the new token immediately
The new `api_token` is shown **only once** and replaces the previous token immediately. Update your `.env` file in the Laravel project before making the next analysis run.
:::

```json
{
  "api_token": "Xyz789...(40 characters)",
  "message": "API token regenerated. Save the new token — it will only be shown once."
}
```

### Errors

| Status | Condition |
|--------|-----------|
| `404` | Project not found or user lacks permission to rotate its token |

---

## Related

- [Reports](/api/reports) — View and delete analysis reports for a project
- [Authentication](/api/authentication) — How to create and use API tokens
- [Errors](/api/errors) — Full error reference
