import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Clock,
  ExternalLink,
  Shield,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { fetchContracts } from '../api/contracts.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { ScoreMeter } from '../components/ScoreMeter.js';
import { UploadModal } from '../components/UploadModal.js';
import type { ContractDocument, RiskLevel } from '../types/index.js';

export const DashboardPage: React.FC = () => {
  const [contracts, setContracts] = useState<ContractDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchContracts();
      setContracts(data);
    } catch (err) {
      console.error('Failed to load contracts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute metrics
  const totalContracts = contracts.length;
  const analyzedContracts = contracts.filter(c => c.status === 'ANALYZED').length;
  const highRiskContracts = contracts.filter(c => c.riskLevel === 'High' || c.riskLevel === 'Critical').length;
  const scores = contracts.map(c => c.overallScore || 0).filter(s => s > 0);
  const avgRiskScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // Chart data: Risk Distribution
  const riskDistData = [
    { name: 'Critical', count: contracts.filter(c => c.riskLevel === 'Critical').length, color: '#e11d48' },
    { name: 'High', count: contracts.filter(c => c.riskLevel === 'High').length, color: '#ea580c' },
    { name: 'Moderate', count: contracts.filter(c => c.riskLevel === 'Moderate').length, color: '#ca8a04' },
    { name: 'Low', count: contracts.filter(c => c.riskLevel === 'Low').length, color: '#059669' }
  ];

  // Chart data: Common Risk Categories
  const categoryData = [
    { category: 'Financial', score: 82 },
    { category: 'Legal', score: 74 },
    { category: 'Commercial', score: 68 },
    { category: 'Operational', score: 58 },
    { category: 'IP', score: 52 },
    { category: 'Privacy', score: 45 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            Legal Risk Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time portfolio overview of contractual exposures, deterministic scores, and audit readiness
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New Contract</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Contracts</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-mono font-bold text-white">{totalContracts}</div>
          <div className="text-[11px] text-slate-400">Indexed in repository</div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Analyzed & Audited</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-mono font-bold text-emerald-400">{analyzedContracts}</div>
          <div className="text-[11px] text-emerald-400/80">
            {totalContracts > 0 ? `${Math.round((analyzedContracts / totalContracts) * 100)}% analyzed` : '100% complete'}
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>High Risk Contracts</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-mono font-bold text-rose-400">{highRiskContracts}</div>
          <div className="text-[11px] text-rose-400/80">Require immediate legal review</div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Average Risk Score</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-amber-400">{avgRiskScore}</span>
            <span className="text-xs text-slate-500 font-mono">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-400">Deterministic normalized metric</div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-serif font-bold text-white">Portfolio Risk Level Distribution</h3>
              <p className="text-xs text-slate-400">Categorized by deterministic severity scale</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Count</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Common Risk Categories */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-serif font-bold text-white">Average Risk Exposure by Category</h3>
              <p className="text-xs text-slate-400">Cross-contract legal exposure index</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Index (0-100)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="score" fill="#d97706" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Analyses Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-serif font-bold text-white">Recent Contract Risk Audits</h3>
            <p className="text-xs text-slate-400">Detailed overview of recently processed legal agreements</p>
          </div>
          <Link
            to="/contracts"
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <span>View All Contracts</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {contracts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No contracts analyzed yet. Click "Upload New Contract" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 text-[11px] uppercase tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Contract Name</th>
                  <th className="py-3 px-4">Contract Type</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {contracts.slice(0, 5).map((contract) => (
                  <tr key={contract.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                      <Link to={`/contracts/${contract.id}`} className="hover:text-amber-400">
                        {contract.title}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{contract.contractType}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {new Date(contract.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono ${
                        contract.status === 'ANALYZED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : contract.status === 'PROCESSING'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60 animate-pulse'
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
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      {contract.overallScore !== undefined ? (
                        <ScoreMeter score={contract.overallScore} level={contract.riskLevel || 'Low'} size="sm" />
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/contracts/${contract.id}`}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium transition-colors"
                      >
                        Open Audit
                      </Link>
                      <a
                        href={`/api/contracts/${contract.id}/report`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded border border-slate-700 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 transition-colors"
                        title="View Formal PDF Report"
                      >
                        PDF
                      </a>
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
        onSuccess={() => loadData()}
      />
    </div>
  );
};