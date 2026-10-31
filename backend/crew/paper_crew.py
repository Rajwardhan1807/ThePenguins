"""
Research Paper Studio — Paper Generation Pipeline Crew.
"""
import asyncio, json, uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.agents.researcher import ResearchAgent
from backend.agents.fact_checker import FactCheckAgent
from backend.tools.llm import call_ollama, parse_json_from_llm
from backend.database.database import (
    get_paper, save_paper,
    save_paper_source, get_paper_sources,
    save_paper_section, get_paper_sections,
    save_paper_job,
    save_originality_finding, clear_originality_findings,
)

PAPER_STRUCTURES: Dict[str, List[Dict[str, Any]]] = {
    "Literature Review": [
        {"key": "abstract", "title": "Abstract"},
        {"key": "keywords", "title": "Keywords"},
        {"key": "introduction", "title": "Introduction"},
        {"key": "background", "title": "Background"},
        {"key": "literature_review", "title": "Literature Review"},
        {"key": "thematic_analysis", "title": "Thematic Analysis"},
        {"key": "gaps", "title": "Identified Research Gaps"},
        {"key": "discussion", "title": "Discussion"},
        {"key": "limitations", "title": "Limitations"},
        {"key": "conclusion", "title": "Conclusion"},
        {"key": "references", "title": "References"},
    ],
    "Systematic Literature Review": [
        {"key": "abstract", "title": "Abstract"},
        {"key": "keywords", "title": "Keywords"},
        {"key": "introduction", "title": "Introduction"},
        {"key": "methodology", "title": "Methodology (PRISMA)"},
        {"key": "inclusion_criteria", "title": "Inclusion and Exclusion Criteria"},
        {"key": "literature_review", "title": "Literature Review"},
        {"key": "findings", "title": "Findings"},
        {"key": "quality_assessment", "title": "Quality Assessment"},
        {"key": "discussion", "title": "Discussion"},
        {"key": "limitations", "title": "Limitations"},
        {"key": "conclusion", "title": "Conclusion"},
        {"key": "references", "title": "References"},
    ],
    "Survey Paper": [
        {"key": "abstract", "title": "Abstract"},
        {"key": "keywords", "title": "Keywords"},
        {"key": "introduction", "title": "Introduction"},
        {"key": "scope", "title": "Scope and Organization"},
        {"key": "background", "title": "Background"},
        {"key": "survey_body", "title": "Survey of Existing Work"},
        {"key": "comparison", "title": "Comparative Analysis"},
        {"key": "open_problems", "title": "Open Problems and Future Directions"},
        {"key": "conclusion", "title": "Conclusion"},
        {"key": "references", "title": "References"},
    ],
    "Comparative Study": [
        {"key": "abstract", "title": "Abstract"},
        {"key": "keywords", "title": "Keywords"},
        {"key": "introduction", "title": "Introduction"},
        {"key": "background", "title": "Background"},
        {"key": "methodology", "title": "Methodology"},
        {"key": "comparison", "title": "Comparative Analysis"},
        {"key": "results", "title": "Results"},
        {"key": "discussion", "title": "Discussion"},
        {"key": "limitations", "title": "Limitations"},
        {"key": "conclusion", "title": "Conclusion"},
        {"key": "references", "title": "References"},
    ],
    "Technical Research Paper": [
        {"key": "abstract", "title": "Abstract"},
        {"key": "keywords", "title": "Keywords"},
        {"key": "introduction", "title": "Introduction"},
        {"key": "background", "title": "Background and Related Work"},
        {"key": "problem_statement", "title": "Problem Statement"},
        {"key": "methodology", "title": "Methodology"},
        {"key": "results", "title": "Results [PENDING USER DATA]"},
        {"key": "discussion", "title": "Discussion"},
        {"key": "limitations", "title": "Limitations"},
        {"key": "future_work", "title": "Future Work"},
        {"key": "conclusion", "title": "Conclusion"},
        {"key": "references", "title": "References"},
    ],
    "Research Proposal": [
        {"key": "abstract", "title": "Abstract"},
        {"key": "introduction", "title": "Introduction"},
        {"key": "problem_statement", "title": "Problem Statement and Research Gap"},
        {"key": "objectives", "title": "Research Questions and Objectives"},
        {"key": "methodology", "title": "Proposed Methodology"},
        {"key": "timeline", "title": "Timeline and Milestones [PENDING]"},
        {"key": "expected_outcomes", "title": "Expected Outcomes and Significance"},
        {"key": "limitations", "title": "Anticipated Limitations"},
        {"key": "references", "title": "References"},
    ],
    "General Academic Paper": [
        {"key": "abstract", "title": "Abstract"},
        {"key": "keywords", "title": "Keywords"},
        {"key": "introduction", "title": "Introduction"},
        {"key": "background", "title": "Background and Related Work"},
        {"key": "literature_review", "title": "Literature Review"},
        {"key": "problem_statement", "title": "Problem Statement and Research Gap"},
        {"key": "methodology", "title": "Methodology"},
        {"key": "results", "title": "Results and Evidence Synthesis"},
        {"key": "discussion", "title": "Discussion"},
        {"key": "limitations", "title": "Limitations"},
        {"key": "future_work", "title": "Future Work"},
        {"key": "conclusion", "title": "Conclusion"},
        {"key": "references", "title": "References"},
    ],
}


def get_structure(paper_type: str) -> List[Dict[str, Any]]:
    return PAPER_STRUCTURES.get(paper_type, PAPER_STRUCTURES["General Academic Paper"])


def _format_citation(src: Dict[str, Any], style: str, idx: int) -> str:
    authors = src.get("authors", "Unknown Author") or "Unknown Author"
    year = src.get("year", "n.d.") or "n.d."
    title = src.get("title", "Untitled") or "Untitled"
    journal = src.get("journal", "") or ""
    doi = src.get("doi", "") or ""
    url = src.get("url", "") or ""
    doi_str = f"https://doi.org/{doi}" if doi else url

    if style == "APA 7":
        j = f" *{journal}*." if journal else ""
        return f"{authors} ({year}). {title}.{j} {doi_str}"
    elif style == "IEEE":
        j = f" in *{journal}*," if journal else ","
        return f'[{idx}] {authors}, "{title}",{j} {year}. {doi_str}'
    elif style == "MLA 9":
        j = f" *{journal}*," if journal else ""
        return f'{authors}. "{title}." {j} {year}, {doi_str}.'
    elif style == "Chicago":
        j = f" *{journal}*" if journal else ""
        return f'{authors}. "{title}."{j} ({year}). {doi_str}.'
    elif style == "Harvard":
        j = f", *{journal}*" if journal else ""
        return f"{authors} ({year}) '{title}'{j}. Available at: {doi_str}."
    elif style == "Vancouver":
        j = f". {journal}" if journal else ""
        return f"{idx}. {authors}. {title}{j}. {year}. {doi_str}"
    return f"{authors} ({year}). {title}. {doi_str}"


def build_references_section(sources: List[Dict[str, Any]], style: str) -> str:
    if not sources:
        return "No references collected."
    return "\n\n".join(_format_citation(s, style, i + 1) for i, s in enumerate(sources))


class PaperCrew:
    def __init__(self, paper_id: str, job_id: str):
        self.paper_id = paper_id
        self.job_id = job_id

    def _update_job(self, status: str, stage: str, progress: int, error: Optional[str] = None):
        save_paper_job({
            "id": self.job_id,
            "paper_id": self.paper_id,
            "job_type": "generate",
            "status": status,
            "stage": stage,
            "progress": progress,
            "error": error,
        })

    async def generate_plan(self) -> Dict[str, Any]:
        paper = get_paper(self.paper_id)
        if not paper:
            raise ValueError(f"Paper {self.paper_id} not found")
        self._update_job("running", "plan", 10)
        title = paper.get("title", "")
        rq = paper.get("research_question", "")
        obj = paper.get("objectives", "")
        field = paper.get("field", "")
        paper_type = paper.get("paper_type", "General Academic Paper")

        system = (
            "You are a senior academic research strategist. "
            "Generate a structured JSON research plan with keys: "
            "problem_statement, research_gaps (list of candidate gaps supported by literature, not established facts), "
            "research_questions (list), objectives (list), search_keywords (list), "
            "methodology_approach (string), outline (list of section names), "
            "evidence_needed (list), expected_limitations (list). Be concise."
        )
        prompt = (
            f"Paper Type: {paper_type}\nTitle: {title}\n"
            f"Research Question: {rq}\nObjectives: {obj}\nField: {field}\n"
            "Generate research plan JSON:"
        )
        raw = await call_ollama(prompt, system=system, temperature=0.3, timeout=90.0)
        plan = parse_json_from_llm(raw)
        if not isinstance(plan, dict):
            plan = {
                "problem_statement": f"This {paper_type} investigates: {rq or title}",
                "research_gaps": [f"Candidate gap: limited synthesis of recent literature on {title}"],
                "research_questions": [rq] if rq else [f"What are the key findings regarding {title}?"],
                "objectives": [obj] if obj else [f"To review and synthesize existing knowledge on {title}"],
                "search_keywords": ([title, field] + title.split()[:3]) if title else [field or "research"],
                "methodology_approach": f"Systematic search and critical synthesis for a {paper_type}",
                "outline": [s["title"] for s in get_structure(paper_type)],
                "evidence_needed": ["Peer-reviewed studies", "Government reports", "Statistical data"],
                "expected_limitations": ["Access to paywalled sources", "Recency of available data"],
            }
        paper = get_paper(self.paper_id)
        paper["plan"] = plan
        paper["current_stage"] = "plan"
        save_paper(paper)
        self._update_job("done", "plan", 20)
        return plan

    async def collect_sources(self) -> List[Dict[str, Any]]:
        paper = get_paper(self.paper_id)
        if not paper:
            raise ValueError(f"Paper {self.paper_id} not found")
        self._update_job("running", "sources", 25)
        plan = paper.get("plan") or {}
        keywords: List[str] = plan.get("search_keywords", [paper.get("title", "")])
        mode = paper.get("research_depth", "deep")
        query_text = " ".join(str(k) for k in keywords[:5]) if keywords else paper.get("title", "research")

        agent = ResearchAgent()
        raw_sources = await agent.run(research_id=self.paper_id, question=query_text, mode=mode)
        collected: List[Dict[str, Any]] = []
        seen_urls: set = set()

        for s in raw_sources:
            url = s.get("url", "")
            if url in seen_urls:
                continue
            seen_urls.add(url)
            ps = {
                "id": f"psrc_{uuid.uuid4().hex[:8]}",
                "paper_id": self.paper_id,
                "title": s.get("title", ""),
                "authors": "",
                "year": (s.get("publication_date", "") or "")[:4],
                "journal": s.get("domain", ""),
                "doi": "",
                "url": url,
                "abstract": (s.get("snippet", "") or "")[:600],
                "snippet": (s.get("snippet", "") or "")[:400],
                "source_type": s.get("source_type", "Web"),
                "reliability": s.get("reliability", 0.6),
                "relevance": s.get("relevance", 0.8),
                "verified": False,
            }
            save_paper_source(ps)
            collected.append(ps)

        crossref = await self._search_crossref(keywords[:3])
        for cs in crossref:
            if cs["url"] not in seen_urls:
                seen_urls.add(cs["url"])
                save_paper_source(cs)
                collected.append(cs)

        paper = get_paper(self.paper_id)
        paper["current_stage"] = "sources"
        save_paper(paper)
        self._update_job("done", "sources", 45)
        return collected

    async def _search_crossref(self, keywords: List[str]) -> List[Dict[str, Any]]:
        import httpx
        results: List[Dict[str, Any]] = []
        query = " ".join(str(k) for k in keywords[:3])
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://api.crossref.org/works",
                    params={"query": query, "rows": 8,
                            "select": "title,author,published,DOI,container-title,abstract,URL"},
                    headers={"User-Agent": "ResearchForge/1.0 (mailto:research@local)"}
                )
                if resp.status_code == 200:
                    items = resp.json().get("message", {}).get("items", [])
                    for item in items:
                        ttl_parts = item.get("title", [""])
                        ttl = ttl_parts[0] if ttl_parts else "Untitled"
                        authors_raw = item.get("author", [])
                        authors = "; ".join(
                            f"{a.get('given','')} {a.get('family','')}".strip()
                            for a in authors_raw[:4]
                        )
                        yr_parts = item.get("published", {}).get("date-parts", [[]])
                        yr = str(yr_parts[0][0]) if yr_parts and yr_parts[0] else ""
                        jrnl_parts = item.get("container-title", [])
                        jrnl = jrnl_parts[0] if jrnl_parts else ""
                        doi = item.get("DOI", "")
                        url = item.get("URL", f"https://doi.org/{doi}" if doi else "")
                        abst = (item.get("abstract", "") or "")[:600]
                        if not ttl or not url:
                            continue
                        results.append({
                            "id": f"psrc_{uuid.uuid4().hex[:8]}",
                            "paper_id": self.paper_id,
                            "title": ttl, "authors": authors,
                            "year": yr, "journal": jrnl, "doi": doi, "url": url,
                            "abstract": abst, "snippet": abst[:300],
                            "source_type": "Academic",
                            "reliability": 0.85, "relevance": 0.80, "verified": True,
                        })
        except Exception as e:
            print(f"[Crossref] {e}")
        return results

    async def verify_evidence(self, raw_sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        self._update_job("running", "evidence", 50)
        paper = get_paper(self.paper_id)
        question = paper.get("research_question") or paper.get("title", "")
        agent_sources = [{
            "id": s["id"], "research_id": self.paper_id,
            "title": s.get("title", ""), "url": s.get("url", ""),
            "domain": s.get("journal", "") or s.get("url", ""),
            "source_type": s.get("source_type", "Web"),
            "publication_date": s.get("year", ""),
            "reliability": s.get("reliability", 0.7),
            "snippet": s.get("snippet", "") or s.get("abstract", ""),
            "full_text": s.get("abstract", ""),
        } for s in raw_sources]
        checker = FactCheckAgent()
        claims = await checker.run(self.paper_id, question, agent_sources)
        self._update_job("done", "evidence", 60)
        return claims

    async def draft_paper(self, sources: List[Dict[str, Any]], claims: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        paper = get_paper(self.paper_id)
        if not paper:
            raise ValueError(f"Paper {self.paper_id} not found")
        paper_type = paper.get("paper_type", "General Academic Paper")
        citation_style = paper.get("citation_style", "APA 7")
        structure = get_structure(paper_type)
        target_words = paper.get("target_word_count", 5000)
        words_per_section = max(150, target_words // max(1, len(structure) - 1))

        source_snippets = "\n".join(
            f"[{i+1}] {s.get('title','')} ({s.get('year','')}): {(s.get('snippet','') or '')[:200]}"
            for i, s in enumerate(sources[:12])
        )
        claim_summary = "\n".join(
            f"- {c.get('claim','')} [{c.get('status','')} | conf={c.get('confidence',0):.0f}%]"
            for c in claims[:8]
        )
        plan_json = json.dumps(paper.get("plan") or {}, indent=2)[:800]
        drafted: List[Dict[str, Any]] = []
        total = len(structure)

        for idx, sec_def in enumerate(structure):
            sk = sec_def["key"]
            title = sec_def["title"]
            progress = 60 + int((idx / max(1, total)) * 30)
            self._update_job("running", f"drafting:{sk}", progress)

            if sk == "references":
                content = build_references_section(sources, citation_style)
                sec = {"id": f"sec_{uuid.uuid4().hex[:8]}", "paper_id": self.paper_id,
                       "section_key": sk, "title": title, "content": content,
                       "word_count": len(content.split()), "order_index": idx, "status": "generated"}
                save_paper_section(sec); drafted.append(sec); continue

            if sk == "keywords":
                kws = (paper.get("plan") or {}).get("search_keywords", [])
                content = "; ".join(str(k) for k in kws[:10]) if kws else paper.get("title", "")
                sec = {"id": f"sec_{uuid.uuid4().hex[:8]}", "paper_id": self.paper_id,
                       "section_key": sk, "title": title, "content": content,
                       "word_count": len(content.split()), "order_index": idx, "status": "generated"}
                save_paper_section(sec); drafted.append(sec); continue

            if "PENDING" in title:
                content = (
                    "**[PENDING — USER INPUT REQUIRED]**\n\n"
                    f"This section requires original data or details that only you can provide. "
                    "Please edit this section directly in the editor."
                )
                sec = {"id": f"sec_{uuid.uuid4().hex[:8]}", "paper_id": self.paper_id,
                       "section_key": sk, "title": title, "content": content,
                       "word_count": len(content.split()), "order_index": idx, "status": "pending_user"}
                save_paper_section(sec); drafted.append(sec); continue

            system = (
                "You are an expert academic writer. Write in formal scholarly prose. "
                "Do NOT invent experiments, datasets, author names, DOIs or statistics absent from the evidence. "
                "Cite sources inline as [1], [2], etc. Mark assumptions as [ASSUMPTION:]. "
                f"Target ~{words_per_section} words."
            )
            prompt = (
                f"Paper Type: {paper_type}\nPaper Title: {paper.get('title','')}\n"
                f"Research Question: {paper.get('research_question','')}\n"
                f"Research Plan:\n{plan_json}\n\nVerified Claims:\n{claim_summary}\n\n"
                f"Sources (numbered for citation):\n{source_snippets}\n\n"
                f"Write the **{title}** section body (no heading):"
            )
            content = await call_ollama(prompt, system=system, temperature=0.25, timeout=120.0)
            if not content or len(content.strip()) < 80:
                content = f"[AUTO-FALLBACK] Section '{title}' could not be generated. Please revise manually."

            sec = {"id": f"sec_{uuid.uuid4().hex[:8]}", "paper_id": self.paper_id,
                   "section_key": sk, "title": title, "content": content,
                   "word_count": len(content.split()), "order_index": idx, "status": "generated"}
            save_paper_section(sec)
            drafted.append(sec)
            await asyncio.sleep(0.5)

        self._update_job("done", "drafting", 90)
        return drafted

    async def run_originality_check(self, sources: List[Dict[str, Any]]) -> Dict[str, Any]:
        self._update_job("running", "originality", 92)
        clear_originality_findings(self.paper_id)
        sections = get_paper_sections(self.paper_id)
        findings: List[Dict[str, Any]] = []

        source_texts = [
            {"title": s.get("title",""), "url": s.get("url",""),
             "text": ((s.get("snippet","") or "") + " " + (s.get("abstract","") or "")).lower()}
            for s in sources
        ]

        cue_phrases = ["according to","studies show","research indicates",
                       "evidence suggests","it has been shown","has demonstrated"]
        seen_paras: Dict[str, str] = {}

        for sec in sections:
            content = sec.get("content","")
            if not content or len(content) < 50:
                continue
            sk = sec.get("section_key","")
            paras = [p.strip() for p in content.split("\n\n") if len(p.strip()) > 80]

            for para in paras[:6]:
                para_lower = para.lower()
                for src in source_texts:
                    src_words = set(src["text"].split())
                    para_words = set(para_lower.split())
                    if len(para_words) < 10:
                        continue
                    overlap = len(para_words & src_words) / max(1, len(para_words))
                    if overlap > 0.55:
                        has_cit = "[" in para and "]" in para
                        f = {
                            "id": f"orig_{uuid.uuid4().hex[:8]}",
                            "paper_id": self.paper_id,
                            "passage": para[:400],
                            "matched_source": src["title"],
                            "matched_url": src["url"],
                            "similarity_note": f"Lexical overlap approx {overlap*100:.0f}% (heuristic, not a plagiarism score)",
                            "flag_reason": "High word overlap with collected source" + (" — citation may be missing" if not has_cit else " — citation present"),
                            "suggestion": ("Add a citation or rephrase with proper attribution." if not has_cit else "Verify the cited source matches the claim."),
                            "needs_citation": not has_cit,
                            "section_key": sk,
                        }
                        save_originality_finding(f); findings.append(f); break

                for cue in cue_phrases:
                    if cue in para_lower and "[" not in para:
                        f = {
                            "id": f"orig_{uuid.uuid4().hex[:8]}",
                            "paper_id": self.paper_id,
                            "passage": para[:400],
                            "matched_source": "", "matched_url": "", "similarity_note": "",
                            "flag_reason": f"Phrase '{cue}' implies a source but no citation found",
                            "suggestion": "Add a citation to the source being referenced.",
                            "needs_citation": True, "section_key": sk,
                        }
                        save_originality_finding(f); findings.append(f); break

                key = para[:80].lower()
                if key in seen_paras:
                    f = {
                        "id": f"orig_{uuid.uuid4().hex[:8]}",
                        "paper_id": self.paper_id,
                        "passage": para[:400],
                        "matched_source": f"Duplicate of passage in section: {seen_paras[key]}",
                        "matched_url": "", "similarity_note": "Exact paragraph duplication",
                        "flag_reason": "Repeated paragraph across sections",
                        "suggestion": "Remove or rephrase the duplicate passage.",
                        "needs_citation": False, "section_key": sk,
                    }
                    save_originality_finding(f); findings.append(f)
                else:
                    seen_paras[key] = sk

        report = {
            "passages_reviewed": sum(
                len([p for p in (sec.get("content","") or "").split("\n\n") if len(p.strip()) > 80])
                for sec in sections),
            "potential_matches": len([f for f in findings if f.get("matched_source") and "Duplicate" not in str(f.get("matched_source",""))]),
            "missing_citations": len([f for f in findings if f.get("needs_citation")]),
            "duplicate_passages": len([f for f in findings if "Duplicate" in str(f.get("matched_source",""))]),
            "findings_count": len(findings),
            "note": (
                "This is a heuristic lexical analysis based on collected source text. "
                "It does not replace dedicated plagiarism detection tools and makes no claim "
                "about AI authorship or Turnitin compatibility."
            ),
        }
        paper = get_paper(self.paper_id)
        paper["originality_report"] = report
        save_paper(paper)
        self._update_job("done", "originality", 98)
        return report

    async def run_full_pipeline(self):
        try:
            paper = get_paper(self.paper_id)
            paper["current_stage"] = "plan"; paper["status"] = "processing"
            save_paper(paper)
            await self.generate_plan()
            sources = await self.collect_sources()
            claims = await self.verify_evidence(sources)
            await self.draft_paper(sources, claims)
            await self.run_originality_check(sources)
            paper = get_paper(self.paper_id)
            paper["status"] = "completed"; paper["current_stage"] = "done"
            save_paper(paper)
            self._update_job("done", "complete", 100)
        except Exception as e:
            import traceback
            err = f"{e}\n{traceback.format_exc()}"
            self._update_job("failed", "error", 0, error=err)
            paper = get_paper(self.paper_id)
            if paper:
                paper["status"] = "failed"; save_paper(paper)
