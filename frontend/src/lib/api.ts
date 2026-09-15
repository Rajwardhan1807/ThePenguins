const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface Source {
  id: string;
  research_id: string;
  title: string;
  url: string;
  domain: string;
  source_type: string;
  publication_date?: string;
  reliability: number;
  relevance: number;
  snippet?: string;
  claims_supported_count?: number;
  claims_contradicted_count?: number;
}

export interface Claim {
  id: string;
  research_id: string;
  claim: string;
  status: "VERIFIED" | "PARTIALLY VERIFIED" | "CONTRADICTED" | "INSUFFICIENT EVIDENCE";
  confidence: number;
  supporting_source_ids: string[];
  contradicting_source_ids: string[];
  supporting_sources: Array<{
    id: string;
    title: string;
    url: string;
    domain: string;
    source_type: string;
    reliability: number;
  }>;
  contradicting_sources: Array<{
    id: string;
    title: string;
    url: string;
    domain: string;
    source_type: string;
    reliability: number;
  }>;
  analysis: string;
  source_reliability_score: number;
  source_agreement_score: number;
  evidence_quality_score: number;
  recency_score: number;
  cross_verification_score: number;
}

export interface KeyFinding {
  finding: string;
  confidence: number;
  evidence_sources_count: number;
  summary: string;
}

export interface Report {
  id: string;
  research_id: string;
  title: string;
  executive_summary: string;
  key_findings: KeyFinding[];
  evidence_and_analysis: string;
  conflicting_evidence: string;
  source_reliability_analysis: string;
  limitations: string;
  conclusion: string;
  full_markdown: string;
  created_at: string;
}

export interface ResearchStatistics {
  sources_discovered: number;
  sources_relevant: number;
  claims_identified: number;
  claims_verified: number;
  conflicts_detected: number;
  overall_confidence: number;
}

export interface AgentStates {
  researcher: "waiting" | "running" | "completed" | "failed";
  fact_checker: "waiting" | "running" | "completed" | "failed";
  writer: "waiting" | "running" | "completed" | "failed";
}

export interface ResearchSession {
  id: string;
  query: string;
  mode: "quick" | "deep" | "document";
  status: string;
  confidence: number;
  statistics: ResearchStatistics;
  agents: AgentStates;
  current_step?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface TimelineEvent {
  agent: string;
  step: string;
  detail?: string;
  timestamp: string;
}

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) throw new Error("Health check failed");
    return res.json();
  },

  async startResearch(query: string, mode: string = "deep", document_ids: string[] = []) {
    const res = await fetch(`${API_BASE}/api/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, mode, document_ids }),
    });
    if (!res.ok) throw new Error("Failed to start research");
    return res.json() as Promise<{ research_id: string; status: string }>;
  },

  async getSession(id: string): Promise<ResearchSession> {
    const res = await fetch(`${API_BASE}/api/research/${id}`);
    if (!res.ok) throw new Error("Failed to load session");
    return res.json();
  },

  async getSources(id: string): Promise<Source[]> {
    const res = await fetch(`${API_BASE}/api/research/${id}/sources`);
    if (!res.ok) throw new Error("Failed to load sources");
    const data = await res.json();
    return data.sources || [];
  },

  async getClaims(id: string): Promise<Claim[]> {
    const res = await fetch(`${API_BASE}/api/research/${id}/claims`);
    if (!res.ok) throw new Error("Failed to load claims");
    const data = await res.json();
    return data.claims || [];
  },

  async getReport(id: string): Promise<Report> {
    const res = await fetch(`${API_BASE}/api/research/${id}/report`);
    if (!res.ok) throw new Error("Failed to load report");
    return res.json();
  },

  async getTimeline(id: string): Promise<TimelineEvent[]> {
    const res = await fetch(`${API_BASE}/api/research/${id}/timeline`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  },

  async getHistory(): Promise<ResearchSession[]> {
    const res = await fetch(`${API_BASE}/api/history`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.sessions || [];
  },

  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/documents`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload document");
    return res.json() as Promise<{ id: string; filename: string; pages: number; status: string; message: string }>;
  },

  getStreamUrl(id: string): string {
    return `${API_BASE}/api/research/${id}/stream`;
  }
};
