"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  AlertTriangle,
  ExternalLink,
  RotateCw,
  FileText,
  Copy,
  Info,
  X
} from "lucide-react";
import { OriginalityFinding, OriginalityReport } from "@/lib/api";

interface PaperOriginalityModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: OriginalityReport | null;
  findings: OriginalityFinding[];
  onApplySuggestion: (finding: OriginalityFinding) => void;
  onRerunCheck: () => void;
  isLoading: boolean;
}

export const PaperOriginalityModal: React.FC<PaperOriginalityModalProps> = ({
  isOpen,
  onClose,
  report,
  findings,
  onApplySuggestion,
  onRerunCheck,
  isLoading,
}) => {
  const [filter, setFilter] = useState<"all" | "missing_citation" | "high_overlap" | "duplicates">("all");
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleApply = (f: OriginalityFinding) => {
    onApplySuggestion(f);
    setAppliedIds((prev) => new Set([...prev, f.id]));
  };

  const filteredFindings = findings.filter((f) => {
    if (filter === "missing_citation") return f.needs_citation;
    if (filter === "high_overlap") return f.matched_source && !f.matched_source.includes("Duplicate");
    if (filter === "duplicates") return f.matched_source && f.matched_source.includes("Duplicate");
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-[#191c22] border border-[#222735] max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222735] bg-[#101319]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ffb77d]/10 border border-[#ffb77d]/30 text-[#ffb77d]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#ffb77d]">
                <span>Originality & Citation Verification Audit</span>
                <span className="text-[#a38c7c]">•</span>
                <span className="text-[#4edea3]">Local Lexical Analysis</span>
              </div>
              <h2 className="font-serif text-lg text-[#e1e2eb] font-normal">
                Passage-by-Passage Originality & Attribution Review
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRerunCheck}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#191c22] hover:bg-[#272a31] border border-[#222735] text-xs font-mono text-[#b9c8de] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Re-run Audit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#a38c7c] hover:text-[#e1e2eb] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statistical Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-4 bg-[#14171e] border-b border-[#222735] font-mono text-xs">
          <div className="bg-[#101319] p-2.5 border border-[#222735]">
            <span className="text-[#a38c7c] block text-[10px]">PASSAGES REVIEWED</span>
            <span className="text-[#e1e2eb] font-bold text-base">
              {report?.passages_reviewed ?? findings.length}
            </span>
          </div>
          <div className="bg-[#101319] p-2.5 border border-[#222735]">
            <span className="text-[#a38c7c] block text-[10px]">POTENTIAL MATCHES</span>
            <span className="text-[#ffb77d] font-bold text-base">
              {report?.potential_matches ?? findings.filter((f) => f.matched_source && !f.matched_source.includes("Duplicate")).length}
            </span>
          </div>
          <div className="bg-[#101319] p-2.5 border border-[#222735]">
            <span className="text-[#a38c7c] block text-[10px]">MISSING CITATIONS</span>
            <span className="text-[#ffb4ab] font-bold text-base">
              {report?.missing_citations ?? findings.filter((f) => f.needs_citation).length}
            </span>
          </div>
          <div className="bg-[#101319] p-2.5 border border-[#222735]">
            <span className="text-[#a38c7c] block text-[10px]">DUPLICATE PASSAGES</span>
            <span className="text-[#b9c8de] font-bold text-base">
              {report?.duplicate_passages ?? findings.filter((f) => f.matched_source?.includes("Duplicate")).length}
            </span>
          </div>
          <div className="bg-[#101319] p-2.5 border border-[#222735]">
            <span className="text-[#a38c7c] block text-[10px]">HUMAN REVIEW FLAGS</span>
            <span className="text-[#e1e2eb] font-bold text-base">
              {findings.length}
            </span>
          </div>
        </div>

        {/* Disclosure Notice */}
        <div className="px-6 py-2.5 bg-[#101319] border-b border-[#222735] flex items-start gap-2.5 text-[11px] font-sans text-[#a38c7c] leading-relaxed">
          <Info className="w-4 h-4 text-[#ffb77d] shrink-0 mt-0.5" />
          <span>
            {report?.note ||
              "This heuristic analysis compares generated text against collected source abstracts and verifies attribution cues. It does not generate fake Turnitin percentages or make unreliable AI-detector claims. Legitimate domain terms and quotations can produce lexical overlap."}
          </span>
        </div>

        {/* Filter Navigation */}
        <div className="flex items-center gap-2 px-6 py-2 bg-[#191c22] border-b border-[#222735] font-mono text-xs">
          <span className="text-[#a38c7c]">Filter:</span>
          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 text-[11px] border transition-colors ${
              filter === "all"
                ? "bg-[#101319] border-[#ffb77d] text-[#ffb77d]"
                : "border-transparent text-[#a38c7c] hover:text-[#e1e2eb]"
            }`}
          >
            All Findings ({findings.length})
          </button>
          <button
            onClick={() => setFilter("missing_citation")}
            className={`px-2.5 py-1 text-[11px] border transition-colors ${
              filter === "missing_citation"
                ? "bg-[#101319] border-[#ffb4ab] text-[#ffb4ab]"
                : "border-transparent text-[#a38c7c] hover:text-[#e1e2eb]"
            }`}
          >
            Needs Citation ({findings.filter((f) => f.needs_citation).length})
          </button>
          <button
            onClick={() => setFilter("high_overlap")}
            className={`px-2.5 py-1 text-[11px] border transition-colors ${
              filter === "high_overlap"
                ? "bg-[#101319] border-[#ffb77d] text-[#ffb77d]"
                : "border-transparent text-[#a38c7c] hover:text-[#e1e2eb]"
            }`}
          >
            Source Overlap ({findings.filter((f) => f.matched_source && !f.matched_source.includes("Duplicate")).length})
          </button>
          <button
            onClick={() => setFilter("duplicates")}
            className={`px-2.5 py-1 text-[11px] border transition-colors ${
              filter === "duplicates"
                ? "bg-[#101319] border-[#b9c8de] text-[#b9c8de]"
                : "border-transparent text-[#a38c7c] hover:text-[#e1e2eb]"
            }`}
          >
            Duplicates ({findings.filter((f) => f.matched_source?.includes("Duplicate")).length})
          </button>
        </div>

        {/* Findings List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredFindings.length === 0 ? (
            <div className="text-center py-12 bg-[#101319] border border-[#222735]">
              <ShieldCheck className="w-10 h-10 text-[#4edea3] mx-auto mb-2" />
              <div className="text-sm font-mono text-[#e1e2eb]">No Attribution Anomalies Detected</div>
              <p className="text-xs text-[#a38c7c] mt-1">
                Draft passages align with empirical evidence and contain appropriate citations.
              </p>
            </div>
          ) : (
            filteredFindings.map((finding) => {
              const isApplied = appliedIds.has(finding.id);
              return (
                <div
                  key={finding.id}
                  className={`border transition-all ${
                    isApplied
                      ? "bg-[#101319]/60 border-[#4edea3]/40 opacity-70"
                      : "bg-[#101319] border-[#222735] hover:border-[#32353c]"
                  } p-4 space-y-3`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-[#222735] text-[#b9c8de] uppercase text-[10px]">
                        Section: {finding.section_key}
                      </span>
                      {finding.needs_citation ? (
                        <span className="px-1.5 py-0.5 bg-[#93000a]/30 border border-[#ffb4ab]/40 text-[#ffb4ab] text-[10px]">
                          NEEDS CITATION
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-[#d97707]/20 border border-[#ffb77d]/40 text-[#ffb77d] text-[10px]">
                          LEXICAL OVERLAP
                        </span>
                      )}
                    </div>
                    {finding.similarity_note && (
                      <span className="text-[#a38c7c] text-[11px]">{finding.similarity_note}</span>
                    )}
                  </div>

                  {/* Flag Reason */}
                  <div className="text-xs text-[#ffb4ab] font-sans flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{finding.flag_reason}</span>
                  </div>

                  {/* Draft Passage */}
                  <div className="p-3 bg-[#191c22] border-l-2 border-[#ffb77d] text-xs text-[#e1e2eb] font-sans leading-relaxed">
                    <span className="text-[#a38c7c] block text-[10px] font-mono uppercase mb-1">
                      Draft Passage:
                    </span>
                    &ldquo;{finding.passage}&rdquo;
                  </div>

                  {/* Matched Source Info */}
                  {finding.matched_source && (
                    <div className="text-xs font-mono text-[#a38c7c] flex items-center justify-between">
                      <span>Source: <strong className="text-[#dbc2b0]">{finding.matched_source}</strong></span>
                      {finding.matched_url && (
                        <a
                          href={finding.matched_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#ffb77d] hover:underline"
                        >
                          <span>Open Reference</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Suggested Correction */}
                  {finding.suggestion && (
                    <div className="p-3 bg-[#191c22] border-l-2 border-[#4edea3] text-xs text-[#dbc2b0] font-sans leading-relaxed">
                      <span className="text-[#4edea3] block text-[10px] font-mono uppercase mb-1 font-bold">
                        Recommended Legitimate Paraphrasing / Attribution:
                      </span>
                      {finding.suggestion}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222735]">
                    {isApplied ? (
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-[#4edea3]">
                        <Check className="w-3.5 h-3.5" />
                        <span>Suggestion Applied</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApply(finding)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] text-xs font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply Suggestion</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#101319] border-t border-[#222735] flex items-center justify-between">
          <span className="text-xs font-mono text-[#a38c7c]">
            {findings.length} total findings audited against corpus
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#191c22] hover:bg-[#272a31] border border-[#222735] text-xs font-mono text-[#e1e2eb]"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
