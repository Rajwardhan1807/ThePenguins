import os
import uuid
import json
import asyncio
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, BackgroundTasks, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from backend.models.schemas import (
    StartResearchRequest,
    StartResearchResponse,
    ResearchSessionSchema,
    DocumentUploadResponse,
)
from backend.database.database import (
    save_session,
    get_session,
    list_sessions,
    get_sources_for_session,
    get_claims_for_session,
    get_report_for_session,
    get_timeline_events,
    save_document,
    get_document,
)
from backend.crew.research_crew import (
    ResearchCrew,
    register_subscriber,
    unregister_subscriber,
)
from backend.tools.llm import check_ollama_health
from backend.tools.search import DDGS
from backend.tools.documents import extract_text_from_file

app = FastAPI(
    title="ResearchForge API",
    description="Local Multi-Agent Research Assistant Backend",
    version="1.0.0"
)

# Enable CORS for local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOCUMENTS_DIR = os.path.join(os.path.dirname(__file__), "../data/documents")
os.makedirs(DOCUMENTS_DIR, exist_ok=True)

@app.get("/api/health")
async def health_check():
    """Health check endpoint evaluating Backend, Ollama, Database, and Search service."""
    ollama_status = await check_ollama_health()
    search_ready = DDGS is not None
    
    return {
        "status": "healthy" if ollama_status["connected"] else "degraded",
        "backend": "online",
        "database": "sqlite_ready",
        "search_service": "duckduckgo_ready" if search_ready else "unavailable",
        "ollama": ollama_status,
        "cost": "₹0"
    }

@app.post("/api/research", response_model=StartResearchResponse)
async def start_research(request: StartResearchRequest, background_tasks: BackgroundTasks):
    """Starts a new asynchronous research session."""
    research_id = f"research_{uuid.uuid4().hex[:8]}"
    
    session_data = {
        "id": research_id,
        "query": request.query.strip(),
        "mode": request.mode.value,
        "status": "started",
        "confidence": 0.0,
        "statistics": {
            "sources_discovered": 0,
            "sources_relevant": 0,
            "claims_identified": 0,
            "claims_verified": 0,
            "conflicts_detected": 0,
            "overall_confidence": 0.0
        },
        "agents": {
            "researcher": "waiting",
            "fact_checker": "waiting",
            "writer": "waiting"
        },
        "current_step": "Initializing agents",
        "error_message": None,
        "created_at": datetime.utcnow().isoformat(),
        "completed_at": None
    }
    save_session(session_data)

    crew = ResearchCrew(research_id)
    background_tasks.add_task(
        crew.execute_pipeline,
        query=request.query,
        mode=request.mode.value,
        document_ids=request.document_ids
    )

    return StartResearchResponse(research_id=research_id, status="started")

@app.get("/api/research/{research_id}")
async def get_research_session(research_id: str):
    """Returns research session information including statistics and status."""
    session = get_session(research_id)
    if not session:
        raise HTTPException(status_code=404, detail="Research session not found")
    return session

@app.get("/api/research/{research_id}/status")
async def get_research_status(research_id: str):
    """Returns the agent progression status."""
    session = get_session(research_id)
    if not session:
        raise HTTPException(status_code=404, detail="Research session not found")
    return {
        "research_id": session["id"],
        "overall_status": session["status"],
        "current_step": session.get("current_step", ""),
        "agents": session["agents"],
        "statistics": session["statistics"],
        "confidence": session.get("confidence", 0.0)
    }

@app.get("/api/research/{research_id}/sources")
async def get_research_sources(research_id: str):
    """Returns all sources collected for the research session."""
    sources = get_sources_for_session(research_id)
    return {"research_id": research_id, "count": len(sources), "sources": sources}

@app.get("/api/research/{research_id}/claims")
async def get_research_claims(research_id: str):
    """Returns all verified claims and detected conflicts."""
    claims = get_claims_for_session(research_id)
    return {"research_id": research_id, "count": len(claims), "claims": claims}

@app.get("/api/research/{research_id}/report")
async def get_research_report(research_id: str):
    """Returns the completed research report."""
    report = get_report_for_session(research_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not yet generated or session failed")
    return report

@app.get("/api/research/{research_id}/timeline")
async def get_research_timeline(research_id: str):
    """Returns persisted timeline events for this research session."""
    events = get_timeline_events(research_id)
    return {"research_id": research_id, "events": events}

@app.get("/api/research/{research_id}/stream")
async def stream_research_events(research_id: str):
    """Server-Sent Events (SSE) endpoint providing live agent updates and telemetry."""
    async def event_generator():
        queue = register_subscriber(research_id)
        try:
            # Yield existing timeline history first
            existing = get_timeline_events(research_id)
            for ev in existing:
                yield f"data: {json.dumps({'type': 'agent_progress', 'agent': ev['agent'], 'step': ev['step'], 'detail': ev.get('detail', ''), 'timestamp': ev['timestamp']})}\n\n"

            while True:
                try:
                    event_data = await asyncio.wait_for(queue.get(), timeout=25.0)
                    yield f"data: {json.dumps(event_data)}\n\n"
                    if event_data.get("type") in ["completed", "error"]:
                        break
                except asyncio.TimeoutError:
                    # Heartbeat comment to keep HTTP connection alive
                    yield ": heartbeat\n\n"
        finally:
            unregister_subscriber(research_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.post("/api/documents", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Uploads a PDF, DOCX, or TXT file for Document Research Mode."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".docx", ".txt", ".md"]:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, TXT, and MD files are supported.")

    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    save_path = os.path.join(DOCUMENTS_DIR, f"{doc_id}_{file.filename}")

    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)

    # Extract text and page count
    extracted = extract_text_from_file(save_path)

    doc_record = {
        "id": doc_id,
        "filename": file.filename,
        "file_path": save_path,
        "file_size": len(contents),
        "page_count": extracted.get("page_count", 1),
        "processed_status": "ready",
        "extracted_text": extracted.get("text", "")[:5000],
    }
    save_document(doc_record)

    return DocumentUploadResponse(
        id=doc_id,
        filename=file.filename,
        pages=extracted.get("page_count", 1),
        status="ready",
        message=f"Successfully processed {file.filename} ({extracted.get('page_count', 1)} pages)"
    )

@app.get("/api/history")
async def get_history():
    """Lists research sessions from history."""
    sessions = list_sessions(limit=30)
    return {"sessions": sessions}
