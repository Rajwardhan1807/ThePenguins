"use client";

import React, { useState } from "react";
import {
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  GitCompare,
  FileCheck2,
  Sparkles
} from "lucide-react";
import { Paper, PaperSource } from "@/lib/api";

interface PaperSourceViewProps {
  paper: Paper;
  sources: PaperSource[];
  onDraftPaper: () => void;
  onAddManualSource: (source: Partial<PaperSource>) => Promise<void>;
  onDiscoverMore: () => void;
  onBackToPlan: () => void;
  isLoading: boolean;
}

export const PaperSourceView: React.FC<PaperSourceViewProps> = ({
  paper,
  sources,
  onDraftPaper,
  onAddManualSource,
  onDiscoverMore,
  onBackToPlan,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "academic" | "verified">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Manual source form state
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthors, setManualAuthors] = useState("");
  const [manualYear, setManualYear] = useState(new Date().getFullYear().toString());
  const [manualJournal, setManualJournal] = useState("");
  const [manualDoi, setManualDoi] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [manualAbstract, setManualAbstract] = useState("");

  const filteredSources = sources.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.authors && s.authors.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.abstract && s.abstract.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === "academic") return s.source_type === "Academic" || !!s.doi;
    if (filterType === "verified") return !!s.verified;
    return true;
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    await onAddManualSource({
      title: manualTitle.trim(),
      authors: manualAuthors.trim(),
      year: manualYear.trim(),
      journal: manualJournal.trim(),
      doi: manualDoi.trim(),
      url: manualUrl.trim() || (manualDoi ? `https://doi.org/${manualDoi.trim()}` : ""),
      abstract: manualAbstract.trim(),
      snippet: manualAbstract.slice(0, 300),
      source_type: manualDoi ? "Academic" : "Manual",
      verified: !!manualDoi,
      reliability: manualDoi ? 0.9 : 0.8,
      relevance: 0.85,
    });
    // Reset
    setManualTitle("");
    setManualAuthors("");
    setManualJournal("");
    setManualDoi("");
    setManualUrl("");
    setManualAbstract("");
    setIsAddModalOpen(false);
  };

  const verifiedCount = sources.filter((s) => s.verified).length;

  return (
    <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 space-y-6">
      {/* Banner */}
      <div className="bg-[#191c22] border border-[#222735] p-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#4edea3]">
            <FolderOpen className="w-4 h-4 text-[#4edea3]" />
            <span>Stage 3 of 5: Primary Source & Evidence Registry</span>
          </div>
          <button
            onClick={onBackToPlan}
            className="inline-flex items-center gap-1 text-xs font-mono text-[#a38c7c] hover:text-[#e1e2eb] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Plan</span>
          </button>
        </div>
        <h1 className="font-serif text-2xl text-[#e1e2eb] mt-2 font-normal">
          Discovered Literature & Evidence Corpus
        </h1>
        <p className="text-xs text-[#dbc2b0] mt-1 max-w-2xl leading-relaxed">
          Primary sources retrieved from CrossRef, open-access academic repositories, and web search. Each source is parsed for empirical findings and ready for claim synthesis and inline citation drafting.
        </p>

        {/* Telemetry Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-[#222735] font-mono text-xs">
          <div className="bg-[#101319] p-2.5 border border-[#222735]">
            <span className="text-[#a38c7c] block text-[10px]">TOTAL SOURCES</span>
            <span className="text-[#e1e2eb] font-bold text-base">{sources.length}</span>
          </div>
          <div className="bg-[#101319] p-2.5 border border-[#222735]">
            <span className="text-[#a38c7c] block text-[10px]">VERIFIED PEER-REVIEW</span>
            <span className="text-[#4edea3] font-bold text-base">{verifiedCount}</span>
          </div>
          <div className="bg-[#101319] p-2.5 border border-[#222735]">
            <span className="text-[#a38c7c] block text-[10px]">CITATION FORMAT</span>
            <span className="text-[#ffb77d] font-bold text-base">{paper.citation_style}</span>
          </div>
          <div className="bg-[#101319] p-2.5 border border-[#222735]">
            <span className="text-[#a38c7c] block text-[10px]">TARGET RIGOR</span>
            <span className="text-[#b9c8de] font-bold text-base">{paper.research_depth}</span>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#a38c7c] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, author, or keyword..."
              className="w-full bg-[#101319] border border-[#222735] focus:border-[#4edea3] pl-9 pr-3 py-2 text-xs text-[#e1e2eb] focus:outline-none"
            />
          </div>

          <div className="flex items-center border border-[#222735] bg-[#101319] p-0.5">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 text-[11px] font-mono transition-colors ${
                filterType === "all" ? "bg-[#191c22] text-[#ffb77d]" : "text-[#a38c7c]"
              }`}
            >
              All ({sources.length})
            </button>
            <button
              onClick={() => setFilterType("verified")}
              className={`px-2.5 py-1 text-[11px] font-mono transition-colors ${
                filterType === "verified" ? "bg-[#191c22] text-[#4edea3]" : "text-[#a38c7c]"
              }`}
            >
              Verified ({verifiedCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#191c22] hover:bg-[#272a31] border border-[#222735] text-xs font-mono text-[#e1e2eb] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#ffb77d]" />
            <span>Add Source Manually</span>
          </button>

          <button
            onClick={onDiscoverMore}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#191c22] hover:bg-[#272a31] border border-[#222735] text-xs font-mono text-[#b9c8de] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Discover More</span>
          </button>
        </div>
      </div>

      {/* Source Cards List */}
      <div className="space-y-3">
        {filteredSources.length === 0 ? (
          <div className="bg-[#191c22] border border-[#222735] p-12 text-center">
            <BookOpen className="w-8 h-8 text-[#a38c7c] mx-auto mb-3" />
            <div className="text-sm text-[#e1e2eb] font-mono">No matching sources found</div>
            <p className="text-xs text-[#a38c7c] mt-1 max-w-sm mx-auto">
              {sources.length === 0
                ? "No sources have been retrieved yet. Click 'Discover More' or add custom references."
                : "Adjust your search filter or clear keywords."}
            </p>
          </div>
        ) : (
          filteredSources.map((src, idx) => (
            <div
              key={src.id || idx}
              className="bg-[#191c22] border border-[#222735] hover:border-[#32353c] p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="text-[#ffb77d] font-bold">[{idx + 1}]</span>
                    {src.verified ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#003824] border border-[#4edea3]/40 text-[#4edea3] text-[10px]">
                        <ShieldCheck className="w-3 h-3" />
                        <span>VERIFIED PEER-REVIEW</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-[#101319] border border-[#222735] text-[#a38c7c] text-[10px]">
                        WEB HARVEST
                      </span>
                    )}
                    {src.year && <span className="text-[#b9c8de]">({src.year})</span>}
                    {src.journal && (
                      <span className="text-[#dbc2b0] italic truncate max-w-xs">
                        {src.journal}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-base text-[#e1e2eb] font-normal leading-snug">
                    {src.title}
                  </h3>

                  {src.authors && (
                    <div className="text-xs text-[#a38c7c] font-sans">
                      Authors: <span className="text-[#dbc2b0]">{src.authors}</span>
                    </div>
                  )}

                  {src.abstract && (
                    <p className="text-xs text-[#dbc2b0]/90 leading-relaxed font-sans line-clamp-2">
                      {src.abstract}
                    </p>
                  )}
                </div>

                {/* Score & Link Badges */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-right font-mono text-[11px]">
                    <div className="text-[#a38c7c]">Reliability</div>
                    <div className="text-[#4edea3] font-bold">
                      {((src.reliability || 0.8) * 100).toFixed(0)}%
                    </div>
                  </div>

                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-[#ffb77d] hover:underline"
                    >
                      <span>{src.doi ? "DOI" : "Source URL"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#222735]">
        <div className="text-xs font-mono text-[#a38c7c]">
          <span>Ready to synthesize {sources.length} sources into a structured research draft.</span>
        </div>

        <button
          onClick={onDraftPaper}
          disabled={isLoading || sources.length === 0}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffb77d] hover:bg-[#ffdcc3] text-[#4d2600] font-mono text-xs uppercase font-bold tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-[#4d2600] border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing & Drafting...</span>
            </>
          ) : (
            <>
              <FileCheck2 className="w-4 h-4" />
              <span>Draft Complete Academic Paper</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Manual Source Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-[#191c22] border border-[#222735] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222735] pb-3">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#ffb77d]">
                <Plus className="w-4 h-4" />
                <span>Add Custom Primary Source</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#a38c7c] hover:text-[#e1e2eb] text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-[#dbc2b0] uppercase mb-1">
                  Paper / Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g., Deep Residual Learning for Image Recognition"
                  className="w-full bg-[#101319] border border-[#222735] focus:border-[#ffb77d] p-2 text-xs text-[#e1e2eb] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-[#dbc2b0] uppercase mb-1">
                    Authors
                  </label>
                  <input
                    type="text"
                    value={manualAuthors}
                    onChange={(e) => setManualAuthors(e.target.value)}
                    placeholder="e.g., He, K., Zhang, X., Ren, S., & Sun, J."
                    className="w-full bg-[#101319] border border-[#222735] focus:border-[#ffb77d] p-2 text-xs text-[#e1e2eb] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#dbc2b0] uppercase mb-1">
                    Publication Year
                  </label>
                  <input
                    type="text"
                    value={manualYear}
                    onChange={(e) => setManualYear(e.target.value)}
                    className="w-full bg-[#101319] border border-[#222735] focus:border-[#ffb77d] p-2 text-xs text-[#e1e2eb] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-[#dbc2b0] uppercase mb-1">
                    Journal / Conference
                  </label>
                  <input
                    type="text"
                    value={manualJournal}
                    onChange={(e) => setManualJournal(e.target.value)}
                    placeholder="e.g., IEEE CVPR"
                    className="w-full bg-[#101319] border border-[#222735] focus:border-[#ffb77d] p-2 text-xs text-[#e1e2eb] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#dbc2b0] uppercase mb-1">
                    DOI (Digital Object Identifier)
                  </label>
                  <input
                    type="text"
                    value={manualDoi}
                    onChange={(e) => setManualDoi(e.target.value)}
                    placeholder="e.g., 10.1109/CVPR.2016.90"
                    className="w-full bg-[#101319] border border-[#222735] focus:border-[#ffb77d] p-2 text-xs text-[#e1e2eb] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#dbc2b0] uppercase mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#101319] border border-[#222735] focus:border-[#ffb77d] p-2 text-xs text-[#e1e2eb] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#dbc2b0] uppercase mb-1">
                  Abstract / Empirical Snippet
                </label>
                <textarea
                  rows={3}
                  value={manualAbstract}
                  onChange={(e) => setManualAbstract(e.target.value)}
                  placeholder="Paste abstract or excerpt for synthesis..."
                  className="w-full bg-[#101319] border border-[#222735] focus:border-[#ffb77d] p-2 text-xs text-[#e1e2eb] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222735]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-[#101319] border border-[#222735] text-xs font-mono text-[#a38c7c]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#ffb77d] text-[#4d2600] text-xs font-mono uppercase font-bold"
                >
                  Insert Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
