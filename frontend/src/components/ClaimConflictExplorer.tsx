"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flame,
  CheckCircle2,
  XCircle,
  BarChart2
} from "lucide-react";
import { Claim } from "@/lib/api";

interface ClaimConflictExplorerProps {
  claims: Claim[];
}

export const ClaimConflictExplorer: React.FC<ClaimConflictExplorerProps> = ({ claims }) => {
  const [filter, setFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredClaims = claims.filter((c) => {
    const conCount = (c.contradicting_sources || []).length;
    if (filter === "ALL") return true;
    if (filter === "CONFLICTS") return c.status === "CONTRADICTED" || conCount > 0;
    return c.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>VERIFIED</span>
          </span>
        );
      case "PARTIALLY VERIFIED":
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800/50">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>PARTIALLY VERIFIED</span>
          </span>
        );
      case "CONTRADICTED":
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800/50 animate-pulse">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>CONTRADICTED / CONFLICT</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-slate-400 border border-slate-800">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>INSUFFICIENT EVIDENCE</span>
          </span>
        );
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-full space-y-5">
      {/* Header & Filter tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl glass-panel border border-white/10">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Claim Verification & Conflict Matrix</h3>
          <p className="text-xs text-slate-400">
            Cross-source validation with mathematical confidence breakdowns and contradiction detection.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {["ALL", "CONFLICTS", "VERIFIED", "PARTIALLY VERIFIED", "CONTRADICTED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filter === f
                  ? "bg-cyan-500 text-slate-950 font-bold"
                  : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.map((claimItem) => {
          const isExpanded = expandedId === claimItem.id;
          const supSources = claimItem.supporting_sources || [];
          const conSources = claimItem.contradicting_sources || [];
          const hasConflict = conSources.length > 0 || claimItem.status === "CONTRADICTED";

          return (
            <div
              key={claimItem.id}
              className={`rounded-2xl border transition duration-200 overflow-hidden ${
                hasConflict
                  ? "glass-panel border-amber-500/30 hover:border-amber-500/50"
                  : "glass-panel border-white/10 hover:border-cyan-500/30"
              }`}
            >
              {/* Claim Summary Header */}
              <div
                onClick={() => toggleExpand(claimItem.id)}
                className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {getStatusBadge(claimItem.status)}
                    <span className="text-xs font-mono text-slate-400">
                      Confidence: <strong className="text-white">{claimItem.confidence}%</strong>
                    </span>
                    {hasConflict && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/40">
                        {conSources.length} Contradicting Source(s)
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                    {claimItem.claim}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {claimItem.analysis}
                  </p>
                </div>

                {/* Right side stats & toggle */}
                <div className="flex items-center space-x-4 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">Sources</div>
                    <div className="text-xs font-mono font-bold">
                      <span className="text-emerald-400">{supSources.length} Support</span>
                      {" / "}
                      <span className="text-rose-400">{conSources.length} Conflict</span>
                    </div>
                  </div>
                  <button className="p-1 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Verification Details & Cross-Check Sources */}
              {isExpanded && (
                <div className="p-5 border-t border-white/5 bg-[#080d1a]/80 space-y-5">
                  {/* PRD Confidence Scoring Breakdown (Section 11) */}
                  <div>
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 mb-2.5">
                      <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>PRD MATHEMATICAL CONFIDENCE BREAKDOWN</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">30% Reliability</div>
                        <div className="text-sm font-mono font-bold text-cyan-300">
                          {Math.round(claimItem.source_reliability_score * 100)}%
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">25% Agreement</div>
                        <div className="text-sm font-mono font-bold text-sky-300">
                          {Math.round(claimItem.source_agreement_score * 100)}%
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">20% Evidence Quality</div>
                        <div className="text-sm font-mono font-bold text-purple-300">
                          {Math.round(claimItem.evidence_quality_score * 100)}%
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">15% Recency</div>
                        <div className="text-sm font-mono font-bold text-indigo-300">
                          {Math.round(claimItem.recency_score * 100)}%
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">10% Cross-Verif</div>
                        <div className="text-sm font-mono font-bold text-emerald-300">
                          {Math.round(claimItem.cross_verification_score * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Supporting vs Contradicting Sources Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Supporting Sources */}
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-emerald-900/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Supporting Evidence ({supSources.length})</span>
                        </span>
                      </div>
                      {supSources.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No direct supporting sources mapped.</p>
                      ) : (
                        <div className="space-y-2">
                          {supSources.map((s) => (
                            <div key={s.id} className="p-2.5 rounded-lg bg-[#0a0f1d] border border-slate-800 text-xs">
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-slate-200 hover:text-cyan-300 flex items-center justify-between gap-1 group"
                              >
                                <span className="line-clamp-1">{s.title}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                              </a>
                              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                                <span>{s.domain} • {s.source_type}</span>
                                <span className="text-emerald-400 font-mono font-semibold">
                                  {Math.round(s.reliability * 100)}% Reliable
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Contradicting Sources */}
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-rose-900/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-rose-400 flex items-center space-x-1.5">
                          <XCircle className="w-4 h-4" />
                          <span>Contradicting / Conflicting Sources ({conSources.length})</span>
                        </span>
                      </div>
                      {conSources.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No contradicting sources identified.</p>
                      ) : (
                        <div className="space-y-2">
                          {conSources.map((s) => (
                            <div key={s.id} className="p-2.5 rounded-lg bg-[#1a0f14] border border-rose-900/40 text-xs">
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-rose-200 hover:text-rose-100 flex items-center justify-between gap-1 group"
                              >
                                <span className="line-clamp-1">{s.title}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-rose-400 group-hover:text-white shrink-0" />
                              </a>
                              <div className="mt-1 flex items-center justify-between text-[10px] text-rose-300/70">
                                <span>{s.domain} • {s.source_type}</span>
                                <span className="font-mono font-semibold">
                                  {Math.round(s.reliability * 100)}% Reliable
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
