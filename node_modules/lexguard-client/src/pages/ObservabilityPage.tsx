import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Server,
  Zap,
  Layers
} from 'lucide-react';
import { fetchObservabilityStats } from '../api/admin.js';
import type { SystemObservability } from '../types/index.js';

export const ObservabilityPage: React.FC = () => {
  const [stats, setStats] = useState<{ metrics: SystemObservability; logs: any[]; totalUsers: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchObservabilityStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-amber-400 text-xs">
        <Activity className="w-5 h-5 animate-spin mr-2" />
        <span>Loading system telemetry & telemetry logs...</span>
      </div>
    );
  }

  const { metrics, logs } = stats;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight flex items-center gap-2.5">
          <Activity className="w-7 h-7 text-amber-500" />
          System Observability & AI Telemetry
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Real-time metrics on hybrid RAG retrieval latency, vector storage density, and multi-agent execution
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
          <span className="text-xs text-slate-400 flex items-center justify-between">
            <span>Documents Processed</span>
            <Server className="w-4 h-4 text-amber-500" />
          </span>
          <div className="text-3xl font-mono font-bold text-white">{metrics.totalDocumentsProcessed}</div>
          <span className="text-[11px] text-emerald-400">{metrics.successfulAnalyses} successful &bull; {metrics.failedAnalyses} failed</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
          <span className="text-xs text-slate-400 flex items-center justify-between">
            <span>Avg Hybrid Retrieval Latency</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </span>
          <div className="text-3xl font-mono font-bold text-sky-400">{metrics.averageRetrievalLatencyMs} ms</div>
          <span className="text-[11px] text-slate-400">RRF Vector + Keyword Fusion</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
          <span className="text-xs text-slate-400 flex items-center justify-between">
            <span>Indexed Semantic Chunks</span>
            <Database className="w-4 h-4 text-emerald-500" />
          </span>
          <div className="text-3xl font-mono font-bold text-emerald-400">{metrics.totalChunksIndexed}</div>
          <span className="text-[11px] text-slate-400">Dense vector embeddings</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
          <span className="text-xs text-slate-400 flex items-center justify-between">
            <span>AI Token Consumption</span>
            <Zap className="w-4 h-4 text-purple-500" />
          </span>
          <div className="text-3xl font-mono font-bold text-purple-400">{metrics.aiTokenUsage.toLocaleString()}</div>
          <span className="text-[11px] text-slate-400">Estimated prompt & completion tokens</span>
        </div>
      </div>

      {/* Active Engine Configuration */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-500" />
          Active Intelligence Engine & Environment
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 font-mono text-[10px] uppercase block">AI Provider Mode</span>
            <span className="text-amber-400 font-medium">{metrics.activeProvider}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 font-mono text-[10px] uppercase block">Vector Store Adapter</span>
            <span className="text-emerald-400 font-medium">pgvector / Embedded Cosine Similarity</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 font-mono text-[10px] uppercase block">Registered Users</span>
            <span className="text-slate-200 font-medium">{stats.totalUsers} legal reviewers</span>
          </div>
        </div>
      </div>

      {/* Live Audit Log Stream */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          Audit Log Stream & Security Trail
        </h3>
        <div className="divide-y divide-slate-800/80 font-mono text-xs">
          {logs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between gap-2 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-semibold">[{log.action}]</span>
                <span className="text-slate-400">{log.entityType} ({log.entityId ? log.entityId.slice(0, 8) : 'N/A'})</span>
              </div>
              <span className="text-slate-500 text-[11px]">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};