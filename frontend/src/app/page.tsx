"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { AgentTimeline } from "@/components/AgentTimeline";
import { MetricsBar } from "@/components/MetricsBar";
import { ReportView } from "@/components/ReportView";
import { ClaimConflictExplorer } from "@/components/ClaimConflictExplorer";
import { SourceExplorer } from "@/components/SourceExplorer";
import { DocumentModal } from "@/components/DocumentModal";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import {
  api,
  ResearchSession,
  Source,
  Claim,
  Report,
  TimelineEvent,
  AgentStates,
  ResearchStatistics,
} from "@/lib/api";
import { FileText, ShieldAlert, Sparkles, PlusCircle, ArrowLeft } from "lucide-react";

export default function Home() {
  const [health, setHealth] = useState<any>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"report" | "claims" | "sources">("report");

  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

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
    setActiveTab("report");

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
  };

  const isResearchActive = Boolean(session && activeSessionId);

  return (
    <div className="min-h-screen flex flex-col bg-[#07090e] text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Global Header */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenDocuments={() => setIsDocumentModalOpen(true)}
        backendHealth={health}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {!isResearchActive ? (
          /* Home Screen */
          <HeroSection onStartResearch={handleStartResearch} isLoading={isLoading} />
        ) : (
          /* Active Research Dashboard */
          <div className="py-6 space-y-6 animate-fade-in">
            {/* Top Navigation & Query Banner */}
            <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <button
                  onClick={handleResetToHome}
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition shrink-0 mt-0.5"
                  title="Back to Home / New Research"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                      {session?.mode} mode
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ID: {session?.id}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                    {session?.query}
                  </h2>
                </div>
              </div>

              <button
                onClick={handleResetToHome}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition text-xs font-semibold shrink-0"
              >
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                <span>New Research</span>
              </button>
            </div>

            {/* Agent Pipeline Visual Progression */}
            {session && (
              <AgentTimeline
                agents={session.agents}
                events={timelineEvents}
                currentStep={session.current_step}
              />
            )}

            {/* Real-time Statistics Bar */}
            {session && (
              <MetricsBar
                statistics={session.statistics}
                modelName={health?.ollama?.model}
              />
            )}

            {/* Tabs for Intelligence Workspace */}
            <div className="border-b border-white/10 flex items-center space-x-4 text-sm font-medium">
              <button
                onClick={() => setActiveTab("report")}
                className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
                  activeTab === "report"
                    ? "border-cyan-400 text-cyan-300 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Research Report</span>
                {report && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("claims")}
                className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
                  activeTab === "claims"
                    ? "border-cyan-400 text-cyan-300 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Claims & Conflicts</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                  {claims.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("sources")}
                className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
                  activeTab === "sources"
                    ? "border-cyan-400 text-cyan-300 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Source Explorer</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                  {sources.length}
                </span>
              </button>
            </div>

            {/* Tab Panels */}
            {activeTab === "report" && (
              <div>
                {report ? (
                  <ReportView report={report} query={session?.query || ""} />
                ) : (
                  <div className="p-12 text-center glass-panel rounded-2xl border border-white/10 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center mx-auto text-cyan-400 animate-pulse">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white">Synthesizing Research Report</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Writer Agent is compiling verified evidence snippets, claims, and cross-source citations.
                      The cited report will appear here upon completion.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "claims" && (
              <ClaimConflictExplorer claims={claims} />
            )}

            {activeTab === "sources" && (
              <SourceExplorer sources={sources} />
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
    </div>
  );
}
