import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  FileCheck2,
  Cpu,
  Search,
  Scale,
  Lock,
  ArrowRight,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LandingPage: React.FC = () => {
  const { user, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const handleExploreDemo = async () => {
    if (!user) {
      await quickDemoLogin('user');
    }
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32 border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,119,6,0.15),rgba(255,255,255,0))] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Next-Generation Legal Intelligence & Contract Risk Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
            Understand Your Contracts Before They Become <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">Risks.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed">
            AI-powered contract intelligence that finds hidden risks, explains complex clauses, and provides evidence-backed insights.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleExploreDemo}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-900/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Analyze a Contract</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleExploreDemo}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              Explore Live Demo Workspace
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/80">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <div className="text-2xl font-bold font-mono text-amber-400">23+</div>
              <div className="text-xs text-slate-400 mt-0.5">Clause Classifiers</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <div className="text-2xl font-bold font-mono text-rose-400">22+</div>
              <div className="text-xs text-slate-400 mt-0.5">Risk Patterns Detected</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <div className="text-2xl font-bold font-mono text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">Deterministic Scoring</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <div className="text-2xl font-bold font-mono text-sky-400">Hybrid</div>
              <div className="text-xs text-slate-400 mt-0.5">RRF Vector + Keyword RAG</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Risk Preview Section */}
      <section className="py-20 bg-slate-900/40 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold mb-2">
              Explainable Risk Intelligence
            </h2>
            <h3 className="text-3xl font-serif font-bold text-white">
              Every Risk Linked Directly to Contract Evidence
            </h3>
            <p className="mt-3 text-sm text-slate-400">
              No black-box hallucinations. LexGuard extracts exact section numbers, pages, and clause text with statutory references.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-rose-900/40 shadow-xl space-y-4 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-rose-950 border border-rose-600/50 text-rose-300 text-xs font-semibold">
                  Critical &bull; 80/100
                </span>
                <span className="text-xs font-mono text-slate-400">Section 5.0 (Page 1)</span>
              </div>
              <h4 className="text-base font-serif font-bold text-white">Unlimited Liability & Absence of Cap</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Customer bears unlimited financial liability for direct, indirect, and punitive damages without any aggregate monetary ceiling.
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-serif text-slate-400 italic">
                &ldquo;CUSTOMER AGREES THAT CUSTOMER SHALL BEAR UNLIMITED LIABILITY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, INCIDENTAL, OR PUNITIVE DAMAGES...&rdquo;
              </div>
              <div className="text-xs text-amber-300 font-medium">
                Recommendation: Insert a trailing 12-month fees cap and strike punitive damages.
              </div>
            </div>

            {/* Risk Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-orange-900/40 shadow-xl space-y-4 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-orange-950 border border-orange-600/50 text-orange-300 text-xs font-semibold">
                  High &bull; 64/100
                </span>
                <span className="text-xs font-mono text-slate-400">Section 7.0 (Page 2)</span>
              </div>
              <h4 className="text-base font-serif font-bold text-white">Unilateral Termination for Convenience</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Provider retains the right to cancel without cause upon 5 days notice, while customer is locked into the multi-year term.
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-serif text-slate-400 italic">
                &ldquo;Provider may terminate this agreement at any time without cause upon five (5) days written notice. Customer shall have no right to terminate...&rdquo;
              </div>
              <div className="text-xs text-amber-300 font-medium">
                Recommendation: Require mutual convenience termination with at least 60 days advance notice.
              </div>
            </div>

            {/* Risk Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-amber-900/40 shadow-xl space-y-4 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-amber-950 border border-amber-600/50 text-amber-300 text-xs font-semibold">
                  Moderate &bull; 45/100
                </span>
                <span className="text-xs font-mono text-slate-400">Section 2.0 (Page 1)</span>
              </div>
              <h4 className="text-base font-serif font-bold text-white">Evergreen Automatic Renewal Trap</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Requires advance opt-out notice 90 days before expiration, otherwise auto-extending for successive 2-year terms.
              </p>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-serif text-slate-400 italic">
                &ldquo;...automatically renew for successive periods of two (2) years each, unless Customer provides written notice at least ninety (90) days prior...&rdquo;
              </div>
              <div className="text-xs text-amber-300 font-medium">
                Recommendation: Reduce notice window to 30 days or require affirmative written renewal.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Agent & RAG Architecture */}
      <section className="py-20 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold mb-2">
              System Architecture
            </h2>
            <h3 className="text-3xl font-serif font-bold text-white">
              Multi-Agent Orchestration & Grounded Hybrid RAG
            </h3>
            <p className="mt-3 text-sm text-slate-400">
              LexGuard separates responsibilities into specialized agents to prevent hallucinations and enforce citation integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-white text-base">Contract Agent</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Parses structural hierarchies, identifies recitals, extracts parties, notice windows, governing laws, and maps covenants.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-white text-base">Risk Detection Agent</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applies the deterministic <code>Severity &times; Probability &times; Impact</code> formula across 22+ dangerous clause configurations.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                <Scale className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-white text-base">Legal Research Agent</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Retrieves authoritative statutes from the knowledge base (GDPR Art. 28, UCC § 2-719, Delaware DGCL) for statutory grounding.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-white text-base">Verification Agent</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cross-examines generated AI outputs against raw contract text, verifying citations and flagging unsupported assertions.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-white text-base">Comparison Agent</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Performs multi-contract side-by-side comparative audits across 9 core legal categories with favorability grading.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-white text-base">Hybrid RRF Retrieval</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Merges dense vector cosine similarity with lexical BM25 token matching via Reciprocal Rank Fusion ($k=60$).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="py-20 bg-slate-900/30 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 mb-6">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-white">Enterprise Privacy & Contract Isolation</h3>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            Contracts contain your most sensitive commercial covenants. LexGuard ensures tenant-isolated document storage, parameterized relational databases, zero model training on uploaded data, and deterministic offline Fallback AI mode.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white">
            Ready to audit your legal contracts?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Experience high-precision clause classification, deterministic risk scores, and evidence-grounded chat in seconds.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleExploreDemo}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-xl shadow-amber-900/30 transition-all"
            >
              Launch Interactive Demo
            </button>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all border border-slate-700"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};