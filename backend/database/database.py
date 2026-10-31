import sqlite3
import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any

DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "../../data/researchforge.db"))

def get_connection():
    os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        mode TEXT NOT NULL,
        status TEXT NOT NULL,
        confidence REAL DEFAULT 0.0,
        statistics TEXT,
        agents TEXT,
        current_step TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT
    )
    """)
    
    # Sources table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        research_id TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        domain TEXT NOT NULL,
        source_type TEXT NOT NULL,
        publication_date TEXT,
        reliability REAL DEFAULT 0.5,
        relevance REAL DEFAULT 0.8,
        snippet TEXT,
        claims_supported_count INTEGER DEFAULT 0,
        claims_contradicted_count INTEGER DEFAULT 0,
        FOREIGN KEY (research_id) REFERENCES sessions(id)
    )
    """)
    
    # Evidence Snippets table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evidence_snippets (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        research_id TEXT NOT NULL,
        content TEXT NOT NULL,
        relevance REAL DEFAULT 0.8,
        FOREIGN KEY (source_id) REFERENCES sources(id)
    )
    """)
    
    # Claims table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        research_id TEXT NOT NULL,
        claim TEXT NOT NULL,
        status TEXT NOT NULL,
        confidence REAL DEFAULT 0.0,
        supporting_source_ids TEXT,
        contradicting_source_ids TEXT,
        analysis TEXT,
        source_reliability_score REAL DEFAULT 0.0,
        source_agreement_score REAL DEFAULT 0.0,
        evidence_quality_score REAL DEFAULT 0.0,
        recency_score REAL DEFAULT 0.0,
        cross_verification_score REAL DEFAULT 0.0,
        FOREIGN KEY (research_id) REFERENCES sessions(id)
    )
    """)
    
    # Research Reports table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        research_id TEXT NOT NULL,
        title TEXT NOT NULL,
        executive_summary TEXT,
        key_findings TEXT,
        evidence_and_analysis TEXT,
        conflicting_evidence TEXT,
        source_reliability_analysis TEXT,
        limitations TEXT,
        conclusion TEXT,
        full_markdown TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (research_id) REFERENCES sessions(id)
    )
    """)
    
    # Documents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        page_count INTEGER DEFAULT 1,
        processed_status TEXT DEFAULT 'uploaded',
        extracted_text TEXT,
        uploaded_at TEXT NOT NULL
    )
    """)
    
    # Timeline Events table (for real-time persistence)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS timeline_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        research_id TEXT NOT NULL,
        agent TEXT NOT NULL,
        step TEXT NOT NULL,
        detail TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (research_id) REFERENCES sessions(id)
    )
    """)

    # ── Research Paper Studio tables ──────────────────────────────────────
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS papers (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        research_question TEXT,
        objectives TEXT,
        field TEXT,
        paper_type TEXT NOT NULL DEFAULT 'General Academic Paper',
        citation_style TEXT DEFAULT 'APA 7',
        target_word_count INTEGER DEFAULT 5000,
        research_depth TEXT DEFAULT 'deep',
        language TEXT DEFAULT 'English',
        target_audience TEXT,
        abstract TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        current_stage TEXT DEFAULT 'config',
        plan TEXT,
        sections TEXT,
        references_json TEXT,
        originality_report TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS paper_sources (
        id TEXT PRIMARY KEY,
        paper_id TEXT NOT NULL,
        title TEXT NOT NULL,
        authors TEXT,
        year TEXT,
        journal TEXT,
        doi TEXT,
        url TEXT,
        abstract TEXT,
        snippet TEXT,
        source_type TEXT DEFAULT 'Web',
        reliability REAL DEFAULT 0.7,
        relevance REAL DEFAULT 0.8,
        verified INTEGER DEFAULT 0,
        FOREIGN KEY (paper_id) REFERENCES papers(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS paper_sections (
        id TEXT PRIMARY KEY,
        paper_id TEXT NOT NULL,
        section_key TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        word_count INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        updated_at TEXT NOT NULL,
        FOREIGN KEY (paper_id) REFERENCES papers(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS paper_jobs (
        id TEXT PRIMARY KEY,
        paper_id TEXT NOT NULL,
        job_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        stage TEXT,
        progress INTEGER DEFAULT 0,
        error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (paper_id) REFERENCES papers(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS paper_originality (
        id TEXT PRIMARY KEY,
        paper_id TEXT NOT NULL,
        passage TEXT NOT NULL,
        matched_source TEXT,
        matched_url TEXT,
        similarity_note TEXT,
        flag_reason TEXT,
        suggestion TEXT,
        needs_citation INTEGER DEFAULT 0,
        section_key TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (paper_id) REFERENCES papers(id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS paper_revisions (
        id TEXT PRIMARY KEY,
        paper_id TEXT NOT NULL,
        revision_label TEXT,
        snapshot_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (paper_id) REFERENCES papers(id)
    )
    """)
    # ── End paper tables ───────────────────────────────────────────────────

    conn.commit()
    conn.close()

# Session DB Methods
def save_session(session_data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO sessions 
    (id, query, mode, status, confidence, statistics, agents, current_step, error_message, created_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        session_data["id"],
        session_data["query"],
        session_data["mode"],
        session_data["status"],
        session_data.get("confidence", 0.0),
        json.dumps(session_data.get("statistics", {})),
        json.dumps(session_data.get("agents", {})),
        session_data.get("current_step", ""),
        session_data.get("error_message", None),
        session_data.get("created_at") or datetime.utcnow().isoformat(),
        session_data.get("completed_at", None)
    ))
    conn.commit()
    conn.close()

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["statistics"] = json.loads(d["statistics"]) if d["statistics"] else {}
    d["agents"] = json.loads(d["agents"]) if d["agents"] else {}
    return d

def list_sessions(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        d["statistics"] = json.loads(d["statistics"]) if d["statistics"] else {}
        d["agents"] = json.loads(d["agents"]) if d["agents"] else {}
        results.append(d)
    return results

def save_source(source_data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO sources 
    (id, research_id, title, url, domain, source_type, publication_date, reliability, relevance, snippet, claims_supported_count, claims_contradicted_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        source_data["id"],
        source_data["research_id"],
        source_data["title"],
        source_data["url"],
        source_data["domain"],
        source_data.get("source_type", "Other"),
        source_data.get("publication_date", None),
        source_data.get("reliability", 0.5),
        source_data.get("relevance", 0.8),
        source_data.get("snippet", ""),
        source_data.get("claims_supported_count", 0),
        source_data.get("claims_contradicted_count", 0)
    ))
    conn.commit()
    conn.close()

def get_sources_for_session(session_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sources WHERE research_id = ?", (session_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_claim(claim_data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO claims 
    (id, research_id, claim, status, confidence, supporting_source_ids, contradicting_source_ids, analysis,
     source_reliability_score, source_agreement_score, evidence_quality_score, recency_score, cross_verification_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        claim_data["id"],
        claim_data["research_id"],
        claim_data["claim"],
        claim_data["status"],
        claim_data.get("confidence", 0.0),
        json.dumps(claim_data.get("supporting_source_ids", [])),
        json.dumps(claim_data.get("contradicting_source_ids", [])),
        claim_data.get("analysis", ""),
        claim_data.get("source_reliability_score", 0.0),
        claim_data.get("source_agreement_score", 0.0),
        claim_data.get("evidence_quality_score", 0.0),
        claim_data.get("recency_score", 0.0),
        claim_data.get("cross_verification_score", 0.0)
    ))
    conn.commit()
    conn.close()

def get_claims_for_session(session_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sources WHERE research_id = ?", (session_id,))
    sources_by_id = {dict(r)["id"]: dict(r) for r in cursor.fetchall()}

    cursor.execute("SELECT * FROM claims WHERE research_id = ?", (session_id,))
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        d["supporting_source_ids"] = json.loads(d["supporting_source_ids"]) if d["supporting_source_ids"] else []
        d["contradicting_source_ids"] = json.loads(d["contradicting_source_ids"]) if d["contradicting_source_ids"] else []
        d["supporting_sources"] = [sources_by_id[sid] for sid in d["supporting_source_ids"] if sid in sources_by_id]
        d["contradicting_sources"] = [sources_by_id[sid] for sid in d["contradicting_source_ids"] if sid in sources_by_id]
        results.append(d)
    return results

def save_report(report_data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO reports 
    (id, research_id, title, executive_summary, key_findings, evidence_and_analysis, conflicting_evidence, source_reliability_analysis, limitations, conclusion, full_markdown, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        report_data["id"],
        report_data["research_id"],
        report_data["title"],
        report_data.get("executive_summary", ""),
        json.dumps(report_data.get("key_findings", [])),
        report_data.get("evidence_and_analysis", ""),
        report_data.get("conflicting_evidence", ""),
        report_data.get("source_reliability_analysis", ""),
        report_data.get("limitations", ""),
        report_data.get("conclusion", ""),
        report_data.get("full_markdown", ""),
        report_data.get("created_at", datetime.utcnow().isoformat())
    ))
    conn.commit()
    conn.close()

def get_report_for_session(session_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports WHERE research_id = ?", (session_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["key_findings"] = json.loads(d["key_findings"]) if d["key_findings"] else []
    return d

def save_timeline_event(research_id: str, agent: str, step: str, detail: str = ""):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO timeline_events (research_id, agent, step, detail, timestamp)
    VALUES (?, ?, ?, ?, ?)
    """, (research_id, agent, step, detail, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()

def get_timeline_events(research_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM timeline_events WHERE research_id = ? ORDER BY id ASC", (research_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_document(doc_data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO documents (id, filename, file_path, file_size, page_count, processed_status, extracted_text, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc_data["id"],
        doc_data["filename"],
        doc_data["file_path"],
        doc_data.get("file_size", 0),
        doc_data.get("page_count", 1),
        doc_data.get("processed_status", "uploaded"),
        doc_data.get("extracted_text", ""),
        doc_data.get("uploaded_at", datetime.utcnow().isoformat())
    ))
    conn.commit()
    conn.close()

def get_document(doc_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# Initialize on import
init_db()

# ── Research Paper Studio CRUD ─────────────────────────────────────────────

def save_paper(paper: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
    INSERT OR REPLACE INTO papers
    (id, title, research_question, objectives, field, paper_type, citation_style,
     target_word_count, research_depth, language, target_audience, abstract,
     status, current_stage, plan, sections, references_json, originality_report,
     created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        paper["id"], paper.get("title", "Untitled"),
        paper.get("research_question"), paper.get("objectives"),
        paper.get("field"), paper.get("paper_type", "General Academic Paper"),
        paper.get("citation_style", "APA 7"), paper.get("target_word_count", 5000),
        paper.get("research_depth", "deep"), paper.get("language", "English"),
        paper.get("target_audience"), paper.get("abstract"),
        paper.get("status", "draft"), paper.get("current_stage", "config"),
        json.dumps(paper.get("plan")) if paper.get("plan") else None,
        json.dumps(paper.get("sections")) if paper.get("sections") else None,
        json.dumps(paper.get("references_json")) if paper.get("references_json") else None,
        json.dumps(paper.get("originality_report")) if paper.get("originality_report") else None,
        paper.get("created_at", now), now
    ))
    conn.commit()
    conn.close()

def get_paper(paper_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM papers WHERE id = ?", (paper_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    for field in ["plan", "sections", "references_json", "originality_report"]:
        if d.get(field):
            try:
                d[field] = json.loads(d[field])
            except Exception:
                pass
    return d

def list_papers(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM papers ORDER BY updated_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        d = dict(r)
        for field in ["plan", "sections", "references_json", "originality_report"]:
            if d.get(field):
                try:
                    d[field] = json.loads(d[field])
                except Exception:
                    pass
        results.append(d)
    return results

def delete_paper(paper_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    for tbl in ["paper_originality", "paper_jobs", "paper_sections", "paper_sources"]:
        cursor.execute(f"DELETE FROM {tbl} WHERE paper_id = ?", (paper_id,))
    cursor.execute("DELETE FROM papers WHERE id = ?", (paper_id,))
    conn.commit()
    conn.close()

def save_paper_source(src: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO paper_sources
    (id, paper_id, title, authors, year, journal, doi, url, abstract, snippet,
     source_type, reliability, relevance, verified)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (
        src["id"], src["paper_id"], src.get("title", ""),
        src.get("authors", ""), src.get("year", ""),
        src.get("journal", ""), src.get("doi", ""),
        src.get("url", ""), src.get("abstract", ""),
        src.get("snippet", ""), src.get("source_type", "Web"),
        src.get("reliability", 0.7), src.get("relevance", 0.8),
        1 if src.get("verified") else 0
    ))
    conn.commit()
    conn.close()

def get_paper_sources(paper_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM paper_sources WHERE paper_id = ?", (paper_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_paper_section(sec: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
    INSERT OR REPLACE INTO paper_sections
    (id, paper_id, section_key, title, content, word_count, order_index, status, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?)
    """, (
        sec["id"], sec["paper_id"], sec["section_key"], sec.get("title", ""),
        sec.get("content", ""), sec.get("word_count", 0),
        sec.get("order_index", 0), sec.get("status", "pending"), now
    ))
    conn.commit()
    conn.close()

def get_paper_sections(paper_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM paper_sections WHERE paper_id = ? ORDER BY order_index ASC", (paper_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_paper_job(job: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
    INSERT OR REPLACE INTO paper_jobs
    (id, paper_id, job_type, status, stage, progress, error, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?)
    """, (
        job["id"], job["paper_id"], job.get("job_type", "generate"),
        job.get("status", "pending"), job.get("stage", ""),
        job.get("progress", 0), job.get("error"),
        job.get("created_at", now), now
    ))
    conn.commit()
    conn.close()

def get_paper_job(job_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM paper_jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_latest_paper_job(paper_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM paper_jobs WHERE paper_id = ? ORDER BY created_at DESC LIMIT 1", (paper_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def save_originality_finding(finding: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
    INSERT OR REPLACE INTO paper_originality
    (id, paper_id, passage, matched_source, matched_url, similarity_note,
     flag_reason, suggestion, needs_citation, section_key, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
    """, (
        finding["id"], finding["paper_id"], finding.get("passage", ""),
        finding.get("matched_source", ""), finding.get("matched_url", ""),
        finding.get("similarity_note", ""), finding.get("flag_reason", ""),
        finding.get("suggestion", ""),
        1 if finding.get("needs_citation") else 0,
        finding.get("section_key", ""), now
    ))
    conn.commit()
    conn.close()

def get_originality_findings(paper_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM paper_originality WHERE paper_id = ? ORDER BY created_at ASC", (paper_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def clear_originality_findings(paper_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM paper_originality WHERE paper_id = ?", (paper_id,))
    conn.commit()
    conn.close()

def save_paper_revision(rev: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
    INSERT INTO paper_revisions (id, paper_id, revision_label, snapshot_json, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (
        rev.get("id") or f"rev_{uuid.uuid4().hex[:8]}",
        rev["paper_id"],
        rev.get("revision_label", "Manual Save"),
        json.dumps(rev.get("snapshot", {})),
        rev.get("created_at", now)
    ))
    conn.commit()
    conn.close()

def get_paper_revisions(paper_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, paper_id, revision_label, created_at FROM paper_revisions WHERE paper_id = ? ORDER BY created_at DESC", (paper_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_paper_revision(revision_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM paper_revisions WHERE id = ?", (revision_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if d.get("snapshot_json"):
        try:
            d["snapshot"] = json.loads(d["snapshot_json"])
        except Exception:
            pass
    return d
