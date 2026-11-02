# 🐧 ResearchForge — Local Multi-Agent Research Assistant

A fully local, privacy-first research assistant powered by a **multi-agent AI pipeline**. ResearchForge uses three collaborative agents (Researcher → Fact-Checker → Writer) backed by a local Ollama LLM, DuckDuckGo search, and a SQLite database to produce structured, verified research reports — **at ₹0 cost**.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend (Port 3000)            │
│  HeroSection · AgentTimeline · SourceExplorer · ReportView  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP / SSE
┌───────────────────────────▼─────────────────────────────────┐
│                   FastAPI Backend (Port 8000)                │
│                                                             │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │  Researcher │→ │ Fact-Checker │→ │  Writer Agent    │  │
│   │   Agent     │  │   Agent      │  │                  │  │
│   └─────────────┘  └──────────────┘  └──────────────────┘  │
│              ↓ Ollama (qwen3.5 / any local model)           │
│              ↓ DuckDuckGo Search · SQLite · File Store      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Python | 3.11+ | `python3 --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| [Ollama](https://ollama.com) | Latest | `ollama --version` |

> **An Ollama model must be pulled before running the backend.** The default model is `qwen3.5:latest`.

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd MultimodelAgent
```

### 2. Pull the Ollama model

Make sure [Ollama](https://ollama.com/download) is installed and running, then pull the default model:

```bash
ollama pull qwen3.5
```

Verify Ollama is running:

```bash
ollama list
```

> To use a different model, set the `OLLAMA_MODEL` environment variable (see [Configuration](#️-configuration)).

---

### 3. Set up the Python backend

```bash
# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 4. Run the backend server

```bash
# From the project root (with .venv active or using its full path)
PYTHONPATH=. .venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify it's healthy:

```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "backend": "online",
  "database": "sqlite_ready",
  "search_service": "duckduckgo_ready",
  "ollama": { "connected": true, "model": "qwen3.5:latest", "model_available": true }
}
```

---

### 5. Set up and run the frontend

Open a **new terminal window**:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at **[http://localhost:3000](http://localhost:3000)**

---

## 📁 Project Structure

```
MultimodelAgent/
├── backend/
│   ├── main.py              # FastAPI app & API routes
│   ├── requirements.txt     # Python dependencies
│   ├── agents/
│   │   ├── researcher.py    # Web search & source discovery agent
│   │   ├── fact_checker.py  # Claim verification agent
│   │   └── writer.py        # Report generation agent
│   ├── crew/
│   │   └── research_crew.py # Agent orchestration pipeline + SSE streaming
│   ├── database/
│   │   └── database.py      # SQLite persistence layer
│   ├── models/
│   │   └── schemas.py       # Pydantic request/response schemas
│   └── tools/
│       ├── llm.py           # Ollama HTTP client
│       ├── search.py        # DuckDuckGo search wrapper
│       ├── scraper.py       # Web scraping (trafilatura + BS4)
│       └── documents.py     # PDF / DOCX / TXT extraction
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # UI components (Timeline, Sources, Report…)
│   │   └── lib/api.ts       # Typed API client
│   └── package.json
├── data/
│   ├── researchforge.db     # SQLite database (auto-created)
│   └── documents/           # Uploaded files (auto-created)
└── README.md
```

---

## ⚙️ Configuration

### Backend environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `qwen3.5:latest` | LLM model to use |

Example with a different model:

```bash
OLLAMA_MODEL=llama3.2:latest PYTHONPATH=. .venv/bin/uvicorn backend.main:app --port 8000 --reload
```

### Frontend environment variables

Create `frontend/.env.local` to override the API base URL:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## 🔬 Research Modes

| Mode | Description |
|------|-------------|
| **Quick** | Fast search with top sources, light fact-checking |
| **Deep** | Thorough multi-source research with full claim verification |
| **Document** | Upload PDF / DOCX / TXT files for document-based analysis |

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | System health & Ollama status |
| `POST` | `/api/research` | Start a new research session |
| `GET` | `/api/research/{id}` | Get session details |
| `GET` | `/api/research/{id}/status` | Agent status & statistics |
| `GET` | `/api/research/{id}/sources` | Discovered sources |
| `GET` | `/api/research/{id}/claims` | Verified claims & conflicts |
| `GET` | `/api/research/{id}/report` | Final research report |
| `GET` | `/api/research/{id}/timeline` | Agent event timeline |
| `GET` | `/api/research/{id}/stream` | Live SSE event stream |
| `POST` | `/api/documents` | Upload a document (PDF/DOCX/TXT) |
| `GET` | `/api/history` | List past research sessions |

---

## 🛠️ Running Both Servers (Summary)

Open two terminal windows from the project root:

**Terminal 1 — Backend:**
```bash
source .venv/bin/activate
PYTHONPATH=. uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🐛 Troubleshooting

### Backend: `ModuleNotFoundError: No module named 'backend'`
Make sure you run uvicorn from the **project root** with `PYTHONPATH=.`:
```bash
PYTHONPATH=. .venv/bin/uvicorn backend.main:app --port 8000
```

### Backend: Ollama `connected: false`
- Ensure Ollama is running: `ollama serve`
- Check the model is available: `ollama list`
- Pull it if missing: `ollama pull qwen3.5`

### Frontend: API errors / blank page
- Confirm the backend is running on port `8000`
- Check browser console for CORS or network errors
- Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local` matches your backend

### `.venv` path issues after moving/renaming the folder
Recreate the virtual environment:
```bash
python3 -m venv .venv --clear
source .venv/bin/activate
pip install -r backend/requirements.txt
```

---

## 📄 License

This project is for local/personal use. All AI inference is performed on-device via Ollama — no data is sent to external APIs.
# MultiModel
# MultiModel
# MultiModel
