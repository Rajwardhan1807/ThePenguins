"use client";

import React from "react";
import { CheckCircle2, Loader2, Clock, AlertTriangle, ChevronRight, Terminal } from "lucide-react";
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
          <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded text-[11px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case "running":
        return (
          <span className="flex items-center space-x-1 text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded text-[11px] font-medium animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Active</span>
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center space-x-1 text-rose-400 bg-rose-950/60 border border-rose-800/40 px-2 py-0.5 rounded text-[11px] font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Waiting</span>
          </span>
        );
    }
  };

  const researcherEvents = events.filter((e) => e.agent === "Research Agent");
  const factCheckerEvents = events.filter((e) => e.agent === "Fact-Check Agent");
  const writerEvents = events.filter((e) => e.agent === "Writer Agent");

  return (
    <div className="w-full glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-white/5 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white tracking-wide">Multi-Agent Workflow Pipeline</h2>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              Live Telemetry
            </span>
          </div>
          {currentStep && (
            <p className="text-xs text-cyan-300 font-mono mt-1 flex items-center space-x-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{currentStep}</span>
            </p>
          )}
        </div>
      </div>

      {/* 3 Columns for 3 Agents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 01 Research Agent */}
        <div
          className={`p-4 rounded-xl border transition duration-300 flex flex-col justify-between ${
            agents.researcher === "running"
              ? "bg-cyan-950/20 border-cyan-500/50 shadow-lg shadow-cyan-950/50"
              : agents.researcher === "completed"
              ? "bg-slate-900/60 border-slate-700/60"
              : "bg-slate-900/30 border-slate-800/40 opacity-70"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-semibold text-cyan-400">STAGE 01</span>
              {getStatusBadge(agents.researcher)}
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Research Agent</h3>
            <p className="text-[11px] text-slate-400 mb-3">Multi-query search & source scraping</p>

            {/* Event list */}
            <div className="space-y-1.5 min-h-[100px]">
              {researcherEvents.slice(-4).map((ev, i) => (
                <div key={i} className="text-xs text-slate-300 flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{ev.step}</span>
                </div>
              ))}
              {researcherEvents.length === 0 && agents.researcher === "running" && (
                <div className="text-xs text-slate-500 italic flex items-center space-x-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Generating queries and scraping...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 02 Fact-Check Agent */}
        <div
          className={`p-4 rounded-xl border transition duration-300 flex flex-col justify-between ${
            agents.fact_checker === "running"
              ? "bg-purple-950/20 border-purple-500/50 shadow-lg shadow-purple-950/50"
              : agents.fact_checker === "completed"
              ? "bg-slate-900/60 border-slate-700/60"
              : "bg-slate-900/30 border-slate-800/40 opacity-70"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-semibold text-purple-400">STAGE 02</span>
              {getStatusBadge(agents.fact_checker)}
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Fact-Check Agent</h3>
            <p className="text-[11px] text-slate-400 mb-3">Claim extraction & conflict detection</p>

            {/* Event list */}
            <div className="space-y-1.5 min-h-[100px]">
              {factCheckerEvents.slice(-4).map((ev, i) => {
                const isConflict = ev.step.toLowerCase().includes("conflict") || ev.detail?.toLowerCase().includes("conflict");
                return (
                  <div key={i} className="text-xs text-slate-300 flex items-start space-x-1.5">
                    {isConflict ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    )}
                    <span className="line-clamp-2">{ev.step}</span>
                  </div>
                );
              })}
              {factCheckerEvents.length === 0 && agents.fact_checker === "running" && (
                <div className="text-xs text-slate-500 italic flex items-center space-x-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span>Cross-verifying claims across sources...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 03 Writer Agent */}
        <div
          className={`p-4 rounded-xl border transition duration-300 flex flex-col justify-between ${
            agents.writer === "running"
              ? "bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/50"
              : agents.writer === "completed"
              ? "bg-slate-900/60 border-slate-700/60"
              : "bg-slate-900/30 border-slate-800/40 opacity-70"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-semibold text-emerald-400">STAGE 03</span>
              {getStatusBadge(agents.writer)}
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Writer Agent</h3>
            <p className="text-[11px] text-slate-400 mb-3">Evidence synthesis & cited reporting</p>

            {/* Event list */}
            <div className="space-y-1.5 min-h-[100px]">
              {writerEvents.slice(-4).map((ev, i) => (
                <div key={i} className="text-xs text-slate-300 flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{ev.step}</span>
                </div>
              ))}
              {writerEvents.length === 0 && agents.writer === "running" && (
                <div className="text-xs text-slate-500 italic flex items-center space-x-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Synthesizing findings and citing evidence...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal log ticker at bottom */}
      {events.length > 0 && (
        <div className="mt-5 p-2.5 rounded-lg bg-[#04060a] border border-slate-800/80 font-mono text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-500">[{events[events.length - 1].agent}]:</span>
            <span className="text-slate-300 truncate">{events[events.length - 1].step}</span>
            {events[events.length - 1].detail && (
              <span className="text-slate-500 hidden sm:inline truncate">— {events[events.length - 1].detail}</span>
            )}
          </div>
          <span className="text-[10px] text-slate-600 shrink-0 pl-2">
            {events[events.length - 1].timestamp.slice(11, 19)} UTC
          </span>
        </div>
      )}
    </div>
  );
};
