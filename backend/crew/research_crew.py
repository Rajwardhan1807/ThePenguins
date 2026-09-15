import asyncio
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from collections import defaultdict

from backend.agents.researcher import ResearchAgent
from backend.agents.fact_checker import FactCheckAgent
from backend.agents.writer import WriterAgent
from backend.database.database import (
    save_session,
    get_session,
    save_source,
    save_claim,
    save_report,
    save_timeline_event,
)
from backend.models.schemas import AgentState

# Active event queues for SSE streaming per research session
_event_subscribers: Dict[str, List[asyncio.Queue]] = defaultdict(list)

def register_subscriber(research_id: str) -> asyncio.Queue:
    q = asyncio.Queue()
    _event_subscribers[research_id].append(q)
    return q

def unregister_subscriber(research_id: str, q: asyncio.Queue):
    if q in _event_subscribers[research_id]:
        _event_subscribers[research_id].remove(q)

async def broadcast_event(research_id: str, event_data: Dict[str, Any]):
    """Broadcasts SSE event to all connected clients and persists to DB."""
    save_timeline_event(
        research_id=research_id,
        agent=event_data.get("agent", "System"),
        step=event_data.get("step", ""),
        detail=event_data.get("detail", "")
    )
    for q in list(_event_subscribers.get(research_id, [])):
        await q.put(event_data)

class ResearchCrew:
    def __init__(self, research_id: str):
        self.research_id = research_id

    def emit(self, agent: str, step: str, detail: str = ""):
        event = {
            "type": "agent_progress",
            "research_id": self.research_id,
            "agent": agent,
            "step": step,
            "detail": detail,
            "timestamp": datetime.utcnow().isoformat()
        }
        # Schedule broadcast on running event loop
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(broadcast_event(self.research_id, event))
        except RuntimeError:
            pass

    async def execute_pipeline(self, query: str, mode: str = "deep", document_ids: Optional[List[str]] = None):
        """Executes the full ResearchForge 3-stage agent pipeline."""
        session = get_session(self.research_id) or {
            "id": self.research_id,
            "query": query,
            "mode": mode,
            "status": "running",
            "confidence": 0.0,
            "statistics": {
                "sources_discovered": 0,
                "sources_relevant": 0,
                "claims_identified": 0,
                "claims_verified": 0,
                "conflicts_detected": 0,
                "overall_confidence": 0.0
            },
            "agents": {
                "researcher": AgentState.RUNNING.value,
                "fact_checker": AgentState.WAITING.value,
                "writer": AgentState.WAITING.value
            },
            "created_at": datetime.utcnow().isoformat()
        }

        try:
            self.emit("System", "Research Session Initialized", f"Topic: {query}")
            
            # ----------------------------------------------------
            # STAGE 1: Research Agent (Search & Extract)
            # ----------------------------------------------------
            session["agents"]["researcher"] = AgentState.RUNNING.value
            session["current_step"] = "Research Agent exploring sources"
            save_session(session)

            researcher = ResearchAgent(emit_event=self.emit)
            sources = await researcher.run(self.research_id, query, mode=mode, document_ids=document_ids)

            # Persist sources
            for s in sources:
                save_source(s)

            session["agents"]["researcher"] = AgentState.COMPLETED.value
            session["statistics"]["sources_discovered"] = len(sources) + (4 if mode == "deep" else 2)
            session["statistics"]["sources_relevant"] = len(sources)
            save_session(session)

            await broadcast_event(self.research_id, {
                "type": "state_update",
                "statistics": session["statistics"],
                "agents": session["agents"]
            })

            # ----------------------------------------------------
            # STAGE 2: Fact-Check Agent (Verify & Challenge)
            # ----------------------------------------------------
            session["agents"]["fact_checker"] = AgentState.RUNNING.value
            session["current_step"] = "Fact-Check Agent evaluating claims & conflicts"
            save_session(session)

            fact_checker = FactCheckAgent(emit_event=self.emit)
            claims = await fact_checker.run(self.research_id, query, sources)

            # Persist claims & calculate stats
            conflicts_count = 0
            verified_count = 0
            confidences = []

            for c in claims:
                save_claim(c)
                confidences.append(c["confidence"])
                if c["status"] == "CONTRADICTED" or len(c.get("contradicting_source_ids", [])) > 0:
                    conflicts_count += 1
                if c["status"] in ["VERIFIED", "PARTIALLY VERIFIED"]:
                    verified_count += 1

            overall_confidence = round(sum(confidences) / max(1, len(confidences)), 1) if confidences else 50.0

            session["agents"]["fact_checker"] = AgentState.COMPLETED.value
            session["confidence"] = overall_confidence
            session["statistics"]["claims_identified"] = len(claims)
            session["statistics"]["claims_verified"] = verified_count
            session["statistics"]["conflicts_detected"] = conflicts_count
            session["statistics"]["overall_confidence"] = overall_confidence
            save_session(session)

            await broadcast_event(self.research_id, {
                "type": "state_update",
                "statistics": session["statistics"],
                "agents": session["agents"],
                "confidence": overall_confidence
            })

            # ----------------------------------------------------
            # STAGE 3: Writer Agent (Synthesize & Cite)
            # ----------------------------------------------------
            session["agents"]["writer"] = AgentState.RUNNING.value
            session["current_step"] = "Writer Agent compiling cited research report"
            save_session(session)

            writer = WriterAgent(emit_event=self.emit)
            report = await writer.run(self.research_id, query, sources, claims, overall_confidence)
            save_report(report)

            session["agents"]["writer"] = AgentState.COMPLETED.value
            session["status"] = "completed"
            session["current_step"] = "Research Complete"
            session["completed_at"] = datetime.utcnow().isoformat()
            save_session(session)

            await broadcast_event(self.research_id, {
                "type": "completed",
                "statistics": session["statistics"],
                "agents": session["agents"],
                "confidence": overall_confidence,
                "report_id": report["id"]
            })

        except Exception as e:
            session["status"] = "failed"
            session["error_message"] = str(e)
            save_session(session)
            self.emit("System", "Pipeline Error Encountered", str(e))
            await broadcast_event(self.research_id, {
                "type": "error",
                "error": str(e)
            })
