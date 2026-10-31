"use client";

import React from "react";
import {
  FileText,
  FolderOpen,
  GitCompare,
  FileCheck2,
  UploadCloud,
  History,
  Sliders,
  Lock,
  Cpu,
  ShieldCheck,
  Calendar,
  X,
  Plus,
  GraduationCap
} from "lucide-react";

export type DocketTab =
  | "briefing"
  | "paper_studio"
  | "sources"
  | "contradictions"
  | "report"
  | "documents"
  | "history"
  | "system";

interface ArchivalSidebarProps {
  activeTab: DocketTab;
  onSelectTab: (tab: DocketTab) => void;
  backendHealth: {
    status?: string;
    backend?: string;
    database?: string;
    search_service?: string;
    ollama?: { connected: boolean; model?: string; error?: string };
    cost?: string;
  } | null;
  onNewResearch: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  sourcesCount?: number;
  claimsCount?: number;
  hasReport?: boolean;
}

export const ArchivalSidebar: React.FC<ArchivalSidebarProps> = ({
  activeTab,
  onSelectTab,
  backendHealth,
  onNewResearch,
  isOpenMobile,
  onCloseMobile,
  sourcesCount = 0,
  claimsCount = 0,
  hasReport = false,
}) => {
  const isOllamaConnected = backendHealth?.ollama?.connected ?? false;
  const modelName = backendHealth?.ollama?.model || "qwen3.5:latest";

  const navItems: Array<{
    id: DocketTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
  }> = [
    {
      id: "briefing",
      label: "Current Briefing",
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    {
      id: "paper_studio",
      label: "Research Paper Studio",
      icon: <GraduationCap className="w-4 h-4 shrink-0 text-[#ffb77d]" />,
      badge: "STUDIO",
    },
    {
      id: "sources",
      label: "Primary Source Registry",
      icon: <FolderOpen className="w-4 h-4 shrink-0" />,
      badge: sourcesCount > 0 ? sourcesCount : undefined,
    },
    {
      id: "contradictions",
      label: "Contradiction Matrix",
      icon: <GitCompare className="w-4 h-4 shrink-0" />,
      badge: claimsCount > 0 ? claimsCount : undefined,
    },
    {
      id: "report",
      label: "Epistemic Ledger",
      icon: <FileCheck2 className="w-4 h-4 shrink-0" />,
      badge: hasReport ? "READY" : undefined,
    },
    {
      id: "documents",
      label: "Corpus Ingestion",
      icon: <UploadCloud className="w-4 h-4 shrink-0" />,
    },
    {
      id: "history",
      label: "Session Archive",
      icon: <History className="w-4 h-4 shrink-0" />,
    },
    {
      id: "system",
      label: "System Parameters",
      icon: <Sliders className="w-4 h-4 shrink-0" />,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 bg-[#0b0e14] border-r border-[#222735] text-[#e1e2eb]">
      {/* Masthead Anchor */}
      <div className="space-y-6">
        <div className="pb-4 border-b border-[#222735]">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={() => {
                onSelectTab("briefing");
                if (isOpenMobile) onCloseMobile();
              }}
              className="text-left group cursor-pointer"
            >
              <span className="font-serif italic text-2xl text-[#ffb77d] tracking-tight group-hover:text-[#ffdcc3] transition-none">
                ResearchForge
              </span>
            </button>
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#a38c7c]" />
              {isOpenMobile && (
                <button
                  onClick={onCloseMobile}
                  className="md:hidden p-1 text-[#a38c7c] hover:text-[#e1e2eb]"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-[#dbc2b0] opacity-75 font-mono">
            Autonomous Evidentiary Terminal
          </p>
          <div className="mt-2 text-[10px] text-[#a38c7c] tracking-tight font-mono">
            ARCHIVAL PROTOCOL v4.11-SEC
          </div>
        </div>

        {/* Primary Navigational Docket */}
        <nav aria-label="Docket Tabs" className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (isOpenMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium tracking-wide transition-none cursor-pointer text-left ${
                  isActive
                    ? "bg-[#1d2026] text-[#ffb77d] border-l-2 border-[#ffb77d]"
                    : "text-[#dbc2b0] hover:text-[#e1e2eb] hover:bg-[#191c22] border-l-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-1.5 py-0.2 text-[10px] font-mono shrink-0 border ${
                      isActive
                        ? "bg-[#272a31] text-[#ffb77d] border-[#d97706]/40"
                        : "bg-[#131720] text-[#94a3b8] border-[#222735]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Diagnostic Telemetry & Operative CTA */}
      <div className="space-y-4 pt-4 border-t border-[#222735]">
        <div className="space-y-1.5 text-[11px] text-[#dbc2b0] font-mono">
          <div className="flex items-center justify-between py-0.5">
            <span className="flex items-center gap-2 truncate">
              <Cpu className="w-3.5 h-3.5 text-[#a38c7c] shrink-0" />
              <span className="truncate">Weights: {modelName}</span>
            </span>
            <span
              className={`text-[10px] font-semibold shrink-0 ${
                isOllamaConnected ? "text-[#4edea3]" : "text-[#ffb4ab]"
              }`}
            >
              {isOllamaConnected ? "ONLINE" : "STANDBY"}
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#a38c7c] shrink-0" />
              <span>Network: 0 B Out</span>
            </span>
            <span className="text-[#4edea3] font-semibold text-[10px]">LOCKED</span>
          </div>

          <div className="flex items-center justify-between py-0.5">
            <span className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#a38c7c] shrink-0" />
              <span>Cutoff: Local-First</span>
            </span>
            <span className="text-[#a38c7c] text-[10px]">AIR-GAPPED</span>
          </div>
        </div>

        <button
          onClick={() => {
            onNewResearch();
            if (isOpenMobile) onCloseMobile();
          }}
          className="w-full bg-[#d97706] hover:bg-[#ffb77d] text-[#08090b] text-xs font-bold py-2.5 px-3 text-center transition-none uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Execute Epistemic Audit</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed SideNavBar */}
      <aside className="fixed top-0 left-0 h-screen w-72 z-40 hidden md:block border-r border-[#222735]">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Overlay Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 h-full z-10 border-r border-[#222735]">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
