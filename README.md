# Scalezix — Client Meeting-to-Action Tracker

> **Project 2** for Scalezix Ventures LLP AI Developer Assignment.  
> Converts client meeting transcripts and rough notes into structured, reviewable meeting records with accountability and zero-hallucination guarantees.

---

## 1. Overview & Core Purpose
Client kickoff and architecture review meetings generate critical action items, architectural decisions, and project blockers. Human teams frequently suffer from missing deadlines, ambiguous task owners, and lost context.

The **Client Meeting-to-Action Tracker** bridges this gap by providing an end-to-end audit and extraction engine that enforces strict human-in-the-loop review and preserves verbatim meeting excerpts.

---

## 2. Non-Negotiable Accuracy & Reliability Rules

1. **Zero Hallucination**: Never invent task owners, deadlines, decisions, or commitments that were not explicitly stated in the meeting notes.
2. **Unassigned Owners**: If no specific individual is assigned to a task, display **`Unassigned — confirmation needed.`** with a rose warning pill.
3. **Missing Due Dates**: If no deadline is stated, display **`No due date stated.`** with an amber pill. Never mark a task overdue when no date exists.
4. **Preserve Ambiguity**: Flag uncertain commitments and open questions in dedicated alert sections rather than forcing a guess.
5. **AI Draft State**: All AI-extracted content remains in a `needs_review` draft state until a human user explicitly confirms or edits it.
6. **No Silent Overwrites**: User-reviewed content is strictly protected from being overwritten by subsequent AI passes.
7. **Brainstorming vs. Decisions**: Discussions or brainstorming points are never recorded as binding decisions unless agreed upon.
8. **Source Excerpt Provenance**: Every extracted task and decision stores and displays its verbatim source quote.
9. **Separate Accountability**: Action items, decisions, risks, and follow-up questions are strictly separated into distinct data models.
10. **Resilient Offline Workflows**: Full manual CRUD workflows are supported without requiring an active external AI API key.
11. **Privacy & Data Isolation**: Client meeting notes are never transmitted to third parties unless the user explicitly configures an AI provider.

---

## 3. Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React icons.
- **Backend API**: Django 6.0, Django REST Framework (DRF), SQLite (configurable to MySQL/Postgres).
- **Styling System**: Scalezix Enterprise Dark & Slate palette (`#090D16`, `#0F172A`, `#1E293B`, `#10B981`).
- **Testing**: 
  - Backend: Django TestCase suite (10 unit tests covering CRUD, validations, exports, cascades).
  - Frontend: Vitest + React Testing Library (7 unit tests covering UI, rules, modals, exports).

---

## 4. Architecture & Folder Structure

```
02-Meeting-Action-Tracker/
├── backend/
│   ├── api/
│   │   ├── management/commands/
│   │   │   └── seed_data.py          # Realistic demo dataset seeder
│   │   ├── ai_service.py             # Server-side LLM & fallback parser
│   │   ├── models.py                 # Meeting, Task, Decision, Risk, Question
│   │   ├── serializers.py            # DRF serializers with nested relationships
│   │   ├── urls.py                   # API routes
│   │   ├── views.py                  # API endpoints, CSV & Markdown exports
│   │   └── tests.py                  # 10 automated backend tests
│   ├── meeting_tracker/
│   │   ├── settings.py               # Django configuration & CORS
│   │   └── urls.py
│   ├── .env.example                  # Environment template
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   # Scalezix Executive Tracker & Modals
│   │   ├── App.test.jsx              # Vitest automated test suite (7 tests)
│   │   ├── index.css                 # Scalezix Design Tokens & Fallbacks
│   │   └── main.jsx
│   ├── index.html                    # Theme & font imports
│   ├── vite.config.js                # Port 5175, proxy & Vitest setup
│   └── package.json
├── RUN_PROJECT_2.bat                 # 1-Click launcher
└── README.md                         # This file
```

---

## 5. Quick Start Instructions

### Method A: 1-Click Launch (Recommended)
Double-click `RUN_PROJECT_2.bat` in the root workspace directory or run:
```cmd
RUN_PROJECT_2.bat
```
*Automatically starts Django backend on port `8000`, React frontend on port `5175`, and opens your browser.*

### Method B: Manual Commands

#### 1. Backend Setup & Run:
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install django djangorestframework django-cors-headers python-dotenv openai
python manage.py migrate
python manage.py seed_data      # Seeds Novacare & Apex sample meetings
python manage.py runserver 127.0.0.1:8000
```
*API is accessible at `http://127.0.0.1:8000/api/`*

#### 2. Frontend Setup & Run:
```bash
cd frontend
npm install
npm run dev
```
*App is accessible at `http://localhost:5175/`*

---

## 6. Running Automated Tests

### Run Backend Unit Tests (10 Tests):
```bash
cd backend
python manage.py test
```
*Tests meeting validation, unassigned owner handling, missing due date rules, CSV export headers, Markdown report formatting, and cascading deletions.*

### Run Frontend Unit Tests (7 Tests):
```bash
cd frontend
npm test
```
*Tests Scalezix branding, executive KPI cards, Zero-Hallucination badges, source note quotes, export buttons, and interactive Edit modal.*

### Run from Root Workspace:
```bash
npm run p2:backend:test
npm run p2:frontend:test
npm run p2:frontend:build
```

---

## 7. Multi-Format Exports

- **CSV Export**: `GET /api/tasks/export-csv/?meeting=<id>` or frontend **"Export CSV"** button. Generates standard spreadsheet containing Meeting Title, Task Title, Owner, Due Date, Priority, Status, and Review State.
- **Markdown Report Export**: `GET /api/meetings/<id>/export-report/` or frontend **"Report (.md)"** button. Generates a formatted executive markdown document with structured sections for Summary, Decisions, Action Items, Risks, and Open Questions.
