"use client";

import React from "react";
import { Check, Loader2, Clock, AlertTriangle, Terminal, ChevronRight } from "lucide-react";
import { AgentStates, TimelineEvent } from "@/lib/api";

interface AgentTimelineProps {
  agents: AgentStates;
  events: TimelineEvent[];
  currentStep?: string;
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({ agents, events, currentStep }) => {
  const getStatusBadge = (state: "waiting" | "running" | "completed" | "failed") => {
    switch (state) {
      case "completed":
        return (
          <span className="flex items-center gap-1.5 text-[#4edea3] bg-[#10b981]/10 border border-[#10b981] px-2 py-0.5 text-[10px] font-mono font-medium uppercase">
            <Check className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case "running":
        return (
          <span className="flex items-center gap-1.5 text-[#ffb77d] bg-[#d97706]/10 border border-[#d97706] px-2 py-0.5 text-[10px] font-mono font-medium uppercase animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Active Audit</span>
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1.5 text-[#ffb4ab] bg-[#93000a]/20 border border-[#dc2626] px-2 py-0.5 text-[10px] font-mono font-medium uppercase">
            <AlertTriangle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-[#a38c7c] bg-[#131720] border border-[#222735] px-2 py-0.5 text-[10px] font-mono font-medium uppercase">
            <Clock className="w-3 h-3" />
            <span>Waiting</span>
          </span>
        );
    }
  };

  const researcherEvents = events.filter((e) => e.agent === "Research Agent");
  const factCheckerEvents = events.filter((e) => e.agent === "Fact-Check Agent");
  const writerEvents = events.filter((e) => e.agent === "Writer Agent");

  return (
    <section className="w-full border border-[#222735] bg-[#0e1117]">
      {/* Topology Header */}
      <div className="px-5 py-3.5 border-b border-[#222735] bg-[#101319] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#ffb77d] uppercase tracking-wider font-semibold">
            Sequential Pipeline Topology
          </span>
          <span className="text-[#a38c7c] text-xs">/</span>
          <span className="text-[11px] font-mono text-[#a38c7c] uppercase">
            DAG Mode: Acyclic Strict Swarm
          </span>
        </div>
        {currentStep && (
          <div className="font-mono text-xs text-[#ffb77d] flex items-center gap-1.5 truncate max-w-md">
            <ChevronRight className="w-3.5 h-3.5 text-[#ffb77d] shrink-0" />
            <span className="truncate">{currentStep}</span>
          </div>
        )}
      </div>

      {/* 3 Sequential Node Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#222735]">
        {/* Node 01: Research Agent */}
        <div
          className={`p-5 flex flex-col justify-between transition-none ${
            agents.researcher === "running" ? "bg-[#131720] border-l-2 border-[#ffb77d]" : "bg-[#0e1117]"
          }`}
        >
          <div>
            <div className="flex items-start justify-between mb-2">
              <span className="font-mono text-xs text-[#a38c7c]">NODE // 01</span>
              {getStatusBadge(agents.researcher)}
            </div>
            <h3 className="font-serif text-base text-[#f1f5f9] mb-1 font-medium">Research Agent</h3>
            <p className="text-xs text-[#dbc2b0] mb-3">
              Formulation of search queries &amp; extraction of empirical sources.
            </p>

            {/* Event List */}
            <div className="space-y-1.5 min-h-[90px] font-mono text-xs border-t border-[#222735] pt-2.5">
              {researcherEvents.slice(-3).map((ev, i) => (
                <div key={i} className="text-[#dbc2b0] flex items-start gap-1.5">
                  <span className="text-[#4edea3] mt-0.5">✓</span>
                  <span className="line-clamp-2 text-[11px]">{ev.step}</span>
                </div>
              ))}
              {researcherEvents.length === 0 && agents.researcher === "running" && (
                <div className="text-[#a38c7c] italic text-xs flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-[#ffb77d]" />
                  <span>Generating queries and scraping corpus...</span>
                </div>
              )}
              {agents.researcher === "waiting" && (
                <span className="text-[11px] text-[#554336] italic">Node in queue</span>
              )}
            </div>
          </div>
        </div>

        {/* Node 02: Fact-Check Agent */}
        <div
          className={`p-5 flex flex-col justify-between transition-none ${
            agents.fact_checker === "running" ? "bg-[#131720] border-l-2 border-[#ffb77d]" : "bg-[#0e1117]"
          }`}
        >
          <div>
            <div className="flex items-start justify-between mb-2">
              <span className="font-mono text-xs text-[#a38c7c]">NODE // 02</span>
              {getStatusBadge(agents.fact_checker)}
            </div>
            <h3 className="font-serif text-base text-[#f1f5f9] mb-1 font-medium">Fact-Check Agent</h3>
            <p className="text-xs text-[#dbc2b0] mb-3">
              Claim atomization, source reliability assessment, &amp; contradiction detection.
            </p>

            {/* Event List */}
            <div className="space-y-1.5 min-h-[90px] font-mono text-xs border-t border-[#222735] pt-2.5">
              {factCheckerEvents.slice(-3).map((ev, i) => {
                const isConflict =
                  ev.step.toLowerCase().includes("conflict") ||
                  ev.detail?.toLowerCase().includes("conflict");
                return (
                  <div key={i} className="text-[#dbc2b0] flex items-start gap-1.5">
                    <span className={isConflict ? "text-[#ffb77d] mt-0.5" : "text-[#4edea3] mt-0.5"}>
                      {isConflict ? "⚠" : "✓"}
                    </span>
                    <span className="line-clamp-2 text-[11px]">{ev.step}</span>
                  </div>
                );
              })}
              {factCheckerEvents.length === 0 && agents.fact_checker === "running" && (
                <div className="text-[#a38c7c] italic text-xs flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-[#ffb77d]" />
                  <span>Auditing claim integrity &amp; cross-verifying...</span>
                </div>
              )}
              {agents.fact_checker === "waiting" && (
                <span className="text-[11px] text-[#554336] italic">Node in queue</span>
              )}
            </div>
          </div>
        </div>

        {/* Node 03: Writer Agent */}
        <div
          className={`p-5 flex flex-col justify-between transition-none ${
            agents.writer === "running" ? "bg-[#131720] border-l-2 border-[#ffb77d]" : "bg-[#0e1117]"
          }`}
        >
          <div>
            <div className="flex items-start justify-between mb-2">
              <span className="font-mono text-xs text-[#a38c7c]">NODE // 03</span>
              {getStatusBadge(agents.writer)}
            </div>
            <h3 className="font-serif text-base text-[#f1f5f9] mb-1 font-medium">Writer Agent</h3>
            <p className="text-xs text-[#dbc2b0] mb-3">
              Epistemic brief synthesis, key findings adjudication, &amp; citation ledger.
            </p>

            {/* Event List */}
            <div className="space-y-1.5 min-h-[90px] font-mono text-xs border-t border-[#222735] pt-2.5">
              {writerEvents.slice(-3).map((ev, i) => (
                <div key={i} className="text-[#dbc2b0] flex items-start gap-1.5">
                  <span className="text-[#4edea3] mt-0.5">✓</span>
                  <span className="line-clamp-2 text-[11px]">{ev.step}</span>
                </div>
              ))}
              {writerEvents.length === 0 && agents.writer === "running" && (
                <div className="text-[#a38c7c] italic text-xs flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-[#ffb77d]" />
                  <span>Compiling formal broadsheet report...</span>
                </div>
              )}
              {agents.writer === "waiting" && (
                <span className="text-[11px] text-[#554336] italic">Node in queue</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Live Ticker */}
      {events.length > 0 && (
        <div className="border-t border-[#222735] bg-[#08090b] px-4 py-2 font-mono text-[11px] text-[#dbc2b0] flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <Terminal className="w-3.5 h-3.5 text-[#ffb77d] shrink-0" />
            <span className="text-[#a38c7c]">[{events[events.length - 1].agent}]:</span>
            <span className="text-[#e1e2eb] truncate">{events[events.length - 1].step}</span>
            {events[events.length - 1].detail && (
              <span className="text-[#a38c7c] hidden sm:inline truncate">
                — {events[events.length - 1].detail}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#a38c7c] shrink-0 pl-3">
            {events[events.length - 1].timestamp.slice(11, 19)} UTC
          </span>
        </div>
      )}
    </section>
  );
};
