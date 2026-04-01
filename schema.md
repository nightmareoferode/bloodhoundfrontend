# API Schema Reference

Base URL: `http://localhost:8000`

Protected endpoints require `Authorization: Bearer <token>` in the request header.

---

## POST /signup

Creates a new user account and returns a JWT. Medications, if provided, are inserted atomically alongside the user and cannot be added or modified through any other endpoint.

### Request Body

```json
{
  "username": "string",
  "email": "string | null",
  "phone": "string | null",
  "password": "string",
  "medications": [
    {
      "name": "string",
      "potency": "string",
      "product_type": "Tablet | Capsule | Liquid | Injection | Topical",
      "method_of_intake": "Oral | Intravenous | Sublingual | Inhalation",
      "course_duration_value": "integer",
      "course_duration_unit": "Days | Weeks | Months",
      "frequency": "string",
      "first_dose_time": "HH:MM:SS"
    }
  ]
}
```

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `username` | string | yes | Must be unique |
| `email` | string | conditional | Valid email format. Required if `phone` is absent |
| `phone` | string | conditional | Required if `email` is absent |
| `password` | string | yes | Stored as an Argon2 hash |
| `medications` | array | no | Defaults to empty array. Each entry maps to one medication record |

### Medication Object Fields

| Field | Type | Required | Allowed Values |
|-------|------|----------|----------------|
| `name` | string | yes | |
| `potency` | string | yes | e.g. `"500mg"` |
| `product_type` | string | yes | `Tablet`, `Capsule`, `Liquid`, `Injection`, `Topical` |
| `method_of_intake` | string | yes | `Oral`, `Intravenous`, `Sublingual`, `Inhalation` |
| `course_duration_value` | integer | yes | Must be greater than `0` |
| `course_duration_unit` | string | yes | `Days`, `Weeks`, `Months` |
| `frequency` | string | yes | e.g. `"Twice daily"` |
| `first_dose_time` | string | yes | `HH:MM:SS` (24-hour time) |

### Responses

| Status | Body | Condition |
|--------|------|-----------|
| `201 Created` | `{ "user_id": 1, "medications": [...] }` | User (and any medications) inserted successfully |
| `409 Conflict` | `{ "detail": "Username already in use" }` | Duplicate `username` |
| `409 Conflict` | `{ "detail": "Email already in use" }` | Duplicate `email` |
| `409 Conflict` | `{ "detail": "Phone number already in use" }` | Duplicate `phone` |
| `422 Unprocessable Entity` | `{ "detail": "No RxNorm match found for medication: '<name>'..." }` | A medication name could not be matched in the RxNorm database |
| `422 Unprocessable Entity` | Pydantic validation error detail | Missing required fields, invalid email format, invalid enum value, or neither `email` nor `phone` provided |

On success the JWT is returned in two places:
- **`Authorization` response header** — raw token only (no `Bearer` prefix), store directly on the client
- **`Set-Cookie: access_token`** — `HttpOnly`, `SameSite=Lax`

### Example Request

```json
{
  "username": "jdoe",
  "email": "jdoe@example.com",
  "password": "hunter2",
  "medications": [
    {
      "name": "Metformin",
      "potency": "500mg",
      "product_type": "Tablet",
      "method_of_intake": "Oral",
      "course_duration_value": 30,
      "course_duration_unit": "Days",
      "frequency": "Twice daily",
      "first_dose_time": "08:00:00"
    }
  ]
}
```

### Example Response

```json
{
  "user_id": 1,
  "medications": [
    {
      "name": "Metformin",
      "potency": "500mg",
      "product_type": "Tablet",
      "method_of_intake": "Oral",
      "course_duration_value": 30,
      "course_duration_unit": "Days",
      "frequency": "Twice daily",
      "first_dose_time": "08:00:00",
      "rxcui": "860974",
      "usa_name": "metformin"
    }
  ]
}
```

### Example Response Headers

```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Set-Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; SameSite=Lax
```

---

## POST /login

Authenticates an existing user and returns a JWT.

### Request Body

```json
{
  "email": "string | null",
  "phone": "string | null",
  "password": "string"
}
```

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string | conditional | Valid email format. Required if `phone` is absent |
| `phone` | string | conditional | Required if `email` is absent |
| `password` | string | yes | |

### Responses

| Status | Body | Condition |
|--------|------|-----------|
| `200 OK` | `{ "user_id": 1 }` | Credentials verified |
| `401 Unauthorized` | `{ "detail": "Invalid credentials" }` | User not found or password mismatch |
| `422 Unprocessable Entity` | Pydantic validation error detail | Invalid email format or neither `email` nor `phone` provided |

On success the JWT is returned in two places:
- **`Authorization` response header** — raw token only (no `Bearer` prefix), store directly on the client
- **`Set-Cookie: access_token`** — `HttpOnly`, `SameSite=Lax`

### Example Request (by email)

```json
{
  "email": "jdoe@example.com",
  "password": "hunter2"
}
```

### Example Request (by phone)

```json
{
  "phone": "+15551234567",
  "password": "hunter2"
}
```

### Example Response

```json
{ "user_id": 1 }
```

### Example Response Headers

```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Set-Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; SameSite=Lax
```

---

## GET /users/me

Returns the authenticated user's profile.

**Requires:** `Authorization: Bearer <token>`

### Responses

| Status | Body | Condition |
|--------|------|-----------|
| `200 OK` | User object (see below) | Token valid |
| `401 Unauthorized` | `{ "detail": "Could not validate credentials" }` | Missing, invalid, or expired token |

### Example Response

```json
{
  "id": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "phone": null,
  "medications": [
    {
      "id": 1,
      "name": "Metformin",
      "potency": "500mg",
      "product_type": "Tablet",
      "method_of_intake": "Oral",
      "course_duration_value": 30,
      "course_duration_unit": "Days",
      "frequency": "Twice daily",
      "first_dose_time": "08:00:00",
      "user_id": 1,
      "usa_name": "metFORMIN",
      "rxcui": "860974"
    }
  ]
}
```

---

## PATCH /users/me

Updates one or more fields on the authenticated user's account. Only provided fields are changed.

**Requires:** `Authorization: Bearer <token>`

### Request Body

```json
{
  "username": "string | null",
  "email": "string | null",
  "phone": "string | null",
  "password": "string | null"
}
```

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `username` | string | no | Must be unique |
| `email` | string | no | Valid email format. Must be unique |
| `phone` | string | no | Must be unique |
| `password` | string | no | Stored as a new Argon2 hash |

### Responses

| Status | Body | Condition |
|--------|------|-----------|
| `200 OK` | Updated user object | Update applied successfully |
| `401 Unauthorized` | `{ "detail": "Could not validate credentials" }` | Missing, invalid, or expired token |
| `409 Conflict` | `{ "detail": "Username, email, or phone already in use" }` | Duplicate `username`, `email`, or `phone` |
| `422 Unprocessable Entity` | Pydantic validation error detail | Invalid email format |

### Example Request

```json
{
  "email": "john.doe@example.com"
}
```

### Example Response

```json
{
  "id": 1,
  "username": "jdoe",
  "email": "john.doe@example.com",
  "phone": null,
  "medications": [
    {
      "id": 1,
      "name": "Metformin",
      "potency": "500mg",
      "product_type": "Tablet",
      "method_of_intake": "Oral",
      "course_duration_value": 30,
      "course_duration_unit": "Days",
      "frequency": "Twice daily",
      "first_dose_time": "08:00:00",
      "user_id": 1,
      "usa_name": "metFORMIN",
      "rxcui": "860974"
    }
  ]
}
```

---

## GET /medications

Returns all medications belonging to the authenticated user.

**Requires:** `Authorization: Bearer <token>`

### Responses

| Status | Body | Condition |
|--------|------|-----------|
| `200 OK` | Array of medication objects (see below) | Token valid |
| `401 Unauthorized` | `{ "detail": "Could not validate credentials" }` | Missing, invalid, or expired token |

### Example Response

```json
[
  {
    "id": 1,
    "name": "Metformin",
    "potency": "500mg",
    "product_type": "Tablet",
    "method_of_intake": "Oral",
    "course_duration_value": 30,
    "course_duration_unit": "Days",
    "frequency": "Twice daily",
    "first_dose_time": "08:00:00",
    "user_id": 1,
    "usa_name": "metFORMIN",
    "rxcui": "860974"
  }
]
```

### Medication Object Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | integer | Primary key |
| `name` | string | Name as submitted at signup |
| `potency` | string | e.g. `"500mg"` |
| `product_type` | string | `Tablet`, `Capsule`, `Liquid`, `Injection`, `Topical` |
| `method_of_intake` | string | `Oral`, `Intravenous`, `Sublingual`, `Inhalation` |
| `course_duration_value` | integer | Must be greater than `0` |
| `course_duration_unit` | string | `Days`, `Weeks`, `Months` |
| `frequency` | string | e.g. `"Twice daily"` |
| `first_dose_time` | string | `HH:MM:SS` (24-hour time) |
| `user_id` | integer | ID of the owning user |
| `usa_name` | string \| null | Standardized name from RxNorm API |
| `rxcui` | string \| null | RxNorm concept unique identifier |

---

## PATCH /medications

Replaces all medications for the authenticated user with a new set. All existing medications are deleted and replaced with the medications provided in the request. Each medication is validated against the RxNorm API.

**Requires:** `Authorization: Bearer <token>`

### Request Body

```json
{
  "medications": [
    {
      "name": "string",
      "potency": "string",
      "product_type": "Tablet | Capsule | Liquid | Injection | Topical",
      "method_of_intake": "Oral | Intravenous | Sublingual | Inhalation",
      "course_duration_value": "integer",
      "course_duration_unit": "Days | Weeks | Months",
      "frequency": "string",
      "first_dose_time": "HH:MM:SS"
    }
  ]
}
```

### Medication Object Fields

| Field | Type | Required | Allowed Values |
|-------|------|----------|----------------|
| `name` | string | yes | |
| `potency` | string | yes | e.g. `"500mg"` |
| `product_type` | string | yes | `Tablet`, `Capsule`, `Liquid`, `Injection`, `Topical` |
| `method_of_intake` | string | yes | `Oral`, `Intravenous`, `Sublingual`, `Inhalation` |
| `course_duration_value` | integer | yes | Must be greater than `0` |
| `course_duration_unit` | string | yes | `Days`, `Weeks`, `Months` |
| `frequency` | string | yes | e.g. `"Twice daily"` |
| `first_dose_time` | string | yes | `HH:MM:SS` (24-hour time) |

### Responses

| Status | Body | Condition |
|--------|------|-----------|
| `200 OK` | Array of new medication objects | All medications replaced successfully |
| `401 Unauthorized` | `{ "detail": "Could not validate credentials" }` | Missing, invalid, or expired token |
| `422 Unprocessable Entity` | `{ "detail": "No RxNorm match found for medication: '<name>'..." }` | A medication name could not be matched in the RxNorm database |
| `422 Unprocessable Entity` | Pydantic validation error detail | Missing required fields or invalid enum value |

### Example Request

```json
{
  "medications": [
    {
      "name": "Metformin",
      "potency": "1000mg",
      "product_type": "Tablet",
      "method_of_intake": "Oral",
      "course_duration_value": 30,
      "course_duration_unit": "Days",
      "frequency": "Once daily",
      "first_dose_time": "08:00:00"
    },
    {
      "name": "Lisinopril",
      "potency": "10mg",
      "product_type": "Tablet",
      "method_of_intake": "Oral",
      "course_duration_value": 90,
      "course_duration_unit": "Days",
      "frequency": "Once daily",
      "first_dose_time": "08:00:00"
    }
  ]
}
```

### Example Response

```json
[
  {
    "id": 2,
    "name": "Metformin",
    "potency": "1000mg",
    "product_type": "Tablet",
    "method_of_intake": "Oral",
    "course_duration_value": 30,
    "course_duration_unit": "Days",
    "frequency": "Once daily",
    "first_dose_time": "08:00:00",
    "user_id": 1,
    "usa_name": "metFORMIN",
    "rxcui": "860974"
  },
  {
    "id": 3,
    "name": "Lisinopril",
    "potency": "10mg",
    "product_type": "Tablet",
    "method_of_intake": "Oral",
    "course_duration_value": 90,
    "course_duration_unit": "Days",
    "frequency": "Once daily",
    "first_dose_time": "08:00:00",
    "user_id": 1,
    "usa_name": "lisinopril",
    "rxcui": "314076"
  }
]
```

---

## DELETE /medications

Deletes all medications belonging to the authenticated user.

**Requires:** `Authorization: Bearer <token>`

### Responses

| Status | Body | Condition |
|--------|------|-----------|
| `204 No Content` | *(empty)* | All medications deleted |
| `401 Unauthorized` | `{ "detail": "Could not validate credentials" }` | Missing, invalid, or expired token |

---

## DELETE /medications/{id}

Deletes a specific medication belonging to the authenticated user.

**Requires:** `Authorization: Bearer <token>`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | ID of the medication to delete |

### Responses

| Status | Body | Condition |
|--------|------|-----------|
| `204 No Content` | *(empty)* | Medication deleted |
| `401 Unauthorized` | `{ "detail": "Could not validate credentials" }` | Missing, invalid, or expired token |
| `404 Not Found` | `{ "detail": "Medication not found" }` | No medication with that ID belonging to the current user |

---

## PATCH /medications/{id}

Updates one or more fields on a specific medication belonging to the authenticated user. Only provided fields are changed. If `name` is updated, the RxNorm API is called to refresh `rxcui` and `usa_name`.

**Requires:** `Authorization: Bearer <token>`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | ID of the medication to update |

### Request Body

```json
{
  "name": "string | null",
  "potency": "string | null",
  "product_type": "Tablet | Capsule | Liquid | Injection | Topical | null",
  "method_of_intake": "Oral | Intravenous | Sublingual | Inhalation | null",
  "course_duration_value": "integer | null",
  "course_duration_unit": "Days | Weeks | Months | null",
  "frequency": "string | null",
  "first_dose_time": "HH:MM:SS | null"
}
```

All fields are optional. Omitted fields are left unchanged.

### Responses

| Status | Body | Condition |
|--------|------|-----------|
| `200 OK` | Updated medication object | Update applied successfully |
| `401 Unauthorized` | `{ "detail": "Could not validate credentials" }` | Missing, invalid, or expired token |
| `404 Not Found` | `{ "detail": "Medication not found" }` | No medication with that ID belonging to the current user |
| `422 Unprocessable Entity` | `{ "detail": "No RxNorm match found for medication: '<name>'..." }` | Updated name could not be matched in the RxNorm database |

### Example Request

```json
{
  "potency": "1000mg",
  "frequency": "Once daily"
}
```

### Example Response

```json
{
  "id": 1,
  "name": "Metformin",
  "potency": "1000mg",
  "product_type": "Tablet",
  "method_of_intake": "Oral",
  "course_duration_value": 30,
  "course_duration_unit": "Days",
  "frequency": "Once daily",
  "first_dose_time": "08:00:00",
  "user_id": 1,
  "usa_name": "metFORMIN",
  "rxcui": "860974"
}
```

---

## POST /quickreference

Analyzes potential drug interactions between two medications using FDA OpenFDA labeling data, real-world adverse event reports (FAERS), and AI-powered clinical reasoning. This endpoint does not require authentication.

### Request Body

```json
{
  "medication1": {
    "name": "string",
    "rxcui": "string",
    "usa_name": "string"
  },
  "medication2": {
    "name": "string",
    "rxcui": "string",
    "usa_name": "string"
  }
}
```

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `medication1` | object | yes | First medication details |
| `medication1.name` | string | yes | Medication name |
| `medication1.rxcui` | string | yes | RxNorm concept unique identifier |
| `medication1.usa_name` | string | yes | USA standardized medication name |
| `medication2` | object | yes | Second medication details |
| `medication2.name` | string | yes | Medication name |
| `medication2.rxcui` | string | yes | RxNorm concept unique identifier |
| `medication2.usa_name` | string | yes | USA standardized medication name |

### Responses

| Status | Body | Condition |
|--------|------|-----------|
| `200 OK` | Drug interaction analysis (see below) | Successfully analyzed interaction |
| `404 Not Found` | `{ "detail": "No substance names found for medication N: <name>" }` | FDA labeling data not found for one of the medications |
| `422 Unprocessable Entity` | Pydantic validation error detail | Missing required fields |
| `500 Internal Server Error` | `{ "detail": "Failed to analyze drug interaction: <error>" }` | AI analysis failed |

### Response Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Overall risk category: `Critical`, `Warning`, `Safe`, or `Synergistic` |
| `severity_index` | integer | Numerical severity score from 0 (no risk) to 10 (maximum risk) |
| `description` | string | Plain-language warning or information for patients (1-2 sentences) |
| `mechanism` | string | Biological explanation of the interaction (e.g., enzyme inhibition pathways) |
| `evidence_match` | boolean | Whether real-world adverse events support the theoretical mechanism |
| `recommendation` | string | Clinical guidance (e.g., "Avoid", "Limit Dose", "Monitor", or "Safe to use together") |

### Example Request

```json
{
  "medication1": {
    "name": "Metformin",
    "rxcui": "860974",
    "usa_name": "metFORMIN"
  },
  "medication2": {
    "name": "Lisinopril",
    "rxcui": "314076",
    "usa_name": "lisinopril"
  }
}
```

### Example Response

```json
{
  "status": "Safe",
  "severity_index": 2,
  "description": "These medications are generally safe to take together. Monitor blood sugar and blood pressure regularly.",
  "mechanism": "No significant metabolic pathway interaction. Both medications work through different mechanisms.",
  "evidence_match": true,
  "recommendation": "Monitor blood glucose and blood pressure. Report any unusual symptoms to your healthcare provider."
}
```

### How It Works

1. **FDA Labeling Query**: Retrieves official drug interaction warnings and clinical pharmacology from FDA label data
2. **Adverse Event Analysis**: Queries FAERS database for real-world reports of adverse events when both medications were taken
3. **AI Clinical Reasoning**: Uses DeepSeek R1 reasoning model to reconcile theoretical mechanisms with real-world evidence
4. **Risk Assessment**: Returns structured clinical assessment with severity scoring and patient-friendly recommendations

---

## DELETE /users/me

Deletes the authenticated user and all associated medications.

**Requires:** `Authorization: Bearer <token>`

### Responses

| Status | Body | Condition |
|--------|------|-----------|
| `204 No Content` | *(empty)* | User and medications deleted |
| `401 Unauthorized` | `{ "detail": "Could not validate credentials" }` | Missing, invalid, or expired token |
