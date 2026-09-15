"use client";

import React, { useState } from "react";
import { Globe, ExternalLink, ShieldCheck, Tag, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { Source } from "@/lib/api";

interface SourceExplorerProps {
  sources: Source[];
}

export const SourceExplorer: React.FC<SourceExplorerProps> = ({ sources }) => {
  const [filterType, setFilterType] = useState<string>("ALL");

  const types = ["ALL", "Government", "Academic", "Research Paper", "News", "Industry", "Organization", "Documentation"];

  const filteredSources = sources.filter((s) => {
    if (filterType === "ALL") return true;
    return s.source_type === filterType;
  });

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "Government":
        return "bg-emerald-950 text-emerald-300 border-emerald-800/40";
      case "Academic":
      case "Research Paper":
        return "bg-indigo-950 text-indigo-300 border-indigo-800/40";
      case "News":
        return "bg-sky-950 text-sky-300 border-sky-800/40";
      case "Industry":
        return "bg-amber-950 text-amber-300 border-amber-800/40";
      case "Documentation":
        return "bg-purple-950 text-purple-300 border-purple-800/40";
      default:
        return "bg-slate-900 text-slate-300 border-slate-800";
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl glass-panel border border-white/10">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Source Intelligence Explorer</h3>
          <p className="text-xs text-slate-400">
            Transparent breakdown of public domains, institutional authority scores, and extracted passages.
          </p>
        </div>

        {/* Source type pills */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterType === t
                  ? "bg-cyan-500 text-slate-950 font-bold"
                  : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSources.map((source) => {
          const relPct = Math.round(source.reliability * 100);
          return (
            <div
              key={source.id}
              className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBadgeColor(source.source_type)}`}>
                    {source.source_type}
                  </span>
                  <div className="flex items-center space-x-1 text-xs font-mono text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Reliability: <strong className="text-white">{relPct}%</strong></span>
                  </div>
                </div>

                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sm sm:text-base text-white hover:text-cyan-300 transition line-clamp-2 leading-snug group flex items-start justify-between gap-2"
                >
                  <span>{source.title}</span>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0 mt-0.5" />
                </a>

                <div className="mt-1 flex items-center space-x-3 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Globe className="w-3 h-3 text-slate-500" />
                    <span>{source.domain}</span>
                  </span>
                  {source.publication_date && (
                    <span className="flex items-center space-x-1 text-[11px] text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>{source.publication_date}</span>
                    </span>
                  )}
                </div>

                {source.snippet && (
                  <p className="mt-3 text-xs text-slate-300 bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 line-clamp-3 leading-relaxed">
                    &ldquo;{source.snippet}&rdquo;
                  </p>
                )}
              </div>

              {/* Bottom metadata */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono text-[10px] text-slate-600">ID: {source.id}</span>
                <span className="text-cyan-400 font-medium">Relevance: {Math.round(source.relevance * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
