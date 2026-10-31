"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, FileText, Check, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentReady: (docId: string, filename: string) => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ isOpen, onClose, onDocumentReady }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ id: string; filename: string; pages: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setIsUploading(true);
    try {
      const res = await api.uploadDocument(file);
      setUploadResult({ id: res.id, filename: res.filename, pages: res.pages });
    } catch (err: any) {
      setError(err.message || "Failed to parse document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none">
      <div className="w-full max-w-xl bg-[#0b0e14] border border-[#222735] p-6 text-[#e1e2eb] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[#a38c7c] hover:text-[#f1f5f9] border border-[#222735] bg-[#101319] cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="pb-4 border-b border-[#222735]">
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#ffb77d] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Air-Gapped Ingestion Chamber</span>
          </div>
          <h3 className="font-serif text-2xl text-[#f1f5f9] font-normal">
            Corpus Ingestion &amp; Parsing Pipeline
          </h3>
          <p className="text-xs text-[#dbc2b0] mt-1">
            Ingest local primary dossiers, statutory PDF filings, legal gazettes, and academic texts.
            All parsing is executed locally on POSIX threads with zero cloud exposure.
          </p>
        </div>

        {/* Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-5 border border-dashed p-8 text-center cursor-pointer transition-none flex flex-col items-center justify-center ${
            dragActive
              ? "border-[#ffb77d] bg-[#d97706]/10"
              : "border-[#2a3142] hover:border-[#a38c7c] bg-[#101319]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />

          <UploadCloud className="w-8 h-8 text-[#ffb77d] mb-2" />
          <p className="font-mono text-sm font-semibold text-[#f1f5f9]">
            SELECT OR DRAG &amp; DROP ARCHIVAL RECORD
          </p>
          <p className="text-xs text-[#a38c7c] font-mono mt-1">
            Permitted: PDF, DOCX, TXT, MD (Max 50MB per dossier)
          </p>
          <div className="mt-3 text-[10px] font-mono text-[#4edea3] border border-[#10b981]/40 bg-[#10b981]/10 px-2 py-0.5">
            LOCAL ENGINE: DETERMINISTIC EXTRACTION
          </div>
        </div>

        {/* Uploading Status */}
        {isUploading && (
          <div className="mt-4 p-3 bg-[#101319] border border-[#222735] flex items-center gap-3 text-xs font-mono text-[#dbc2b0]">
            <Loader2 className="w-4 h-4 text-[#ffb77d] animate-spin shrink-0" />
            <span>Parsing document pages and extracting text passages locally...</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-[#93000a]/20 border border-[#dc2626] flex items-center gap-3 text-xs font-mono text-[#ffb4ab]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Success Result */}
        {uploadResult && (
          <div className="mt-4 p-4 bg-[#101319] border border-[#10b981] space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <Check className="w-4 h-4 text-[#4edea3] shrink-0" />
                <span className="font-bold text-[#f1f5f9] truncate">{uploadResult.filename}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 bg-[#10b981]/10 border border-[#10b981] text-[#4edea3] shrink-0">
                {uploadResult.pages} Page(s) Parsed
              </span>
            </div>

            <button
              onClick={() => {
                onDocumentReady(uploadResult.id, uploadResult.filename);
                onClose();
              }}
              className="w-full py-2.5 bg-[#d97706] hover:bg-[#ffb77d] text-[#08090b] font-bold text-xs uppercase tracking-wider transition-none cursor-pointer"
            >
              Execute Epistemic Audit With Ingested Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
