"use client";

import React, { useState } from "react";
import { ExternalLink, Search, ShieldCheck, Globe, Calendar } from "lucide-react";
import { Source } from "@/lib/api";

interface SourceExplorerProps {
  sources: Source[];
}

export const SourceExplorer: React.FC<SourceExplorerProps> = ({ sources }) => {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const types = ["ALL", "Government", "Academic", "Research Paper", "News", "Industry", "Documentation"];

  const filteredSources = sources.filter((s) => {
    const matchesType = filterType === "ALL" || s.source_type.toLowerCase() === filterType.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.snippet && s.snippet.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="w-full space-y-6">
      {/* Editorial Headline Broadsheet Masthead Block */}
      <section className="border border-[#222735] bg-[#0b0e14] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-[11px]">
              <span className="text-[#ffb77d] border border-[#ffb77d] px-2 py-0.5 uppercase tracking-widest bg-[#d97706]/10 font-semibold">
                STATUTORY ARCHIVE
              </span>
              <span className="text-[#a38c7c] uppercase">
                PROVENANCE LEDGER // CLASSIFICATION: UNRESTRICTED
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#f1f5f9] tracking-tight">
              Primary Source Registry &amp; Epistemic Provenance
            </h1>
            <p className="font-serif italic text-[#dbc2b0] text-sm mt-1 max-w-3xl">
              Exhaustive evidentiary repository of primary sources, official gazettes, academic papers, and
              institutional benchmarks. Strict zero-hallucination archival ledger.
            </p>
          </div>

          <div className="text-left md:text-right shrink-0 font-mono text-xs border border-[#222735] p-3 bg-[#101319]">
            <div className="text-[#a38c7c] uppercase text-[10px]">Total Ingested Records</div>
            <div className="text-[#ffb77d] font-bold text-base mt-0.5">
              {sources.length} STATUTORY ENTRIES
            </div>
            <div className="text-[#4edea3] text-[10px] mt-0.5">SHA-256 REGISTRY VERIFIED</div>
          </div>
        </div>

        {/* Filter Ribbon & Search Bar */}
        <div className="pt-3 border-t border-[#222735] flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
          {/* Source Type Buttons */}
          <div className="flex flex-wrap items-center gap-1">
            {types.map((t) => {
              const count =
                t === "ALL"
                  ? sources.length
                  : sources.filter((s) => s.source_type.toLowerCase() === t.toLowerCase()).length;
              return (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 uppercase transition-none cursor-pointer border ${
                    filterType === t
                      ? "bg-[#ffb77d] text-[#08090b] border-[#ffb77d] font-bold"
                      : "bg-[#101319] text-[#dbc2b0] border-[#222735] hover:border-[#a38c7c]"
                  }`}
                >
                  {t} ({count})
                </button>
              );
            })}
          </div>

          {/* Keyword Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#a38c7c]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fingerprint, domain, text..."
              className="w-full bg-[#101319] border border-[#222735] py-1.5 pl-8 pr-3 text-xs font-mono text-[#f1f5f9] placeholder-[#554336] focus:border-[#a38c7c] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Primary Source Ledger Table & Cards */}
      <section className="border border-[#222735] bg-[#0b0e14]">
        {/* Table Column Headers on Desktop */}
        <div className="hidden lg:grid grid-cols-12 bg-[#101319] border-b border-[#222735] text-[11px] font-mono text-[#a38c7c] uppercase tracking-wider py-2.5 px-4">
          <div className="col-span-6">Document Fingerprint / Citation</div>
          <div className="col-span-2">Domain &amp; Source Type</div>
          <div className="col-span-2 text-right">Evidentiary Weight</div>
          <div className="col-span-2 text-right">Relevance Metric</div>
        </div>

        {/* Source Rows */}
        {filteredSources.length === 0 ? (
          <div className="p-10 text-center font-mono text-xs text-[#a38c7c]">
            NO SOURCES MATCH THE SELECTED FILTERS.
          </div>
        ) : (
          <div className="divide-y divide-[#222735]">
            {filteredSources.map((source, idx) => {
              const relWeight = Math.round(source.reliability * 100);
              const relevPct = Math.round(source.relevance * 100);

              return (
                <article
                  key={source.id}
                  className="p-4 sm:p-5 hover:bg-[#101319] transition-none flex flex-col gap-3"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                    {/* Column 1: Title & Citation */}
                    <div className="lg:col-span-6 space-y-1">
                      <div className="flex items-center gap-2 font-mono text-[10px] text-[#a38c7c]">
                        <span className="text-[#ffb77d]">ID: {source.id.slice(0, 12)}</span>
                        {source.publication_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{source.publication_date}</span>
                          </span>
                        )}
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-serif text-base text-[#f1f5f9] hover:text-[#ffb77d] flex items-center gap-2 group leading-snug"
                      >
                        <span>{source.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#a38c7c] group-hover:text-[#ffb77d] shrink-0" />
                      </a>
                    </div>

                    {/* Column 2: Domain & Source Type */}
                    <div className="lg:col-span-2 font-mono text-xs text-[#dbc2b0] flex flex-wrap lg:flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[#a38c7c]">
                        <Globe className="w-3 h-3" />
                        <span className="truncate">{source.domain}</span>
                      </div>
                      <span className="inline-block px-1.5 py-0.2 text-[10px] uppercase border border-[#222735] bg-[#131720] text-[#a38c7c] self-start">
                        {source.source_type}
                      </span>
                    </div>

                    {/* Column 3: Evidentiary Weight */}
                    <div className="lg:col-span-2 lg:text-right font-mono text-xs">
                      <span className="lg:hidden text-[#a38c7c] mr-2">Weight:</span>
                      <span
                        className={`font-bold text-sm ${
                          relWeight >= 75
                            ? "text-[#4edea3]"
                            : relWeight >= 50
                            ? "text-[#ffb77d]"
                            : "text-[#ffb4ab]"
                        }`}
                      >
                        {relWeight}%
                      </span>
                      <span className="block text-[10px] text-[#a38c7c]">Reliability</span>
                    </div>

                    {/* Column 4: Relevance */}
                    <div className="lg:col-span-2 lg:text-right font-mono text-xs">
                      <span className="lg:hidden text-[#a38c7c] mr-2">Relevance:</span>
                      <span className="font-bold text-[#ffb77d] text-sm">{relevPct}%</span>
                      <span className="block text-[10px] text-[#a38c7c]">Corpus Match</span>
                    </div>
                  </div>

                  {/* Extracted Evidence Snippet */}
                  {source.snippet && (
                    <blockquote className="border-l-2 border-[#2a3142] pl-3 py-1 bg-[#08090b] text-xs font-sans text-[#dbc2b0] italic leading-relaxed">
                      &ldquo;{source.snippet}&rdquo;
                    </blockquote>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
