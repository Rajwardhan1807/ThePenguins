"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { ArchivalSidebar, DocketTab } from "@/components/ArchivalSidebar";
import { HeroSection } from "@/components/HeroSection";
import { AgentTimeline } from "@/components/AgentTimeline";
import { MetricsBar } from "@/components/MetricsBar";
import { ReportView } from "@/components/ReportView";
import { ClaimConflictExplorer } from "@/components/ClaimConflictExplorer";
import { SourceExplorer } from "@/components/SourceExplorer";
import { DocumentModal } from "@/components/DocumentModal";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { SystemStatusModal } from "@/components/SystemStatusModal";
import { PaperStudio } from "@/components/paper/PaperStudio";
import {
  api,
  ResearchSession,
  Source,
  Claim,
  Report,
  TimelineEvent,
} from "@/lib/api";
import {
  FileText,
  ShieldAlert,
  FolderOpen,
  ArrowLeft,
  Plus,
  Loader2,
  GitCompare,
  FileCheck2
} from "lucide-react";

export default function Home() {
  const [health, setHealth] = useState<any>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // Navigation state
  const [activeDocketTab, setActiveDocketTab] = useState<DocketTab>("briefing");
  const [activeSubTab, setActiveSubTab] = useState<"report" | "claims" | "sources">("report");

  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Initial Health Check
  useEffect(() => {
    api.getHealth()
      .then((h) => setHealth(h))
      .catch((e) => console.error("Health check error:", e));
  }, []);

  // Fetch full session data
  const loadFullSession = async (id: string) => {
    try {
      const sess = await api.getSession(id);
      setSession(sess);

      const [srcs, clms] = await Promise.all([
        api.getSources(id).catch(() => []),
        api.getClaims(id).catch(() => []),
      ]);
      setSources(srcs);
      setClaims(clms);

      if (sess.status === "completed") {
        const rep = await api.getReport(id).catch(() => null);
        setReport(rep);
      }

      const events = await api.getTimeline(id).catch(() => []);
      setTimelineEvents(events);
    } catch (err) {
      console.error("Error loading session:", err);
    }
  };

  // Connect to SSE stream for live updates
  const connectSSE = (researchId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(api.getStreamUrl(researchId));
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "agent_progress") {
          setTimelineEvents((prev) => [
            ...prev,
            {
              agent: data.agent,
              step: data.step,
              detail: data.detail,
              timestamp: data.timestamp,
            },
          ]);
          setSession((prev) =>
            prev ? { ...prev, current_step: `${data.agent}: ${data.step}` } : prev
          );
        } else if (data.type === "state_update") {
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  statistics: data.statistics || prev.statistics,
                  agents: data.agents || prev.agents,
                  confidence: data.confidence !== undefined ? data.confidence : prev.confidence,
                }
              : prev
          );
          // Refetch sources and claims as they populate
          api.getSources(researchId).then(setSources).catch(() => {});
          api.getClaims(researchId).then(setClaims).catch(() => {});
        } else if (data.type === "completed") {
          setIsLoading(false);
          loadFullSession(researchId);
          sse.close();
        } else if (data.type === "error") {
          setIsLoading(false);
          sse.close();
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    sse.onerror = () => {
      // Stream closed or error
    };
  };

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Polling fallback to guarantee state completes even if SSE drops
  useEffect(() => {
    if (!activeSessionId || !isLoading) return;

    const interval = setInterval(async () => {
      try {
        const sess = await api.getSession(activeSessionId);
        setSession(sess);

        if (sess.status === "completed" || sess.status === "failed") {
          setIsLoading(false);
          loadFullSession(activeSessionId);
          clearInterval(interval);
        }
      } catch (e) {
        // ignore
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeSessionId, isLoading]);

  // Start research handler
  const handleStartResearch = async (
    query: string,
    mode: "quick" | "deep" | "document",
    documentIds: string[] = []
  ) => {
    setIsLoading(true);
    setSession(null);
    setSources([]);
    setClaims([]);
    setReport(null);
    setTimelineEvents([]);
    setActiveDocketTab("briefing");
    setActiveSubTab("report");

    try {
      const res = await api.startResearch(query, mode, documentIds);
      setActiveSessionId(res.research_id);

      // Initialize local state immediately
      const initialSession: ResearchSession = {
        id: res.research_id,
        query,
        mode,
        status: "started",
        confidence: 0,
        statistics: {
          sources_discovered: 0,
          sources_relevant: 0,
          claims_identified: 0,
          claims_verified: 0,
          conflicts_detected: 0,
          overall_confidence: 0,
        },
        agents: {
          researcher: "running",
          fact_checker: "waiting",
          writer: "waiting",
        },
        current_step: "Initializing ResearchForge agents...",
        created_at: new Date().toISOString(),
      };
      setSession(initialSession);

      connectSSE(res.research_id);
    } catch (err: any) {
      alert("Failed to start research: " + err.message);
      setIsLoading(false);
    }
  };

  const handleDocumentReady = (docId: string, filename: string) => {
    handleStartResearch(
      `Document Analysis & Evidence Extraction: ${filename}`,
      "document",
      [docId]
    );
  };

  const handleSelectHistorySession = (id: string) => {
    setActiveSessionId(id);
    setActiveDocketTab("briefing");
    loadFullSession(id);
  };

  const handleResetToHome = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setActiveSessionId(null);
    setSession(null);
    setSources([]);
    setClaims([]);
    setReport(null);
    setTimelineEvents([]);
    setIsLoading(false);
    setActiveDocketTab("briefing");
  };

  const handleDocketSelect = (tab: DocketTab) => {
    if (tab === "documents") {
      setIsDocumentModalOpen(true);
      return;
    }
    if (tab === "history") {
      setIsHistoryOpen(true);
      return;
    }
    if (tab === "system") {
      setIsSystemModalOpen(true);
      return;
    }
    setActiveDocketTab(tab);
  };

  const isResearchActive = Boolean(session && activeSessionId);

  return (
    <div className="min-h-screen bg-[#08090b] text-[#e1e2eb] font-sans antialiased flex flex-col">
      {/* Archival Sidebar */}
      <ArchivalSidebar
        activeTab={activeDocketTab}
        onSelectTab={handleDocketSelect}
        backendHealth={health}
        onNewResearch={handleResetToHome}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        sourcesCount={sources.length}
        claimsCount={claims.length}
        hasReport={Boolean(report)}
      />

      {/* Top Header Bar */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenDocuments={() => setIsDocumentModalOpen(true)}
        onNewResearch={handleResetToHome}
        onOpenPaperStudio={() => setActiveDocketTab("paper_studio")}
        onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        activeSessionId={activeSessionId}
        mode={session?.mode}
        backendHealth={health}
      />

      {/* Main Editorial Canvas */}
      <main className="md:pl-72 pt-12 min-h-screen flex-1 flex flex-col bg-[#08090b]">
        {activeDocketTab === "paper_studio" ? (
          <PaperStudio onBackToArchival={() => setActiveDocketTab("briefing")} />
        ) : (
          <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* VIEW 1: Current Briefing */}
            {activeDocketTab === "briefing" && (
            <>
              {!isResearchActive ? (
                /* Research Home Screen */
                <HeroSection onStartResearch={handleStartResearch} isLoading={isLoading} />
              ) : (
                /* Active Research Docket */
                <div className="space-y-6">
                  {/* Top Dossier Title & Navigation Banner */}
                  <div className="p-4 sm:p-5 bg-[#0b0e14] border border-[#222735] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={handleResetToHome}
                        className="p-1.5 border border-[#222735] bg-[#101319] hover:border-[#a38c7c] text-[#a38c7c] hover:text-[#f1f5f9] transition-none cursor-pointer mt-0.5 shrink-0"
                        title="Back to Home / Formulate New Query"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-[#ffb77d] uppercase px-1.5 py-0.2 border border-[#d97706]/40 bg-[#d97706]/10 font-bold">
                            {session?.mode} mode
                          </span>
                          <span className="text-[#a38c7c]">
                            REF-{session?.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <h1 className="font-serif text-xl sm:text-2xl text-[#f1f5f9] mt-1 tracking-tight font-medium">
                          {session?.query}
                        </h1>
                      </div>
                    </div>

                    <button
                      onClick={handleResetToHome}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#191c22] border border-[#222735] hover:border-[#a38c7c] text-[#f1f5f9] transition-none font-mono text-xs uppercase cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#ffb77d]" />
                      <span>New Query</span>
                    </button>
                  </div>

                  {/* Agent Pipeline Sequential Topology */}
                  {session && (
                    <AgentTimeline
                      agents={session.agents}
                      events={timelineEvents}
                      currentStep={session.current_step}
                    />
                  )}

                  {/* High-Density Telemetry Strip */}
                  {session && (
                    <MetricsBar
                      statistics={session.statistics}
                      modelName={health?.ollama?.model}
                    />
                  )}

                  {/* Operational Sub-Tabs */}
                  <div className="border-b border-[#222735] flex items-center gap-4 text-xs font-mono">
                    <button
                      onClick={() => setActiveSubTab("report")}
                      className={`pb-2.5 border-b-2 uppercase tracking-wider flex items-center gap-1.5 transition-none cursor-pointer ${
                        activeSubTab === "report"
                          ? "border-[#ffb77d] text-[#ffb77d] font-bold"
                          : "border-transparent text-[#a38c7c] hover:text-[#f1f5f9]"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Epistemic Ledger</span>
                      {report && <span className="text-[#4edea3] font-bold">●</span>}
                    </button>

                    <button
                      onClick={() => setActiveSubTab("claims")}
                      className={`pb-2.5 border-b-2 uppercase tracking-wider flex items-center gap-1.5 transition-none cursor-pointer ${
                        activeSubTab === "claims"
                          ? "border-[#ffb77d] text-[#ffb77d] font-bold"
                          : "border-transparent text-[#a38c7c] hover:text-[#f1f5f9]"
                      }`}
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>Contradiction Matrix ({claims.length})</span>
                    </button>

                    <button
                      onClick={() => setActiveSubTab("sources")}
                      className={`pb-2.5 border-b-2 uppercase tracking-wider flex items-center gap-1.5 transition-none cursor-pointer ${
                        activeSubTab === "sources"
                          ? "border-[#ffb77d] text-[#ffb77d] font-bold"
                          : "border-transparent text-[#a38c7c] hover:text-[#f1f5f9]"
                      }`}
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Primary Sources ({sources.length})</span>
                    </button>
                  </div>

                  {/* Active Sub-Tab View */}
                  {activeSubTab === "report" && (
                    <div>
                      {report ? (
                        <ReportView report={report} query={session?.query || ""} />
                      ) : (
                        <div className="p-10 border border-[#222735] bg-[#0e1117] text-center space-y-3 font-mono">
                          <Loader2 className="w-6 h-6 text-[#ffb77d] animate-spin mx-auto" />
                          <h3 className="text-sm font-bold text-[#f1f5f9] uppercase tracking-wider">
                            Writer Agent Synthesizing Epistemic Ledger...
                          </h3>
                          <p className="text-xs text-[#a38c7c] max-w-md mx-auto">
                            Corroborating citations, formatting key empirical assertions, and calculating
                            mathematical confidence scores.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSubTab === "claims" && (
                    <ClaimConflictExplorer claims={claims} />
                  )}

                  {activeSubTab === "sources" && (
                    <SourceExplorer sources={sources} />
                  )}
                </div>
              )}
            </>
          )}

          {/* VIEW 2: Primary Source Registry */}
          {activeDocketTab === "sources" && (
            <SourceExplorer sources={sources} />
          )}

          {/* VIEW 3: Contradiction Matrix */}
          {activeDocketTab === "contradictions" && (
            <ClaimConflictExplorer claims={claims} />
          )}

          {/* VIEW 4: Epistemic Ledger (Report) */}
          {activeDocketTab === "report" && (
            <div>
              {report ? (
                <ReportView report={report} query={session?.query || ""} />
              ) : (
                <div className="p-12 border border-[#222735] bg-[#0e1117] text-center space-y-3 font-mono">
                  <FileCheck2 className="w-8 h-8 text-[#a38c7c] mx-auto" />
                  <h3 className="text-sm font-bold text-[#f1f5f9] uppercase tracking-wider">
                    No Epistemic Ledger Compiled Yet
                  </h3>
                  <p className="text-xs text-[#a38c7c] max-w-md mx-auto">
                    Initiate a research docket from the home terminal or select an archived session to review
                    the synthesized report.
                  </p>
                  <button
                    onClick={() => setActiveDocketTab("briefing")}
                    className="mt-2 px-4 py-2 bg-[#d97706] hover:bg-[#ffb77d] text-[#08090b] font-bold text-xs uppercase tracking-wider transition-none cursor-pointer"
                  >
                    Open Research Briefing
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </main>

      {/* Modals & Drawers */}
      <DocumentModal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        onDocumentReady={handleDocumentReady}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSession={handleSelectHistorySession}
      />

      <SystemStatusModal
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
        backendHealth={health}
      />
    </div>
  );
}
