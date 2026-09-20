import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Search,
  Highlighter,
  FileText,
  ExternalLink,
  Info
} from 'lucide-react';
import type { ContractDocument, Clause, ContractEvidence } from '../types/index.js';

interface ContractViewerProps {
  contract: ContractDocument;
  clauses: Clause[];
  activeEvidence?: ContractEvidence | null;
  onClauseSelect?: (clause: Clause) => void;
}

export const ContractViewer: React.FC<ContractViewerProps> = ({
  contract,
  clauses,
  activeEvidence,
  onClauseSelect
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlightedSnippet, setHighlightedSnippet] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const evidenceRef = useRef<HTMLDivElement>(null);

  // Group clauses by estimated page
  const totalPages = Math.max(1, ...clauses.map(c => c.pageNumber || 1));

  // If external activeEvidence is passed, navigate to that page and highlight!
  useEffect(() => {
    if (activeEvidence) {
      if (activeEvidence.page) {
        setCurrentPage(activeEvidence.page);
      }
      setHighlightedSnippet(activeEvidence.text);

      // Auto scroll to highlighted clause element after state updates
      setTimeout(() => {
        if (evidenceRef.current) {
          evidenceRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [activeEvidence]);

  const clausesOnCurrentPage = clauses.filter(c => (c.pageNumber || 1) === currentPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-500" />
          <span className="font-medium text-slate-200 truncate max-w-[200px]">{contract.fileName}</span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] font-mono text-slate-400 uppercase">{contract.fileType}</span>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-medium text-slate-200">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">
            <button
              onClick={() => setZoom(z => Math.max(70, z - 10))}
              className="p-0.5 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono w-10 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(z => Math.min(150, z + 10))}
              className="p-0.5 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-0.5 text-slate-500 hover:text-slate-300 ml-1 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <a
            href={contract.filePath.startsWith('http') ? contract.filePath : `/uploads/${contract.fileName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-md hover:text-amber-400 hover:border-amber-500/30 transition-all"
            title="Open Original Document"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Active Highlighting Banner */}
      {activeEvidence && (
        <div className="flex items-center justify-between bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Highlighter className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>
              <strong>Target Clause Identified:</strong> {activeEvidence.section} (Page {activeEvidence.page})
            </span>
          </div>
          <button
            onClick={() => setHighlightedSnippet(null)}
            className="text-[11px] text-amber-300 hover:text-white underline ml-2"
          >
            Clear Highlight
          </button>
        </div>
      )}

      {/* Document Content Paper Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-950/70"
      >
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-lg p-8 sm:p-12 shadow-2xl text-slate-100 min-h-[900px] transition-transform duration-200 relative"
        >
          {/* Header watermark */}
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-800 pb-3 mb-6">
            <span>LEXGUARD AUDIT LAYER &bull; CONFIDENTIAL</span>
            <span>SHEET {currentPage} / {totalPages}</span>
          </div>

          {clausesOnCurrentPage.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Info className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm">No specific structured clauses detected on Page {currentPage}.</p>
              <p className="text-xs mt-1">Navigate to Page 1 or review extracted clauses in the analysis panel.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {clausesOnCurrentPage.map((clause, idx) => {
                // Check if this clause matches active evidence snippet
                const isHighlighted = highlightedSnippet && (
                  clause.text.toLowerCase().includes(highlightedSnippet.toLowerCase().slice(0, 60)) ||
                  highlightedSnippet.toLowerCase().includes(clause.text.toLowerCase().slice(0, 60)) ||
                  (activeEvidence?.section && (clause.clauseNumber === activeEvidence.section || clause.title?.toLowerCase().includes(activeEvidence.section.toLowerCase())))
                );

                return (
                  <div
                    key={clause.id || idx}
                    ref={isHighlighted ? evidenceRef : undefined}
                    onClick={() => onClauseSelect && onClauseSelect(clause)}
                    className={`p-4 rounded-lg transition-all duration-300 cursor-pointer ${
                      isHighlighted
                        ? 'bg-amber-500/20 border-2 border-amber-400 shadow-lg shadow-amber-500/20 ring-4 ring-amber-500/10'
                        : 'bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {clause.clauseNumber || `§ ${idx + 1}`}
                        </span>
                        {clause.title && (
                          <span className="text-xs font-serif font-bold text-slate-200">
                            {clause.title}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {clause.clauseType}
                      </span>
                    </div>

                    <p className={`text-sm font-serif leading-relaxed text-slate-300 ${isHighlighted ? 'text-amber-100 font-medium' : ''}`}>
                      {clause.text}
                    </p>

                    {isHighlighted && (
                      <div className="mt-3 pt-2 border-t border-amber-500/30 flex items-center justify-between text-[11px] text-amber-300">
                        <span className="flex items-center gap-1">
                          <Highlighter className="w-3 h-3 text-amber-400" />
                          Evidence Match for Current Risk Finding
                        </span>
                        <span className="font-mono text-[10px]">VERIFIED CLAUSE EXCERPT</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Page Footer */}
          <div className="mt-12 pt-4 border-t border-slate-800 text-center text-[10px] font-mono text-slate-400">
            Page {currentPage} &bull; LexGuard AI Grounded Text Extraction
          </div>
        </div>
      </div>
    </div>
  );
};