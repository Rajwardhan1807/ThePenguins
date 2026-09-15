"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, FileText, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
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
      setError(err.message || "Failed to upload document");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2.5 mb-2">
          <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/40">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Local Document Research</h3>
            <p className="text-xs text-slate-400">Analyze local PDFs, DOCX, and TXT files securely with zero cloud exposure.</p>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-5 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center ${
            dragActive
              ? "border-cyan-400 bg-cyan-950/20"
              : "border-slate-700/80 hover:border-slate-500 bg-slate-900/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />

          <UploadCloud className="w-10 h-10 text-cyan-400 mb-3 animate-bounce" />
          <p className="text-sm font-semibold text-white">Click or drag & drop files here</p>
          <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, TXT, MD (Up to 50MB)</p>
          <span className="text-[10px] text-emerald-400 mt-2 font-mono">100% Local Machine Processing</span>
        </div>

        {/* Upload Status */}
        {isUploading && (
          <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3 text-xs text-slate-300">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            <span>Parsing document pages and extracting text passages locally...</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/40 flex items-center space-x-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {uploadResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-emerald-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white truncate max-w-[220px]">{uploadResult.filename}</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">
                {uploadResult.pages} Page(s) Parsed
              </span>
            </div>

            <button
              onClick={() => {
                onDocumentReady(uploadResult.id, uploadResult.filename);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs tracking-wide transition hover:opacity-90 shadow-lg shadow-cyan-500/20"
            >
              Start Document Research With This File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
