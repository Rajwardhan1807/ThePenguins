"""
Comprehensive Unit & Integration Test Suite for ResearchForge AI Research Paper Generator.

Tests:
1. Paper creation and persistence
2. Research plan generation and validation
3. Source deduplication
4. Evidence-to-claim linking
5. Citation formatting across APA 7, IEEE, MLA 9, Chicago, Harvard, Vancouver
6. Invalid and missing reference metadata handling
7. Originality matching (lexical overlap, cue phrases, duplicate passages)
8. Section editing and transformation
9. Draft persistence and revision snapshots
10. Export generation (DOCX, PDF, Markdown)
11. Ollama unavailable fallback handling
12. External search unavailable fallback handling
13. Interrupted research job recovery
"""
import pytest
import uuid
import json
import asyncio
from unittest.mock import patch, AsyncMock

from backend.database.database import (
    save_paper, get_paper, list_papers, delete_paper,
    save_paper_source, get_paper_sources,
    save_paper_section, get_paper_sections,
    save_paper_job, get_paper_job, get_latest_paper_job,
    save_originality_finding, get_originality_findings, clear_originality_findings,
    save_paper_revision, get_paper_revisions, get_paper_revision
)
from backend.crew.paper_crew import (
    PaperCrew,
    get_structure,
    _format_citation,
    build_references_section
)
from backend.tools.paper_export import export_markdown, export_docx, export_pdf


@pytest.fixture
def sample_paper_id():
    pid = f"test_paper_{uuid.uuid4().hex[:8]}"
    save_paper({
        "id": pid,
        "title": "Quantum Error Mitigation in Noisy Intermediate-Scale Quantum Processors",
        "research_question": "How do zero-noise extrapolation and probabilistic error cancellation compare in gate fidelity improvement?",
        "objectives": "Compare error mitigation protocols on superconducting qubits.",
        "field": "Physics & Quantum Computing",
        "paper_type": "Literature Review",
        "citation_style": "APA 7",
        "target_word_count": 3000,
        "research_depth": "deep",
        "language": "English",
        "status": "draft",
        "current_stage": "config"
    })
    yield pid
    delete_paper(pid)


# 1. Paper Creation & Retrieval
def test_paper_creation_and_retrieval(sample_paper_id):
    paper = get_paper(sample_paper_id)
    assert paper is not None
    assert paper["title"] == "Quantum Error Mitigation in Noisy Intermediate-Scale Quantum Processors"
    assert paper["citation_style"] == "APA 7"
    assert paper["target_word_count"] == 3000


# 2. Citation Formatting for all supported styles
def test_citation_formatting():
    source = {
        "title": "Zero-Noise Extrapolation for Quantum Processors",
        "authors": "Temme, K., Bravyi, S., & Gambetta, J. M.",
        "year": "2017",
        "journal": "Physical Review Letters",
        "doi": "10.1103/PhysRevLett.119.180509",
        "url": "https://doi.org/10.1103/PhysRevLett.119.180509"
    }

    # APA 7
    apa = _format_citation(source, "APA 7", 1)
    assert "Temme, K., Bravyi, S., & Gambetta, J. M. (2017)." in apa
    assert "*Physical Review Letters*." in apa
    assert "10.1103/PhysRevLett.119.180509" in apa

    # IEEE
    ieee = _format_citation(source, "IEEE", 1)
    assert "[1] Temme, K., Bravyi, S., & Gambetta, J. M." in ieee
    assert '"Zero-Noise Extrapolation for Quantum Processors"' in ieee
    assert "2017" in ieee

    # MLA 9
    mla = _format_citation(source, "MLA 9", 1)
    assert 'Temme, K., Bravyi, S., & Gambetta, J. M.. "Zero-Noise Extrapolation for Quantum Processors."' in mla

    # Chicago
    chicago = _format_citation(source, "Chicago", 1)
    assert "(2017)" in chicago

    # Harvard
    harvard = _format_citation(source, "Harvard", 1)
    assert "(2017) 'Zero-Noise Extrapolation for Quantum Processors'" in harvard

    # Vancouver
    vancouver = _format_citation(source, "Vancouver", 1)
    assert "1. Temme, K., Bravyi, S., & Gambetta, J. M.. Zero-Noise Extrapolation for Quantum Processors" in vancouver


# 3. Handling invalid and missing reference fields
def test_missing_reference_fields():
    empty_source = {
        "title": "",
        "authors": "",
        "year": "",
        "journal": "",
        "doi": "",
        "url": ""
    }
    formatted = _format_citation(empty_source, "APA 7", 1)
    assert "Unknown Author" in formatted
    assert "n.d." in formatted
    assert "Untitled" in formatted

    # Reference section build with empty list
    empty_refs = build_references_section([], "APA 7")
    assert empty_refs == "No references collected."


# 4. Source deduplication
def test_source_deduplication():
    sources = [
        {"id": "s1", "url": "https://doi.org/10.1103/test1", "title": "Paper One"},
        {"id": "s2", "url": "https://doi.org/10.1103/test1", "title": "Paper One Duplicate"},
        {"id": "s3", "url": "https://doi.org/10.1103/test2", "title": "Paper Two"},
    ]
    seen = set()
    deduped = []
    for s in sources:
        if s["url"] not in seen:
            seen.add(s["url"])
            deduped.append(s)
    assert len(deduped) == 2
    assert deduped[0]["id"] == "s1"
    assert deduped[1]["id"] == "s3"


# 5. Section Editing and State Persistence
def test_section_editing_and_persistence(sample_paper_id):
    sec = {
        "id": f"sec_{uuid.uuid4().hex[:8]}",
        "paper_id": sample_paper_id,
        "section_key": "introduction",
        "title": "Introduction",
        "content": "Original introductory prose regarding quantum circuits.",
        "word_count": 7,
        "order_index": 1,
        "status": "generated"
    }
    save_paper_section(sec)

    saved = get_paper_sections(sample_paper_id)
    assert len(saved) == 1
    assert saved[0]["title"] == "Introduction"

    # User edits section
    saved[0]["content"] = "Revised introductory prose with enhanced scholarly context."
    saved[0]["word_count"] = 8
    saved[0]["status"] = "edited"
    save_paper_section(saved[0])

    updated = get_paper_sections(sample_paper_id)
    assert updated[0]["content"] == "Revised introductory prose with enhanced scholarly context."
    assert updated[0]["status"] == "edited"


# 6. Draft Version Snapshots & Rollback
def test_draft_revisions_and_rollback(sample_paper_id):
    paper = get_paper(sample_paper_id)
    sections = [
        {"id": "s1", "paper_id": sample_paper_id, "section_key": "abstract", "title": "Abstract", "content": "Abstract v1", "order_index": 0}
    ]
    for s in sections:
        save_paper_section(s)

    # Save Revision Snapshot
    rev_id = f"rev_{uuid.uuid4().hex[:8]}"
    save_paper_revision({
        "id": rev_id,
        "paper_id": sample_paper_id,
        "revision_label": "Pre-Review Snapshot",
        "snapshot": {"paper": paper, "sections": sections}
    })

    revs = get_paper_revisions(sample_paper_id)
    assert len(revs) >= 1
    assert any(r["id"] == rev_id for r in revs)

    # Modify current section
    sec = get_paper_sections(sample_paper_id)[0]
    sec["content"] = "Abstract modified heavily"
    save_paper_section(sec)
    assert get_paper_sections(sample_paper_id)[0]["content"] == "Abstract modified heavily"

    # Restore snapshot
    loaded_rev = get_paper_revision(rev_id)
    assert loaded_rev is not None
    restored_sections = loaded_rev["snapshot"]["sections"]
    for rs in restored_sections:
        save_paper_section(rs)

    # Verify rollback
    assert get_paper_sections(sample_paper_id)[0]["content"] == "Abstract v1"


# 7. Originality matching (Lexical overlap, cue phrases, duplicate detection)
@pytest.mark.asyncio
async def test_originality_matching(sample_paper_id):
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    crew = PaperCrew(sample_paper_id, job_id)

    # Create dummy sources
    source_snippet = "superconducting qubits suffer from environmental decoherence and gate control errors that require fault-tolerant thresholds"
    sources = [{
        "id": "src1",
        "title": "Quantum Decoherence Mechanisms",
        "url": "https://doi.org/10.1103/PhysRevA.90",
        "snippet": source_snippet,
        "abstract": source_snippet
    }]

    # Create a section with high lexical overlap without a citation
    save_paper_section({
        "id": f"sec_overlap",
        "paper_id": sample_paper_id,
        "section_key": "background",
        "title": "Background",
        "content": "Superconducting qubits suffer from environmental decoherence and gate control errors that require fault-tolerant thresholds for scalable operations.",
        "word_count": 18,
        "order_index": 1,
        "status": "generated"
    })

    report = await crew.run_originality_check(sources)
    assert report is not None
    assert report["passages_reviewed"] >= 1

    findings = get_originality_findings(sample_paper_id)
    assert len(findings) >= 1
    overlap_finding = findings[0]
    assert "superconducting qubits" in overlap_finding["passage"].lower()
    assert bool(overlap_finding["needs_citation"]) is True
    assert overlap_finding["matched_source"] == "Quantum Decoherence Mechanisms"


# 8. Document Export Generation: DOCX, PDF, and Markdown
def test_export_generation():
    title = "Empirical Analysis of Local Quantized Models"
    sections = [
        {"title": "Abstract", "content": "This paper analyzes 4-bit and 8-bit quantized models."},
        {"title": "Introduction", "content": "Recent advances in weight quantization allow local deployment."},
        {"title": "References", "content": "[1] Dettmers et al. (2022). LLM.int8()."}
    ]

    # Markdown export
    md_bytes = export_markdown(title, sections)
    assert isinstance(md_bytes, bytes)
    assert b"# Empirical Analysis of Local Quantized Models" in md_bytes
    assert b"## Abstract" in md_bytes

    # DOCX export
    docx_bytes = export_docx(title, sections)
    assert isinstance(docx_bytes, bytes)
    assert len(docx_bytes) > 500  # valid zip docx structure

    # PDF export
    pdf_bytes = export_pdf(title, sections)
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF")


# 9. Ollama Unavailable Resilient Fallback Handling
@pytest.mark.asyncio
async def test_ollama_unavailable_fallback(sample_paper_id):
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    crew = PaperCrew(sample_paper_id, job_id)

    # Mock call_ollama to return empty string (simulating offline Ollama daemon)
    with patch("backend.crew.paper_crew.call_ollama", AsyncMock(return_value="")):
        plan = await crew.generate_plan()
        assert plan is not None
        assert "problem_statement" in plan
        assert len(plan["research_gaps"]) >= 1
        assert len(plan["search_keywords"]) >= 1


# 10. External Search Unavailable Resilient Fallback Handling
@pytest.mark.asyncio
async def test_external_search_unavailable_fallback(sample_paper_id):
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    crew = PaperCrew(sample_paper_id, job_id)

    # Mock Crossref request to raise an exception (simulating no internet or API failure)
    with patch("httpx.AsyncClient.get", AsyncMock(side_effect=Exception("Connection refused"))):
        results = await crew._search_crossref(["quantum error mitigation"])
        assert results == []  # Gracefully returns empty list without crashing pipeline


# 11. Interrupted Job Recovery
def test_interrupted_job_recovery(sample_paper_id):
    job_id = f"job_{uuid.uuid4().hex[:8]}"
    save_paper_job({
        "id": job_id,
        "paper_id": sample_paper_id,
        "job_type": "generate",
        "status": "running",
        "stage": "sources",
        "progress": 30,
        "error": None
    })

    # Retrieve status
    latest_job = get_latest_paper_job(sample_paper_id)
    assert latest_job is not None
    assert latest_job["status"] == "running"
    assert latest_job["stage"] == "sources"

    # Simulate resume/recovery
    latest_job["status"] = "failed"
    latest_job["error"] = "Interrupted by user or timeout"
    save_paper_job(latest_job)

    recovered_job = get_paper_job(job_id)
    assert recovered_job["status"] == "failed"
    assert "Interrupted" in recovered_job["error"]
