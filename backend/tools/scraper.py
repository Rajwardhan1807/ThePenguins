import re
import httpx
from bs4 import BeautifulSoup
from typing import Optional

try:
    import trafilatura
except ImportError:
    trafilatura = None

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

async def scrape_webpage(url: str, timeout: float = 6.0) -> Optional[str]:
    """
    Scrapes web page text cleanly using Trafilatura or BeautifulSoup.
    Handles timeouts, HTTP errors, and returns clean passages.
    """
    if not url or not url.startswith("http"):
        return None

    try:
        async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=timeout) as client:
            response = await client.get(url)
            if response.status_code != 200:
                return None
            html = response.text
    except Exception as e:
        # Graceful skip on network errors/timeouts
        return None

    # Try trafilatura first for article body extraction
    if trafilatura is not None:
        try:
            extracted = trafilatura.extract(html, include_links=False, include_comments=False)
            if extracted and len(extracted.strip()) > 100:
                # Clean up excess whitespace
                clean = re.sub(r'\n{3,}', '\n\n', extracted.strip())
                return clean[:4000] # Limit to relevant length
        except Exception:
            pass

    # Fallback to BeautifulSoup
    try:
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
            tag.decompose()
            
        paragraphs = [p.get_text(strip=True) for p in soup.find_all(["p", "h1", "h2", "h3", "li"])]
        full_text = "\n\n".join([p for p in paragraphs if len(p) > 25])
        clean = re.sub(r'\s+', ' ', full_text).strip()
        if len(clean) > 80:
            return clean[:4000]
    except Exception:
        pass

    return None
