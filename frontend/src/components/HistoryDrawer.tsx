"use client";

import React, { useEffect, useState } from "react";
import { X, History, RotateCcw, ArrowRight } from "lucide-react";
import { api, ResearchSession } from "@/lib/api";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSession,
}) => {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory();
      setSessions(data);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-none">
      <div className="w-full max-w-md h-full bg-[#0b0e14] border-l border-[#222735] p-5 sm:p-6 flex flex-col justify-between text-[#e1e2eb]">
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#222735]">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#ffb77d]" />
              <h3 className="font-serif text-lg text-[#f1f5f9] font-medium">Session Archive</h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={fetchHistory}
                className="p-1 text-[#a38c7c] hover:text-[#f1f5f9] border border-[#222735] bg-[#101319] cursor-pointer"
                title="Refresh history"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="p-1 text-[#a38c7c] hover:text-[#f1f5f9] border border-[#222735] bg-[#101319] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-[11px] font-mono text-[#a38c7c] mt-2">
            PERSISTENT LOCAL ARCHIVE // SQLITE IMMUTABLE LEDGER
          </p>

          {/* Session List */}
          <div className="mt-4 space-y-2.5 overflow-y-auto max-h-[calc(100vh-170px)] pr-1 font-mono">
            {loading && (
              <p className="text-xs text-[#a38c7c] italic py-4">Querying local archival ledger...</p>
            )}
            {!loading && sessions.length === 0 && (
              <div className="text-center py-12 text-[#a38c7c] text-xs">
                <p>NO ARCHIVED RESEARCH SESSIONS FOUND.</p>
                <p className="mt-1 text-[10px]">Execute an audit to register a new dossier.</p>
              </div>
            )}

            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  onSelectSession(s.id);
                  onClose();
                }}
                className="p-3.5 bg-[#0e1117] border border-[#222735] hover:border-[#ffb77d] hover:bg-[#131720] cursor-pointer transition-none group"
              >
                <div className="flex items-center justify-between mb-1 text-[10px] text-[#a38c7c]">
                  <span className="text-[#ffb77d] font-bold">
                    REF-{s.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span>{s.created_at ? s.created_at.slice(0, 10) : ""}</span>
                </div>

                <h4 className="font-serif text-sm text-[#f1f5f9] group-hover:text-[#ffb77d] line-clamp-2 leading-snug font-medium">
                  {s.query}
                </h4>

                <div className="mt-2.5 pt-2 border-t border-[#222735] flex items-center justify-between text-[11px] text-[#a38c7c]">
                  <span className="text-[10px] uppercase">{s.mode} mode</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#4edea3] font-bold">{s.confidence}% Conf.</span>
                    <ArrowRight className="w-3 h-3 text-[#a38c7c] group-hover:text-[#ffb77d]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#222735] text-center text-[10px] text-[#a38c7c] font-mono">
          AIR-GAPPED SQLITE LEDGER // 0 B OUTBOUND
        </div>
      </div>
    </div>
  );
};
