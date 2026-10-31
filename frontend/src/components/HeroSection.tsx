"use client";

import React, { useState } from "react";
import { Search, ArrowRight, ShieldCheck, Cpu, Database, Network } from "lucide-react";

interface HeroSectionProps {
  onStartResearch: (query: string, mode: "quick" | "deep" | "document") => void;
  isLoading: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartResearch, isLoading }) => {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"quick" | "deep" | "document">("deep");

  const demoPresets = [
    "Is nuclear energy economically viable in India?",
    "Will AI-assisted code generation reduce software developer headcount by 2030?",
    "Comparison of Solid-State Batteries vs Lithium-Ion for commercial aviation",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onStartResearch(query.trim(), mode);
  };

  return (
    <div className="w-full flex flex-col space-y-8">
      {/* Broadsheet Masthead Block */}
      <section className="border-b border-[#222735] bg-[#101319] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2 font-mono text-[11px]">
              <span className="text-[#ffb77d] border border-[#d97706]/60 px-2 py-0.5 tracking-widest uppercase bg-[#d97706]/10 font-semibold">
                STATUTORY ARCHIVE
              </span>
              <span className="text-[#a38c7c]">
                PROTOCOL: VERIFIED UNRESTRICTED // JURISDICTION: ZERO-EXFILTRATION
              </span>
            </div>
            <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl text-[#f1f5f9] tracking-tight leading-tight">
              Research anything. Verify everything.
            </h1>
            <p className="text-[#dbc2b0] font-sans text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Autonomous evidentiary research terminal. Formulates targeted investigative queries,
              ingests institutional and public records, exposes methodological schisms, and compiles
              strictly cited reports with mathematical confidence scoring.
            </p>
          </div>

          <div className="text-left md:text-right shrink-0 font-mono text-xs border border-[#222735] p-3 bg-[#0b0e14]">
            <div className="text-[#a38c7c] uppercase text-[10px]">Active Engine Telemetry</div>
            <div className="text-[#ffb77d] font-bold text-sm mt-0.5">LOCAL SWARM v4.11</div>
            <div className="text-[#4edea3] text-[11px] mt-0.5">0.0000 DRIFT // LOCALHOST:8000</div>
          </div>
        </div>
      </section>

      {/* Terminal Investigation Input Workspace */}
      <section className="p-4 sm:p-6 bg-[#0e1117] border border-[#222735] space-y-5">
        <div className="flex items-center justify-between border-b border-[#222735] pb-3 text-xs font-mono">
          <span className="text-[#a38c7c] uppercase tracking-wider font-semibold">
            Inquiry Proposition &amp; Scope Specification
          </span>
          <span className="text-[#dbc2b0] hidden sm:inline">
            Execution Mode: <strong className="text-[#ffb77d] uppercase">{mode}</strong>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative border border-[#2a3142] focus-within:border-[#a38c7c] bg-[#08090b] transition-none">
            <div className="flex items-center px-3.5 py-1">
              <Search className="w-4 h-4 text-[#a38c7c] shrink-0 mr-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter research thesis, empirical claim, or statutory query..."
                disabled={isLoading}
                className="w-full bg-transparent text-[#f1f5f9] placeholder-[#554336] focus:outline-none text-sm sm:text-base py-3 font-sans"
              />
            </div>

            {/* Bottom Controls Bar inside Input */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-2.5 bg-[#0b0e14] border-t border-[#222735]">
              {/* Mode Selection Chips */}
              <div className="flex items-center gap-1 font-mono text-xs">
                <span className="text-[#a38c7c] text-[10px] uppercase mr-1 hidden sm:inline">Mode:</span>
                <button
                  type="button"
                  onClick={() => setMode("quick")}
                  className={`px-2.5 py-1 border transition-none cursor-pointer uppercase ${
                    mode === "quick"
                      ? "bg-[#ffb77d] text-[#08090b] border-[#ffb77d] font-bold"
                      : "bg-[#101319] text-[#dbc2b0] border-[#222735] hover:border-[#a38c7c]"
                  }`}
                >
                  Quick (5-8 Sources)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("deep")}
                  className={`px-2.5 py-1 border transition-none cursor-pointer uppercase ${
                    mode === "deep"
                      ? "bg-[#ffb77d] text-[#08090b] border-[#ffb77d] font-bold"
                      : "bg-[#101319] text-[#dbc2b0] border-[#222735] hover:border-[#a38c7c]"
                  }`}
                >
                  Deep (10-20 Sources)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("document")}
                  className={`px-2.5 py-1 border transition-none cursor-pointer uppercase ${
                    mode === "document"
                      ? "bg-[#ffb77d] text-[#08090b] border-[#ffb77d] font-bold"
                      : "bg-[#101319] text-[#dbc2b0] border-[#222735] hover:border-[#a38c7c]"
                  }`}
                >
                  Doc Ingestion
                </button>
              </div>

              {/* Submit Trigger */}
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#d97706] hover:bg-[#ffb77d] text-[#08090b] font-bold text-xs uppercase tracking-wider transition-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-none"
              >
                <span>{isLoading ? "Executing Audit..." : "Execute Epistemic Audit"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Preset Prompts */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1">
            <span className="text-[#a38c7c] uppercase text-[10px]">Benchmarked Dossiers:</span>
            {demoPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuery(preset)}
                className="px-2.5 py-1 bg-[#101319] border border-[#222735] hover:border-[#ffb77d] text-[#dbc2b0] hover:text-[#ffb77d] transition-none text-left cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </form>
      </section>

      {/* 3 Sequential Agent Swarm Dossier Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#222735] pb-2 text-xs font-mono">
          <span className="text-[#a38c7c] uppercase tracking-wider font-semibold">
            Autonomous Swarm Node Architecture &amp; Task Delegation
          </span>
          <span className="text-[#4edea3]">Sequential Acyclic Pipeline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Node 01: Research Agent */}
          <article className="border border-[#222735] bg-[#0e1117] p-5 flex flex-col justify-between hover:border-[#a38c7c] transition-none">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#222735] font-mono">
                <span className="text-[#ffb77d] font-semibold text-xs">NODE // 01</span>
                <span className="text-[10px] px-2 py-0.5 border border-[#222735] bg-[#131720] text-[#a38c7c] uppercase">
                  SEARCH &amp; EXTRACT
                </span>
              </div>
              <h2 className="font-serif text-lg text-[#f1f5f9] mb-2 font-medium">Research Agent</h2>
              <p className="text-xs text-[#dbc2b0] leading-relaxed">
                Formulates multi-perspective search queries, executes automated scrapers across public and
                statutory web repositories, and extracts verifiable evidence snippets without external API fees.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#222735] font-mono text-[10px] text-[#a38c7c] flex justify-between">
              <span>Target: DuckDuckGo / ArXiv</span>
              <span className="text-[#4edea3]">Payload: 0 B Out</span>
            </div>
          </article>

          {/* Node 02: Fact-Check Agent */}
          <article className="border border-[#222735] bg-[#0e1117] p-5 flex flex-col justify-between hover:border-[#a38c7c] transition-none">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#222735] font-mono">
                <span className="text-[#ffb77d] font-semibold text-xs">NODE // 02</span>
                <span className="text-[10px] px-2 py-0.5 border border-[#d97706]/60 bg-[#d97706]/10 text-[#ffb77d] uppercase">
                  VERIFY &amp; CHALLENGE
                </span>
              </div>
              <h2 className="font-serif text-lg text-[#f1f5f9] mb-2 font-medium">Fact-Check Agent</h2>
              <p className="text-xs text-[#dbc2b0] leading-relaxed">
                Deconstructs statements into atomized claims, audits institutional domain provenance,
                identifies contradictory evidence across sources, and computes mathematical confidence metrics.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#222735] font-mono text-[10px] text-[#a38c7c] flex justify-between">
              <span>Model: Local Qwen / Ollama</span>
              <span className="text-[#ffb77d]">NLI Threshold: 0.80δ</span>
            </div>
          </article>

          {/* Node 03: Writer Agent */}
          <article className="border border-[#222735] bg-[#0e1117] p-5 flex flex-col justify-between hover:border-[#a38c7c] transition-none">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#222735] font-mono">
                <span className="text-[#ffb77d] font-semibold text-xs">NODE // 03</span>
                <span className="text-[10px] px-2 py-0.5 border border-[#10b981]/60 bg-[#10b981]/10 text-[#4edea3] uppercase">
                  SYNTHESIZE &amp; AUDIT
                </span>
              </div>
              <h2 className="font-serif text-lg text-[#f1f5f9] mb-2 font-medium">Writer Agent</h2>
              <p className="text-xs text-[#dbc2b0] leading-relaxed">
                Synthesizes corroborated evidence into a formal archival briefing featuring an executive summary,
                adjudicated key findings, contradiction ledgers, and explicit epistemological limitations.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#222735] font-mono text-[10px] text-[#a38c7c] flex justify-between">
              <span>Format: Broadsheet Markdown</span>
              <span className="text-[#4edea3]">Strict Zero-Hallucination</span>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};
