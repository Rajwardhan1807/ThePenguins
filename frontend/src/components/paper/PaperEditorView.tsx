"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Save,
  Download,
  ShieldAlert,
  FileCheck2,
  RotateCw,
  Sparkles,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Clock,
  History,
  FileText,
  Copy,
  Check,
  ChevronRight,
  Sliders,
  ExternalLink,
  Plus,
  Trash2,
  HelpCircle,
  Hash
} from "lucide-react";
import {
  Paper,
  PaperSection,
  PaperSource,
  OriginalityFinding,
  OriginalityReport,
  paperApi
} from "@/lib/api";
import { PaperOriginalityModal } from "./PaperOriginalityModal";

interface PaperEditorViewProps {
  paper: Paper;
  sections: PaperSection[];
  sources: PaperSource[];
  onUpdateSection: (sectionId: string, content: string) => Promise<void>;
  onRegenerateSection: (sectionKey: string) => Promise<void>;
  onTransformSection: (sectionKey: string, action: "clarity" | "expand" | "shorten") => Promise<void>;
  onChangeCitationStyle: (style: string) => Promise<void>;
  onExport: (format: "markdown" | "docx" | "pdf") => Promise<void>;
  onSaveRevision: (label?: string) => Promise<void>;
  onRestoreRevision: (revId: string) => Promise<void>;
  onRefreshPaper: () => Promise<void>;
}

export const PaperEditorView: React.FC<PaperEditorViewProps> = ({
  paper,
  sections,
  sources,
  onUpdateSection,
  onRegenerateSection,
  onTransformSection,
  onChangeCitationStyle,
  onExport,
  onSaveRevision,
  onRestoreRevision,
  onRefreshPaper,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    sections[0]?.id || ""
  );
  const [activeSectionContent, setActiveSectionContent] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string>("Just now");
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Side drawers / modals
  const [activeTab, setActiveTab] = useState<"editor" | "references" | "evidence" | "history">("editor");
  const [isOriginalityModalOpen, setIsOriginalityModalOpen] = useState(false);
  const [originalityFindings, setOriginalityFindings] = useState<OriginalityFinding[]>([]);
  const [originalityReport, setOriginalityReport] = useState<OriginalityReport | null>(paper.originality_report || null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Revisions state
  const [revisions, setRevisions] = useState<Array<{ id: string; revision_label: string; created_at: string }>>([]);
  const [revisionLabelInput, setRevisionLabelInput] = useState("");
  const [isCreatingRevision, setIsCreatingRevision] = useState(false);

  // References state
  const [formattedReferences, setFormattedReferences] = useState<string>("");
  const [copiedRef, setCopiedRef] = useState(false);

  // Active section tracking
  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  useEffect(() => {
    if (activeSection) {
      setActiveSectionContent(activeSection.content || "");
    }
  }, [activeSectionId, sections]);

  // Load revisions and evidence on mount
  useEffect(() => {
    if (paper.id) {
      paperApi.getRevisions(paper.id).then(setRevisions).catch(() => {});
      paperApi.getReferences(paper.id).then((r) => setFormattedReferences(r.references)).catch(() => {});
      paperApi.getEvidence(paper.id).then((e) => {
        if (e.originality_findings) setOriginalityFindings(e.originality_findings);
      }).catch(() => {});
    }
  }, [paper.id]);

  // Debounced Auto-save
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleContentChange = (val: string) => {
    setActiveSectionContent(val);
    setSaveStatus("unsaved");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (activeSection) {
        setSaveStatus("saving");
        try {
          await onUpdateSection(activeSection.id, val);
          setSaveStatus("saved");
          setLastSavedAt(new Date().toLocaleTimeString());
        } catch (err) {
          console.error("Auto-save failed:", err);
          setSaveStatus("unsaved");
        }
      }
    }, 1200);
  };

  const handleManualSave = async () => {
    if (!activeSection) return;
    setSaveStatus("saving");
    try {
      await onUpdateSection(activeSection.id, activeSectionContent);
      setSaveStatus("saved");
      setLastSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setSaveStatus("unsaved");
    }
  };

  const handleCreateSnapshot = async () => {
    setIsCreatingRevision(true);
    try {
      await onSaveRevision(revisionLabelInput.trim() || undefined);
      setRevisionLabelInput("");
      const revs = await paperApi.getRevisions(paper.id);
      setRevisions(revs);
    } finally {
      setIsCreatingRevision(false);
    }
  };

  const handleRestore = async (revId: string) => {
    await onRestoreRevision(revId);
    await onRefreshPaper();
  };

  const handleAuditOriginality = async () => {
    setIsAuditing(true);
    try {
      await paperApi.runOriginalityCheck(paper.id);
      const ev = await paperApi.getEvidence(paper.id);
      setOriginalityFindings(ev.originality_findings || []);
      const p = await paperApi.getPaper(paper.id);
      setOriginalityReport(p.originality_report || null);
      setIsOriginalityModalOpen(true);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleApplyOriginalitySuggestion = (finding: OriginalityFinding) => {
    if (finding.suggestion && activeSection) {
      const updated = activeSectionContent.replace(
        finding.passage,
        `${finding.passage} [Ref: ${finding.matched_source || "Peer-Reviewed Source"}]`
      );
      handleContentChange(updated);
    }
  };

  const insertCitation = (citationTag: string) => {
    const updated = activeSectionContent + ` ${citationTag}`;
    handleContentChange(updated);
  };

  const totalWords = sections.reduce((acc, s) => acc + (s.word_count || 0), 0);
  const targetWords = paper.target_word_count || 5000;
  const wordProgress = Math.min(100, Math.round((totalWords / targetWords) * 100));

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#101319] text-[#e1e2eb] overflow-hidden">
      {/* Top Studio Control Bar */}
      <div className="bg-[#191c22] border-b border-[#222735] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Paper Title & Telemetry */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
            <h1 className="font-serif text-base text-[#e1e2eb] font-normal truncate max-w-sm sm:max-w-md">
              {paper.title}
            </h1>
          </div>

          <div className="hidden lg:flex items-center gap-2 font-mono text-xs text-[#a38c7c] border-l border-[#222735] pl-3">
            <span className="text-[#ffb77d]">{paper.paper_type}</span>
            <span>•</span>
            <span className="text-[#b9c8de]">{paper.field}</span>
          </div>
        </div>

        {/* Center: Citation Style Quick Switcher */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#a38c7c] hidden sm:inline">Style:</span>
          <select
            value={paper.citation_style || "APA 7"}
            onChange={(e) => onChangeCitationStyle(e.target.value)}
            className="bg-[#101319] border border-[#222735] hover:border-[#ffb77d] px-2.5 py-1 text-xs font-mono text-[#ffb77d] focus:outline-none cursor-pointer"
            title="Instant citation style reformatting"
          >
            <option value="APA 7">APA 7th</option>
            <option value="IEEE">IEEE [1]</option>
            <option value="MLA 9">MLA 9th</option>
            <option value="Chicago">Chicago</option>
            <option value="Harvard">Harvard</option>
            <option value="Vancouver">Vancouver</option>
          </select>

          {/* Save Status Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#101319] border border-[#222735] text-[11px] font-mono">
            {saveStatus === "saving" ? (
              <span className="text-[#ffb77d] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb77d] animate-pulse" />
                <span>Saving...</span>
              </span>
            ) : saveStatus === "saved" ? (
              <span className="text-[#4edea3] flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Saved {lastSavedAt}</span>
              </span>
            ) : (
              <button
                onClick={handleManualSave}
                className="text-[#ffb4ab] hover:underline flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                <span>Save</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2">
          {/* Audit Originality Button */}
          <button
            onClick={handleAuditOriginality}
            disabled={isAuditing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#101319] hover:bg-[#1d2026] border border-[#222735] hover:border-[#ffb77d] text-xs font-mono text-[#ffb77d] transition-colors cursor-pointer disabled:opacity-50"
            title="Passage-by-passage originality & attribution review"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Originality Audit</span>
          </button>

          {/* Revisions Button */}
          <button
            onClick={() => setActiveTab(activeTab === "history" ? "editor" : "history")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-mono transition-colors cursor-pointer ${
              activeTab === "history"
                ? "bg-[#ffb77d]/10 border-[#ffb77d] text-[#ffb77d]"
                : "bg-[#101319] border-[#222735] text-[#b9c8de] hover:border-[#32353c]"
            }`}
            title="Draft version snapshots"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Revisions ({revisions.length})</span>
          </button>

          {/* References & Evidence Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === "references" ? "editor" : "references")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-mono transition-colors cursor-pointer ${
              activeTab === "references"
                ? "bg-[#4edea3]/10 border-[#4edea3] text-[#4edea3]"
                : "bg-[#101319] border-[#222735] text-[#e1e2eb] hover:border-[#32353c]"
            }`}
            title="Formatted bibliography"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bibliography</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ffb77d] hover:bg-[#ffdcc3] text-[#4d2600] font-mono text-xs uppercase font-bold tracking-wider transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-44 bg-[#191c22] border border-[#222735] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40 p-1 font-mono text-xs">
              <button
                onClick={async () => {
                  setIsExporting("docx");
                  await onExport("docx");
                  setIsExporting(null);
                }}
                className="w-full text-left px-3 py-2 text-[#e1e2eb] hover:bg-[#101319] hover:text-[#ffb77d] flex items-center justify-between"
              >
                <span>Word (.docx)</span>
                {isExporting === "docx" && <span className="animate-spin text-xs">⟳</span>}
              </button>
              <button
                onClick={async () => {
                  setIsExporting("pdf");
                  await onExport("pdf");
                  setIsExporting(null);
                }}
                className="w-full text-left px-3 py-2 text-[#e1e2eb] hover:bg-[#101319] hover:text-[#ffb77d] flex items-center justify-between"
              >
                <span>Academic PDF (.pdf)</span>
                {isExporting === "pdf" && <span className="animate-spin text-xs">⟳</span>}
              </button>
              <button
                onClick={async () => {
                  setIsExporting("markdown");
                  await onExport("markdown");
                  setIsExporting(null);
                }}
                className="w-full text-left px-3 py-2 text-[#e1e2eb] hover:bg-[#101319] hover:text-[#ffb77d] flex items-center justify-between"
              >
                <span>Markdown (.md)</span>
                {isExporting === "markdown" && <span className="animate-spin text-xs">⟳</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Section Navigator */}
        <aside className="w-64 sm:w-72 bg-[#14171e] border-r border-[#222735] flex flex-col shrink-0 overflow-y-auto">
          {/* Word count progress bar */}
          <div className="p-4 border-b border-[#222735] bg-[#101319]">
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-[#a38c7c]">TOTAL LENGTH</span>
              <span className="text-[#e1e2eb] font-bold">
                {totalWords.toLocaleString()} / {targetWords.toLocaleString()} w
              </span>
            </div>
            <div className="w-full bg-[#191c22] h-1.5 border border-[#222735] overflow-hidden">
              <div
                className="bg-[#4edea3] h-full transition-all duration-300"
                style={{ width: `${wordProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#a38c7c] mt-1">
              <span>{sections.length} sections</span>
              <span>{wordProgress}% of target</span>
            </div>
          </div>

          {/* Section List Items */}
          <div className="p-2 space-y-1 flex-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#a38c7c] px-2 py-1">
              Document Sections
            </div>
            {sections.map((sec, idx) => {
              const isSelected = sec.id === activeSection?.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveSectionId(sec.id);
                    setActiveTab("editor");
                  }}
                  className={`w-full text-left p-2.5 transition-colors flex items-center justify-between border cursor-pointer ${
                    isSelected
                      ? "bg-[#1d2026] border-[#ffb77d] text-[#e1e2eb]"
                      : "bg-[#101319] border-transparent hover:border-[#222735] text-[#dbc2b0]"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#a38c7c]">
                      <span>§ {idx + 1}</span>
                      {sec.status === "edited" && (
                        <span className="text-[#4edea3]">• edited</span>
                      )}
                      {sec.status === "pending_user" && (
                        <span className="text-[#ffb4ab]">• user input</span>
                      )}
                    </div>
                    <div className="text-xs font-serif truncate font-normal">
                      {sec.title}
                    </div>
                  </div>

                  <span className="font-mono text-[10px] text-[#a38c7c] shrink-0">
                    {sec.word_count || 0}w
                  </span>
                </button>
              );
            })}
          </div>

          {/* Discovered Sources Mini Registry */}
          <div className="p-3 border-t border-[#222735] bg-[#101319]">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#a38c7c] mb-2">
              <span>QUICK INSERT CITATION</span>
              <span>{sources.length} sources</span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {sources.slice(0, 8).map((src, idx) => (
                <button
                  key={src.id || idx}
                  onClick={() => insertCitation(`[${idx + 1}]`)}
                  className="w-full text-left p-1.5 bg-[#14171e] hover:bg-[#1d2026] border border-[#222735] text-[10px] font-mono truncate text-[#dbc2b0] hover:text-[#ffb77d] flex items-center justify-between"
                  title={`Click to insert inline citation [${idx + 1}]`}
                >
                  <span className="truncate">{idx + 1}. {src.title}</span>
                  <Plus className="w-3 h-3 text-[#ffb77d] shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: Active Section Editor */}
        {activeTab === "editor" && (
          <main className="flex-1 flex flex-col bg-[#101319] overflow-hidden">
            {/* Section Action Toolbar */}
            <div className="bg-[#191c22] border-b border-[#222735] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-wider text-[#ffb77d]">
                  Editing Section:
                </span>
                <span className="font-serif text-base text-[#e1e2eb]">
                  {activeSection?.title || "Select a section"}
                </span>
                <span className="text-xs font-mono text-[#a38c7c]">
                  ({activeSectionContent.split(/\s+/).filter(Boolean).length} words)
                </span>
              </div>

              {/* Section AI Transformation Cluster */}
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <button
                  onClick={() => activeSection && onTransformSection(activeSection.section_key, "clarity")}
                  className="px-2.5 py-1 bg-[#101319] hover:bg-[#1d2026] border border-[#222735] hover:border-[#b9c8de] text-[#b9c8de] transition-colors cursor-pointer"
                  title="Rewrite for improved scholarly flow and academic precision"
                >
                  Improve Clarity
                </button>
                <button
                  onClick={() => activeSection && onTransformSection(activeSection.section_key, "expand")}
                  className="px-2.5 py-1 bg-[#101319] hover:bg-[#1d2026] border border-[#222735] hover:border-[#4edea3] text-[#4edea3] transition-colors cursor-pointer"
                  title="Expand with deeper theoretical context and literature synthesis"
                >
                  Expand
                </button>
                <button
                  onClick={() => activeSection && onTransformSection(activeSection.section_key, "shorten")}
                  className="px-2.5 py-1 bg-[#101319] hover:bg-[#1d2026] border border-[#222735] hover:border-[#dbc2b0] text-[#dbc2b0] transition-colors cursor-pointer"
                  title="Condense into concise academic prose"
                >
                  Shorten
                </button>
                <button
                  onClick={() => activeSection && onRegenerateSection(activeSection.section_key)}
                  className="px-2.5 py-1 bg-[#101319] hover:bg-[#1d2026] border border-[#222735] hover:border-[#ffb77d] text-[#ffb77d] transition-colors cursor-pointer"
                  title="Regenerate this section only from evidence"
                >
                  Regenerate
                </button>
              </div>
            </div>

            {/* Editor Canvas */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-4xl w-full mx-auto">
              <div className="bg-[#14171e] border border-[#222735] shadow-xl p-6 sm:p-10 min-h-[70vh] flex flex-col">
                {/* Academic Section Heading */}
                <h2 className="font-serif text-2xl text-[#e1e2eb] font-normal mb-6 pb-3 border-b border-[#222735]">
                  {activeSection?.title}
                </h2>

                {/* Section Body Textarea */}
                <textarea
                  value={activeSectionContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Draft content for this section..."
                  className="flex-1 w-full bg-transparent text-[#e1e2eb] text-sm leading-relaxed font-sans placeholder-[#a38c7c]/50 focus:outline-none resize-none min-h-[500px]"
                />
              </div>
            </div>
          </main>
        )}

        {/* Tab: Formatted Bibliography */}
        {activeTab === "references" && (
          <main className="flex-1 flex flex-col bg-[#101319] overflow-hidden">
            <div className="bg-[#191c22] border-b border-[#222735] px-6 py-3 flex items-center justify-between shrink-0">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-[#4edea3]">
                  Bibliography & Reference List
                </span>
                <h2 className="font-serif text-lg text-[#e1e2eb] font-normal">
                  Formatted in {paper.citation_style || "APA 7"} Style
                </h2>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(formattedReferences);
                  setCopiedRef(true);
                  setTimeout(() => setCopiedRef(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#101319] hover:bg-[#1d2026] border border-[#222735] text-xs font-mono text-[#e1e2eb]"
              >
                {copiedRef ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRef ? "Copied" : "Copy All References"}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 max-w-4xl w-full mx-auto">
              <div className="bg-[#14171e] border border-[#222735] p-8 space-y-4 font-serif text-sm text-[#dbc2b0] leading-relaxed">
                {formattedReferences ? (
                  formattedReferences.split("\n\n").map((entry, idx) => (
                    <div key={idx} className="pl-6 -indent-6 border-b border-[#222735]/40 pb-3">
                      {entry}
                    </div>
                  ))
                ) : (
                  <p className="text-[#a38c7c] italic font-sans">No references generated yet.</p>
                )}
              </div>
            </div>
          </main>
        )}

        {/* Tab: Draft Version History & Revisions */}
        {activeTab === "history" && (
          <main className="flex-1 flex flex-col bg-[#101319] overflow-hidden">
            <div className="bg-[#191c22] border-b border-[#222735] px-6 py-3 flex items-center justify-between shrink-0">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-[#ffb77d]">
                  Draft Version History
                </span>
                <h2 className="font-serif text-lg text-[#e1e2eb] font-normal">
                  Save Snapshots & Restore Prior Edits
                </h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 max-w-3xl w-full mx-auto space-y-6">
              {/* Snapshot Creator */}
              <div className="bg-[#191c22] border border-[#222735] p-4 space-y-3">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#e1e2eb]">
                  Create Manual Draft Snapshot
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={revisionLabelInput}
                    onChange={(e) => setRevisionLabelInput(e.target.value)}
                    placeholder="e.g., Pre-defense draft with expanded methodology"
                    className="flex-1 bg-[#101319] border border-[#222735] focus:border-[#ffb77d] px-3 py-2 text-xs text-[#e1e2eb] focus:outline-none"
                  />
                  <button
                    onClick={handleCreateSnapshot}
                    disabled={isCreatingRevision}
                    className="px-4 py-2 bg-[#ffb77d] text-[#4d2600] font-mono text-xs uppercase font-bold tracking-wider cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingRevision ? "Saving..." : "Take Snapshot"}
                  </button>
                </div>
              </div>

              {/* Saved Snapshots List */}
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase text-[#a38c7c]">
                  Saved Snapshots ({revisions.length})
                </div>
                {revisions.length === 0 ? (
                  <div className="p-8 text-center bg-[#191c22] border border-[#222735] text-xs font-mono text-[#a38c7c]">
                    No snapshots taken yet. Click 'Take Snapshot' to create an immutable rollback point.
                  </div>
                ) : (
                  revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-[#191c22] border border-[#222735] p-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs text-[#e1e2eb] font-medium font-sans">
                          {rev.revision_label}
                        </div>
                        <div className="text-[11px] font-mono text-[#a38c7c]">
                          {new Date(rev.created_at).toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRestore(rev.id)}
                        className="px-3 py-1.5 bg-[#101319] hover:bg-[#272a31] border border-[#222735] hover:border-[#ffb77d] text-xs font-mono text-[#ffb77d] transition-colors cursor-pointer"
                      >
                        Restore Draft
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Originality Audit Modal */}
      <PaperOriginalityModal
        isOpen={isOriginalityModalOpen}
        onClose={() => setIsOriginalityModalOpen(false)}
        report={originalityReport}
        findings={originalityFindings}
        onApplySuggestion={handleApplyOriginalitySuggestion}
        onRerunCheck={handleAuditOriginality}
        isLoading={isAuditing}
      />
    </div>
  );
};
