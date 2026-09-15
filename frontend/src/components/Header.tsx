"use client";

import React from "react";
import { Cpu, ShieldCheck, History, FileUp, Sparkles, CheckCircle2 } from "lucide-react";

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenDocuments: () => void;
  backendHealth: {
    status: string;
    ollama?: { connected: boolean; model: string };
    cost: string;
  } | null;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHistory, onOpenDocuments, backendHealth }) => {
  const isHealthy = backendHealth?.status === "healthy";
  const modelName = backendHealth?.ollama?.model || "qwen3.5:latest";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#07090e]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1px]">
            <div className="w-full h-full bg-[#0a0f1d] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Research<span className="text-cyan-400">Forge</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                v1.0 MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Local Multi-Agent Research Assistant
            </p>
          </div>
        </div>

        {/* System Badges & Telemetry */}
        <div className="hidden md:flex items-center space-x-3 text-xs">
          {/* Local LLM Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Model:</span>
            <span className="font-mono text-purple-300 font-medium">{modelName}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Zero Cost Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cost: ₹0 (Local AI)</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenDocuments}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition text-xs font-medium"
            title="Upload PDF/DOCX for Document Research"
          >
            <FileUp className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Upload Doc</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition text-xs font-medium"
            title="View Research History"
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </div>
    </header>
  );
};
