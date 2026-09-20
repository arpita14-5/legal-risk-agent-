import React, { useState } from 'react';
import {
  Upload,
  X,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileUp,
  Sparkles
} from 'lucide-react';
import { uploadContract } from '../api/contracts.js';
import type { ContractDocument } from '../types/index.js';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contract: ContractDocument) => void;
}

const STAGES = [
  'Uploading document to secure workspace',
  'Extracting text & page layout parsing',
  'Detecting & classifying legal clauses',
  'Generating semantic vector embeddings',
  'Orchestrating multi-agent risk evaluation',
  'Finalizing deterministic audit scores'
];

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [contractType, setContractType] = useState('Master Services Agreement');
  const [isUploading, setIsUploading] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      if (!title) {
        setTitle(dropped.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);
    setCurrentStageIdx(0);

    const stageInterval = setInterval(() => {
      setCurrentStageIdx(prev => {
        if (prev < STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 900);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('title', title);
      formData.append('contractType', contractType);

      const contract = await uploadContract(formData);
      clearInterval(stageInterval);
      setCurrentStageIdx(STAGES.length - 1);

      setTimeout(() => {
        setIsUploading(false);
        onSuccess(contract);
        onClose();
      }, 600);
    } catch (err: any) {
      clearInterval(stageInterval);
      setIsUploading(false);
      setErrorMessage(err.response?.data?.error || err.message || 'Upload failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          disabled={isUploading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-white">Upload Legal Contract</h3>
            <p className="text-xs text-slate-400">Upload PDF or DOCX for automated AI intelligence & risk audit</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isUploading ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span className="font-semibold text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                Processing Contract Intelligence
              </span>
              <span className="font-mono text-slate-400">{Math.round(((currentStageIdx + 1) / STAGES.length) * 100)}%</span>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 ease-out"
                style={{ width: `${((currentStageIdx + 1) / STAGES.length) * 100}%` }}
              />
            </div>

            <div className="space-y-2 mt-4 pt-2 border-t border-slate-800/80">
              {STAGES.map((stage, idx) => {
                const isDone = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                return (
                  <div key={idx} className="flex items-center gap-2.5 text-xs">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span className={isCurrent ? 'text-amber-200 font-medium' : isDone ? 'text-slate-400' : 'text-slate-600'}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40 relative group"
            >
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                required
              />
              <FileUp className="w-9 h-9 text-slate-500 group-hover:text-amber-400 mx-auto mb-2 transition-colors" />
              {file ? (
                <div className="text-xs text-slate-200 font-medium flex items-center justify-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="truncate max-w-xs">{file.name}</span>
                  <span className="text-slate-500 font-mono">({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-slate-300">Click to upload or drag & drop</p>
                  <p className="text-[11px] text-slate-400 mt-1">PDF or Word (.docx) up to 25MB</p>
                </>
              )}
            </div>

            {/* Document Title */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contract Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Services Agreement 2025"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Contract Type */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contract Category</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Master Services Agreement">Master Services Agreement (MSA)</option>
                <option value="Non-Disclosure Agreement">Non-Disclosure Agreement (NDA)</option>
                <option value="Vendor Agreement">Vendor / Supplier Agreement</option>
                <option value="Software License Agreement">Software License / SaaS Agreement</option>
                <option value="Employment Agreement">Employment Agreement</option>
                <option value="Partnership Agreement">Partnership Agreement</option>
                <option value="Commercial Lease Agreement">Commercial Lease Agreement</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file}
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-all shadow-md disabled:opacity-40 disabled:hover:bg-amber-500"
              >
                Upload & Run Audit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};