import os
import uuid
import json
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, BackgroundTasks, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from backend.models.schemas import (
    StartResearchRequest,
    StartResearchResponse,
    ResearchSessionSchema,
    DocumentUploadResponse,
)
from backend.database.database import (
    save_session, get_session, list_sessions,
    get_sources_for_session, get_claims_for_session,
    get_report_for_session, get_timeline_events,
    save_document, get_document,
    # Paper Studio
    save_paper, get_paper, list_papers, delete_paper,
    save_paper_source, get_paper_sources,
    save_paper_section, get_paper_sections,
    save_paper_job, get_paper_job, get_latest_paper_job,
    get_originality_findings, clear_originality_findings,
    save_paper_source,
    save_paper_revision, get_paper_revisions, get_paper_revision,
)
from backend.crew.research_crew import (
    ResearchCrew,
    register_subscriber,
    unregister_subscriber,
)
from backend.crew.paper_crew import PaperCrew, get_structure, build_references_section
from backend.tools.llm import check_ollama_health, call_ollama
from backend.tools.search import DDGS
from backend.tools.documents import extract_text_from_file
from backend.tools.paper_export import export_markdown, export_docx, export_pdf

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

# ═══════════════════════════════════════════════════════════════════════════
# Research Paper Studio API
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/papers")
async def create_paper(data: Dict[str, Any]):
    """Create a new research paper record."""
    paper_id = f"paper_{uuid.uuid4().hex[:10]}"
    now = datetime.utcnow().isoformat()
    paper = {
        "id": paper_id,
        "title": data.get("title", "Untitled Paper"),
        "research_question": data.get("research_question", ""),
        "objectives": data.get("objectives", ""),
        "field": data.get("field", ""),
        "paper_type": data.get("paper_type", "General Academic Paper"),
        "citation_style": data.get("citation_style", "APA 7"),
        "target_word_count": int(data.get("target_word_count", 5000)),
        "research_depth": data.get("research_depth", "deep"),
        "language": data.get("language", "English"),
        "target_audience": data.get("target_audience", ""),
        "abstract": data.get("abstract", ""),
        "status": "draft",
        "current_stage": "config",
        "created_at": now,
        "updated_at": now,
    }
    save_paper(paper)
    return paper

@app.get("/api/papers")
async def get_papers():
    """List all research papers."""
    papers = list_papers()
    return {"papers": papers, "count": len(papers)}

@app.get("/api/papers/{paper_id}")
async def get_paper_detail(paper_id: str):
    """Get a single paper with all metadata."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper

@app.patch("/api/papers/{paper_id}")
async def update_paper(paper_id: str, data: Dict[str, Any]):
    """Update paper metadata."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    allowed = ["title","research_question","objectives","field","paper_type",
               "citation_style","target_word_count","research_depth","language",
               "target_audience","abstract","status"]
    for k, v in data.items():
        if k in allowed:
            paper[k] = v
    save_paper(paper)
    return paper

@app.delete("/api/papers/{paper_id}")
async def remove_paper(paper_id: str):
    """Delete a paper and all its data."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    delete_paper(paper_id)
    return {"deleted": True}

@app.post("/api/papers/{paper_id}/plan")
async def generate_paper_plan(paper_id: str, background_tasks: BackgroundTasks):
    """Generate the research plan for a paper."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    save_paper_job({"id": job_id, "paper_id": paper_id, "job_type": "plan",
                    "status": "pending", "stage": "plan", "progress": 0})
    crew = PaperCrew(paper_id, job_id)
    background_tasks.add_task(crew.generate_plan)
    return {"job_id": job_id, "status": "started"}

@app.post("/api/papers/{paper_id}/sources")
async def collect_paper_sources(paper_id: str, background_tasks: BackgroundTasks):
    """Trigger source collection for a paper."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    save_paper_job({"id": job_id, "paper_id": paper_id, "job_type": "sources",
                    "status": "pending", "stage": "sources", "progress": 0})
    crew = PaperCrew(paper_id, job_id)
    background_tasks.add_task(crew.collect_sources)
    return {"job_id": job_id, "status": "started"}

@app.post("/api/papers/{paper_id}/generate")
async def generate_paper(paper_id: str, background_tasks: BackgroundTasks):
    """Trigger the full paper generation pipeline."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    save_paper_job({"id": job_id, "paper_id": paper_id, "job_type": "generate",
                    "status": "pending", "stage": "init", "progress": 0})
    crew = PaperCrew(paper_id, job_id)
    background_tasks.add_task(crew.run_full_pipeline)
    return {"job_id": job_id, "status": "started"}

@app.get("/api/papers/{paper_id}/status")
async def get_paper_status(paper_id: str):
    """Get paper generation job status."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    job = get_latest_paper_job(paper_id)
    sections = get_paper_sections(paper_id)
    total_words = sum(s.get("word_count", 0) for s in sections)
    return {
        "paper_id": paper_id,
        "paper_status": paper.get("status", "draft"),
        "current_stage": paper.get("current_stage", "config"),
        "job": job,
        "sections_count": len(sections),
        "total_words": total_words,
    }

@app.get("/api/papers/{paper_id}/evidence")
async def get_paper_evidence(paper_id: str):
    """Get all sources and originality findings for a paper."""
    sources = get_paper_sources(paper_id)
    findings = get_originality_findings(paper_id)
    return {"sources": sources, "originality_findings": findings}

@app.post("/api/papers/{paper_id}/verify")
async def verify_paper_sources(paper_id: str, background_tasks: BackgroundTasks):
    """Re-run evidence verification for a paper."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    save_paper_job({"id": job_id, "paper_id": paper_id, "job_type": "verify",
                    "status": "pending", "stage": "evidence", "progress": 0})
    async def _run():
        crew = PaperCrew(paper_id, job_id)
        sources = get_paper_sources(paper_id)
        await crew.verify_evidence(sources)
    background_tasks.add_task(_run)
    return {"job_id": job_id, "status": "started"}

@app.post("/api/papers/{paper_id}/originality-check")
async def run_paper_originality(paper_id: str, background_tasks: BackgroundTasks):
    """Run originality and citation check for a paper."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    save_paper_job({"id": job_id, "paper_id": paper_id, "job_type": "originality",
                    "status": "pending", "stage": "originality", "progress": 0})
    async def _run():
        crew = PaperCrew(paper_id, job_id)
        sources = get_paper_sources(paper_id)
        await crew.run_originality_check(sources)
    background_tasks.add_task(_run)
    return {"job_id": job_id, "status": "started"}

@app.patch("/api/papers/{paper_id}/sections/{section_id}")
async def update_paper_section(paper_id: str, section_id: str, data: Dict[str, Any]):
    """Update a specific section's content."""
    sections = get_paper_sections(paper_id)
    sec = next((s for s in sections if s["id"] == section_id), None)
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")
    if "content" in data:
        sec["content"] = data["content"]
        sec["word_count"] = len(data["content"].split())
        sec["status"] = "edited"
    save_paper_section(sec)
    return sec

@app.post("/api/papers/{paper_id}/sections/{section_key}/regenerate")
async def regenerate_section(paper_id: str, section_key: str, background_tasks: BackgroundTasks):
    """Regenerate a single section via LLM (non-blocking)."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    async def _regen():
        sources = get_paper_sources(paper_id)
        paper_type = paper.get("paper_type", "General Academic Paper")
        plan_json = json.dumps(paper.get("plan") or {})[:600]
        source_snippets = "\n".join(
            f"[{i+1}] {s.get('title','')} ({s.get('year','')}): {(s.get('snippet','') or '')[:200]}"
            for i, s in enumerate(sources[:12])
        )
        structure = get_structure(paper_type)
        sec_def = next((s for s in structure if s["key"] == section_key), None)
        title = sec_def["title"] if sec_def else section_key

        system = (
            "You are an expert academic writer. Rewrite this section with improved clarity. "
            "Do NOT invent facts. Cite as [1], [2] etc."
        )
        prompt = (
            f"Paper Type: {paper_type}\nPaper Title: {paper.get('title','')}\n"
            f"Research Question: {paper.get('research_question','')}\nPlan: {plan_json}\n\n"
            f"Sources:\n{source_snippets}\n\nRewrite the **{title}** section:"
        )
        content = await call_ollama(prompt, system=system, temperature=0.3, timeout=120.0)
        if content and len(content.strip()) > 80:
            sections = get_paper_sections(paper_id)
            for sec in sections:
                if sec["section_key"] == section_key:
                    sec["content"] = content
                    sec["word_count"] = len(content.split())
                    sec["status"] = "regenerated"
                    save_paper_section(sec)
                    break

    background_tasks.add_task(_regen)
    return {"status": "regenerating"}

@app.post("/api/papers/{paper_id}/sections/{section_key}/transform")
async def transform_section(paper_id: str, section_key: str, data: Dict[str, Any]):
    """Transform section: improve clarity, expand, or shorten (synchronous LLM call)."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    action = data.get("action", "clarity")  # clarity, expand, shorten
    sections = get_paper_sections(paper_id)
    sec = next((s for s in sections if s["section_key"] == section_key), None)
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")

    content = sec.get("content", "")
    action_instructions = {
        "clarity": "Rewrite this academic section for maximum clarity, logical flow, academic rigor, and precision while preserving all citations and facts.",
        "expand": "Expand this academic section with deeper theoretical context, analytical explanation, and comprehensive synthesis while keeping all existing citations.",
        "shorten": "Condense this academic section to be more succinct, impactful, and direct while retaining all critical arguments, findings, and citations.",
    }
    instruction = action_instructions.get(action, action_instructions["clarity"])
    prompt = f"{instruction}\n\nExisting Section Content:\n{content}\n\nRewritten Section (scholarly prose only, no intro or chatter):"
    new_content = await call_ollama(prompt, system="You are an expert academic editor.", temperature=0.25, timeout=120.0)

    if new_content and len(new_content.strip()) > 50:
        sec["content"] = new_content.strip()
        sec["word_count"] = len(sec["content"].split())
        sec["status"] = f"edited_{action}"
        save_paper_section(sec)
        return sec
    return sec

@app.post("/api/papers/{paper_id}/sources/add")
async def add_source(paper_id: str, data: Dict[str, Any]):
    """Add a manual or uploaded source to the paper."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    src = {
        "id": f"psrc_{uuid.uuid4().hex[:8]}",
        "paper_id": paper_id,
        "title": data.get("title", "Untitled Source"),
        "authors": data.get("authors", ""),
        "year": str(data.get("year", "")),
        "journal": data.get("journal", ""),
        "doi": data.get("doi", ""),
        "url": data.get("url", ""),
        "abstract": data.get("abstract", ""),
        "snippet": data.get("snippet", data.get("abstract", ""))[:400],
        "source_type": data.get("source_type", "Manual Entry"),
        "reliability": float(data.get("reliability", 0.8)),
        "relevance": float(data.get("relevance", 0.9)),
        "verified": bool(data.get("verified", False)),
    }
    save_paper_source(src)
    return src

@app.patch("/api/papers/{paper_id}/citation-style")
async def change_citation_style(paper_id: str, data: Dict[str, Any]):
    """Update citation style and immediately regenerate References section without affecting body text."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    new_style = data.get("citation_style", "APA 7")
    paper["citation_style"] = new_style
    save_paper(paper)

    sources = get_paper_sources(paper_id)
    ref_content = build_references_section(sources, new_style)
    sections = get_paper_sections(paper_id)
    for sec in sections:
        if sec["section_key"] == "references":
            sec["content"] = ref_content
            sec["word_count"] = len(ref_content.split())
            sec["status"] = "regenerated"
            save_paper_section(sec)
            break
    return {"citation_style": new_style, "references": ref_content}

@app.post("/api/papers/{paper_id}/revisions")
async def create_revision(paper_id: str, data: Dict[str, Any]):
    """Save a snapshot revision of the current paper and sections."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    sections = get_paper_sections(paper_id)
    label = data.get("revision_label", f"Revision at {datetime.utcnow().strftime('%H:%M:%S')}")
    rev_id = f"rev_{uuid.uuid4().hex[:8]}"
    save_paper_revision({
        "id": rev_id,
        "paper_id": paper_id,
        "revision_label": label,
        "snapshot": {"paper": paper, "sections": sections},
        "created_at": datetime.utcnow().isoformat(),
    })
    return {"id": rev_id, "label": label, "created_at": datetime.utcnow().isoformat()}

@app.get("/api/papers/{paper_id}/revisions")
async def list_revisions(paper_id: str):
    """List all saved draft revisions for a paper."""
    return get_paper_revisions(paper_id)

@app.post("/api/papers/{paper_id}/revisions/{revision_id}/restore")
async def restore_revision(paper_id: str, revision_id: str):
    """Restore a previous revision snapshot."""
    rev = get_paper_revision(revision_id)
    if not rev or rev.get("paper_id") != paper_id:
        raise HTTPException(status_code=404, detail="Revision not found")
    snapshot = rev.get("snapshot", {})
    saved_sections = snapshot.get("sections", [])
    for sec in saved_sections:
        save_paper_section(sec)
    return {"status": "restored", "revision_id": revision_id}

@app.get("/api/papers/{paper_id}/sections")
async def get_sections(paper_id: str):
    """Get all sections for a paper."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    sections = get_paper_sections(paper_id)
    return {"sections": sections, "count": len(sections)}

@app.get("/api/papers/{paper_id}/references")
async def get_references(paper_id: str):
    """Get formatted references for the paper."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    sources = get_paper_sources(paper_id)
    style = paper.get("citation_style", "APA 7")
    formatted = build_references_section(sources, style)
    return {"style": style, "references": formatted, "count": len(sources)}

@app.post("/api/papers/{paper_id}/export")
async def export_paper(paper_id: str, data: Dict[str, Any]):
    """Export the paper in DOCX, PDF, or Markdown format."""
    paper = get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    sections = get_paper_sections(paper_id)
    if not sections:
        raise HTTPException(status_code=400, detail="No sections to export")

    fmt = (data.get("format") or "markdown").lower()
    title = paper.get("title", "Research Paper")
    safe_title = "".join(c if c.isalnum() or c in " -_" else "_" for c in title)[:60]

    if fmt == "docx":
        content = export_docx(title, sections)
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.docx"'}
        )
    elif fmt == "pdf":
        content = export_pdf(title, sections)
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.pdf"'}
        )
    else:
        content = export_markdown(title, sections)
        return Response(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.md"'}
        )
