from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class ResearchMode(str, Enum):
    QUICK = "quick"
    DEEP = "deep"
    DOCUMENT = "document"

class AgentState(str, Enum):
    WAITING = "waiting"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class ClaimStatus(str, Enum):
    VERIFIED = "VERIFIED"
    PARTIALLY_VERIFIED = "PARTIALLY VERIFIED"
    CONTRADICTED = "CONTRADICTED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT EVIDENCE"

class SourceType(str, Enum):
    GOVERNMENT = "Government"
    ACADEMIC = "Academic"
    RESEARCH_PAPER = "Research Paper"
    NEWS = "News"
    INDUSTRY = "Industry"
    ORGANIZATION = "Organization"
    DOCUMENTATION = "Documentation"
    OTHER = "Other"

# Request / Response Schemas
class StartResearchRequest(BaseModel):
    query: str
    mode: ResearchMode = ResearchMode.DEEP
    document_ids: Optional[List[str]] = Field(default_factory=list)

class StartResearchResponse(BaseModel):
    research_id: str
    status: str

class EvidenceSnippetSchema(BaseModel):
    id: Optional[str] = None
    source_id: Optional[str] = None
    content: str
    relevance: float = 0.8

class SourceSchema(BaseModel):
    id: str
    research_id: str
    title: str
    url: str
    domain: str
    source_type: str = SourceType.OTHER
    publication_date: Optional[str] = None
    reliability: float = 0.5
    relevance: float = 0.8
    snippet: Optional[str] = None
    claims_supported_count: int = 0
    claims_contradicted_count: int = 0

class ClaimVerificationSchema(BaseModel):
    id: str
    research_id: str
    claim: str
    status: ClaimStatus
    confidence: float  # 0 - 100%
    supporting_source_ids: List[str] = Field(default_factory=list)
    contradicting_source_ids: List[str] = Field(default_factory=list)
    supporting_sources: List[Dict[str, Any]] = Field(default_factory=list)
    contradicting_sources: List[Dict[str, Any]] = Field(default_factory=list)
    analysis: str
    source_reliability_score: float = 0.0
    source_agreement_score: float = 0.0
    evidence_quality_score: float = 0.0
    recency_score: float = 0.0
    cross_verification_score: float = 0.0

class KeyFindingSchema(BaseModel):
    finding: str
    confidence: float
    evidence_sources_count: int
    summary: str

class ResearchReportSchema(BaseModel):
    id: str
    research_id: str
    title: str
    executive_summary: str
    key_findings: List[KeyFindingSchema] = Field(default_factory=list)
    evidence_and_analysis: str
    conflicting_evidence: str
    source_reliability_analysis: str
    limitations: str
    conclusion: str
    full_markdown: str
    created_at: str

class ResearchStatisticsSchema(BaseModel):
    sources_discovered: int = 0
    sources_relevant: int = 0
    claims_identified: int = 0
    claims_verified: int = 0
    conflicts_detected: int = 0
    overall_confidence: float = 0.0

class AgentStatusSchema(BaseModel):
    researcher: AgentState = AgentState.WAITING
    fact_checker: AgentState = AgentState.WAITING
    writer: AgentState = AgentState.WAITING

class ResearchSessionSchema(BaseModel):
    id: str
    query: str
    mode: ResearchMode
    status: str
    created_at: str
    completed_at: Optional[str] = None
    confidence: float = 0.0
    statistics: ResearchStatisticsSchema
    agents: AgentStatusSchema
    current_step: Optional[str] = None
    error_message: Optional[str] = None

class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    pages: int
    status: str
    message: str
