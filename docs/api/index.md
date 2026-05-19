---
title: API Reference
description: REST API v1 reference for ShieldCI - manage projects, reports, teams, and tokens programmatically
icon: plug
outline: [2, 2]
tags: api,v1,overview,rest
---

# REST API v1

The ShieldCI REST API lets you manage projects, reports, teams, and tokens programmatically. It is entirely separate from the package-facing endpoint that the ShieldCI Laravel package uses to submit analysis results.

**Base URL:** `https://shieldci.com/api/v1`

All endpoints require a valid Sanctum personal access token and an active subscription. See [Authentication](/api/authentication) for setup instructions.

---

## Endpoints

| Method | Endpoint | Ability | Description |
|--------|----------|---------|-------------|
| `GET` | `/api/v1/user` | read | Get your profile |
| `PUT` | `/api/v1/user` | write | Update your display name |
| `DELETE` | `/api/v1/user` | admin | Delete your account |
| `POST` | `/api/v1/user/export-data` | write | Request a data export |
| `GET` | `/api/v1/user/notifications` | read | List notifications |
| `PUT` | `/api/v1/user/notifications/{notification}/read` | write | Mark a notification as read |
| `GET` | `/api/v1/tokens` | read | List personal access tokens |
| `POST` | `/api/v1/tokens` | admin | Create a personal access token |
| `DELETE` | `/api/v1/tokens/{token}` | admin | Revoke a personal access token |
| `GET` | `/api/v1/projects` | read | List projects |
| `POST` | `/api/v1/projects` | write | Create a project |
| `GET` | `/api/v1/projects/{project}` | read | Get a project |
| `PUT` | `/api/v1/projects/{project}` | write | Update a project |
| `DELETE` | `/api/v1/projects/{project}` | write | Delete a project |
| `POST` | `/api/v1/projects/{project}/regenerate-token` | write | Regenerate a project's API token |
| `GET` | `/api/v1/projects/{project}/reports` | read | List reports for a project |
| `GET` | `/api/v1/reports/{report}` | read | Get a full report |
| `DELETE` | `/api/v1/reports/{report}` | write | Delete a report |
| `GET` | `/api/v1/teams` | read | List teams |
| `POST` | `/api/v1/teams` | write | Create a team |
| `GET` | `/api/v1/teams/{team}` | read | Get a team and its members |
| `PUT` | `/api/v1/teams/{team}` | write | Rename a team |
| `DELETE` | `/api/v1/teams/{team}` | write | Delete a team |
| `POST` | `/api/v1/teams/{team}/members` | admin | Invite a member |
| `PUT` | `/api/v1/teams/{team}/members/{user}` | admin | Update a member's role |
| `DELETE` | `/api/v1/teams/{team}/members/{user}` | admin | Remove a member |

---

## Getting Started

### 1. Create a token

Open the ShieldCI dashboard → **Settings → API Tokens** → **New Token**. Assign the abilities your integration needs (`read`, `write`, and/or `admin`) and save the token value; it is shown only once.

Alternatively, create one via the API if you already have a token with the `admin` ability:

```bash
curl -X POST https://shieldci.com/api/v1/tokens \
  -H "Authorization: Bearer shieldci_{existing_token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "ci-pipeline", "abilities": ["read", "write"]}'
```

### 2. Authenticate requests

Include your token in the `Authorization` header of every request:

```bash
curl https://shieldci.com/api/v1/user \
  -H "Authorization: Bearer shieldci_{token}" \
  -H "Accept: application/json"
```

### 3. Choose the right ability

Every endpoint requires a minimum ability. Use the least-privileged token that covers your use case:

| Ability | What it covers |
|---------|---------------|
| `read` | View projects, reports, teams, and notifications |
| `write` | Create and update projects, reports, and teams (includes `read`) |
| `admin` | Manage tokens, delete resources, and team members (includes `write`) |

### 4. Handle errors

All error responses use the same envelope:

```json
{
  "error": "ErrorType",
  "message": "Human-readable description."
}
```

See [Errors](/api/errors) for the full status code reference. See [Rate Limits](/api/rate-limits) for throttle details and retry guidance.

---

## Resources

| Resource | Description |
|----------|-------------|
| [Users](/api/users) | Manage your profile, data exports, and notifications |
| [Tokens](/api/tokens) | Create and revoke personal access tokens |
| [Projects](/api/projects) | Manage the projects your ShieldCI package reports to |
| [Reports](/api/reports) | View and delete analysis reports |
| [Teams](/api/teams) | Create teams and manage their members |

---

## Reference

- [Authentication](/api/authentication) - How to create tokens and use the `Authorization` header
- [Rate Limits](/api/rate-limits) - Request limits by plan and retry strategies
- [Errors](/api/errors) - Full HTTP status code and error format reference
