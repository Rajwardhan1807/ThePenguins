import re
import json
import urllib.request
import xml.etree.ElementTree as ET
from urllib.parse import urlparse, quote_plus
from typing import List, Dict, Any


try:
    from ddgs import DDGS
except ImportError:
    try:
        from duckduckgo_search import DDGS
    except ImportError:
        DDGS = None


DOMAIN_TYPE_MAP = {
    "gov": ("Government", 0.95),
    "gov.in": ("Government", 0.95),
    "nic.in": ("Government", 0.95),
    "mil": ("Government", 0.90),
    "edu": ("Academic", 0.92),
    "ac.in": ("Academic", 0.92),
    "ac.uk": ("Academic", 0.92),
    "arxiv.org": ("Research Paper", 0.94),
    "nature.com": ("Academic", 0.95),
    "sciencedirect.com": ("Academic", 0.93),
    "ieee.org": ("Academic", 0.92),
    "researchgate.net": ("Academic", 0.88),
    "springer.com": ("Academic", 0.91),
    "reuters.com": ("News", 0.85),
    "apnews.com": ("News", 0.85),
    "bbc.com": ("News", 0.82),
    "thehindu.com": ("News", 0.80),
    "theguardian.com": ("News", 0.80),
    "economictimes.indiatimes.com": ("News", 0.78),
    "livemint.com": ("News", 0.78),
    "bloomberg.com": ("News", 0.82),
    "iaea.org": ("Organization", 0.92),
    "world-nuclear.org": ("Industry", 0.80),
    "iea.org": ("Organization", 0.88),
    "worldbank.org": ("Organization", 0.88),
}

def classify_domain(url: str) -> tuple[str, float]:
    """Classifies a URL into a source type and base reliability score."""
    try:
        parsed = urlparse(url)
        netloc = parsed.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
            
        # Check specific domains
        for domain_key, (src_type, rel) in DOMAIN_TYPE_MAP.items():
            if domain_key in netloc:
                return src_type, rel
                
        # Check TLD patterns
        if netloc.endswith(".gov") or ".gov." in netloc:
            return "Government", 0.95
        if netloc.endswith(".edu") or ".edu." in netloc or ".ac." in netloc:
            return "Academic", 0.92
        if netloc.endswith(".org"):
            return "Organization", 0.78
            
        return "Other", 0.55
    except Exception:
        return "Other", 0.50

def search_wikipedia(query: str, limit: int = 4) -> List[Dict[str, Any]]:
    """Free, reliable fallback search using Wikipedia OpenSearch API."""
    results = []
    try:
        url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={quote_plus(query)}&limit={limit}&namespace=0&format=json"
        req = urllib.request.Request(url, headers={"User-Agent": "ResearchForge/1.0 (Local Research Assistant)"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            titles, descriptions, urls = data[1], data[2], data[3]
            for t, d, u in zip(titles, descriptions, urls):
                if u:
                    results.append({
                        "title": t,
                        "url": u,
                        "domain": "wikipedia.org",
                        "source_type": "Academic",
                        "snippet": d or f"Comprehensive overview and citations regarding {t}.",
                        "reliability": 0.88,
                        "relevance": 0.85
                    })
    except Exception as e:
        print(f"[Search Tool] Wikipedia search fallback error: {e}")
    return results

def search_arxiv(query: str, limit: int = 3) -> List[Dict[str, Any]]:
    """Free academic paper fallback search using ArXiv API."""
    results = []
    try:
        url = f"http://export.arxiv.org/api/query?search_query=all:{quote_plus(query)}&start=0&max_results={limit}"
        req = urllib.request.Request(url, headers={"User-Agent": "ResearchForge/1.0 (Local Research Assistant)"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            root = ET.fromstring(resp.read())
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            for entry in root.findall("atom:entry", ns):
                title = entry.find("atom:title", ns)
                summary = entry.find("atom:summary", ns)
                link = entry.find("atom:id", ns)
                t_str = " ".join(title.text.split()) if title is not None and title.text else "Untitled Paper"
                s_str = " ".join(summary.text.split())[:350] if summary is not None and summary.text else ""
                l_str = link.text.strip() if link is not None and link.text else ""
                if l_str:
                    results.append({
                        "title": t_str,
                        "url": l_str,
                        "domain": "arxiv.org",
                        "source_type": "Research Paper",
                        "snippet": s_str,
                        "reliability": 0.94,
                        "relevance": 0.90
                    })
    except Exception as e:
        print(f"[Search Tool] ArXiv search fallback error: {e}")
    return results

def search_duckduckgo(query: str, max_results: int = 8) -> List[Dict[str, Any]]:
    """Performs a web search using DuckDuckGo with Wikipedia and ArXiv fallbacks."""
    results = []
    if DDGS is not None:
        try:
            with DDGS(timeout=10) as ddgs:
                ddg_results = list(ddgs.text(query, max_results=max_results))
                for item in ddg_results:
                    url = item.get("href") or item.get("link") or ""
                    title = item.get("title") or "Untitled Source"
                    snippet = item.get("body") or item.get("snippet") or ""
                    
                    parsed = urlparse(url)
                    domain = parsed.netloc.lower()
                    if domain.startswith("www."):
                        domain = domain[4:]
                        
                    src_type, rel = classify_domain(url)
                    
                    results.append({
                        "title": title,
                        "url": url,
                        "domain": domain or "web",
                        "source_type": src_type,
                        "snippet": snippet,
                        "reliability": rel,
                        "relevance": 0.85
                    })
        except Exception as e:
            print(f"[Search Tool] DDGS search error: {e}")

    # If DDGS returned few or zero results, augment with Wikipedia and ArXiv
    if len(results) < 4:
        results.extend(search_wikipedia(query, limit=3))
    if len(results) < 4:
        results.extend(search_arxiv(query, limit=2))

    # Deduplicate by URL
    seen_urls = set()
    deduped = []
    for r in results:
        if r["url"] and r["url"] not in seen_urls:
            seen_urls.add(r["url"])
            deduped.append(r)
            
    return deduped

