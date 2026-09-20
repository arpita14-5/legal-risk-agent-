import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, Scale, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { fetchLegalSourcesApi, createLegalSourceApi } from '../api/legalSources.js';
import { useAuth } from '../context/AuthContext.js';
import type { LegalSourceCitation } from '../types/index.js';

export const LegalKnowledgePage: React.FC = () => {
  const { user } = useAuth();
  const [sources, setSources] = useState<LegalSourceCitation[]>([]);
  const [search, setSearch] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newJurisdiction, setNewJurisdiction] = useState('United States');
  const [newSection, setNewSection] = useState('');
  const [newContent, setNewContent] = useState('');

  const loadSources = async () => {
    try {
      const data = await fetchLegalSourcesApi({ search, jurisdiction: jurisdiction || undefined });
      setSources(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSources();
  }, [search, jurisdiction]);

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLegalSourceApi({
        title: newTitle,
        source: newSource,
        jurisdiction: newJurisdiction,
        section: newSection,
        content: newContent
      });
      setIsModalOpen(false);
      setNewTitle('');
      setNewSource('');
      setNewContent('');
      loadSources();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-amber-500" />
            Authoritative Legal Knowledge Base
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Precedent repository used for statutory grounding, RAG research, and legal citation verification
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Legal Authority</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search statutes, codes, articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={jurisdiction}
          onChange={(e) => setJurisdiction(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="">All Jurisdictions</option>
          <option value="United States">United States (Federal)</option>
          <option value="European Union">European Union (GDPR)</option>
          <option value="California, USA">California State</option>
          <option value="Delaware, USA">Delaware State (DGCL)</option>
        </select>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sources.map((src) => (
          <div key={src.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold block">
                  {src.source} &bull; {src.jurisdiction}
                </span>
                <h3 className="text-sm font-serif font-bold text-white mt-1">
                  {src.title}
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {src.section || 'Statute'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-serif text-slate-300 leading-relaxed italic">
              &ldquo;{src.contentSnippet}&rdquo;
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-emerald-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> Vector Indexed
              </span>
              <span className="font-mono text-slate-500">ID: {src.id.slice(0, 8)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 space-y-4">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-serif font-bold text-white">Index Authoritative Legal Authority</h3>
            <form onSubmit={handleCreateSource} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Title</label>
                <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. UCC § 2-719" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Source / Publication</label>
                <input required value={newSource} onChange={e => setNewSource(e.target.value)} placeholder="e.g. Uniform Commercial Code" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Jurisdiction</label>
                <input required value={newJurisdiction} onChange={e => setNewJurisdiction(e.target.value)} placeholder="e.g. United States" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200" />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Full Legal Text / Statutory Rule</label>
                <textarea required rows={4} value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Statutory text..." className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg">Save & Index</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};