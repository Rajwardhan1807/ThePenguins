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

// ── Research Paper Studio API types ────────────────────────────────────────

export interface Paper {
  id: string;
  title: string;
  research_question: string;
  objectives: string;
  field: string;
  paper_type: string;
  citation_style: string;
  target_word_count: number;
  research_depth: string;
  language: string;
  target_audience: string;
  abstract: string;
  status: "draft" | "processing" | "completed" | "failed";
  current_stage: string;
  plan?: ResearchPlan;
  sections?: PaperSection[];
  references_json?: any;
  originality_report?: OriginalityReport;
  created_at: string;
  updated_at: string;
}

export interface ResearchPlan {
  problem_statement: string;
  research_gaps: string[];
  research_questions: string[];
  objectives: string[];
  search_keywords: string[];
  methodology_approach: string;
  outline: string[];
  evidence_needed: string[];
  expected_limitations: string[];
}

export interface PaperSection {
  id: string;
  paper_id: string;
  section_key: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: "pending" | "generated" | "edited" | "regenerated" | "pending_user";
  updated_at: string;
}

export interface PaperSource {
  id: string;
  paper_id: string;
  title: string;
  authors: string;
  year: string;
  journal: string;
  doi: string;
  url: string;
  abstract: string;
  snippet: string;
  source_type: string;
  reliability: number;
  relevance: number;
  verified: boolean | number;
}

export interface OriginalityFinding {
  id: string;
  paper_id: string;
  passage: string;
  matched_source: string;
  matched_url: string;
  similarity_note: string;
  flag_reason: string;
  suggestion: string;
  needs_citation: boolean;
  section_key: string;
  created_at: string;
}

export interface OriginalityReport {
  passages_reviewed: number;
  potential_matches: number;
  missing_citations: number;
  duplicate_passages: number;
  findings_count: number;
  note: string;
}

export interface PaperJob {
  id: string;
  paper_id: string;
  job_type: string;
  status: "pending" | "running" | "done" | "failed";
  stage: string;
  progress: number;
  error?: string;
  created_at: string;
  updated_at: string;
}

export const paperApi = {
  async createPaper(data: Partial<Paper>): Promise<Paper> {
    const res = await fetch(`${API_BASE}/api/papers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create paper");
    return res.json();
  },

  async listPapers(): Promise<Paper[]> {
    const res = await fetch(`${API_BASE}/api/papers`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.papers || [];
  },

  async getPaper(id: string): Promise<Paper> {
    const res = await fetch(`${API_BASE}/api/papers/${id}`);
    if (!res.ok) throw new Error("Paper not found");
    return res.json();
  },

  async updatePaper(id: string, data: Partial<Paper>): Promise<Paper> {
    const res = await fetch(`${API_BASE}/api/papers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update paper");
    return res.json();
  },

  async deletePaper(id: string): Promise<void> {
    await fetch(`${API_BASE}/api/papers/${id}`, { method: "DELETE" });
  },

  async generatePlan(id: string): Promise<{ job_id: string; status: string }> {
    const res = await fetch(`${API_BASE}/api/papers/${id}/plan`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to start plan generation");
    return res.json();
  },

  async collectSources(id: string): Promise<{ job_id: string; status: string }> {
    const res = await fetch(`${API_BASE}/api/papers/${id}/sources`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to start source collection");
    return res.json();
  },

  async generatePaper(id: string): Promise<{ job_id: string; status: string }> {
    const res = await fetch(`${API_BASE}/api/papers/${id}/generate`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to start paper generation");
    return res.json();
  },

  async getPaperStatus(id: string): Promise<{
    paper_status: string;
    current_stage: string;
    job?: PaperJob;
    sections_count: number;
    total_words: number;
  }> {
    const res = await fetch(`${API_BASE}/api/papers/${id}/status`);
    if (!res.ok) throw new Error("Failed to get status");
    return res.json();
  },

  async getSections(id: string): Promise<PaperSection[]> {
    const res = await fetch(`${API_BASE}/api/papers/${id}/sections`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.sections || [];
  },

  async updateSection(paperId: string, sectionId: string, content: string): Promise<PaperSection> {
    const res = await fetch(`${API_BASE}/api/papers/${paperId}/sections/${sectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error("Failed to update section");
    return res.json();
  },

  async regenerateSection(paperId: string, sectionKey: string): Promise<void> {
    await fetch(`${API_BASE}/api/papers/${paperId}/sections/${sectionKey}/regenerate`, { method: "POST" });
  },

  async transformSection(paperId: string, sectionKey: string, action: "clarity" | "expand" | "shorten"): Promise<PaperSection> {
    const res = await fetch(`${API_BASE}/api/papers/${paperId}/sections/${sectionKey}/transform`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error(`Transform ${action} failed`);
    return res.json();
  },

  async addSource(paperId: string, source: Partial<PaperSource>): Promise<PaperSource> {
    const res = await fetch(`${API_BASE}/api/papers/${paperId}/sources/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(source),
    });
    if (!res.ok) throw new Error("Failed to add source");
    return res.json();
  },

  async changeCitationStyle(paperId: string, citation_style: string): Promise<{ citation_style: string; references: string }> {
    const res = await fetch(`${API_BASE}/api/papers/${paperId}/citation-style`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ citation_style }),
    });
    if (!res.ok) throw new Error("Failed to change citation style");
    return res.json();
  },

  async createRevision(paperId: string, revision_label?: string): Promise<{ id: string; label: string; created_at: string }> {
    const res = await fetch(`${API_BASE}/api/papers/${paperId}/revisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revision_label }),
    });
    if (!res.ok) throw new Error("Failed to create revision");
    return res.json();
  },

  async getRevisions(paperId: string): Promise<Array<{ id: string; paper_id: string; revision_label: string; created_at: string }>> {
    const res = await fetch(`${API_BASE}/api/papers/${paperId}/revisions`);
    if (!res.ok) return [];
    return res.json();
  },

  async restoreRevision(paperId: string, revisionId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/papers/${paperId}/revisions/${revisionId}/restore`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to restore revision");
  },

  async getEvidence(id: string): Promise<{ sources: PaperSource[]; originality_findings: OriginalityFinding[] }> {
    const res = await fetch(`${API_BASE}/api/papers/${id}/evidence`);
    if (!res.ok) return { sources: [], originality_findings: [] };
    return res.json();
  },

  async runOriginalityCheck(id: string): Promise<{ job_id: string; status: string }> {
    const res = await fetch(`${API_BASE}/api/papers/${id}/originality-check`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to start originality check");
    return res.json();
  },

  async getReferences(id: string): Promise<{ style: string; references: string; count: number }> {
    const res = await fetch(`${API_BASE}/api/papers/${id}/references`);
    if (!res.ok) return { style: "APA 7", references: "", count: 0 };
    return res.json();
  },

  async exportPaper(id: string, format: "markdown" | "docx" | "pdf"): Promise<Blob> {
    const res = await fetch(`${API_BASE}/api/papers/${id}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format }),
    });
    if (!res.ok) throw new Error("Export failed");
    return res.blob();
  },
};

