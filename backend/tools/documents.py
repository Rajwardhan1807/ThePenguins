import os
from typing import Dict, Any, Optional

def extract_text_from_file(file_path: str) -> Dict[str, Any]:
    """Extracts text content and metadata from local PDF, DOCX, or TXT documents."""
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    pages = 1
    
    if ext == ".pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            pages = len(reader.pages)
            extracted_pages = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    extracted_pages.append(f"[Page {i+1}]\n{page_text}")
            text = "\n\n".join(extracted_pages)
        except Exception as e:
            text = f"Error reading PDF: {e}"
            
    elif ext == ".docx":
        try:
            import docx
            doc = docx.Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            text = "\n\n".join(paragraphs)
            pages = max(1, len(paragraphs) // 10)
        except Exception as e:
            text = f"Error reading DOCX: {e}"
            
    elif ext in [".txt", ".md"]:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
            pages = max(1, len(text.splitlines()) // 40)
        except Exception as e:
            text = f"Error reading text file: {e}"
    else:
        text = "Unsupported file format."

    return {
        "text": text.strip(),
        "page_count": pages,
        "char_count": len(text)
    }
