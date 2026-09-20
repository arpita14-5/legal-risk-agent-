import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  FileText,
  GitCompare,
  BookOpen,
  Activity,
  LogOut,
  Search,
  Sparkles,
  LayoutDashboard,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const Navbar: React.FC = () => {
  const { user, logout, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Contracts', path: '/contracts', icon: FileText },
    { name: 'Compare', path: '/compare', icon: GitCompare },
    { name: 'Legal Knowledge', path: '/legal-sources', icon: BookOpen },
    ...(user?.role === 'admin' ? [{ name: 'Observability', path: '/admin/monitoring', icon: Activity }] : [])
  ];

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              LexGuard
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                AI SaaS
              </span>
            </span>
            <span className="text-[10px] tracking-wide text-slate-400 -mt-1 font-mono">
              LEGAL INTELLIGENCE
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        {user && (
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative flex-1 max-w-xs mx-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search contracts, risks, laws..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </form>
        )}

        {/* Nav Links */}
        {user ? (
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    active
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        ) : null}

        {/* Right side: Demo mode status & Auth menu */}
        <div className="flex items-center gap-3">
          {/* Demo AI Mode Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Demo AI Mode Active</span>
          </div>

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200 truncate max-w-[140px]">{user.name}</span>
                <span className="text-[10px] text-slate-400 uppercase font-mono">{user.role}</span>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => quickDemoLogin('user')}
                className="text-xs px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all shadow-sm"
              >
                Demo Counsel Login
              </button>
              <Link
                to="/login"
                className="text-xs px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-900 transition-colors border border-slate-800"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};