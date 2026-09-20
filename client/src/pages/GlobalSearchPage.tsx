import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, FileText, BookOpen, ArrowRight, ShieldCheck } from 'lucide-react';
import { globalSearchApi } from '../api/search.js';
import type { ContractDocument, LegalSourceCitation } from '../types/index.js';

export const GlobalSearchPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [contracts, setContracts] = useState<ContractDocument[]>([]);
  const [legalSources, setLegalSources] = useState<LegalSourceCitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const performSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    try {
      const res = await globalSearchApi(q);
      setContracts(res.contracts);
      setLegalSources(res.legalSources);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-2.5">
          <Search className="w-7 h-7 text-amber-500" />
          Global Legal & Contract Search
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Hybrid semantic search across uploaded contracts, extracted clauses, risk findings, and authoritative legal sources
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contracts, indemnification, automatic renewal, UCC, GDPR..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all"
        >
          Search
        </button>
      </form>

      {isLoading ? (
        <div className="py-20 text-center text-amber-400 text-xs">
          Running hybrid semantic search...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Contracts Found */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Matching Contracts ({contracts.length})
            </h3>
            {contracts.length === 0 ? (
              <p className="text-xs text-slate-500">No matching contracts found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contracts.map(c => (
                  <Link
                    key={c.id}
                    to={`/contracts/${c.id}`}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all block group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs group-hover:text-amber-400">{c.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">{c.contractType} &bull; Score: {c.overallScore || 'N/A'}/100</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Legal Sources Found */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Authoritative Legal Precedents ({legalSources.length})
            </h3>
            {legalSources.length === 0 ? (
              <p className="text-xs text-slate-500">No matching legal references found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {legalSources.map(s => (
                  <div key={s.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs">{s.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">{s.jurisdiction}</span>
                    </div>
                    <p className="text-[11px] font-serif text-slate-400 italic line-clamp-2">&ldquo;{s.contentSnippet}&rdquo;</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};