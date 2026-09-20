import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Trash2,
  ExternalLink,
  Play,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  FileDown
} from 'lucide-react';
import { fetchContracts, deleteContract, triggerAnalysis } from '../api/contracts.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { ScoreMeter } from '../components/ScoreMeter.js';
import { UploadModal } from '../components/UploadModal.js';
import type { ContractDocument, RiskLevel } from '../types/index.js';

export const ContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<ContractDocument[]>([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadContracts = async () => {
    try {
      const data = await fetchContracts({
        search: search || undefined,
        riskLevel: riskFilter !== 'ALL' ? riskFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      setContracts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [search, riskFilter, statusFilter]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this contract and all associated analysis data?')) {
      await deleteContract(id);
      loadContracts();
    }
  };

  const handleReanalyze = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await triggerAnalysis(id);
    loadContracts();
  };

  const sortedContracts = [...contracts].sort((a, b) => {
    if (sortBy === 'score') {
      return (b.overallScore || 0) - (a.overallScore || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Contract Management & Portfolio Repository
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search, filter, and audit legal documents across your enterprise repository
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Contract</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name or file..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Risk Filter */}
        <div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="Critical">Critical Risk (76 - 100)</option>
            <option value="High">High Risk (51 - 75)</option>
            <option value="Moderate">Moderate Risk (26 - 50)</option>
            <option value="Low">Low Risk (0 - 25)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ANALYZED">Analyzed</option>
            <option value="PROCESSING">Processing</option>
            <option value="UPLOADED">Uploaded</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <button
            onClick={() => setSortBy(s => s === 'date' ? 'score' : 'date')}
            className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 hover:border-slate-700"
          >
            <span className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Sort: {sortBy === 'date' ? 'Upload Date (Newest)' : 'Risk Score (Highest)'}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {sortedContracts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No matching contracts found. Try adjusting filters or upload a new agreement.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Contract Title & File</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-medium text-white max-w-sm">
                      <Link to={`/contracts/${contract.id}`} className="block hover:text-amber-400">
                        <div className="text-sm font-semibold truncate">{contract.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <FileText className="w-3 h-3 text-amber-500" />
                          <span>{contract.fileName}</span>
                          <span>&bull;</span>
                          <span>{(contract.fileSize / 1024).toFixed(0)} KB</span>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{contract.contractType}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono ${
                        contract.status === 'ANALYZED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : contract.status === 'PROCESSING'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60 animate-pulse'
                          : contract.status === 'FAILED'
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {contract.riskLevel ? (
                        <RiskBadge level={contract.riskLevel as RiskLevel} />
                      ) : (
                        <span className="text-slate-500 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {contract.overallScore !== undefined ? (
                        <ScoreMeter score={contract.overallScore} level={contract.riskLevel || 'Low'} size="sm" />
                      ) : (
                        <span className="text-slate-500 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {new Date(contract.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <Link
                        to={`/contracts/${contract.id}`}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium transition-colors"
                      >
                        Inspect
                      </Link>
                      <a
                        href={`/api/contracts/${contract.id}/report`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded border border-slate-700 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
                        title="View Formal PDF Report"
                      >
                        <FileDown className="w-3 h-3" /> Report
                      </a>
                      <button
                        onClick={(e) => handleDelete(contract.id, e)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                        title="Delete Contract"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => loadContracts()}
      />
    </div>
  );
};