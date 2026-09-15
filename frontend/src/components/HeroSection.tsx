"use client";

import React, { useState } from "react";
import { Search, Zap, Compass, FileText, ArrowRight, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";

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
    "Comparison of Solid-State Batteries vs Lithium-Ion for commercial aviation"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onStartResearch(query.trim(), mode);
  };

  return (
    <div className="w-full pt-8 pb-12 flex flex-col items-center text-center">
      {/* Top Banner Tag */}
      <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-xs font-semibold mb-6 backdrop-blur-md shadow-lg shadow-cyan-950/30">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Local-first AI • Multi-Agent Pipeline • ₹0 Cost</span>
      </div>

      {/* Main Tagline */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl leading-[1.15]">
        Research anything. <br className="hidden sm:inline" />
        <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
          Verify everything.
        </span>
      </h1>

      <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
        ResearchForge separates AI research into specialized agents: discovering real sources,
        challenging factual claims, detecting conflicts, and synthesizing verifiable cited reports.
      </p>

      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="w-full max-w-3xl mt-8">
        <div className="relative group">
          {/* Glowing gradient background */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-70 blur-lg transition duration-500 group-hover:opacity-100" />
          
          <div className="relative rounded-2xl bg-[#0d1322] border border-white/10 p-2 shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center flex-1 pl-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What would you like to research? (e.g. Is nuclear energy viable in India?)"
                disabled={isLoading}
                className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm sm:text-base py-2"
              />
            </div>

            {/* Mode Selectors */}
            <div className="flex items-center justify-between sm:justify-end gap-1.5 px-2 py-1 bg-slate-900/90 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setMode("quick")}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                  mode === "quick"
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Quick Research (5-8 sources)"
              >
                Quick
              </button>
              <button
                type="button"
                onClick={() => setMode("deep")}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                  mode === "deep"
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Deep Research (10-20 sources)"
              >
                Deep
              </button>
              <button
                type="button"
                onClick={() => setMode("document")}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                  mode === "document"
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Document Research mode"
              >
                Doc
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide transition shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <span>{isLoading ? "Starting..." : "Start Research"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Demo Preset Chips */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-500 font-medium mr-1">Try Hackathon Demo:</span>
          {demoPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuery(preset)}
              className="px-3 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition text-left"
            >
              {preset}
            </button>
          ))}
        </div>
      </form>

      {/* 3 Agent Responsibility Cards (PRD Section 17.1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl w-full mt-14 text-left">
        {/* Agent 1 */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/40 transition duration-300">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
              01 Agent
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
              SEARCH & EXTRACT
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Research Agent</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Formulates multi-perspective search queries, explores public web sources without API costs,
            and extracts verifiable evidence snippets.
          </p>
        </div>

        {/* Agent 2 */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/40 transition duration-300">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-purple-400 font-semibold uppercase tracking-wider">
              02 Agent
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
              VERIFY & CHALLENGE
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Fact-Check Agent</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Extracts claims, evaluates domain reliability, identifies conflicting sources, and calculates
            mathematical confidence scores.
          </p>
        </div>

        {/* Agent 3 */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition duration-300">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
              03 Agent
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
              SYNTHESIZE & REPORT
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Writer Agent</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Synthesizes strictly verified evidence into cited reports with executive summary,
            conflict breakdowns, confidence metrics, and transparent limitations.
          </p>
        </div>
      </div>
    </div>
  );
};
