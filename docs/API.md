# Fittable Frontend — API Documentation

## Architecture Overview

```
┌──────────────┐       ┌───────────────────┐       ┌──────────────────┐
│              │       │  Next.js API       │       │  FastAPI Backend  │
│  Browser /   │──────▶│  Route Handlers    │──────▶│  (BACKEND_URL)   │
│  React UI    │ fetch │  app/api/*         │ proxy │  default:        │
│              │◀──────│                    │◀──────│  localhost:8001   │
└──────────────┘       └───────────────────┘       └──────────────────┘
```

The frontend uses a **proxy pattern**. All client-side code calls local Next.js API routes (`/api/*`) via the `api` client in `lib/api.ts`. Each Next.js route handler then proxies the request to the FastAPI backend at `BACKEND_URL`.

**Authentication** is cookie-based. On login, the server sets two `httpOnly` cookies:
- `access_token` — JWT for all protected routes
- `session_token` — KLAS session token (used by some legacy endpoints)

The middleware (`middleware.ts`) redirects unauthenticated users to `/login` for any route under `/calendar/*`.

---

## Quick Reference

| #  | Method   | Frontend Route               | Backend Route                    | Auth Required |
|----|----------|------------------------------|----------------------------------|:---:|
| 1  | `POST`   | `/api/auth/login`            | `/api/auth/login`                | No  |
| 2  | `POST`   | `/api/auth/logout`           | `/api/auth/logout`               | Yes |
| 3  | `GET`    | `/api/me`                    | `/api/auth/me`                   | Yes |
| 4  | `GET`    | `/api/shifts`                | `/api/shifts`                    | Yes |
| 5  | `POST`   | `/api/shifts`                | `/api/shifts`                    | Yes |
| 6  | `PATCH`  | `/api/shifts/[id]`           | `/api/shifts/{id}`               | Yes |
| 7  | `DELETE` | `/api/shifts/[id]`           | `/api/shifts/{id}`               | Yes |
| 8  | `GET`    | `/api/shifts/hours`          | `/api/shifts/hours`              | Yes |
| 9  | `GET`    | `/api/shifts/schedule/pdf`   | `/api/shifts/schedule/pdf`       | Yes |
| 10 | `GET`    | `/api/work-log/pdf/preview`  | `/api/work-log/pdf/preview`      | Yes |
| 11 | `GET`    | `/api/work-log/docx/preview` | `/api/work-log/docx/preview`     | Yes |
| 12 | `GET`    | `/api/holidays`              | `/api/holidays`                  | Yes |
| 13 | `POST`   | `/api/holidays`              | `/api/holidays`                  | Yes |
| 14 | `PATCH`  | `/api/holidays/[id]`         | `/api/holidays/{id}`             | Yes |
| 15 | `DELETE` | `/api/holidays/[id]`         | `/api/holidays/{id}`             | Yes |
| 16 | `POST`   | `/api/holidays/sync`         | `/api/holidays/sync`             | Yes |
| 17 | `GET`    | `/api/users`                 | `/api/users`                     | Yes |
| 18 | `PATCH`  | `/api/users/[id]/role`       | `/api/users/{id}/role`           | Yes |
| 19 | `GET`    | `/api/timetable`             | `/api/timetable`                 | Yes |
| 20 | `GET`    | `/api/profile/settings`      | `/api/profile/settings`          | Yes |
| 21 | `PATCH`  | `/api/profile/settings`      | `/api/profile/settings`          | Yes |
| 22 | `GET`    | `/api/profile/image`         | `/api/profile/image`             | Yes |

---

## 1. Authentication

### 1.1 Login

```
POST /api/auth/login
```

**Source:** `app/api/auth/login/route.ts` → proxies to `POST {BACKEND_URL}/api/auth/login`
**Called by:** `app/login/page.tsx` via `api.login()`

#### Request

```json
{
  "student_id": "2024001234",
  "password": "s3cret"
}
```

| Field        | Type     | Required | Description                  |
|--------------|----------|:--------:|------------------------------|
| `student_id` | `string` | No       | Student ID (KLAS identifier) |
| `password`   | `string` | Yes      | Account password             |

#### Response — 200 OK

```json
{
  "success": true,
  "message": "Login successful",
  "token": "klas-session-abc123...",
  "access_token": "eyJhbGciOi..."
}
```

| Field          | Type              | Description                                |
|----------------|-------------------|--------------------------------------------|
| `success`      | `boolean`         | Whether login succeeded                    |
| `message`      | `string`          | Human-readable status message              |
| `token`        | `string \| null`  | KLAS session token (for legacy endpoints)  |
| `access_token` | `string \| null`  | JWT for protected API routes               |

**Side effects:** Sets `access_token` and `session_token` as `httpOnly` cookies.

#### Response — 401 Unauthorized

```json
{
  "detail": "Invalid credentials"
}
```

---

### 1.2 Logout

```
POST /api/auth/logout
```

**Source:** `app/api/auth/logout/route.ts` → proxies to `POST {BACKEND_URL}/api/auth/logout`
**Called by:** `app/calendar/page.tsx` via `api.logout()`

#### Request

No body. Authentication is sent via cookies.

#### Response — 200 OK

```json
{
  "message": "Logged out"
}
```

**Side effects:** Deletes `access_token` and `session_token` cookies.

---

### 1.3 Get Current User

```
GET /api/me
```

**Source:** `app/api/me/route.ts` → proxies to `GET {BACKEND_URL}/api/auth/me`
**Called by:** `app/calendar/page.tsx` via `api.getMe()`

#### Request

No body. Prefers `session_token` cookie, falls back to `access_token`.

#### Response — 200 OK

```json
{
  "id": "uuid-string",
  "student_id": "2024001234",
  "name": "홍길동",
  "role": "admin",
  "status": "active"
}
```

| Field        | Type             | Description                 |
|--------------|------------------|-----------------------------|
| `id`         | `string`         | User UUID                   |
| `student_id` | `string`         | Student ID                  |
| `name`       | `string \| null` | Full name                   |
| `role`       | `string`         | `"admin"` or `"worker"`     |
| `status`     | `string`         | Account status              |

#### Response — 401 Unauthorized

```json
{
  "detail": "Not authenticated"
}
```

---

## 2. Shifts

### 2.1 List Shifts

```
GET /api/shifts?month={YYYY-MM}&user_id={userId}
```

**Source:** `app/api/shifts/route.ts` → proxies to `GET {BACKEND_URL}/api/shifts`
**Called by:** `app/calendar/page.tsx` via `api.getShifts(month, userId?)`

#### Query Parameters

| Param     | Type     | Required | Description                     |
|-----------|----------|:--------:|---------------------------------|
| `month`   | `string` | Yes      | Target month, format `YYYY-MM`  |
| `user_id` | `string` | No       | Filter shifts for a specific user |

#### Response — 200 OK

```json
[
  {
    "id": "shift-uuid",
    "user_id": "user-uuid",
    "date": "2026-03-09",
    "start_time": "09:00:00",
    "end_time": "13:00:00",
    "note": "Library front desk",
    "created_by": "admin-uuid",
    "updated_at": "2026-03-08T15:30:00Z",
    "name": "홍길동",
    "task_name": "도서관 근무",
    "segments": [
      { "start": "09:00", "end": "11:00" },
      { "start": "11:30", "end": "13:00" }
    ]
  }
]
```

| Field        | Type                                    | Description                            |
|--------------|-----------------------------------------|----------------------------------------|
| `id`         | `string`                                | Shift UUID                             |
| `user_id`    | `string`                                | User UUID who owns the shift           |
| `date`       | `string`                                | Shift date, `YYYY-MM-DD`              |
| `start_time` | `string`                                | Start time, `HH:MM:SS`                |
| `end_time`   | `string`                                | End time, `HH:MM:SS`                  |
| `note`       | `string \| null`                        | Optional shift note                    |
| `created_by` | `string`                                | UUID of user who created the shift     |
| `updated_at` | `string`                                | ISO 8601 timestamp of last update      |
| `name`       | `string \| null`                        | Display name of the shift owner        |
| `task_name`  | `string \| null`                        | Name of the assigned task              |
| `segments`   | `{ start: string, end: string }[]`      | Time segments within the shift         |

---

### 2.2 Create Shift

```
POST /api/shifts
```

**Source:** `app/api/shifts/route.ts` → proxies to `POST {BACKEND_URL}/api/shifts`
**Called by:** `components/ShiftEditorModal.tsx` via `api.createShift(data)`

#### Request

```json
{
  "date": "2026-03-10",
  "start_time": "09:00:00",
  "end_time": "17:00:00",
  "note": "Morning shift",
  "user_id": "target-user-uuid"
}
```

| Field        | Type     | Required | Description                           |
|--------------|----------|:--------:|---------------------------------------|
| `date`       | `string` | Yes      | Shift date, `YYYY-MM-DD`            |
| `start_time` | `string` | Yes      | Start time, `HH:MM:SS`              |
| `end_time`   | `string` | Yes      | End time, `HH:MM:SS`                |
| `note`       | `string` | No       | Shift note                           |
| `user_id`    | `string` | No       | Assign to another user (admin only)  |

#### Response — 200 OK

Returns a single `Shift` object (same schema as in [2.1](#21-list-shifts)).

---

### 2.3 Update Shift

```
PATCH /api/shifts/{id}
```

**Source:** `app/api/shifts/[id]/route.ts` → proxies to `PATCH {BACKEND_URL}/api/shifts/{id}`
**Called by:** `components/ShiftEditorModal.tsx` via `api.updateShift(id, data)`

#### Path Parameters

| Param | Type     | Description |
|-------|----------|-------------|
| `id`  | `string` | Shift UUID  |

#### Request

All fields are optional — only include fields to update.

```json
{
  "date": "2026-03-11",
  "start_time": "10:00:00",
  "end_time": "14:00:00",
  "note": "Updated note",
  "user_id": "new-user-uuid"
}
```

#### Response — 200 OK

Returns the updated `Shift` object.

---

### 2.4 Delete Shift

```
DELETE /api/shifts/{id}
```

**Source:** `app/api/shifts/[id]/route.ts` → proxies to `DELETE {BACKEND_URL}/api/shifts/{id}`
**Called by:** `components/ShiftEditorModal.tsx`, `app/calendar/page.tsx` via `api.deleteShift(id)`

#### Path Parameters

| Param | Type     | Description |
|-------|----------|-------------|
| `id`  | `string` | Shift UUID  |

#### Response — 204 No Content

Empty response on success.

---

### 2.5 Hours Summary

```
GET /api/shifts/hours?month={YYYY-MM}&user_id={userId}
```

**Source:** `app/api/shifts/hours/route.ts` → proxies to `GET {BACKEND_URL}/api/shifts/hours`
**Called by:** `components/Sidebar.tsx` via `api.getHours(month, userId?)`

#### Query Parameters

| Param     | Type     | Required | Description                     |
|-----------|----------|:--------:|---------------------------------|
| `month`   | `string` | Yes      | Work month, format `YYYY-MM`    |
| `user_id` | `string` | No       | Filter for a specific user      |

#### Response — 200 OK

```json
{
  "month": "2026-03",
  "users": [
    {
      "user_id": "user-uuid",
      "name": "홍길동",
      "daily": {
        "2026-03-01": 4.0,
        "2026-03-02": 3.5,
        "2026-03-05": 8.0
      },
      "monthly_total": 15.5,
      "shift_count": 3
    }
  ]
}
```

| Field                 | Type                       | Description                        |
|-----------------------|----------------------------|------------------------------------|
| `month`               | `string`                   | The queried month                  |
| `users`               | `UserHoursSummary[]`       | Array of per-user summaries        |
| `users[].user_id`     | `string`                   | User UUID                          |
| `users[].name`        | `string \| null`           | User display name                  |
| `users[].daily`       | `Record<string, number>`   | Map of date → hours worked         |
| `users[].monthly_total` | `number`                 | Total hours for the month          |
| `users[].shift_count` | `number`                   | Number of shifts in the month      |

---

### 2.6 Download Schedule PDF

```
GET /api/shifts/schedule/pdf?month={YYYY-MM}
GET /api/shifts/schedule/pdf?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}
```

**Source:** `app/api/shifts/schedule/pdf/route.ts` → proxies to `GET {BACKEND_URL}/api/shifts/schedule/pdf`
**Called by:** `app/calendar/page.tsx` via `api.downloadSchedulePDF(...)`

#### Query Parameters

| Param        | Type     | Required          | Description                |
|--------------|----------|:-----------------:|----------------------------|
| `month`      | `string` | One of the two    | Format `YYYY-MM`           |
| `start_date` | `string` | One of the two    | Custom range start, `YYYY-MM-DD` |
| `end_date`   | `string` | With `start_date` | Custom range end, `YYYY-MM-DD`   |

#### Response — 200 OK

Binary PDF file with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="schedule-2026-03.pdf"`

The client creates a download link and triggers a browser download.

---

## 3. Work Log

### 3.1 Work Log PDF Preview

```
GET /api/work-log/pdf/preview?month={YYYY-MM}
```

**Source:** `app/api/work-log/pdf/preview/route.ts` → proxies to `GET {BACKEND_URL}/api/work-log/pdf/preview`
**Called by:** `app/calendar/page.tsx` (direct `fetch`, not via `lib/api.ts`)

#### Query Parameters

| Param   | Type     | Required | Description           |
|---------|----------|:--------:|-----------------------|
| `month` | `string` | Yes      | Format `YYYY-MM`      |

#### Response — 200 OK

Binary PDF file. Content-Disposition may include RFC 5987 encoded Korean filenames.

---

### 3.2 Work Log DOCX Preview

```
GET /api/work-log/docx/preview?month={YYYY-MM}
```

**Source:** `app/api/work-log/docx/preview/route.ts` → proxies to `GET {BACKEND_URL}/api/work-log/docx/preview`
**Called by:** `app/calendar/page.tsx` via `api.downloadWorkLogDocx(month)`

#### Query Parameters

| Param   | Type     | Required | Description           |
|---------|----------|:--------:|-----------------------|
| `month` | `string` | Yes      | Format `YYYY-MM`      |

#### Response — 200 OK

Binary `.docx` file with headers:
- `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `Content-Disposition: attachment; filename*=UTF-8''..._근무일지(...).docx`

---

## 4. Holidays

### 4.1 List Holidays

```
GET /api/holidays?year={year}
```

**Source:** `app/api/holidays/route.ts` → proxies to `GET {BACKEND_URL}/api/holidays`
**Called by:** `app/calendar/page.tsx` via `api.getHolidays(year?)`

#### Query Parameters

| Param  | Type     | Required | Description           |
|--------|----------|:--------:|-----------------------|
| `year` | `number` | No       | e.g. `2026`           |

#### Response — 200 OK

```json
{
  "year": 2026,
  "count": 15,
  "holidays": [
    {
      "id": "holiday-uuid",
      "date": "2026-01-01",
      "name": "New Year's Day",
      "localName": "신정",
      "type": "Public holiday",
      "localType": "공휴일",
      "source": "google"
    }
  ]
}
```

| Field                  | Type     | Description                                 |
|------------------------|----------|---------------------------------------------|
| `year`                 | `number` | The queried year                            |
| `count`                | `number` | Total number of holidays                    |
| `holidays`             | `Holiday[]` | Array of holiday objects                 |
| `holidays[].id`        | `string` | Holiday UUID                                |
| `holidays[].date`      | `string` | Date, `YYYY-MM-DD`                         |
| `holidays[].name`      | `string` | English name                                |
| `holidays[].localName` | `string` | Korean name                                 |
| `holidays[].type`      | `string` | `"Public holiday"` or `"Observance"`        |
| `holidays[].localType` | `string` | `"공휴일"` or `"기념일"`                      |
| `holidays[].source`    | `string` | `"google"` or `"manual"`                    |

---

### 4.2 Create Holiday

```
POST /api/holidays
```

**Source:** `app/api/holidays/route.ts` → proxies to `POST {BACKEND_URL}/api/holidays`
**Called by:** `lib/api.ts` → `api.createHoliday(data)`

#### Request

```json
{
  "date": "2026-05-05",
  "name": "Children's Day",
  "localName": "어린이날",
  "type": "Public holiday",
  "localType": "공휴일"
}
```

| Field       | Type     | Required | Description            |
|-------------|----------|:--------:|------------------------|
| `date`      | `string` | Yes      | Date, `YYYY-MM-DD`    |
| `name`      | `string` | Yes      | English name           |
| `localName` | `string` | Yes      | Korean name            |
| `type`      | `string` | Yes      | Holiday type           |
| `localType` | `string` | Yes      | Localized type         |

#### Response — 200 OK

Returns the created `Holiday` object.

---

### 4.3 Update Holiday

```
PATCH /api/holidays/{id}
```

**Source:** `app/api/holidays/[id]/route.ts` → proxies to `PATCH {BACKEND_URL}/api/holidays/{id}`
**Called by:** `lib/api.ts` → `api.updateHoliday(id, data)`

#### Path Parameters

| Param | Type     | Description  |
|-------|----------|--------------|
| `id`  | `string` | Holiday UUID |

#### Request

All fields optional — only include fields to update.

```json
{
  "name": "Updated Name",
  "localName": "수정된 이름"
}
```

#### Response — 200 OK

Returns the updated `Holiday` object.

---

### 4.4 Delete Holiday

```
DELETE /api/holidays/{id}
```

**Source:** `app/api/holidays/[id]/route.ts` → proxies to `DELETE {BACKEND_URL}/api/holidays/{id}`
**Called by:** `lib/api.ts` → `api.deleteHoliday(id)`

#### Path Parameters

| Param | Type     | Description  |
|-------|----------|--------------|
| `id`  | `string` | Holiday UUID |

#### Response — 204 No Content

Empty response on success.

---

### 4.5 Sync Holidays

```
POST /api/holidays/sync?year={year}
```

**Source:** `app/api/holidays/sync/route.ts` → proxies to `POST {BACKEND_URL}/api/holidays/sync`
**Called by:** `lib/api.ts` → `api.syncHolidays(year)`

#### Query Parameters

| Param  | Type     | Required | Description    |
|--------|----------|:--------:|----------------|
| `year` | `number` | Yes      | e.g. `2026`    |

#### Response — 200 OK

```json
{
  "year": 2026,
  "synced": 15,
  "message": "Synced 15 holidays for 2026"
}
```

| Field     | Type     | Description                         |
|-----------|----------|-------------------------------------|
| `year`    | `number` | Year that was synced                |
| `synced`  | `number` | Number of holidays synced           |
| `message` | `string` | Human-readable status message       |

---

## 5. Users

### 5.1 List Users

```
GET /api/users
```

**Source:** `app/api/users/route.ts` → proxies to `GET {BACKEND_URL}/api/users`
**Called by:** `app/calendar/page.tsx` via `api.getUsers()`

#### Response — 200 OK

```json
[
  {
    "id": "user-uuid",
    "student_id": "2024001234",
    "name": "홍길동",
    "nickname": "길동이",
    "role": "admin",
    "created_at": "2026-01-15T09:00:00Z",
    "status": "active"
  }
]
```

| Field        | Type              | Description              |
|--------------|-------------------|--------------------------|
| `id`         | `string`          | User UUID                |
| `student_id` | `string`          | Student ID               |
| `name`       | `string \| null`  | Full name                |
| `nickname`   | `string \| null`  | Optional display nickname|
| `role`       | `string`          | `"admin"` or `"worker"` |
| `created_at` | `string`          | Account creation date    |
| `status`     | `string`          | Account status           |

---

### 5.2 Update User Role

```
PATCH /api/users/{id}/role
```

**Source:** `app/api/users/[id]/role/route.ts` → proxies to `PATCH {BACKEND_URL}/api/users/{id}/role`
**Called by:** `lib/api.ts` → `api.updateUserRole(userId, role)`

#### Path Parameters

| Param | Type     | Description |
|-------|----------|-------------|
| `id`  | `string` | User UUID   |

#### Request

```json
{
  "role": "admin"
}
```

| Field  | Type     | Required | Description                    |
|--------|----------|:--------:|--------------------------------|
| `role` | `string` | Yes      | `"admin"` or `"worker"`       |

#### Response — 200 OK

Returns the updated `User` object.

---

## 6. Timetable

### 6.1 Get Timetable

```
GET /api/timetable?year={year}&semester={semester}
```

**Source:** `app/api/timetable/route.ts` → proxies to `GET {BACKEND_URL}/api/timetable`
**Called by:** `app/calendar/page.tsx` via `api.getTimetable(year, semester)`

#### Query Parameters

| Param      | Type     | Required | Description          |
|------------|----------|:--------:|----------------------|
| `year`     | `number` | Yes      | Academic year        |
| `semester` | `number` | Yes      | `1` or `2`           |

#### Response — 200 OK

```json
{
  "success": true,
  "courses": {
    "CS101-001": {
      "course_title": "Introduction to Programming",
      "course_code": "CS101-001",
      "schedules": [
        {
          "day": "Monday",
          "day_num": 0,
          "start_time": "09:00",
          "end_time": "10:30",
          "location": "Engineering Hall 301",
          "professor": "김교수"
        }
      ]
    }
  },
  "message": null
}
```

| Field                            | Type                                  | Description                          |
|----------------------------------|---------------------------------------|--------------------------------------|
| `success`                        | `boolean`                             | Whether fetch succeeded              |
| `courses`                        | `Record<string, TimetableCourse>`     | Map of course code → course object   |
| `courses[].course_title`         | `string`                              | Course name                          |
| `courses[].course_code`          | `string`                              | Course code                          |
| `courses[].schedules`            | `TimetableSchedule[]`                 | Weekly schedule entries              |
| `courses[].schedules[].day`      | `string`                              | Day name (e.g. `"Monday"`)          |
| `courses[].schedules[].day_num`  | `number`                              | 0=Mon, 1=Tue, ..., 4=Fri           |
| `courses[].schedules[].start_time` | `string`                            | Start time, `HH:MM`                 |
| `courses[].schedules[].end_time` | `string`                              | End time, `HH:MM`                   |
| `courses[].schedules[].location` | `string`                              | Classroom location                   |
| `courses[].schedules[].professor`| `string`                              | Professor name                       |
| `message`                        | `string \| null`                      | Optional status/error message        |

---

## 7. Profile

### 7.1 Get Profile Settings

```
GET /api/profile/settings
```

**Source:** `app/api/profile/settings/route.ts` → proxies to `GET {BACKEND_URL}/api/profile/settings`
**Called by:** `app/calendar/page.tsx`, `components/ProfileCard.tsx` via `api.getProfileSettings()`

#### Response — 200 OK

```json
{
  "name": "홍길동",
  "student_id": "2024001234",
  "major": "Computer Science",
  "date_of_birth": "2001-05-15",
  "gender": "M",
  "nationality": "KR",
  "profile_image": "base64-or-url-string",
  "room_no": "기숙사 301호",
  "nickname": "길동이",
  "dept_name": "도서관",
  "work_category": "교비근로"
}
```

| Field           | Type              | Description                     |
|-----------------|-------------------|---------------------------------|
| `name`          | `string \| null`  | Full name                       |
| `student_id`    | `string`          | Student ID                      |
| `major`         | `string \| null`  | Major / department              |
| `date_of_birth` | `string \| null`  | Date of birth                   |
| `gender`        | `string \| null`  | Gender                          |
| `nationality`   | `string \| null`  | Nationality code                |
| `profile_image` | `string \| null`  | Profile image reference         |
| `room_no`       | `string \| null`  | Room number (editable)          |
| `nickname`      | `string \| null`  | Display nickname (editable)     |
| `dept_name`     | `string \| null`  | Department name (editable)      |
| `work_category` | `string \| null`  | Work category (editable)        |

---

### 7.2 Update Profile Settings

```
PATCH /api/profile/settings
```

**Source:** `app/api/profile/settings/route.ts` → proxies to `PATCH {BACKEND_URL}/api/profile/settings`
**Called by:** `components/ProfileCard.tsx` via `api.updateProfileSettings(data)`

#### Request

Only editable fields can be updated.

```json
{
  "room_no": "기숙사 502호",
  "nickname": "새별명",
  "dept_name": "전산실",
  "work_category": "국가근로"
}
```

| Field           | Type              | Required | Description            |
|-----------------|-------------------|:--------:|------------------------|
| `room_no`       | `string \| null`  | No       | Room number            |
| `nickname`      | `string \| null`  | No       | Display nickname       |
| `dept_name`     | `string \| null`  | No       | Department name        |
| `work_category` | `string \| null`  | No       | Work category          |

#### Response — 200 OK

Returns the full updated `ProfileSettings` object.

---

### 7.3 Get Profile Image

```
GET /api/profile/image
```

**Source:** `app/api/profile/image/route.ts` → proxies to `GET {BACKEND_URL}/api/profile/image`
**Called by:** `components/ProfileCard.tsx` (as `<img src="/api/profile/image" />`)

#### Response — 200 OK

Binary image data with appropriate `Content-Type` (e.g. `image/png`).
Cached with `Cache-Control: public, max-age=300`.

---

## 8. Error Responses

All endpoints use a consistent error format:

```json
{
  "detail": "Error description string"
}
```

| HTTP Status | Meaning                                      |
|-------------|----------------------------------------------|
| `400`       | Bad request (missing/invalid parameters)     |
| `401`       | Not authenticated or invalid token           |
| `403`       | Insufficient permissions (e.g. not admin)    |
| `404`       | Resource not found                           |
| `500`       | Internal server error                        |

The client-side `fetchApi()` in `lib/api.ts` parses errors by checking `detail`, then `message`, then falls back to a generic status message.

---

## 9. Data Flow Diagrams

### Login Flow

```
User (login form)
  │
  ▼
POST /api/auth/login  { student_id, password }
  │
  ├──▶ Next.js route handler (app/api/auth/login/route.ts)
  │       │
  │       ▼
  │    POST {BACKEND_URL}/api/auth/login
  │       │
  │       ▼
  │    Backend validates credentials → returns tokens
  │       │
  │       ▼
  │    Route handler sets httpOnly cookies:
  │      • access_token (JWT)
  │      • session_token (KLAS)
  │       │
  ▼       ▼
  Client receives { success, message, token, access_token }
  │
  ▼
  Redirect to /calendar
```

### Authenticated Request Flow

```
React Component (e.g. calendar/page.tsx)
  │
  ▼
api.getShifts("2026-03")  →  fetchApi("/shifts?month=2026-03")
  │
  ├──▶ fetch("/api/shifts?month=2026-03", { credentials: "include" })
  │       │
  │       ▼  cookies sent automatically (access_token, session_token)
  │
  ├──▶ Next.js route handler (app/api/shifts/route.ts)
  │       │
  │       ▼  reads cookies from request
  │       ▼  forwards to GET {BACKEND_URL}/api/shifts?month=2026-03
  │       ▼  attaches token in Authorization header or cookie
  │       │
  │       ▼
  │    Backend returns Shift[]
  │       │
  ▼       ▼
  Component receives Shift[] → updates state → renders calendar
```

### File Download Flow (PDF/DOCX)

```
User clicks "Download"
  │
  ▼
api.downloadSchedulePDF("2026-03")
  │
  ├──▶ fetch("/api/shifts/schedule/pdf?month=2026-03")
  │       │
  │       ▼
  │    Next.js route handler streams binary response from backend
  │       │
  ▼       ▼
  Client receives Blob
  │
  ▼
  Creates object URL → triggers <a download> click → browser saves file
```

---

## 10. Key Files Reference

| File                              | Purpose                                      |
|-----------------------------------|----------------------------------------------|
| `lib/types.ts`                    | All TypeScript interfaces for request/response payloads |
| `lib/api.ts`                      | Client-side API wrapper (`api` object)        |
| `lib/config.ts`                   | Backend URL configuration                     |
| `middleware.ts`                    | Auth redirect middleware                      |
| `app/api/auth/login/route.ts`     | Login proxy route                            |
| `app/api/auth/logout/route.ts`    | Logout proxy route                           |
| `app/api/me/route.ts`             | Current user proxy route                     |
| `app/api/shifts/route.ts`         | Shifts list/create proxy route               |
| `app/api/shifts/[id]/route.ts`    | Shift update/delete proxy route              |
| `app/api/shifts/hours/route.ts`   | Hours summary proxy route                    |
| `app/api/shifts/schedule/pdf/route.ts` | Schedule PDF proxy route                |
| `app/api/work-log/pdf/preview/route.ts` | Work log PDF proxy route              |
| `app/api/work-log/docx/preview/route.ts` | Work log DOCX proxy route            |
| `app/api/holidays/route.ts`       | Holidays list/create proxy route             |
| `app/api/holidays/[id]/route.ts`  | Holiday update/delete proxy route            |
| `app/api/holidays/sync/route.ts`  | Holiday sync proxy route                     |
| `app/api/users/route.ts`          | Users list proxy route                       |
| `app/api/users/[id]/role/route.ts`| User role update proxy route                 |
| `app/api/timetable/route.ts`      | Timetable proxy route                        |
| `app/api/profile/settings/route.ts` | Profile settings proxy route               |
| `app/api/profile/image/route.ts`  | Profile image proxy route                    |
