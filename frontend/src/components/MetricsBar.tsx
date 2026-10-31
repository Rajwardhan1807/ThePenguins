"use client";

import React from "react";
import { ResearchStatistics } from "@/lib/api";

interface MetricsBarProps {
  statistics: ResearchStatistics;
  modelName?: string;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ statistics }) => {
  const confidenceScore = statistics.overall_confidence || 0;

  const getConfidenceStyle = (score: number) => {
    if (score >= 75) return { color: "#4edea3", border: "border-[#10b981]", label: "HIGH CORROBORATION" };
    if (score >= 50) return { color: "#ffb77d", border: "border-[#d97706]", label: "MODERATE TENSION" };
    return { color: "#ffb4ab", border: "border-[#dc2626]", label: "UNRESOLVED SCHISM" };
  };

  const confInfo = getConfidenceStyle(confidenceScore);

  return (
    <div className="w-full border border-[#222735] bg-[#0b0e14]">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#222735]">
        {/* Cell 1: Sources Discovered */}
        <div className="p-3 sm:p-4 bg-[#0e1117] flex flex-col justify-between">
          <span className="text-[10px] font-mono text-[#a38c7c] uppercase tracking-wider block mb-1">
            Sources Ingested
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#f1f5f9] tabular-nums">
              {statistics.sources_discovered}
            </span>
            <span className="text-[10px] font-mono text-[#a38c7c]">Discovered</span>
          </div>
        </div>

        {/* Cell 2: Relevant Sources */}
        <div className="p-3 sm:p-4 bg-[#0e1117] flex flex-col justify-between">
          <span className="text-[10px] font-mono text-[#a38c7c] uppercase tracking-wider block mb-1">
            Corpus Filtered
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#ffb77d] tabular-nums">
              {statistics.sources_relevant}
            </span>
            <span className="text-[10px] font-mono text-[#a38c7c]">Relevant</span>
          </div>
        </div>

        {/* Cell 3: Claims Extracted */}
        <div className="p-3 sm:p-4 bg-[#0e1117] flex flex-col justify-between">
          <span className="text-[10px] font-mono text-[#a38c7c] uppercase tracking-wider block mb-1">
            Assertions Parsed
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#f1f5f9] tabular-nums">
              {statistics.claims_identified}
            </span>
            <span className="text-[10px] font-mono text-[#a38c7c]">Claims</span>
          </div>
        </div>

        {/* Cell 4: Verified Statutory */}
        <div className="p-3 sm:p-4 bg-[#0e1117] flex flex-col justify-between">
          <span className="text-[10px] font-mono text-[#a38c7c] uppercase tracking-wider block mb-1">
            Verified Statutory
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-[#4edea3] tabular-nums">
              {statistics.claims_verified}
            </span>
            <span className="text-[10px] font-mono text-[#4edea3]">Audited</span>
          </div>
        </div>

        {/* Cell 5: Conflicts Detected */}
        <div className="p-3 sm:p-4 bg-[#0e1117] flex flex-col justify-between">
          <span className="text-[10px] font-mono text-[#a38c7c] uppercase tracking-wider block mb-1">
            Methodological Schisms
          </span>
          <div className="flex items-baseline justify-between">
            <span
              className={`font-mono text-2xl font-bold tabular-nums ${
                statistics.conflicts_detected > 0 ? "text-[#ffb77d]" : "text-[#f1f5f9]"
              }`}
            >
              {statistics.conflicts_detected}
            </span>
            <span className="text-[10px] font-mono text-[#ffb77d]">Contested</span>
          </div>
        </div>

        {/* Cell 6: Mathematical Confidence */}
        <div className="p-3 sm:p-4 bg-[#131720] flex flex-col justify-between border-l-2 border-[#d97706]">
          <span className="text-[10px] font-mono text-[#a38c7c] uppercase tracking-wider block mb-1">
            Epistemic Confidence
          </span>
          <div className="flex items-baseline justify-between">
            <span
              className="font-mono text-2xl font-bold tabular-nums"
              style={{ color: confInfo.color }}
            >
              {confidenceScore}%
            </span>
            <span className="text-[9px] font-mono text-[#a38c7c] uppercase">{confInfo.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
