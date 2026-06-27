<div align="center">

# Fittable | Frontend

Scheduling dashboard for university student office assistants. Syncs work shifts and university timetables into a single calendar, streamlines schedule creation, and automates work document generation to replace manual spreadsheet workflows.

<br/>

![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![CSS Modules](https://img.shields.io/badge/CSS_Modules-000000?style=for-the-badge&logo=cssmodules&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

<br/>

▶ Click to watch demo

[![Fittable Demo](https://img.youtube.com/vi/Se2Nv5h_u2k/maxresdefault.jpg)](https://www.youtube.com/watch?v=Se2Nv5h_u2k)

</div>

---

## Screenshots

**University Portal Login**
![Login](.github/assets/01_login.png)
Signs in using the same RSA-encrypted login flow as the university browser portal. No separate account needed.

**My Shift Schedule**
![My Schedule](.github/assets/02_my_schedule.png)
Personal view of the logged-in student's own shifts with total hours for the current pay period.

**All Part-time Workers Schedule**
![All Schedules](.github/assets/03_all_schedules.png)
Everyone can see each other's shifts so no more than 3 workers end up scheduled on the same day.

**Timetable Sync · Week View**
![Weekly Sync](.github/assets/09_weekly_sync.png)
Class blocks and work shifts on the same timeline so scheduling conflicts are caught before they happen.

**Multi-day Shift Creation**
![Multi-day](.github/assets/07_multi_day.png)
Ctrl-click multiple dates to create shifts across all of them at once.

**Dark Mode**
![Dark Mode](.github/assets/10_dark_mode.png)
Full dark theme across all views, toggled without a page reload.

**Work Schedule Export**
![Download Schedule](.github/assets/04_download_schedule.png)
Exports the month's schedule as a formatted PDF ready to submit.

**Work Log Document Generation**
![Download Worklog](.github/assets/05_download_worklog.png)
Auto-generates the official work log form as a PDF with personal details and work hours pre-filled, replacing what was previously done by hand.

**Student Profile Card**
![Profile](.github/assets/06_my_profile.png)
Profile synced with the university portal and displayed as a digital student ID card.

---

## System Architecture

```mermaid
graph TB
    subgraph browser["Browser"]
        UI["React Components\n30 custom components"]
        CTX["Context API\nTheme · Auth state"]
    end

    subgraph vercel["Vercel · Next.js 14"]
        direction TB
        MW["Middleware\nAuth guard · Route protection"]
        PAGES["App Router\nServer + Client Components"]
        PROXY["API Route Handlers\n17 proxy endpoints"]
    end

    subgraph backend["FastAPI Backend\nAWS EC2"]
        API["REST API"]
    end

    subgraph external["External"]
        KLAS["KLAS Portal"]
        GS["Google Sheets"]
    end

    UI --> MW
    MW -->|"redirect /login if no cookie"| PAGES
    PAGES --> PROXY
    PROXY -->|"httpOnly cookie forwarding"| API
    API --> KLAS
    API --> GS

    style browser fill:#1a1a2e,stroke:#61DAFB,color:#fff
    style vercel fill:#1a1a2e,stroke:#fff,color:#fff
    style backend fill:#1a1a2e,stroke:#FF9900,color:#fff
    style external fill:#1a1a2e,stroke:#888,color:#fff
```

---

## Data Flows

### 1. Authentication Flow

All auth state lives in httpOnly cookies — the browser never touches the token directly. Next.js middleware enforces protection at the edge before any component renders.

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant MW as Next.js Middleware
    participant PR as API Route /api/auth/login
    participant BE as FastAPI Backend

    B->>MW: GET /calendar
    MW->>MW: Check access_token cookie
    alt cookie missing
        MW-->>B: 302 → /login
    end

    B->>PR: POST /api/auth/login {student_id, password}
    PR->>BE: POST /api/auth/login (forwarded)
    BE-->>PR: {access_token, token}

    Note over PR: Set httpOnly cookies<br/>access_token (JWT, 24h)<br/>session_token (KLAS session)

    PR-->>B: 200 OK + Set-Cookie headers
    B->>MW: GET /calendar
    MW->>MW: access_token cookie ✓
    MW-->>B: 200 — render calendar
```

---

## Component Architecture

```mermaid
graph TD
    subgraph layout["Root Layout (layout.tsx)"]
        TP["ThemeProvider\nContext · localStorage"]
    end

    subgraph calendar["Calendar Page (page.tsx) — state hub"]
        CH["CalendarHeader\nView toggle · date nav · language"]
        SB["Sidebar\nWorker list · filters · mini-calendar"]
        CG["CalendarGrid\nMonth view · multi-select dates"]
        WG["WeeklyCalendarGrid\nWeek/day view · time slots"]
        MC["MobileDayCalendar\nMobile week strip"]
        SEM["ShiftEditorModal\nCreate/edit · conflict detection"]
        SDP["ShiftDetailPanel\nDesktop shift info"]
        PC["ProfileCard\nProfile · settings · work hours"]
    end

    TP --> calendar
    CH --> calendar
    SB --> calendar
    CG --> SEM
    WG --> SEM
    SEM --> calendar
```

---

## Project Structure

```
app/
├── api/              # 17 API proxy route handlers (auth, shifts, holidays, users…)
├── calendar/         # Main protected page — calendar orchestrator
├── login/            # Auth page with error state from URL params
├── globals.css       # 60+ CSS custom properties (dual theme)
└── layout.tsx        # Root layout with ThemeProvider

components/           # 30 fully custom components
lib/
├── api.ts            # Typed fetch wrapper — all 18 endpoint functions
├── types.ts          # 20+ TypeScript interfaces (Shift, User, Holiday, TimetableEntry…)
├── i18n.ts           # Bilingual Ko/En translation system
├── workMonth.ts      # 25th–24th payroll cycle date math
└── theme.ts          # Theme persistence + DOM application

middleware.ts         # Edge auth guard — protects /calendar/* routes
```

---

## Local Setup

```bash
npm install
cp .env.example .env.local   # set BACKEND_URL
npm run dev
```

| Variable | Description |
|---|---|
| `BACKEND_URL` | FastAPI backend URL (e.g. `http://localhost:8000`) |

| Script | Description |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
