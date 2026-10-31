"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  HelpCircle,
  BarChart3
} from "lucide-react";
import { Claim } from "@/lib/api";

interface ClaimConflictExplorerProps {
  claims: Claim[];
}

export const ClaimConflictExplorer: React.FC<ClaimConflictExplorerProps> = ({ claims }) => {
  const [filter, setFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const conflictCount = claims.filter(
    (c) => c.status === "CONTRADICTED" || (c.contradicting_sources || []).length > 0
  ).length;

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
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#4edea3] bg-[#10b981]/10 border border-[#10b981]">
            STATUTORY CORROBORATED
          </span>
        );
      case "PARTIALLY VERIFIED":
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#ffb77d] bg-[#d97706]/10 border border-[#d97706]">
            PARTIALLY VERIFIED
          </span>
        );
      case "CONTRADICTED":
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#ffb4ab] bg-[#93000a]/20 border border-[#dc2626]">
            SCHISM CRITICAL / CONTRADICTED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#a38c7c] bg-[#131720] border border-[#222735]">
            INSUFFICIENT PROVENANCE
          </span>
        );
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-full space-y-6">
      {/* Editorial Broadsheet Masthead Block */}
      <section className="border border-[#222735] bg-[#0b0e14] p-5 sm:p-6 space-y-4">
        {/* Severity Banner */}
        <div
          className={`border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs ${
            conflictCount > 0
              ? "border-[#d97706] bg-[#d97706]/10 text-[#ffb77d]"
              : "border-[#10b981] bg-[#10b981]/10 text-[#4edea3]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="tracking-wider uppercase font-semibold">
              {conflictCount > 0
                ? `${conflictCount} UNRESOLVED METHODOLOGICAL SCHISMS DETECTED // AUDIT LEVEL: HOSTILE`
                : "CORPUS INTEGRITY NOMINAL // ZERO IRRECONCILABLE DISCREPANCIES"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#a38c7c]">
            <span>TOTAL CLAIMS AUDITED: {claims.length}</span>
          </div>
        </div>

        {/* Header Titles */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
          <div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-[#a38c7c] mb-1">
              FORENSIC DISCREPANCY MATRIX &amp; PROVENANCE RECORD
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#f1f5f9] tracking-tight">
              Contradiction Matrix &amp; Discrepancy Ledger
            </h1>
            <p className="font-serif italic text-[#dbc2b0] text-sm mt-1 max-w-3xl">
              Adversarial reconciliation of conflicting empirical assertions and claims across all ingested
              institutional records.
            </p>
          </div>

          {/* Filter Ribbon */}
          <div className="flex flex-wrap items-center gap-1 font-mono text-xs self-start md:self-end">
            {["ALL", "CONFLICTS", "VERIFIED", "PARTIALLY VERIFIED", "CONTRADICTED"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 uppercase transition-none cursor-pointer border ${
                  filter === f
                    ? "bg-[#ffb77d] text-[#08090b] border-[#ffb77d] font-bold"
                    : "bg-[#101319] text-[#dbc2b0] border-[#222735] hover:border-[#a38c7c]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <div className="border border-[#222735] p-10 text-center bg-[#0e1117] font-mono text-xs text-[#a38c7c]">
            NO CLAIMS MATCH THE SELECTED FILTER CRITERIA.
          </div>
        ) : (
          filteredClaims.map((claimItem, index) => {
            const isExpanded = expandedId === claimItem.id;
            const supSources = claimItem.supporting_sources || [];
            const conSources = claimItem.contradicting_sources || [];
            const hasConflict = conSources.length > 0 || claimItem.status === "CONTRADICTED";

            return (
              <article
                key={claimItem.id}
                className="border border-[#222735] bg-[#0b0e14] transition-none"
              >
                {/* Row Docket Header */}
                <div
                  onClick={() => toggleExpand(claimItem.id)}
                  className="bg-[#101319] px-4 py-3 border-b border-[#222735] flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-[#131720]"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
                    <span className="px-1.5 py-0.5 bg-[#191c22] border border-[#222735] text-[#ffb77d] font-mono text-[11px] font-semibold">
                      VARIABLE {String(index + 1).padStart(2, "0")}
                    </span>
                    <h2 className="font-sans text-sm font-semibold text-[#f1f5f9] tracking-wide truncate">
                      {claimItem.claim}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs shrink-0">
                    <div className="flex items-center gap-1.5 border border-[#222735] px-2 py-0.5 bg-[#0b0e14]">
                      <span className="text-[10px] text-[#a38c7c] uppercase">Confidence</span>
                      <span className="font-bold text-[#ffb77d]">{claimItem.confidence}%</span>
                    </div>

                    {getStatusBadge(claimItem.status)}

                    <button
                      className="p-1 text-[#a38c7c] hover:text-[#f1f5f9] transition-none"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Analysis Snippet Bar */}
                {claimItem.analysis && (
                  <div className="px-4 py-2.5 bg-[#0e1117] border-b border-[#222735] text-xs text-[#dbc2b0] font-sans italic">
                    {claimItem.analysis}
                  </div>
                )}

                {/* Side-by-Side Contested Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#222735]">
                  {/* Side A: Supporting Ingestion */}
                  <div className="p-4 space-y-3 bg-[#0b0e14]">
                    <div className="flex items-center justify-between pb-2 border-b border-[#222735]">
                      <span className="text-[11px] font-mono text-[#4edea3] uppercase font-semibold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>Side A: Corroborating Sources ({supSources.length})</span>
                      </span>
                    </div>

                    {supSources.length === 0 ? (
                      <p className="text-xs text-[#a38c7c] italic font-mono py-2">
                        No direct supporting institutional sources mapped.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {supSources.map((s) => (
                          <div
                            key={s.id}
                            className="p-2.5 bg-[#0e1117] border border-[#222735] text-xs font-mono"
                          >
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-[#f1f5f9] hover:text-[#ffb77d] flex items-center justify-between gap-2"
                            >
                              <span className="line-clamp-1">{s.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-[#a38c7c] shrink-0" />
                            </a>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-[#a38c7c]">
                              <span>{s.domain} • {s.source_type}</span>
                              <span className="text-[#4edea3]">
                                Weight: {Math.round(s.reliability * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Side B: Contradicting / Adversarial Ingestion */}
                  <div className="p-4 space-y-3 bg-[#0b0e14]">
                    <div className="flex items-center justify-between pb-2 border-b border-[#222735]">
                      <span className="text-[11px] font-mono text-[#ffb4ab] uppercase font-semibold flex items-center gap-1.5">
                        <X className="w-3.5 h-3.5" />
                        <span>Side B: Adversarial &amp; Conflicting ({conSources.length})</span>
                      </span>
                    </div>

                    {conSources.length === 0 ? (
                      <p className="text-xs text-[#a38c7c] italic font-mono py-2">
                        Zero contradictory claims or adversarial evidence discovered.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {conSources.map((s) => (
                          <div
                            key={s.id}
                            className="p-2.5 bg-[#191114] border border-[#554336] text-xs font-mono"
                          >
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-[#ffb4ab] hover:text-[#ffdcc3] flex items-center justify-between gap-2"
                            >
                              <span className="line-clamp-1">{s.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-[#ffb4ab] shrink-0" />
                            </a>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-[#a38c7c]">
                              <span>{s.domain} • {s.source_type}</span>
                              <span className="text-[#ffb4ab]">
                                Weight: {Math.round(s.reliability * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mathematical Confidence Breakdown (Expanded) */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-[#222735] bg-[#0e1117] space-y-3">
                    <div className="flex items-center gap-2 font-mono text-xs text-[#a38c7c] uppercase">
                      <BarChart3 className="w-3.5 h-3.5 text-[#ffb77d]" />
                      <span>PRD Epistemic Confidence Matrix Formulation (Section 11)</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                      <div className="p-2.5 bg-[#131720] border border-[#222735]">
                        <div className="text-[10px] text-[#a38c7c] uppercase">30% Reliability</div>
                        <div className="text-base font-bold text-[#ffb77d] mt-0.5">
                          {Math.round(claimItem.source_reliability_score * 100)}%
                        </div>
                      </div>
                      <div className="p-2.5 bg-[#131720] border border-[#222735]">
                        <div className="text-[10px] text-[#a38c7c] uppercase">25% Agreement</div>
                        <div className="text-base font-bold text-[#f1f5f9] mt-0.5">
                          {Math.round(claimItem.source_agreement_score * 100)}%
                        </div>
                      </div>
                      <div className="p-2.5 bg-[#131720] border border-[#222735]">
                        <div className="text-[10px] text-[#a38c7c] uppercase">20% Quality</div>
                        <div className="text-base font-bold text-[#b9c8de] mt-0.5">
                          {Math.round(claimItem.evidence_quality_score * 100)}%
                        </div>
                      </div>
                      <div className="p-2.5 bg-[#131720] border border-[#222735]">
                        <div className="text-[10px] text-[#a38c7c] uppercase">15% Recency</div>
                        <div className="text-base font-bold text-[#f1f5f9] mt-0.5">
                          {Math.round(claimItem.recency_score * 100)}%
                        </div>
                      </div>
                      <div className="p-2.5 bg-[#131720] border border-[#222735]">
                        <div className="text-[10px] text-[#a38c7c] uppercase">10% Cross-Verif</div>
                        <div className="text-base font-bold text-[#4edea3] mt-0.5">
                          {Math.round(claimItem.cross_verification_score * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
