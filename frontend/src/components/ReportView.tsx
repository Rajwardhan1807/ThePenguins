"use client";

import React, { useState } from "react";
import { marked } from "marked";
import { Download, Copy, Check, Award, FileText } from "lucide-react";
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
    link.download = `ResearchForge_Ledger_${query.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 35)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderedHtml = marked.parse(report.full_markdown) as string;

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Top Action Toolbar */}
      <section className="border border-[#222735] bg-[#0b0e14] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#a38c7c] uppercase">
            <span className="text-[#ffb77d] border border-[#d97706]/60 px-1.5 py-0.2 bg-[#d97706]/10 font-semibold">
              EPISTEMIC BRIEF
            </span>
            <span>AUTONOMOUS DOSSIER SUMMARY</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-[#f1f5f9] tracking-tight mt-1">
            {report.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101319] border border-[#222735] hover:border-[#a38c7c] text-[#dbc2b0] hover:text-[#f1f5f9] transition-none cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5 text-[#a38c7c]" />}
            <span>{copied ? "Copied" : "Copy Markdown"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#d97706] hover:bg-[#ffb77d] text-[#08090b] font-bold transition-none cursor-pointer uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Ledger (.MD)</span>
          </button>
        </div>
      </section>

      {/* Key Findings Highlight Cards (PRD Section 14) */}
      {report.key_findings && report.key_findings.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#222735] pb-2 font-mono text-xs">
            <span className="text-[#a38c7c] uppercase tracking-wider font-semibold flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-[#ffb77d]" />
              <span>Adjudicated Key Findings &amp; Epistemic Metrics</span>
            </span>
            <span className="text-[#4edea3]">{report.key_findings.length} Claims Formalized</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.key_findings.map((finding, idx) => (
              <article
                key={idx}
                className="border border-[#222735] bg-[#0e1117] p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222735] font-mono">
                    <span className="text-xs text-[#a38c7c]">FINDING #{String(idx + 1).padStart(2, "0")}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 border uppercase ${
                        finding.confidence >= 70
                          ? "bg-[#10b981]/10 text-[#4edea3] border-[#10b981]"
                          : finding.confidence >= 50
                          ? "bg-[#d97706]/10 text-[#ffb77d] border-[#d97706]"
                          : "bg-[#93000a]/20 text-[#ffb4ab] border-[#dc2626]"
                      }`}
                    >
                      Confidence: {finding.confidence}%
                    </span>
                  </div>
                  <h3 className="font-serif text-base text-[#f1f5f9] mb-1.5 font-medium leading-snug">
                    {finding.finding}
                  </h3>
                  <p className="text-xs text-[#dbc2b0] line-clamp-3 leading-relaxed">
                    {finding.summary}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#222735] flex items-center justify-between font-mono text-[10px] text-[#a38c7c]">
                  <span>Ingested Corroboration: {finding.evidence_sources_count} Sources</span>
                  <span className="text-[#4edea3]">Cryptographically Sealed</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Main Full Markdown Broadsheet Canvas */}
      <article className="border border-[#222735] bg-[#0b0e14] p-6 sm:p-10">
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </article>
    </div>
  );
};
