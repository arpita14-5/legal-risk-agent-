import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  ShieldCheck,
  Scale,
  PlusCircle,
  MinusCircle,
  Edit3,
  TrendingDown,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { fetchContracts } from '../api/contracts.js';
import { compareContractsApi } from '../api/comparison.js';
import { RiskBadge } from '../components/RiskBadge.js';
import type { ContractDocument, ComparisonResult, RiskLevel } from '../types/index.js';

export const ContractComparisonPage: React.FC = () => {
  const [contracts, setContracts] = useState<ContractDocument[]>([]);
  const [idA, setIdA] = useState<string>('');
  const [idB, setIdB] = useState<string>('');
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [diffFilter, setDiffFilter] = useState<'ALL' | 'modified' | 'added' | 'removed'>('ALL');

  useEffect(() => {
    async function load() {
      const list = await fetchContracts({ status: 'ANALYZED' });
      setContracts(list);
      if (list.length >= 2) {
        setIdA(list[0].id);
        setIdB(list[1].id);
      }
    }
    load();
  }, []);

  const handleCompare = async () => {
    if (!idA || !idB || idA === idB) return;
    setIsLoading(true);
    try {
      const res = await compareContractsApi(idA, idB);
      setComparison(res);
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (idA && idB && idA !== idB) {
      handleCompare();
    }
  }, [idA, idB]);

  const filteredClauseDiffs = (comparison?.clauseDiffs || []).filter(
    d => diffFilter === 'ALL' || d.type === diffFilter
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-2.5">
          <GitCompare className="w-7 h-7 text-amber-500" />
          Contract Version Comparison & Risk Diff
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Side-by-side comparative analysis of added, removed, and modified clauses with quantified risk impact
        </p>
      </div>

      {/* Contract Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Contract Baseline (Version A)
          </label>
          <select
            value={idA}
            onChange={(e) => setIdA(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
          >
            {contracts.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.contractType} - Score: {c.overallScore || 'N/A'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Comparison Contract (Version B)
          </label>
          <select
            value={idB}
            onChange={(e) => setIdB(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
          >
            {contracts.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.contractType} - Score: {c.overallScore || 'N/A'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-amber-400 text-xs flex items-center justify-center gap-2">
          <Scale className="w-5 h-5 animate-spin" />
          <span>Synthesizing comparative legal matrix & clause diffs...</span>
        </div>
      ) : comparison ? (
        <div className="space-y-6">
          {/* Executive Comparative Assessment Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Comparative Risk Verdict & Delta
              </div>
              <h3 className="text-base font-serif font-bold text-white">
                {comparison.overallRecommendation}
              </h3>
              {comparison.keyDifferencesSummary && comparison.keyDifferencesSummary.length > 0 && (
                <ul className="text-xs text-slate-300 space-y-1 pt-1 list-disc list-inside">
                  {comparison.keyDifferencesSummary.slice(0, 3).map((diff, dIdx) => (
                    <li key={dIdx}>{diff}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-4 bg-slate-950 px-5 py-3 rounded-xl border border-slate-800 self-stretch md:self-auto justify-center">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Version A</span>
                <span className="font-mono font-bold text-base text-slate-200">{comparison.contractA.overallScore}/100</span>
              </div>
              
              <div className="flex flex-col items-center">
                {comparison.riskScoreDelta !== undefined && (
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                    comparison.riskScoreDelta < 0
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : comparison.riskScoreDelta > 0
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-slate-800 text-slate-300'
                  }`}>
                    {comparison.riskScoreDelta < 0 ? (
                      <>
                        <TrendingDown className="w-3 h-3" />
                        <span>{comparison.riskScoreDelta} pts</span>
                      </>
                    ) : comparison.riskScoreDelta > 0 ? (
                      <>
                        <TrendingUp className="w-3 h-3" />
                        <span>+{comparison.riskScoreDelta} pts</span>
                      </>
                    ) : (
                      <span>0 pts</span>
                    )}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">Risk Delta</span>
              </div>

              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Version B</span>
                <span className="font-mono font-bold text-base text-amber-400">{comparison.contractB.overallScore}/100</span>
              </div>
            </div>
          </div>

          {/* Granular Clause-Level Diffs (Added, Removed, Modified) */}
          {comparison.clauseDiffs && comparison.clauseDiffs.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Clause-Level Textual & Risk Diffs
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Detailed changes between Version A and Version B and their contractual exposure impact
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                  {(['ALL', 'modified', 'added', 'removed'] as const).map(flt => (
                    <button
                      key={flt}
                      onClick={() => setDiffFilter(flt)}
                      className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                        diffFilter === flt
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {flt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredClauseDiffs.map((diff) => (
                  <div
                    key={diff.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          diff.type === 'added'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : diff.type === 'removed'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {diff.type === 'added' ? '+ Added' : diff.type === 'removed' ? '- Removed' : '~ Modified'}
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          {diff.title || diff.clauseType}
                        </span>
                      </div>

                      {diff.riskScoreImpact !== undefined && diff.riskScoreImpact !== 0 && (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          diff.riskScoreImpact < 0
                            ? 'bg-emerald-950/80 text-emerald-400'
                            : 'bg-rose-950/80 text-rose-400'
                        }`}>
                          {diff.riskScoreImpact < 0 ? `${diff.riskScoreImpact} pts (Safer)` : `+${diff.riskScoreImpact} pts (Riskier)`}
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300/90 font-medium">
                      Risk Impact: {diff.riskImpact}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {diff.textA && (
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block">Version A Language</span>
                          <p className="font-serif text-slate-300 text-[11px] leading-relaxed italic">
                            &ldquo;{diff.textA}&rdquo;
                          </p>
                        </div>
                      )}

                      {diff.textB && (
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-mono text-amber-400 uppercase block">Version B Language</span>
                          <p className="font-serif text-slate-200 text-[11px] leading-relaxed italic">
                            &ldquo;{diff.textB}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categorical Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-xs font-serif font-bold text-white uppercase tracking-wider">
                Category-by-Category Covenants Matrix
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 w-36">Category</th>
                    <th className="py-3.5 px-4 w-1/3">Contract A ({comparison.contractA.title})</th>
                    <th className="py-3.5 px-4 w-1/3">Contract B ({comparison.contractB.title})</th>
                    <th className="py-3.5 px-4 w-44">Risk Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {comparison.categories.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 font-semibold text-white font-mono">
                        {cat.category}
                      </td>
                      <td className="py-4 px-4 font-serif text-slate-300 text-[11px] leading-relaxed">
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                          {cat.contractAValue}
                          {cat.evidenceA && (
                            <div className="mt-1 text-[10px] text-amber-400 font-sans font-medium">
                              Ref: {cat.evidenceA}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-serif text-slate-300 text-[11px] leading-relaxed">
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                          {cat.contractBValue}
                          {cat.evidenceB && (
                            <div className="mt-1 text-[10px] text-amber-400 font-sans font-medium">
                              Ref: {cat.evidenceB}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          cat.assessment.includes('B safer')
                            ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300'
                            : cat.assessment.includes('A safer')
                            ? 'bg-sky-950/60 border-sky-600/50 text-sky-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}>
                          {cat.assessment}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
                          {cat.rationale}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500 text-xs">
          Select two contracts above to view comparative analysis.
        </div>
      )}
    </div>
  );
};