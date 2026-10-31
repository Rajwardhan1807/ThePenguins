"use client";

import React from "react";
import { Lock, FileUp, History, Plus, Menu, Terminal, Shield, GraduationCap } from "lucide-react";

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenDocuments: () => void;
  onNewResearch?: () => void;
  onOpenPaperStudio?: () => void;
  onToggleMobileMenu?: () => void;
  activeSessionId?: string | null;
  mode?: string;
  backendHealth: {
    status?: string;
    ollama?: { connected: boolean; model: string };
    cost?: string;
  } | null;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenDocuments,
  onNewResearch,
  onOpenPaperStudio,
  onToggleMobileMenu,
  activeSessionId,
  mode,
  backendHealth,
}) => {
  const modelName = backendHealth?.ollama?.model || "qwen3.5:latest";
  const dossierId = activeSessionId ? `REF-${activeSessionId.slice(0, 8).toUpperCase()}` : "REF-ACTIVE-01";
  const modeDisplay = mode
    ? mode === "deep"
      ? "Deep Archival"
      : mode === "quick"
      ? "Rapid Synthesis"
      : "Corpus Parsing"
    : "Statutory Corroboration";

  return (
    <header className="fixed top-0 left-0 w-full z-30 md:pl-72 bg-[#101319] border-b border-[#222735]">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 h-12">
        {/* Left: Mobile Toggle & Telemetry Ribbon */}
        <div className="flex items-center gap-3 overflow-x-auto py-1 text-xs font-mono">
          {/* Mobile hamburger button */}
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1 text-[#dbc2b0] hover:text-[#e1e2eb] border border-[#222735] bg-[#0b0e14]"
            aria-label="Open docket menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Dossier Code */}
          <span className="text-[#4edea3] tracking-wider uppercase flex items-center gap-1.5 shrink-0">
            <span className="inline-block w-1.5 h-1.5 bg-[#4edea3]"></span>
            <span>Dossier: {dossierId}</span>
          </span>

          {/* Mode telemetry */}
          <span className="text-[#dbc2b0] border-l border-[#222735] pl-3 hidden sm:inline shrink-0">
            Mode: {modeDisplay}
          </span>

          {/* Latency & Zero Cost */}
          <span className="text-[#a38c7c] border-l border-[#222735] pl-3 hidden lg:inline shrink-0">
            Audit Footprint: ₹0 / Offline
          </span>
        </div>

        {/* Right: Action Cluster */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {onNewResearch && (
            <button
              onClick={onNewResearch}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#191c22] border border-[#222735] hover:border-[#a38c7c] text-[#e1e2eb] transition-none cursor-pointer"
              title="New Research Query"
            >
              <Plus className="w-3.5 h-3.5 text-[#ffb77d]" />
              <span className="hidden sm:inline">New Query</span>
            </button>
          )}

          {onOpenPaperStudio && (
            <button
              onClick={onOpenPaperStudio}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#191c22] border border-[#ffb77d]/40 hover:border-[#ffb77d] text-[#ffb77d] transition-none cursor-pointer"
              title="AI Research Paper Generator Studio"
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#ffb77d]" />
              <span className="hidden sm:inline">Paper Studio</span>
            </button>
          )}

          <button
            onClick={onOpenDocuments}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#191c22] border border-[#222735] hover:border-[#a38c7c] text-[#e1e2eb] transition-none cursor-pointer"
            title="Upload Document into Ingestion Corpus"
          >
            <FileUp className="w-3.5 h-3.5 text-[#ffb77d]" />
            <span className="hidden md:inline">Ingest Corpus</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#191c22] border border-[#222735] hover:border-[#a38c7c] text-[#e1e2eb] transition-none cursor-pointer"
            title="Open Historical Docket Archive"
          >
            <History className="w-3.5 h-3.5 text-[#b9c8de]" />
            <span className="hidden md:inline">Archive</span>
          </button>

          {/* Archival Seal Marker */}
          <div className="border-l border-[#222735] pl-2.5 ml-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#a38c7c]" />
            <span className="text-[11px] text-[#a38c7c] hidden xl:inline">SEAL: CAO-098</span>
          </div>
        </div>
      </div>
    </header>
  );
};
