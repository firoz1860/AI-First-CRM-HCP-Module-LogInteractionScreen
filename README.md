# AI-First CRM — HCP Module

A production-ready AI-powered Customer Relationship Management system for pharmaceutical field representatives. Built around the **Log Interaction Screen** — a dual-mode interface (Structured Form + Conversational AI Chat) that lets reps capture, enrich, and analyze HCP interactions in real time.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [LangGraph Agent — 5 Tools](#langgraph-agent--5-tools)
- [Frontend Pages](#frontend-pages)
- [Running the Project](#running-the-project)
- [Groq API Key Setup](#groq-api-key-setup)

---

## Overview

Pharmaceutical field reps visit doctors and pharmacists daily. After each visit, they need to log what was discussed, what samples were left, and what follow-ups are needed. This CRM automates that process using AI:

- **Form Mode** — Fill a structured form; the backend AI agent summarizes the visit, extracts entities, checks compliance, and suggests a next action — all automatically.
- **Chat Mode** — Describe your visit in plain English. The LangGraph agent understands context, calls the right tools, and logs everything without the rep touching a form.

---

## Features

| Feature | Description |
|---------|-------------|
| Dual-Mode Logging | Structured form OR conversational AI chat — same result |
| AI Summarization | Groq `gemma2-9b-it` extracts key messages, feedback, and entities |
| Compliance Checking | Automated PDMA/AMA validation on every interaction |
| Next Best Action | Groq `llama-3.3-70b-versatile` recommends the most impactful follow-up |
| HCP Profile Panel | Real-time context panel showing recent visits and engagement metrics |
| WebSocket Streaming | Live tool execution status during AI chat (`Checking compliance...`) |
| Interaction History | Filterable table with expandable AI summaries |
| Dashboard | Weekly/monthly metrics, compliance rate, top HCPs, upcoming follow-ups |
| Fully Responsive | Works on mobile, tablet, and desktop |
| Seed Data | 10 HCPs, 25 interactions, 5 next best actions pre-loaded |

---

## Architecture

```
Browser (React + Redux)
        |
        | HTTP / WebSocket
        v
FastAPI (REST + WS endpoints)
        |
        v
LangGraph Agent (ReAct loop)
   |        |        |        |        |
Tool 1   Tool 2   Tool 3   Tool 4   Tool 5
 Log      Edit    Profile   NBA    Comply
   |                                  |
   +----------> Groq LLM <-----------+
                (gemma2-9b-it /
                llama-3.3-70b)
        |
        v
   SQLite / PostgreSQL
```

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| API Framework | FastAPI 0.111 |
| AI Agent | LangGraph 0.2 |
| LLM Provider | Groq (via `langchain-groq`) |
| ORM | SQLAlchemy 2.0 |
| Validation | Pydantic v2 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Server | Uvicorn |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite 5 |
| State Management | Redux Toolkit |
| Routing | React Router v6 |
| HTTP Client | Axios |
| WebSocket | Native WebSocket API |
| Font | Inter (Google Fonts) |

### LLM Models (via Groq)
| Model | Use Case |
|-------|---------|
| `gemma2-9b-it` | Fast structured extraction, compliance checks |
| `llama-3.3-70b-versatile` | Complex reasoning, summaries, next best action |

---

## Project Structure

```
ai-crm-hcp/
│
├── start.bat                          ← One-click launch (Windows)
├── README.md
│
├── backend/
│   ├── main.py                        ← FastAPI entry point
│   ├── .env                           ← Environment variables (add GROQ_API_KEY here)
│   ├── .env.example
│   ├── requirements.txt
│   ├── hcp_crm.db                     ← SQLite database (auto-created)
│   ├── backend.log                    ← Server log
│   │
│   ├── core/
│   │   ├── config.py                  ← Pydantic settings
│   │   └── database.py                ← SQLAlchemy engine + session
│   │
│   ├── models/                        ← SQLAlchemy ORM models
│   │   ├── hcp.py
│   │   ├── interaction.py
│   │   ├── chat_session.py
│   │   └── next_best_action.py
│   │
│   ├── schemas/                       ← Pydantic request/response schemas
│   │   ├── hcp.py
│   │   ├── interaction.py
│   │   ├── chat.py
│   │   └── action.py
│   │
│   ├── api/routers/                   ← FastAPI route handlers
│   │   ├── hcps.py                    ← GET/POST /api/hcps
│   │   ├── interactions.py            ← CRUD /api/interactions
│   │   ├── chat.py                    ← POST /api/chat/message + WebSocket
│   │   └── actions.py                 ← GET/PUT /api/actions
│   │
│   ├── agent/
│   │   ├── graph.py                   ← LangGraph StateGraph definition
│   │   ├── state.py                   ← HCPInteractionState TypedDict
│   │   └── tools/
│   │       ├── log_interaction.py     ← Tool 1
│   │       ├── edit_interaction.py    ← Tool 2
│   │       ├── get_hcp_profile.py     ← Tool 3
│   │       ├── suggest_next_action.py ← Tool 4
│   │       └── check_compliance.py    ← Tool 5
│   │
│   ├── services/
│   │   └── groq_service.py            ← Groq API wrapper
│   │
│   └── scripts/
│       └── seed_data.py               ← Database seeder
│
└── frontend/
    ├── .env                           ← Vite env vars
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx                    ← Router + layout
        ├── index.css                  ← Global styles + CSS variables
        ├── app/
        │   └── store.js               ← Redux store
        ├── features/
        │   ├── interactions/
        │   │   ├── LogInteractionScreen.jsx  ← MAIN SCREEN
        │   │   ├── FormMode.jsx
        │   │   ├── ChatMode.jsx
        │   │   └── InteractionHistory.jsx
        │   ├── hcp/
        │   │   ├── HCPList.jsx
        │   │   └── HCPProfile.jsx
        │   ├── chat/
        │   │   └── ChatBubble.jsx
        │   ├── dashboard/
        │   │   └── Dashboard.jsx
        │   └── ui/
        │       └── uiSlice.js
        ├── components/
        │   ├── Layout/
        │   │   ├── AppLayout.jsx
        │   │   ├── Sidebar.jsx
        │   │   └── TopBar.jsx
        │   └── ui/
        │       ├── Button.jsx
        │       ├── Badge.jsx
        │       ├── Spinner.jsx
        │       ├── Toast.jsx
        │       └── Skeleton.jsx
        └── services/
            ├── api.js
            ├── interactionService.js
            ├── hcpService.js
            └── chatService.js
```

---

## Getting Started

### Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Groq API Key | — | [console.groq.com](https://console.groq.com) |

---

## Environment Variables

### Backend — `backend/.env`

```env
# Database (SQLite for dev, PostgreSQL for prod)
DATABASE_URL=sqlite:///./hcp_crm.db

# REQUIRED — get from https://console.groq.com
GROQ_API_KEY=gsk_your_key_here

# LLM Models
GROQ_MODEL_PRIMARY=gemma2-9b-it
GROQ_MODEL_SECONDARY=llama-3.3-70b-versatile

# App
SECRET_KEY=change_this_in_production
CORS_ORIGINS=http://localhost:5173
DEBUG=True
```

### Frontend — `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

---

## Database Schema

### `hcps`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| name | VARCHAR(255) | |
| specialty | VARCHAR(100) | Cardiology, Endocrinology, etc. |
| institution | VARCHAR(255) | Hospital/clinic name |
| email | VARCHAR(255) UNIQUE | |
| phone | VARCHAR(50) | |
| territory | VARCHAR(100) | Northeast, Midwest, etc. |
| tier | ENUM A/B/C | Prescribing potential |
| preferred_contact | ENUM email/phone/in-person | |

### `interactions`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| hcp_id | FK → hcps | |
| interaction_type | ENUM | detail_visit, lunch_meeting, etc. |
| products_discussed | JSON | Array of product names |
| samples_provided | JSON | Array of {product, quantity} |
| key_messages_delivered | TEXT | What the rep said |
| hcp_feedback | TEXT | What the HCP said |
| ai_summary | TEXT | LLM-generated summary |
| ai_entities | JSON | Extracted products, conditions, actions |
| compliance_status | ENUM | compliant / flagged / pending |
| follow_up_required | BOOLEAN | |
| follow_up_date | DATE | Optional |

### `chat_sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| hcp_id | FK → hcps | |
| interaction_id | FK → interactions | Set after logging |
| messages | JSON | Full conversation history |
| session_state | JSON | LangGraph state snapshot |

### `next_best_actions`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| hcp_id | FK → hcps | |
| interaction_id | FK → interactions | |
| action_type | VARCHAR(100) | follow_up_visit, send_literature, etc. |
| action_description | TEXT | AI-generated recommendation |
| priority | ENUM high/medium/low | |
| due_date | DATE | Within 30 days |
| status | ENUM pending/completed/dismissed | |
| rationale | TEXT | Why this action was recommended |

---

## API Reference

### HCPs
```
GET    /api/hcps/              List all HCPs (search, specialty, tier filters)
POST   /api/hcps/              Create new HCP
GET    /api/hcps/{id}          Get HCP with engagement metrics
PUT    /api/hcps/{id}          Update HCP
```

### Interactions
```
GET    /api/interactions/           List interactions (filters: hcp_id, type, compliance, dates)
POST   /api/interactions/           Create + AI-enrich interaction
GET    /api/interactions/{id}       Get single interaction
PUT    /api/interactions/{id}       Update (supports natural language modification_request)
DELETE /api/interactions/{id}       Soft delete
```

### Chat (AI Agent)
```
POST   /api/chat/message            Single-turn agent message
GET    /api/chat/session/{id}       Get chat session history
WS     /api/chat/ws/chat/{id}       WebSocket — streaming agent responses
```

### Actions
```
GET    /api/actions/                List all next best actions
GET    /api/actions/hcp/{hcp_id}    Get actions for specific HCP
PUT    /api/actions/{id}            Update action status
```

---

## LangGraph Agent — 5 Tools

The agent follows a ReAct loop: **Reason → Act → Observe → Repeat**

```
User message
     ↓
 agent_node  ──── [tool call?] ──YES──→ tool_executor_node
     ↑                                        ↓
     └─────────────────────────────────────────
     ↓
 [no tool call]
     ↓
 finalize_node
     ↓
  Response
```

### Tool 1 — `log_interaction`
Captures a new HCP interaction from natural language or structured data.

**Steps:**
1. Calls `gemma2-9b-it` to extract key messages, HCP feedback, products, and generate a 3-sentence summary
2. Calls `check_compliance` inline
3. Inserts record into `interactions` table
4. Returns interaction ID, AI summary, and compliance result

**Example trigger:** *"I just had a detail visit with Dr. Chen. Discussed Jardiance for T2D patients. Left 3 samples."*

---

### Tool 2 — `edit_interaction`
Modifies a logged interaction using a natural language diff.

**Steps:**
1. Fetches existing record from DB
2. Calls `llama-3.3-70b` to compute field-level diff from the modification request
3. Merges delta with existing record
4. Re-runs AI summarization if text fields changed
5. Updates DB

**Example trigger:** *"Change the follow-up date to next Friday and add Ozempic to the products list"*

---

### Tool 3 — `get_hcp_profile`
Retrieves full HCP profile with computed engagement metrics.

**Returns:** Contact info, tier, last 10 interactions, compliance rate, top products, open follow-ups

**Example trigger:** *"Show me Dr. Patel's profile and recent history"*

---

### Tool 4 — `suggest_next_best_action`
Uses HCP history to recommend the most impactful next commercial activity.

**Steps:**
1. Fetches HCP profile + last 10 interactions
2. Calls `llama-3.3-70b` with full context
3. Returns structured recommendation: action type, description, priority, due date, rationale
4. Saves to `next_best_actions` table

**Example trigger:** *"What should my next step be with Dr. Chen?"*

---

### Tool 5 — `check_compliance`
Validates interaction data against pharmaceutical industry rules.

**Checks:**
- Sample quantity limits (>6 per product per visit = flagged)
- Off-label promotion detection (LLM analysis)
- Improper inducement language
- PDMA / AMA guideline compliance

**Returns:** `compliant` / `flagged` / `pending` with specific flags and recommendations

---

## Frontend Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Dashboard | Metrics cards, recent interactions, top HCPs, follow-ups |
| `/hcps` | HCPList | Searchable card grid with tier badges and quick actions |
| `/hcps/:id` | HCPProfile | Full profile, metrics, interaction timeline |
| `/interactions/new` | LogInteractionScreen | **Main feature** — Form + Chat modes |
| `/interactions` | InteractionHistory | Filterable table with expandable AI summaries |

### Redux State Shape
```js
{
  interactions: {
    list: [],           // All fetched interactions
    current: null,      // Currently viewing/editing
    loading: false,
    submitting: false,
    aiSummary: null,    // Returned after form submit
    complianceResult: null,
    nextAction: null
  },
  hcp: {
    selected: null,     // HCP chosen for interaction logging
    list: [],
    profile: null,
    loading: false
  },
  chat: {
    sessionId: null,
    messages: [],
    isConnected: false,
    isTyping: false,
    toolExecuting: null,  // e.g. 'check_compliance'
    streamingContent: ''
  },
  ui: {
    mode: 'form',         // 'form' | 'chat'
    sidebarOpen: true,
    activeToasts: []
  }
}
```

---

## Running the Project

### Option A — One-click (Windows)

Double-click **`start.bat`** in the project root. Opens two terminal windows and launches both servers automatically.

### Option B — Manual

**Terminal 1 — Backend**
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```

**Terminal 3 (one-time) — Seed the database**
```bash
cd backend
python scripts/seed_data.py
```

### Access Points
| URL | Purpose |
|-----|---------|
| http://localhost:5173 | React application |
| http://localhost:8000 | FastAPI backend |
| http://localhost:8000/docs | Interactive API documentation (Swagger UI) |
| http://localhost:8000/health | Health check endpoint |

---

## Groq API Key Setup

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to **API Keys** → **Create New Key**
4. Copy the key (starts with `gsk_...`)
5. Open `backend/.env` and replace:
   ```
   GROQ_API_KEY=gsk_your_key_here
   ```
6. Restart the backend server

> Without a valid Groq API key, AI features (summarization, compliance check, next best action, chat mode) will not work. Basic form submission will still save interactions.

---

## Color System

```css
--primary:        #2563EB   /* Blue-600 — primary actions */
--success:        #16A34A   /* Green-600 — compliant, Tier A */
--warning:        #D97706   /* Amber-600 — pending, Tier B */
--danger:         #DC2626   /* Red-600 — flagged, errors */

/* Tier Badges */
Tier A → background #DCFCE7, color #15803D
Tier B → background #FEF9C3, color #A16207
Tier C → background #F1F5F9, color #475569

/* Compliance Badges */
compliant → background #DCFCE7, color #15803D
flagged   → background #FEE2E2, color #DC2626
pending   → background #FEF9C3, color #A16207
```

---

## Seed Data

The seed script populates the database with realistic sample data:

- **10 HCPs** across 4 specialties (Endocrinology, Cardiology, General Practice, Internal Medicine) and 4 territories (Northeast, Midwest, West, South), mixed Tier A/B/C
- **25 interactions** with varied types, products, compliance statuses, and follow-up flags
- **5 next best actions** linked to recent interactions
- **Products:** Jardiance, Ozempic, Trulicity, Farxiga, Victoza, Metformin

```bash
cd backend
python scripts/seed_data.py
```

> Safe to run multiple times — skips if data already exists.

---

## Production Deployment Notes

- Switch `DATABASE_URL` to PostgreSQL: `postgresql://user:pass@host:5432/hcp_crm`
- Set `DEBUG=False` and a strong `SECRET_KEY`
- Serve frontend with `npm run build` → serve `dist/` via Nginx or a CDN
- Run backend with `uvicorn main:app --workers 4` behind a reverse proxy
