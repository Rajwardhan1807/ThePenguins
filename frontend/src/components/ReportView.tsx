"use client";

import React, { useState } from "react";
import { marked } from "marked";
import { Download, Copy, Check, FileText, Award, ShieldAlert, BookOpen } from "lucide-react";
import { Report } from "@/lib/api";

interface ReportViewProps {
  report: Report;
  query: string;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, query }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(report.full_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([report.full_markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ResearchForge_Report_${query.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 35)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Convert markdown to HTML string
  const renderedHtml = marked.parse(report.full_markdown) as string;

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Top action toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl glass-panel border border-white/10">
        <div>
          <span className="text-[11px] font-mono font-semibold text-cyan-400 uppercase tracking-wider">
            Synthesized Intelligence Report
          </span>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">{report.title}</h2>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition text-xs font-medium"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? "Copied" : "Copy Markdown"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition text-xs shadow-lg shadow-cyan-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .MD</span>
          </button>
        </div>
      </div>

      {/* Key Findings Highlight Cards (PRD Section 14) */}
      {report.key_findings && report.key_findings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>EXECUTIVE KEY FINDINGS & CONFIDENCE INDICATORS</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.key_findings.map((finding, idx) => (
              <div key={idx} className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-400">Finding #{idx + 1}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        finding.confidence >= 70
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                          : finding.confidence >= 50
                          ? "bg-amber-950 text-amber-400 border border-amber-800/40"
                          : "bg-rose-950 text-rose-400 border border-rose-800/40"
                      }`}
                    >
                      Confidence: {finding.confidence}%
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-2 leading-snug">{finding.finding}</h4>
                  <p className="text-xs text-slate-400 line-clamp-3">{finding.summary}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Supported by: {finding.evidence_sources_count} sources</span>
                  <span className="text-cyan-400 font-mono">Cross-verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Full Markdown Article */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl">
        <div
          className="markdown-body text-slate-200"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    </div>
  );
};
