import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  BookOpen,
  MessageSquare,
  Shield,
  Layers,
  FileDown,
  Info,
  Highlighter,
  Sparkles,
  Scale,
  CornerDownRight,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Calendar,
  Clock,
  Briefcase,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  fetchContract,
  fetchAnalysis,
  fetchClauses,
  fetchRisks,
  triggerAnalysis,
  submitRiskFeedbackApi,
  fetchRiskFeedbackApi
} from '../api/contracts.js';
import { ContractViewer } from '../components/ContractViewer.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { ScoreMeter } from '../components/ScoreMeter.js';
import { ContractChatDrawer } from '../components/ContractChatDrawer.js';
import type {
  ContractDocument,
  ContractAnalysis,
  Clause,
  RiskFinding,
  RiskLevel,
  ContractEvidence
} from '../types/index.js';

export const ContractAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<ContractDocument | null>(null);
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [risks, setRisks] = useState<RiskFinding[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'risks' | 'timeline' | 'clauses' | 'recommendations' | 'chat'>('summary');
  const [riskSeverityFilter, setRiskSeverityFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [activeEvidence, setActiveEvidence] = useState<ContractEvidence | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);

  // Human feedback state
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'correct' | 'incorrect'>>({});
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<Record<string, boolean>>({});

  // Negotiation Assistant expansion & copy state
  const [expandedClauseId, setExpandedClauseId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const doc = await fetchContract(id);
      setContract(doc);

      try {
        const ana = await fetchAnalysis(id);
        setAnalysis(ana);
      } catch {}

      try {
        const cls = await fetchClauses(id);
        setClauses(cls);
      } catch {}

      try {
        const rks = await fetchRisks(id);
        setRisks(rks);
      } catch {}

      try {
        const fbList = await fetchRiskFeedbackApi(id);
        if (Array.isArray(fbList)) {
          const map: Record<string, 'correct' | 'incorrect'> = {};
          fbList.forEach(f => {
            map[f.riskId] = f.feedback;
          });
          setFeedbackMap(map);
        }
      } catch {}
    } catch (err) {
      console.error('Failed to load contract details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleReanalyze = async () => {
    if (!id) return;
    setIsReanalyzing(true);
    try {
      await triggerAnalysis(id);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleJumpToEvidence = (evidence: ContractEvidence) => {
    setActiveEvidence(evidence);
  };

  const handleFeedback = async (riskId: string, feedback: 'correct' | 'incorrect') => {
    if (!id) return;
    setFeedbackSubmitting(prev => ({ ...prev, [riskId]: true }));
    try {
      await submitRiskFeedbackApi(id, riskId, feedback);
      setFeedbackMap(prev => ({ ...prev, [riskId]: feedback }));
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setFeedbackSubmitting(prev => ({ ...prev, [riskId]: false }));
    }
  };

  const handleCopyClause = (riskId: string, clauseText: string) => {
    navigator.clipboard.writeText(clauseText);
    setCopiedId(riskId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredRisks = risks.filter(r => riskSeverityFilter === 'ALL' || r.level === riskSeverityFilter);

  if (isLoading || !contract) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-amber-400 text-sm">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span>Loading contract audit intelligence...</span>
        </div>
      </div>
    );
  }

  const execData = analysis?.executiveSummaryData;
  const timeline = analysis?.timeline || [];
  const obligations = analysis?.obligations || [];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Audit Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-amber-400 uppercase font-semibold">{contract.contractType}</span>
            <span>&bull;</span>
            <span className="font-mono">{contract.fileName}</span>
            <span>&bull;</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
              contract.status === 'ANALYZED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-amber-950/60 text-amber-400'
            }`}>
              {contract.status}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            {contract.title}
          </h1>
          <p className="text-xs text-slate-400 line-clamp-2">
            {analysis?.executiveSummary || 'Contract intelligence parsed with multi-agent orchestration and deterministic risk scoring.'}
          </p>
        </div>

        {/* Right Header: Score Meter & Action Buttons */}
        <div className="flex items-center gap-6 self-stretch lg:self-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-800">
          <div className="flex items-center gap-4 bg-slate-950 px-5 py-3 rounded-xl border border-slate-800">
            <ScoreMeter
              score={contract.overallScore !== undefined ? contract.overallScore : (analysis?.overallScore || 0)}
              level={(contract.riskLevel as RiskLevel) || 'Low'}
              size="lg"
            />
            <div className="flex flex-col">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Audit Assessment</span>
              <div className="mt-0.5">
                <RiskBadge level={(contract.riskLevel as RiskLevel) || (analysis?.riskLevel as RiskLevel) || 'Low'} size="lg" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <a
              href={`/api/contracts/${contract.id}/report`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 text-center"
            >
              <FileDown className="w-4 h-4" />
              <span>Export PDF Audit Report</span>
            </a>

            <button
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isReanalyzing ? 'Re-auditing...' : 'Re-run Analysis'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Document & Clause Viewer (7 cols) */}
        <div className="lg:col-span-6 xl:col-span-7 h-[850px]">
          <ContractViewer
            contract={contract}
            clauses={clauses}
            activeEvidence={activeEvidence}
            onClauseSelect={(c) => {
              setActiveEvidence({
                page: c.pageNumber,
                section: c.clauseNumber || c.title || 'Clause',
                text: c.text
              });
            }}
          />
        </div>

        {/* Right Column: AI Analysis, Findings & Chat (5 cols) */}
        <div className="lg:col-span-6 xl:col-span-5 h-[850px] flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          {/* Analysis Navigation Tabs */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950 px-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'summary'
                  ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Executive Summary</span>
            </button>

            <button
              onClick={() => setActiveTab('risks')}
              className={`px-3 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'risks'
                  ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Risks ({risks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Dates & Obligations</span>
            </button>

            <button
              onClick={() => setActiveTab('clauses')}
              className={`px-3 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'clauses'
                  ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Clauses ({clauses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-3 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'recommendations'
                  ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Checklist</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>Ask LexGuard</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* TAB 1: EXECUTIVE SUMMARY */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-serif font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-amber-400" /> Contract Executive Briefing
                    </span>
                    <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {contract.contractType}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {analysis?.executiveSummary}
                  </p>

                  {execData?.keyTakeaways && execData.keyTakeaways.length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs space-y-1">
                      <div className="font-semibold text-amber-300 text-[11px] uppercase tracking-wider">Key Executive Takeaways:</div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                        {execData.keyTakeaways.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Core Parameters Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Parties</span>
                      <span className="font-medium text-slate-200">{analysis?.metadata.parties?.join(' & ') || 'Contract Signatories'}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Effective & Expiry Dates</span>
                      <span className="font-medium text-slate-200">
                        {analysis?.metadata.effectiveDate || 'Execution'} &rarr; {analysis?.metadata.expirationDate || analysis?.metadata.contractDuration || '12 Months'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Renewal Terms</span>
                      <span className="font-medium text-slate-200">{analysis?.metadata.renewalPeriod || 'Mutual written confirmation'}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Termination Notice</span>
                      <span className="font-medium text-slate-200">{analysis?.metadata.noticePeriod || '30 days standard notice'}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Payment Terms</span>
                      <span className="font-medium text-slate-200">{analysis?.metadata.paymentSchedule || 'Net 30 Days'}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">IP Ownership Model</span>
                      <span className="font-medium text-slate-200">{analysis?.metadata.ipOwnership || 'License grant / Background IP'}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 sm:col-span-2">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Liability Cap Terms</span>
                      <span className={`font-medium ${analysis?.metadata.liabilityCap?.includes('Uncapped') ? 'text-rose-400 font-semibold' : 'text-slate-200'}`}>
                        {analysis?.metadata.liabilityCap || 'Standard commercial limitation'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Detected Risks Highlight */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-serif font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>Highest Exposure Findings</span>
                    <button onClick={() => setActiveTab('risks')} className="text-amber-400 text-[11px] font-sans hover:underline">
                      View all {risks.length} &rarr;
                    </button>
                  </h4>
                  <div className="space-y-2">
                    {risks.slice(0, 3).map(r => (
                      <div
                        key={r.id}
                        onClick={() => {
                          setActiveTab('risks');
                          handleJumpToEvidence(r.contractEvidence);
                        }}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between gap-2 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${r.level === 'Critical' ? 'text-rose-400' : 'text-amber-400'}`} />
                          <span className="font-medium text-slate-200 truncate">{r.title}</span>
                        </div>
                        <RiskBadge level={r.level} score={r.score} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EXPLAINABLE RISKS & NEGOTIATION ASSISTANT */}
            {activeTab === 'risks' && (
              <div className="space-y-4">
                {/* Severity Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {(['ALL', 'Critical', 'High', 'Moderate', 'Low'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setRiskSeverityFilter(lvl)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-all ${
                        riskSeverityFilter === lvl
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {lvl} {lvl !== 'ALL' && `(${risks.filter(r => r.level === lvl).length})`}
                    </button>
                  ))}
                </div>

                {filteredRisks.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs">
                    No risk findings match this filter.
                  </div>
                ) : (
                  filteredRisks.map((risk) => {
                    const isExpanded = expandedClauseId === risk.id;
                    const feedback = feedbackMap[risk.id];
                    const isSubmitting = feedbackSubmitting[risk.id];

                    return (
                      <div
                        key={risk.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                      >
                        {/* Title & Badge & S x P x I breakdown */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                                {risk.category} &bull; {risk.clauseTitle || 'Clause'}
                              </span>
                              {risk.confidence && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800/60">
                                  {Math.round(risk.confidence * 100)}% Conf
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-serif font-bold text-white mt-0.5">
                              {risk.title}
                            </h4>
                          </div>
                          <div className="text-right">
                            <RiskBadge level={risk.level} score={risk.score} size="sm" />
                            <div className="text-[9px] font-mono text-slate-500 mt-1">
                              S:{risk.severity} &times; P:{risk.probability} &times; I:{risk.impact} = {risk.severity * risk.probability * risk.impact}/125
                            </div>
                          </div>
                        </div>

                        {/* Explainable Detection Rationale */}
                        {risk.detectionReason && (
                          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] space-y-0.5">
                            <div className="text-amber-400/90 font-mono text-[10px] uppercase font-semibold">Why Detected:</div>
                            <p className="text-slate-300">{risk.detectionReason}</p>
                          </div>
                        )}

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {risk.description}
                        </p>

                        <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/30 text-[11px] space-y-1">
                          <div className="text-amber-400/90 font-medium">Business & Legal Impact:</div>
                          <p className="text-slate-300">{risk.whyItMatters}</p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-900/40 text-[11px] space-y-1">
                          <div className="text-sky-300 font-medium">Strategic Recommendation:</div>
                          <p className="text-slate-300">{risk.recommendation}</p>
                        </div>

                        {/* Interactive PDF Evidence Button */}
                        {risk.contractEvidence && (
                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                            <button
                              onClick={() => handleJumpToEvidence(risk.contractEvidence)}
                              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors group"
                            >
                              <Highlighter className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              <span>
                                View Evidence ({risk.contractEvidence.section}, Page {risk.contractEvidence.page})
                              </span>
                              <CornerDownRight className="w-3 h-3 ml-0.5" />
                            </button>
                            <span className="text-[10px] font-mono text-emerald-400">Verified Citation</span>
                          </div>
                        )}

                        {/* Negotiation Assistant & Suggested Alternative Clause */}
                        {risk.suggestedClause && (
                          <div className="pt-2 border-t border-slate-800/80">
                            <button
                              onClick={() => setExpandedClauseId(isExpanded ? null : risk.id)}
                              className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs font-semibold text-amber-400 transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                Negotiation Assistant: Suggested Counter-Clause
                              </span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {isExpanded && (
                              <div className="mt-2 p-3 rounded-lg bg-slate-900/90 border border-amber-500/20 space-y-2.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                                    Suggested Draft &bull; Not Legal Advice
                                  </span>
                                  <button
                                    onClick={() => handleCopyClause(risk.id, risk.suggestedClause!)}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono flex items-center gap-1 transition-colors"
                                  >
                                    {copiedId === risk.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy Clause</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="p-2.5 rounded bg-slate-950 font-mono text-[11px] text-slate-300 leading-relaxed border border-slate-800">
                                  {risk.suggestedClause}
                                </div>

                                {risk.negotiationPoint && (
                                  <div className="text-[11px] text-slate-400 space-y-0.5">
                                    <strong className="text-slate-300">Negotiation Counter-Point:</strong>
                                    <p>{risk.negotiationPoint}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Human Feedback Controls (Correct / Incorrect) */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-[10px] font-mono text-slate-400">
                            Counsel Feedback:
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleFeedback(risk.id, 'correct')}
                              disabled={isSubmitting}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1 transition-all ${
                                feedback === 'correct'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold'
                                  : 'bg-slate-900 text-slate-400 hover:text-emerald-400 border border-slate-800'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>{feedback === 'correct' ? 'Verified Accurate' : 'Accurate'}</span>
                            </button>

                            <button
                              onClick={() => handleFeedback(risk.id, 'incorrect')}
                              disabled={isSubmitting}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1 transition-all ${
                                feedback === 'incorrect'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-700 font-bold'
                                  : 'bg-slate-900 text-slate-400 hover:text-rose-400 border border-slate-800'
                              }`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>{feedback === 'incorrect' ? 'Marked False Positive' : 'False Positive'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Authoritative Legal Citations */}
                        {risk.legalSources && risk.legalSources.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80 space-y-1">
                            <span className="text-[10px] font-mono uppercase text-sky-400 flex items-center gap-1">
                              <Scale className="w-3 h-3" /> Authoritative Legal Precedent:
                            </span>
                            {risk.legalSources.map((ls, idx) => (
                              <div key={idx} className="p-2 rounded bg-slate-900/80 text-[11px] text-slate-300">
                                <span className="font-semibold text-white">{ls.title}</span> ({ls.source})
                                <p className="text-[10px] text-slate-400 mt-0.5 italic">&ldquo;{ls.contentSnippet}&rdquo;</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 3: DATES & OBLIGATIONS TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {/* Timeline Component */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-serif font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-400" /> Contract Timeline & Milestones
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{timeline.length} Milestones Identified</span>
                  </div>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                    {timeline.map((event) => (
                      <div key={event.id} className="relative space-y-1">
                        {/* Timeline Node Dot */}
                        <div className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                          event.status === 'critical'
                            ? 'bg-rose-500'
                            : event.status === 'milestone'
                              ? 'bg-amber-400'
                              : 'bg-sky-400'
                        }`} />

                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200">{event.title}</span>
                          <span className="font-mono text-[11px] text-amber-400 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {event.dateOrPeriod}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400">
                          {event.description}
                        </p>
                        {event.clauseReference && (
                          <div className="text-[10px] font-mono text-slate-500">
                            Ref: {event.clauseReference}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Obligations Matrix */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-serif font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" /> Party Obligations Schedule
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{obligations.length} Covenants</span>
                  </div>

                  <div className="space-y-2.5">
                    {obligations.map((ob) => (
                      <div key={ob.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{ob.party}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                            {ob.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {ob.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                          <span>Deadline: {ob.deadlineOrFrequency || 'Active Term'}</span>
                          <span>{ob.clauseReference}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CLAUSES */}
            {activeTab === 'clauses' && (
              <div className="space-y-3">
                {clauses.map((clause, idx) => (
                  <div
                    key={clause.id || idx}
                    onClick={() => handleJumpToEvidence({ page: clause.pageNumber, section: clause.clauseNumber || clause.title || 'Clause', text: clause.text })}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">
                        {clause.clauseNumber || `§ ${idx + 1}`} &bull; {clause.title || clause.clauseType}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {clause.clauseType}
                      </span>
                    </div>
                    <p className="text-xs font-serif text-slate-300 line-clamp-2">
                      {clause.text}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                      <span>Page {clause.pageNumber}</span>
                      <span className="text-amber-400">Click to locate in viewer &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: RECOMMENDATIONS */}
            {activeTab === 'recommendations' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-serif font-bold text-white uppercase tracking-wider">
                    Strategic Redlining & Negotiation Checklist
                  </h4>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {(analysis?.recommendations || []).map((rec, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 6: CHAT */}
            {activeTab === 'chat' && (
              <div className="h-full">
                <ContractChatDrawer
                  contractId={contract.id}
                  onNavigateToEvidence={handleJumpToEvidence}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};