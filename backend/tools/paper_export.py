"""
Paper export utilities: DOCX, Markdown, and PDF.
All libraries are open-source. PDF via reportlab. DOCX via python-docx.
"""
import io
import os
import re
from typing import Any, Dict, List, Optional


def _strip_markdown(text: str) -> str:
    """Very basic markdown to plain text stripper for DOCX/PDF."""
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'`(.*?)`', r'\1', text)
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    return text


def export_markdown(title: str, sections: List[Dict[str, Any]]) -> bytes:
    """Return paper as Markdown bytes."""
    parts = [f"# {title}\n"]
    for sec in sections:
        parts.append(f"\n## {sec['title']}\n")
        parts.append((sec.get("content") or "") + "\n")
    return "\n".join(parts).encode("utf-8")


def export_docx(title: str, sections: List[Dict[str, Any]]) -> bytes:
    """Return paper as a DOCX binary."""
    from docx import Document
    from docx.shared import Pt, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    doc = Document()
    # Title
    heading = doc.add_heading(title, 0)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER

    for sec in sections:
        doc.add_heading(sec["title"], level=2)
        content = sec.get("content") or ""
        for para_text in content.split("\n\n"):
            para_text = para_text.strip()
            if not para_text:
                continue
            if para_text.startswith("[PENDING") or para_text.startswith("**[PENDING"):
                p = doc.add_paragraph()
                run = p.add_run(_strip_markdown(para_text))
                run.italic = True
            else:
                doc.add_paragraph(_strip_markdown(para_text))

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def export_pdf(title: str, sections: List[Dict[str, Any]]) -> bytes:
    """Return paper as a PDF binary using reportlab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib import colors

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2.5 * cm, rightMargin=2.5 * cm,
        topMargin=2.5 * cm, bottomMargin=2.5 * cm
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "PaperTitle", parent=styles["Title"],
        fontSize=18, spaceAfter=20, textColor=colors.black
    )
    h2_style = ParagraphStyle(
        "SectionHeading", parent=styles["Heading2"],
        fontSize=13, spaceBefore=16, spaceAfter=8,
        textColor=colors.HexColor("#1a1a2e")
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["BodyText"],
        fontSize=11, leading=16, spaceAfter=8
    )
    pending_style = ParagraphStyle(
        "Pending", parent=styles["BodyText"],
        fontSize=10, leading=14, textColor=colors.HexColor("#d97706"),
        fontName="Helvetica-Oblique"
    )

    story = []
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 0.4 * cm))

    for sec in sections:
        story.append(Paragraph(sec["title"], h2_style))
        content = sec.get("content") or ""
        for para_text in content.split("\n\n"):
            para_text = _strip_markdown(para_text.strip())
            if not para_text:
                continue
            style = pending_style if "PENDING" in para_text[:30].upper() else body_style
            # Escape & for reportlab XML
            para_text = para_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            try:
                story.append(Paragraph(para_text, style))
            except Exception:
                story.append(Paragraph("(Content could not be rendered)", pending_style))
        story.append(Spacer(1, 0.2 * cm))

    doc.build(story)
    return buf.getvalue()
