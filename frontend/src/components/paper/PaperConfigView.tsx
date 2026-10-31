"use client";

import React, { useState } from "react";
import {
  Sparkles,
  BookOpen,
  Sliders,
  Compass,
  FileText,
  Target,
  GraduationCap,
  Scale,
  Hash,
  ArrowRight,
  HelpCircle,
  Lightbulb
} from "lucide-react";
import { Paper } from "@/lib/api";

interface PaperConfigViewProps {
  onStartPlanning: (config: Partial<Paper>) => void;
  isLoading: boolean;
}

const PRESET_TOPICS = [
  {
    title: "Post-Quantum Cryptography in Resource-Constrained Edge IoT Devices",
    field: "Computer Science & AI",
    paper_type: "Survey Paper",
    citation_style: "IEEE",
    rq: "What are the computational trade-offs of lattice-based post-quantum key encapsulation algorithms on embedded ARM Cortex-M microcontrollers?",
  },
  {
    title: "Hallucination Mitigation in Local Multi-Agent Retrieval-Augmented Generation",
    field: "Computer Science & AI",
    paper_type: "Systematic Literature Review",
    citation_style: "APA 7",
    rq: "To what extent do multi-agent cross-verification loops reduce factual hallucinations compared to single-agent RAG in proprietary corpora?",
  },
  {
    title: "Autonomous AI Agents in Macroeconomic Market Microstructure",
    field: "Economics & Business",
    paper_type: "Empirical / Experimental Study",
    citation_style: "Chicago",
    rq: "How does the proliferation of algorithmic LLM execution agents alter intraday volatility and liquidity depth across decentralized exchanges?",
  },
];

export const PaperConfigView: React.FC<PaperConfigViewProps> = ({
  onStartPlanning,
  isLoading,
}) => {
  const [title, setTitle] = useState("");
  const [researchQuestion, setResearchQuestion] = useState("");
  const [objectives, setObjectives] = useState("");
  const [field, setField] = useState("Computer Science & AI");
  const [paperType, setPaperType] = useState("Literature Review");
  const [citationStyle, setCitationStyle] = useState("APA 7");
  const [targetWordCount, setTargetWordCount] = useState<number>(5000);
  const [academicLevel, setAcademicLevel] = useState("Master's / Graduate");
  const [methodology, setMethodology] = useState("Systematic Literature Review (PRISMA)");
  const [researchDepth, setResearchDepth] = useState<"quick" | "standard" | "deep">("deep");
  const [language, setLanguage] = useState("English");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onStartPlanning({
      title: title.trim(),
      research_question: researchQuestion.trim() || `Investigation into ${title.trim()}`,
      objectives: objectives.trim() || `Synthesize state-of-the-art literature, identify research gaps, and propose an analytical framework for ${title.trim()}.`,
      field,
      paper_type: paperType,
      citation_style: citationStyle,
      target_word_count: Number(targetWordCount),
      research_depth: researchDepth,
      language,
      target_audience: `${academicLevel} Academic Peers`,
    });
  };

  const applyPreset = (preset: typeof PRESET_TOPICS[0]) => {
    setTitle(preset.title);
    setField(preset.field);
    setPaperType(preset.paper_type);
    setCitationStyle(preset.citation_style);
    setResearchQuestion(preset.rq);
    setObjectives(`Analyze recent peer-reviewed publications (2020-2025), compare performance empirical benchmarks, and identify unresolved challenges.`);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="bg-[#191c22] border border-[#222735] p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffb77d]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2 font-mono text-xs uppercase tracking-widest text-[#ffb77d]">
          <GraduationCap className="w-4 h-4 text-[#ffb77d]" />
          <span>ResearchForge Academic Engine</span>
          <span className="text-[#a38c7c]">•</span>
          <span className="text-[#4edea3]">Zero-Cost Local Pipeline</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl text-[#e1e2eb] font-normal tracking-tight">
          Configure AI Research Paper
        </h1>
        <p className="text-sm text-[#dbc2b0] mt-1 max-w-2xl leading-relaxed">
          Define your research topic, academic criteria, and methodology. ResearchForge will formulate a peer-review-grade research plan, discover primary sources, verify empirical claims, and draft a structured academic paper.
        </p>

        {/* Preset Topics Carousel */}
        <div className="mt-4 pt-4 border-t border-[#222735]/80">
          <div className="flex items-center gap-2 text-xs font-mono text-[#a38c7c] mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-[#ffb77d]" />
            <span>Select a pre-formulated academic inquiry or enter your own:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESET_TOPICS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-left p-2.5 bg-[#101319] hover:bg-[#1d2026] border border-[#222735] hover:border-[#ffb77d]/40 transition-colors group cursor-pointer"
              >
                <div className="text-xs font-medium text-[#e1e2eb] group-hover:text-[#ffb77d] line-clamp-1">
                  {p.title}
                </div>
                <div className="text-[10px] font-mono text-[#a38c7c] mt-1 flex items-center gap-2">
                  <span>{p.field}</span>
                  <span>•</span>
                  <span>{p.citation_style}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Topic & Question */}
        <div className="bg-[#191c22] border border-[#222735] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222735] pb-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#e1e2eb]">
              <Target className="w-4 h-4 text-[#ffb77d]" />
              <span>1. Research Scope & Inquiry</span>
            </div>
            <span className="text-[11px] font-mono text-[#a38c7c]">Stage 1 of 5</span>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#dbc2b0] mb-1.5 uppercase tracking-wider">
              Research Topic / Working Title <span className="text-[#ffb4ab]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Evaluation of Quantized Small Language Models in Edge Clinical Diagnostic Support"
              className="w-full bg-[#101319] border border-[#222735] focus:border-[#ffb77d] px-3.5 py-2.5 text-sm text-[#e1e2eb] placeholder-[#a38c7c]/60 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#dbc2b0] mb-1.5 uppercase tracking-wider">
              Primary Research Question (RQ)
            </label>
            <textarea
              rows={2}
              value={researchQuestion}
              onChange={(e) => setResearchQuestion(e.target.value)}
              placeholder="e.g., How do 4-bit quantized local models compare against 16-bit baselines in medical entity extraction accuracy and diagnostic latency?"
              className="w-full bg-[#101319] border border-[#222735] focus:border-[#ffb77d] px-3.5 py-2.5 text-sm text-[#e1e2eb] placeholder-[#a38c7c]/60 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#dbc2b0] mb-1.5 uppercase tracking-wider">
              Research Objectives & Specific Gaps to Address
            </label>
            <textarea
              rows={2}
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="e.g., (1) Systematically catalog benchmark datasets; (2) Synthesize conflicting claims on accuracy degradation; (3) Propose architectural guidelines for edge deployment."
              className="w-full bg-[#101319] border border-[#222735] focus:border-[#ffb77d] px-3.5 py-2.5 text-sm text-[#e1e2eb] placeholder-[#a38c7c]/60 focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Academic Classification */}
        <div className="bg-[#191c22] border border-[#222735] p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#e1e2eb] border-b border-[#222735] pb-3">
            <Compass className="w-4 h-4 text-[#4edea3]" />
            <span>2. Academic Taxonomy & Structure</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#dbc2b0] mb-1.5 uppercase tracking-wider">
                Field of Study
              </label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full bg-[#101319] border border-[#222735] focus:border-[#4edea3] px-3 py-2 text-sm text-[#e1e2eb] focus:outline-none"
              >
                <option value="Computer Science & AI">Computer Science & AI</option>
                <option value="Medicine & Health">Medicine & Health Sciences</option>
                <option value="Physics & Mathematics">Physics & Mathematics</option>
                <option value="Economics & Finance">Economics & Finance</option>
                <option value="Engineering & Robotics">Engineering & Robotics</option>
                <option value="Social Sciences">Social Sciences & Humanities</option>
                <option value="Law & Public Policy">Law & Public Policy</option>
                <option value="Environmental Science">Environmental & Earth Sciences</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#dbc2b0] mb-1.5 uppercase tracking-wider">
                Paper Typology
              </label>
              <select
                value={paperType}
                onChange={(e) => setPaperType(e.target.value)}
                className="w-full bg-[#101319] border border-[#222735] focus:border-[#4edea3] px-3 py-2 text-sm text-[#e1e2eb] focus:outline-none"
              >
                <option value="Literature Review">Literature Review (Critical Synthesis)</option>
                <option value="Systematic Literature Review">Systematic Literature Review (PRISMA)</option>
                <option value="Survey Paper">Comprehensive Survey Paper</option>
                <option value="Empirical / Experimental Study">Empirical / Experimental Study</option>
                <option value="Position Paper">Position Paper (Perspective & Argument)</option>
                <option value="Comparative Analysis">Comparative Architectural Analysis</option>
                <option value="General Academic Paper">General Academic Research Paper</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#dbc2b0] mb-1.5 uppercase tracking-wider">
                Citation & Bibliography Style
              </label>
              <select
                value={citationStyle}
                onChange={(e) => setCitationStyle(e.target.value)}
                className="w-full bg-[#101319] border border-[#222735] focus:border-[#4edea3] px-3 py-2 text-sm text-[#e1e2eb] focus:outline-none font-mono"
              >
                <option value="APA 7">APA 7th Edition (Author, Year)</option>
                <option value="IEEE">IEEE Style ([1] Sequential Numbered)</option>
                <option value="MLA 9">MLA 9th Edition (Humanities)</option>
                <option value="Chicago">Chicago 17th Edition (Author-Date)</option>
                <option value="Harvard">Harvard Reference Format</option>
                <option value="Vancouver">Vancouver Biomedical Format</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#dbc2b0] mb-1.5 uppercase tracking-wider">
                Target Word Count
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2500, 5000, 8000, 12000].map((wc) => (
                  <button
                    key={wc}
                    type="button"
                    onClick={() => setTargetWordCount(wc)}
                    className={`py-1.5 text-xs font-mono border transition-colors ${
                      targetWordCount === wc
                        ? "bg-[#ffb77d]/10 border-[#ffb77d] text-[#ffb77d]"
                        : "bg-[#101319] border-[#222735] text-[#a38c7c] hover:border-[#32353c]"
                    }`}
                  >
                    {wc >= 1000 ? `${wc / 1000}k` : wc} w
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Methodology & Depth */}
        <div className="bg-[#191c22] border border-[#222735] p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#e1e2eb] border-b border-[#222735] pb-3">
            <Sliders className="w-4 h-4 text-[#b9c8de]" />
            <span>3. Methodology & Evidence Rigor</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#dbc2b0] mb-1.5 uppercase tracking-wider">
                Methodology Framework
              </label>
              <input
                type="text"
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                placeholder="e.g., Systematic Review (PRISMA 2020 Guidelines)"
                className="w-full bg-[#101319] border border-[#222735] focus:border-[#b9c8de] px-3 py-2 text-sm text-[#e1e2eb] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#dbc2b0] mb-1.5 uppercase tracking-wider">
                Academic Rigor Level
              </label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value)}
                className="w-full bg-[#101319] border border-[#222735] focus:border-[#b9c8de] px-3 py-2 text-sm text-[#e1e2eb] focus:outline-none"
              >
                <option value="Undergraduate Honors">Undergraduate Honors</option>
                <option value="Master's / Graduate">Master's / Graduate Level</option>
                <option value="Doctoral / PhD">Doctoral / PhD Dissertation</option>
                <option value="Postdoctoral / Peer-Reviewed">Postdoctoral / Peer-Reviewed Journal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#dbc2b0] mb-2 uppercase tracking-wider">
              Source Discovery Depth
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: "quick",
                  title: "Rapid Scoping",
                  desc: "5-10 foundational sources. Fast synthesis.",
                },
                {
                  id: "standard",
                  title: "Standard Scholarly",
                  desc: "10-20 peer-reviewed papers & CrossRef records.",
                },
                {
                  id: "deep",
                  title: "Deep Archival",
                  desc: "Extensive multi-source cross-verification + conflict matrix.",
                },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setResearchDepth(lvl.id as any)}
                  className={`p-3 text-left border transition-colors cursor-pointer ${
                    researchDepth === lvl.id
                      ? "bg-[#ffb77d]/10 border-[#ffb77d]"
                      : "bg-[#101319] border-[#222735] hover:border-[#32353c]"
                  }`}
                >
                  <div className={`text-xs font-mono uppercase font-bold ${
                    researchDepth === lvl.id ? "text-[#ffb77d]" : "text-[#e1e2eb]"
                  }`}>
                    {lvl.title}
                  </div>
                  <div className="text-[11px] text-[#a38c7c] mt-1 leading-normal">
                    {lvl.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs font-mono text-[#a38c7c] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
            <span>Local Qwen Inference Active • No Paid APIs Required</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !title.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffb77d] hover:bg-[#ffdcc3] text-[#4d2600] font-mono text-xs uppercase font-semibold tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-[#4d2600] border-t-transparent rounded-full animate-spin" />
                <span>Formulating Plan...</span>
              </>
            ) : (
              <>
                <span>Generate Research Plan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
