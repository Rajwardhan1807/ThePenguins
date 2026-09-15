"use client";

import React, { useEffect, useState } from "react";
import { X, History, Clock, ArrowUpRight, Award, Globe, Zap, RotateCcw } from "lucide-react";
import { api, ResearchSession } from "@/lib/api";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose, onSelectSession }) => {
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-[#080d1a] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl overflow-hidden">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">Research History</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchHistory}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                title="Refresh history"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Session list */}
          <div className="mt-5 space-y-3 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
            {loading && <p className="text-xs text-slate-500 italic">Loading past research sessions...</p>}
            {!loading && sessions.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-xs">
                <History className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                <p>No research sessions saved yet.</p>
                <p className="mt-1 text-[11px] text-slate-600">Start a research session to see it archived here.</p>
              </div>
            )}

            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  onSelectSession(s.id);
                  onClose();
                }}
                className="p-4 rounded-xl glass-panel border border-white/5 hover:border-cyan-500/40 cursor-pointer transition group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 uppercase">
                    {s.mode} mode
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {s.created_at ? s.created_at.slice(0, 10) : ""}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-cyan-300 transition line-clamp-2">
                  {s.query}
                </h4>

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center space-x-2.5">
                    <span className="flex items-center space-x-1">
                      <Globe className="w-3 h-3 text-cyan-400" />
                      <span>{s.statistics?.sources_relevant || 0}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-purple-400" />
                      <span>{s.statistics?.claims_verified || 0}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 font-mono text-emerald-400 font-semibold">
                    <Award className="w-3 h-3" />
                    <span>{s.confidence}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 text-center text-[10px] text-slate-600 font-mono">
          Stored locally in SQLite • ₹0 Cloud Footprint
        </div>
      </div>
    </div>
  );
};
