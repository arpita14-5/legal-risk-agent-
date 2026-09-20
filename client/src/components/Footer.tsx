import React from 'react';
import { AlertTriangle, ShieldCheck, Scale, FileCode2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 mt-auto text-slate-400 text-xs">
      {/* Prominent Legal Disclaimer Banner */}
      <div className="bg-amber-950/20 border-b border-amber-900/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-amber-200/90 text-[11px] sm:text-xs leading-relaxed">
            <strong className="text-amber-300 font-semibold uppercase tracking-wider mr-1.5">Legal Disclaimer:</strong>
            LexGuard provides AI-generated legal information and contract analysis for informational and educational purposes only. It does not constitute legal advice. Important legal decisions should be reviewed by a qualified legal professional.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-300">
          <Scale className="w-4 h-4 text-amber-500" />
          <span className="font-serif font-semibold text-white">LexGuard</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 text-xs">Final-Year Academic Capstone Project</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Hybrid RAG & Vector Embeddings
          </span>
          <span className="flex items-center gap-1">
            <FileCode2 className="w-3.5 h-3.5 text-sky-400" />
            Multi-Agent Verification Pipeline
          </span>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          &copy; {new Date().getFullYear()} LexGuard Legal Intelligence
        </div>
      </div>
    </footer>
  );
};