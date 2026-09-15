import re
from urllib.parse import urlparse
from typing import List, Dict, Any

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

def search_duckduckgo(query: str, max_results: int = 8) -> List[Dict[str, Any]]:
    """Performs a web search using DuckDuckGo (₹0 cost) and extracts sources."""
    results = []
    if DDGS is not None:
        try:
            with DDGS() as ddgs:
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

    # Deduplicate by domain or URL
    seen_urls = set()
    deduped = []
    for r in results:
        if r["url"] and r["url"] not in seen_urls:
            seen_urls.add(r["url"])
            deduped.append(r)
            
    return deduped
