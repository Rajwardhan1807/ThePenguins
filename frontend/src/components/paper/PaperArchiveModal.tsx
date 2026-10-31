"use client";

import React, { useState } from "react";
import {
  History,
  Trash2,
  ArrowRight,
  Plus,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  X
} from "lucide-react";
import { Paper } from "@/lib/api";

interface PaperArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  papers: Paper[];
  onSelectPaper: (paperId: string) => void;
  onDeletePaper: (paperId: string) => void;
  onNewPaper: () => void;
}

export const PaperArchiveModal: React.FC<PaperArchiveModalProps> = ({
  isOpen,
  onClose,
  papers,
  onSelectPaper,
  onDeletePaper,
  onNewPaper,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-[#191c22] border border-[#222735] max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222735] bg-[#101319]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ffb77d]/10 border border-[#ffb77d]/30 text-[#ffb77d]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#ffb77d]">
                <span>Research Paper Archive</span>
                <span className="text-[#a38c7c]">•</span>
                <span>Persistent Local Database</span>
              </div>
              <h2 className="font-serif text-lg text-[#e1e2eb] font-normal">
                Saved Papers & Draft Revisions
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onNewPaper();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ffb77d] hover:bg-[#ffdcc3] text-[#4d2600] text-xs font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Paper</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#a38c7c] hover:text-[#e1e2eb] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Papers List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {papers.length === 0 ? (
            <div className="text-center py-16 bg-[#101319] border border-[#222735]">
              <BookOpen className="w-10 h-10 text-[#a38c7c] mx-auto mb-2" />
              <div className="text-sm font-mono text-[#e1e2eb]">No Saved Research Papers</div>
              <p className="text-xs text-[#a38c7c] mt-1 max-w-xs mx-auto">
                Generate your first academic paper using the Research Paper Studio. All drafts are preserved locally.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onNewPaper();
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#ffb77d] text-[#4d2600] text-xs font-mono uppercase font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Configure First Paper</span>
              </button>
            </div>
          ) : (
            papers.map((p) => {
              const dateStr = p.updated_at
                ? new Date(p.updated_at).toLocaleString()
                : "Recent";
              const isConfirming = confirmDeleteId === p.id;

              return (
                <div
                  key={p.id}
                  className="bg-[#101319] border border-[#222735] hover:border-[#32353c] p-4 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="px-1.5 py-0.5 bg-[#191c22] border border-[#222735] text-[#ffb77d]">
                        {p.paper_type || "Paper"}
                      </span>
                      {p.field && (
                        <span className="text-[#b9c8de] truncate max-w-xs">{p.field}</span>
                      )}
                      <span className="text-[#a38c7c]">•</span>
                      <span className="text-[#4edea3]">{p.citation_style || "APA 7"}</span>
                      <span className="text-[#a38c7c]">•</span>
                      <span className="text-[#dbc2b0]">{p.target_word_count || 5000} words</span>
                    </div>

                    <h3 className="font-serif text-base text-[#e1e2eb] font-normal leading-snug truncate">
                      {p.title}
                    </h3>

                    {p.research_question && (
                      <p className="text-xs text-[#a38c7c] line-clamp-1 italic font-sans">
                        RQ: {p.research_question}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#a38c7c]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </span>
                      <span>•</span>
                      <span className="uppercase text-[#4edea3]">Stage: {p.current_stage || p.status}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isConfirming ? (
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <button
                          onClick={() => {
                            onDeletePaper(p.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 bg-[#93000a] text-white hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 bg-[#191c22] border border-[#222735] text-[#a38c7c]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(p.id)}
                        className="p-2 text-[#a38c7c] hover:text-[#ffb4ab] border border-transparent hover:border-[#222735] transition-colors"
                        title="Delete paper draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onSelectPaper(p.id);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#191c22] hover:bg-[#272a31] border border-[#222735] hover:border-[#ffb77d] text-xs font-mono text-[#e1e2eb] transition-colors cursor-pointer"
                    >
                      <span>Resume Draft</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#ffb77d]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#101319] border-t border-[#222735] flex items-center justify-between font-mono text-xs text-[#a38c7c]">
          <span>{papers.length} total saved dockets</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#191c22] hover:bg-[#272a31] border border-[#222735] text-xs font-mono text-[#e1e2eb]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
