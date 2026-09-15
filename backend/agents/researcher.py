import asyncio
import uuid
from typing import List, Dict, Any, Callable, Optional
from urllib.parse import urlparse

from backend.tools.search import search_duckduckgo, classify_domain
from backend.tools.scraper import scrape_webpage
from backend.tools.llm import call_ollama, parse_json_from_llm
from backend.tools.documents import extract_text_from_file
from backend.database.database import get_document

class ResearchAgent:
    def __init__(self, emit_event: Optional[Callable[[str, str, str], None]] = None):
        """
        Research Agent responsible for understanding research queries, discovering sources,
        scraping content, and extracting evidence snippets.
        """
        self.emit_event = emit_event or (lambda agent, step, detail="": None)

    async def generate_search_queries(self, question: str, mode: str = "deep") -> List[str]:
        """Uses Ollama Qwen to formulate distinct, multi-perspective search queries."""
        self.emit_event("Research Agent", "Generating targeted search queries", f"Analyzing: {question}")
        
        system_prompt = (
            "You are a Senior Research Analyst. Given a user's research question, generate 3 to 4 distinct search queries "
            "designed to uncover multiple perspectives: supporting arguments, counter-arguments/challenges, and factual data/statistics. "
            "Return ONLY a JSON list of strings, for example: [\"query 1\", \"query 2\", \"query 3\"]"
        )
        
        prompt = f"Research Question: {question}\nGenerate 3-4 distinct search queries:"
        response = await call_ollama(prompt, system=system_prompt, temperature=0.3, timeout=30.0)
        parsed = parse_json_from_llm(response)
        
        if isinstance(parsed, list) and len(parsed) > 0 and all(isinstance(x, str) for x in parsed):
            queries = parsed[:4]
        else:
            # Fallback deterministic queries if LLM returns unstructured text
            queries = [
                question,
                f"{question} economic viability costs benefits",
                f"{question} criticisms challenges opposing views",
                f"{question} government report data statistics"
            ]
            
        self.emit_event("Research Agent", "Search queries formulated", f"Formulated {len(queries)} search queries")
        return queries

    async def run(self, research_id: str, question: str, mode: str = "deep", document_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Executes the research phase:
        - If document mode, ingests uploaded documents as sources
        - Searches web sources across generated queries
        - Concurrently scrapes top sources
        - Extracts structured evidence passages
        """
        collected_sources: List[Dict[str, Any]] = []
        target_sources = 6 if mode == "quick" else 14
        
        # 1. Process local uploaded documents if provided or in document mode
        if document_ids:
            self.emit_event("Research Agent", "Analyzing uploaded documents", f"Processing {len(document_ids)} local files")
            for doc_id in document_ids:
                doc_record = get_document(doc_id)
                if doc_record:
                    extracted = extract_text_from_file(doc_record["file_path"])
                    source_id = f"src_doc_{uuid.uuid4().hex[:8]}"
                    snippet = extracted["text"][:1200]
                    collected_sources.append({
                        "id": source_id,
                        "research_id": research_id,
                        "title": f"Document: {doc_record['filename']}",
                        "url": f"file://{doc_record['filename']}",
                        "domain": "Local Document",
                        "source_type": "Documentation",
                        "publication_date": doc_record.get("uploaded_at", "")[:10],
                        "reliability": 0.95,
                        "relevance": 0.95,
                        "snippet": snippet,
                        "full_text": extracted["text"],
                        "evidence": [snippet[:400], snippet[400:800]] if len(snippet) > 400 else [snippet]
                    })

        # 2. Web search discovery
        queries = await self.generate_search_queries(question, mode)
        discovered_items = []
        
        for q in queries:
            self.emit_event("Research Agent", f"Searching: {q[:45]}...", f"Querying search index")
            results = search_duckduckgo(q, max_results=5 if mode == "quick" else 8)
            discovered_items.extend(results)
            await asyncio.sleep(0.3)
            
        # Deduplicate results by URL
        seen_urls = set(s["url"] for s in collected_sources)
        unique_results = []
        for item in discovered_items:
            if item["url"] not in seen_urls:
                seen_urls.add(item["url"])
                unique_results.append(item)
                
        self.emit_event(
            "Research Agent",
            f"{len(unique_results)} sources discovered",
            f"Filtering top {target_sources} most relevant sources"
        )
        
        selected_candidates = unique_results[:target_sources]
        
        # 3. Scrape webpage content concurrently
        self.emit_event("Research Agent", "Extracting full source text", f"Scraping {len(selected_candidates)} web pages")
        
        async def fetch_source_content(item: Dict[str, Any]) -> Dict[str, Any]:
            source_id = f"src_{uuid.uuid4().hex[:8]}"
            url = item["url"]
            full_text = await scrape_webpage(url, timeout=5.0)
            
            # Fallback to search snippet if scraping gets blocked
            content = full_text if (full_text and len(full_text) > 120) else item.get("snippet", "")
            
            # Divide into evidence chunks
            evidence_snippets = []
            if content:
                paragraphs = [p.strip() for p in content.split("\n\n") if len(p.strip()) > 60]
                evidence_snippets = paragraphs[:4] if paragraphs else [content[:500]]
                
            return {
                "id": source_id,
                "research_id": research_id,
                "title": item["title"],
                "url": url,
                "domain": item["domain"],
                "source_type": item.get("source_type", "Other"),
                "publication_date": "2024-2025",
                "reliability": item.get("reliability", 0.65),
                "relevance": item.get("relevance", 0.85),
                "snippet": content[:800],
                "full_text": content,
                "evidence": evidence_snippets
            }

        scraped_sources = await asyncio.gather(*[fetch_source_content(cand) for cand in selected_candidates])
        collected_sources.extend(scraped_sources)
        
        self.emit_event(
            "Research Agent",
            "Evidence extraction completed",
            f"Retrieved {len(collected_sources)} structured sources with evidence passages"
        )
        
        return collected_sources
