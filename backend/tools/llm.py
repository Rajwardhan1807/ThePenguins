import os
import json
import re
import httpx
from typing import Optional, Dict, Any, List

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3.5:latest")

async def check_ollama_health() -> Dict[str, Any]:
    """Checks if Ollama daemon is reachable and lists available models."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{OLLAMA_HOST}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name") for m in data.get("models", [])]
                model_ready = any(OLLAMA_MODEL in m for m in models)
                return {
                    "connected": True,
                    "model": OLLAMA_MODEL,
                    "model_available": model_ready,
                    "models": models
                }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e),
            "model": OLLAMA_MODEL,
            "model_available": False,
            "models": []
        }
    return {"connected": False, "model": OLLAMA_MODEL, "model_available": False, "models": []}

async def call_ollama(prompt: str, system: Optional[str] = None, temperature: float = 0.2, timeout: float = 90.0) -> str:
    """Calls Ollama HTTP API directly to generate a completion."""
    url = f"{OLLAMA_HOST}/api/generate"
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "top_p": 0.9,
        }
    }
    if system:
        payload["system"] = system

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "").strip()
            else:
                print(f"[Ollama Error] HTTP {response.status_code}: {response.text}")
                return ""
    except Exception as e:
        print(f"[Ollama Exception] {e}")
        return ""

def parse_json_from_llm(text: str) -> Optional[Any]:
    """Robustly extracts JSON object or array from LLM response text."""
    if not text:
        return None
        
    text = text.strip()
    # Check if wrapped in ```json ... ``` or ``` ... ```
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if json_match:
        text = json_match.group(1).strip()
        
    try:
        return json.loads(text)
    except Exception:
        pass
        
    # Attempt finding first { and last } or first [ and last ]
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    if first_brace != -1 and last_brace > first_brace:
        try:
            return json.loads(text[first_brace:last_brace+1])
        except Exception:
            pass
            
    first_bracket = text.find('[')
    last_bracket = text.rfind(']')
    if first_bracket != -1 and last_bracket > first_bracket:
        try:
            return json.loads(text[first_bracket:last_bracket+1])
        except Exception:
            pass
            
    return None
