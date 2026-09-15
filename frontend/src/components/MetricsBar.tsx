"use client";

import React from "react";
import { Globe, FileCheck2, AlertTriangle, ShieldCheck, Cpu, Zap, Award } from "lucide-react";
import { ResearchStatistics } from "@/lib/api";

interface MetricsBarProps {
  statistics: ResearchStatistics;
  modelName?: string;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ statistics, modelName = "Qwen / Ollama" }) => {
  const getConfidenceColor = (score: number) => {
    if (score >= 75) return "text-emerald-400 border-emerald-500/40 bg-emerald-950/40";
    if (score >= 50) return "text-amber-400 border-amber-500/40 bg-amber-950/40";
    return "text-rose-400 border-rose-500/40 bg-rose-950/40";
  };

  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
      {/* Sources Discovered */}
      <div className="glass-panel p-3.5 rounded-xl border border-white/10 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Sources</span>
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-black text-white">{statistics.sources_discovered}</span>
          <span className="text-[11px] text-slate-500 font-mono">found</span>
        </div>
      </div>

      {/* Relevant Sources */}
      <div className="glass-panel p-3.5 rounded-xl border border-white/10 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Relevant</span>
          <FileCheck2 className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-black text-sky-300">{statistics.sources_relevant}</span>
          <span className="text-[11px] text-slate-500 font-mono">extracted</span>
        </div>
      </div>

      {/* Claims Identified */}
      <div className="glass-panel p-3.5 rounded-xl border border-white/10 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Claims</span>
          <Zap className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-black text-purple-300">{statistics.claims_identified}</span>
          <span className="text-[11px] text-slate-500 font-mono">extracted</span>
        </div>
      </div>

      {/* Verified Claims */}
      <div className="glass-panel p-3.5 rounded-xl border border-white/10 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Verified</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-black text-emerald-300">{statistics.claims_verified}</span>
          <span className="text-[11px] text-slate-500 font-mono">cross-checked</span>
        </div>
      </div>

      {/* Conflicts Detected */}
      <div className="glass-panel p-3.5 rounded-xl border border-white/10 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Conflicts</span>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-black text-amber-400">{statistics.conflicts_detected}</span>
          <span className="text-[11px] text-slate-500 font-mono">detected</span>
        </div>
      </div>

      {/* Overall Confidence */}
      <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${getConfidenceColor(statistics.overall_confidence)}`}>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-semibold">Confidence</span>
          <Award className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-black">{statistics.overall_confidence}%</span>
          <span className="text-[10px] uppercase font-mono opacity-80">calculated</span>
        </div>
      </div>
    </div>
  );
};
