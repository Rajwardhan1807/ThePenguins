"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  ListTree,
  Tag,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  FileText,
  Search,
  Sparkles
} from "lucide-react";
import { Paper } from "@/lib/api";

interface PaperPlanViewProps {
  paper: Paper;
  onApprovePlan: (updatedPlan: any) => void;
  onRegeneratePlan: () => void;
  onBackToConfig: () => void;
  isLoading: boolean;
}

export const PaperPlanView: React.FC<PaperPlanViewProps> = ({
  paper,
  onApprovePlan,
  onRegeneratePlan,
  onBackToConfig,
  isLoading,
}) => {
  const initialPlan = (paper.plan as any) || {};

  const [problemStatement, setProblemStatement] = useState<string>(
    initialPlan.problem_statement || `Investigating: ${paper.research_question || paper.title}`
  );
  const [researchGaps, setResearchGaps] = useState<string[]>(
    initialPlan.research_gaps || [
      `Candidate gap: Limited systematic empirical benchmarks for ${paper.title}`,
      `Candidate gap: Unresolved trade-offs between accuracy and latency in local deployment`,
    ]
  );
  const [newGap, setNewGap] = useState("");

  const [researchQuestions, setResearchQuestions] = useState<string[]>(
    initialPlan.research_questions || [
      paper.research_question || `What are the primary factors influencing ${paper.title}?`,
    ]
  );
  const [newQuestion, setNewQuestion] = useState("");

  const [objectives, setObjectives] = useState<string[]>(
    initialPlan.objectives || [
      `Synthesize contemporary peer-reviewed literature.`,
      `Evaluate empirical trade-offs and build a comparative taxonomy.`,
    ]
  );
  const [newObjective, setNewObjective] = useState("");

  const [keywords, setKeywords] = useState<string[]>(
    initialPlan.search_keywords || [
      paper.title,
      paper.field,
      "empirical analysis",
      "methodology",
      "benchmarks",
    ]
  );
  const [newKeyword, setNewKeyword] = useState("");

  const [methodology, setMethodology] = useState<string>(
    initialPlan.methodology_approach ||
      "Systematic Literature Review following PRISMA guidelines with empirical claim verification."
  );

  const [outline, setOutline] = useState<string[]>(
    initialPlan.outline || [
      "Abstract",
      "Introduction",
      "Background and Related Work",
      "Methodology",
      "Results and Evidence Synthesis",
      "Discussion and Open Questions",
      "Limitations",
      "Conclusion",
      "References",
    ]
  );

  const addGap = () => {
    if (newGap.trim()) {
      setResearchGaps([...researchGaps, newGap.trim()]);
      setNewGap("");
    }
  };

  const removeGap = (idx: number) => {
    setResearchGaps(researchGaps.filter((_, i) => i !== idx));
  };

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setResearchQuestions([...researchQuestions, newQuestion.trim()]);
      setNewQuestion("");
    }
  };

  const removeQuestion = (idx: number) => {
    setResearchQuestions(researchQuestions.filter((_, i) => i !== idx));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleApprove = () => {
    const updatedPlan = {
      ...initialPlan,
      problem_statement: problemStatement,
      research_gaps: researchGaps,
      research_questions: researchQuestions,
      objectives: objectives,
      search_keywords: keywords,
      methodology_approach: methodology,
      outline: outline,
      approved_at: new Date().toISOString(),
    };
    onApprovePlan(updatedPlan);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-[#191c22] border border-[#222735] p-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#ffb77d]">
            <ListTree className="w-4 h-4 text-[#ffb77d]" />
            <span>Stage 2 of 5: Research Plan Review & Approval</span>
          </div>
          <button
            onClick={onBackToConfig}
            className="inline-flex items-center gap-1 text-xs font-mono text-[#a38c7c] hover:text-[#e1e2eb] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Edit Configuration</span>
          </button>
        </div>
        <h1 className="font-serif text-2xl text-[#e1e2eb] mt-2 font-normal">
          Review & Refine Research Plan
        </h1>
        <p className="text-xs text-[#dbc2b0] mt-1 max-w-2xl leading-relaxed">
          The autonomous strategist formulated the following research framework. You can inspect, modify, or augment the research gaps, questions, search queries, and section outline before initiating primary source discovery.
        </p>

        {/* Paper Metadata Badge Ribbon */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#222735] font-mono text-xs text-[#a38c7c]">
          <span className="px-2 py-0.5 bg-[#101319] border border-[#222735] text-[#ffb77d]">
            {paper.paper_type}
          </span>
          <span className="px-2 py-0.5 bg-[#101319] border border-[#222735] text-[#b9c8de]">
            {paper.field}
          </span>
          <span className="px-2 py-0.5 bg-[#101319] border border-[#222735] text-[#4edea3]">
            {paper.citation_style}
          </span>
          <span className="px-2 py-0.5 bg-[#101319] border border-[#222735]">
            Target: ~{paper.target_word_count} words
          </span>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="bg-[#191c22] border border-[#222735] p-6 space-y-3">
        <label className="block text-xs font-mono uppercase tracking-wider text-[#e1e2eb] flex items-center justify-between">
          <span>Problem Statement & Framing</span>
          <span className="text-[10px] text-[#a38c7c] lowercase font-sans">Editable</span>
        </label>
        <textarea
          rows={3}
          value={problemStatement}
          onChange={(e) => setProblemStatement(e.target.value)}
          className="w-full bg-[#101319] border border-[#222735] focus:border-[#ffb77d] p-3 text-sm text-[#e1e2eb] focus:outline-none transition-colors"
        />
      </div>

      {/* Candidate Research Gaps */}
      <div className="bg-[#191c22] border border-[#222735] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#222735] pb-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#e1e2eb]">
            <AlertCircle className="w-4 h-4 text-[#ffb77d]" />
            <span>Candidate Research Gaps (To be validated by literature)</span>
          </div>
          <span className="text-[10px] font-mono text-[#a38c7c]">
            {researchGaps.length} gaps defined
          </span>
        </div>

        <div className="space-y-2">
          {researchGaps.map((gap, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 p-3 bg-[#101319] border border-[#222735]"
            >
              <div className="flex items-start gap-2.5 text-xs text-[#e1e2eb] leading-relaxed">
                <span className="font-mono text-[#ffb77d] font-bold">GAP-{idx + 1}:</span>
                <span>{gap}</span>
              </div>
              <button
                type="button"
                onClick={() => removeGap(idx)}
                className="text-[#a38c7c] hover:text-[#ffb4ab] transition-colors p-1"
                title="Remove gap"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newGap}
              onChange={(e) => setNewGap(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGap())}
              placeholder="Add another candidate research gap..."
              className="flex-1 bg-[#101319] border border-[#222735] focus:border-[#ffb77d] px-3 py-2 text-xs text-[#e1e2eb] focus:outline-none"
            />
            <button
              type="button"
              onClick={addGap}
              className="px-3 py-2 bg-[#1d2026] hover:bg-[#272a31] border border-[#222735] text-[#e1e2eb] font-mono text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#ffb77d]" />
              <span>Add Gap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Research Questions */}
      <div className="bg-[#191c22] border border-[#222735] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#222735] pb-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#e1e2eb]">
            <HelpCircle className="w-4 h-4 text-[#4edea3]" />
            <span>Research Questions (RQ)</span>
          </div>
          <span className="text-[10px] font-mono text-[#a38c7c]">
            {researchQuestions.length} questions
          </span>
        </div>

        <div className="space-y-2">
          {researchQuestions.map((q, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 p-3 bg-[#101319] border border-[#222735]"
            >
              <div className="flex items-start gap-2.5 text-xs text-[#e1e2eb] leading-relaxed">
                <span className="font-mono text-[#4edea3] font-bold">RQ-{idx + 1}:</span>
                <span>{q}</span>
              </div>
              <button
                type="button"
                onClick={() => removeQuestion(idx)}
                className="text-[#a38c7c] hover:text-[#ffb4ab] transition-colors p-1"
                title="Remove question"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addQuestion())}
              placeholder="Add another research question..."
              className="flex-1 bg-[#101319] border border-[#222735] focus:border-[#4edea3] px-3 py-2 text-xs text-[#e1e2eb] focus:outline-none"
            />
            <button
              type="button"
              onClick={addQuestion}
              className="px-3 py-2 bg-[#1d2026] hover:bg-[#272a31] border border-[#222735] text-[#e1e2eb] font-mono text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#4edea3]" />
              <span>Add RQ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Keywords (Crossref & Web Search) */}
      <div className="bg-[#191c22] border border-[#222735] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#222735] pb-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#e1e2eb]">
            <Search className="w-4 h-4 text-[#b9c8de]" />
            <span>Source Discovery Keywords (arXiv / CrossRef Queries)</span>
          </div>
          <span className="text-[10px] font-mono text-[#a38c7c]">
            Used for automated literature retrieval
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#101319] border border-[#222735] text-xs font-mono text-[#e1e2eb]"
            >
              <Tag className="w-3 h-3 text-[#b9c8de]" />
              <span>{kw}</span>
              <button
                type="button"
                onClick={() => removeKeyword(kw)}
                className="text-[#a38c7c] hover:text-[#ffb4ab] ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
            placeholder="Type keyword and press Enter..."
            className="flex-1 bg-[#101319] border border-[#222735] focus:border-[#b9c8de] px-3 py-2 text-xs text-[#e1e2eb] focus:outline-none"
          />
          <button
            type="button"
            onClick={addKeyword}
            className="px-3 py-2 bg-[#1d2026] hover:bg-[#272a31] border border-[#222735] text-[#e1e2eb] font-mono text-xs flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#b9c8de]" />
            <span>Add Keyword</span>
          </button>
        </div>
      </div>

      {/* Section Outline Preview */}
      <div className="bg-[#191c22] border border-[#222735] p-6 space-y-3">
        <div className="flex items-center justify-between border-b border-[#222735] pb-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#e1e2eb]">
            <FileText className="w-4 h-4 text-[#ffb77d]" />
            <span>Target Paper Section Outline</span>
          </div>
          <span className="text-[10px] font-mono text-[#a38c7c]">
            {outline.length} sections planned
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {outline.map((sec, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2.5 bg-[#101319] border border-[#222735] text-xs font-mono text-[#dbc2b0]"
            >
              <span className="text-[#a38c7c] w-6">{idx + 1}.</span>
              <span className="text-[#e1e2eb] font-sans font-medium">{sec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#222735]">
        <button
          type="button"
          onClick={onRegeneratePlan}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#191c22] hover:bg-[#272a31] border border-[#222735] text-xs font-mono text-[#dbc2b0] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Regenerate with New Strategy</span>
        </button>

        <button
          type="button"
          onClick={handleApprove}
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#4edea3] hover:bg-[#6ffbbe] text-[#003824] font-mono text-xs uppercase font-bold tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-[#003824] border-t-transparent rounded-full animate-spin" />
              <span>Collecting Sources...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Plan & Discover Sources</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
