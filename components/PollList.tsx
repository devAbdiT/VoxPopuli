import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Link } from 'react-router-dom';
import { PollCategory } from '../types';
import { 
  BarChart3, 
  Clock, 
  Users, 
  ChevronRight, 
  Search, 
  SearchX, 
  ClipboardList, 
  TrendingUp, 
  Flame, 
  CheckCircle2, 
  ArrowUpDown, 
  Sparkles,
  MessageSquare,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import PollListSkeleton from './PollSkeleton';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 26 } }
};

const getCategoryBadgeClass = (category?: string) => {
  switch (category) {
    case PollCategory.TECH:
      return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/50';
    case PollCategory.LIFESTYLE:
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50';
    case PollCategory.FOOD:
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50';
    case PollCategory.ENTERTAINMENT:
      return 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/50';
    case PollCategory.SPORTS:
      return 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/50';
    default:
      return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/50';
  }
};

/**
 * Highlights matching title keywords in real-time
 */
const HighlightedText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const keywords = trimmed.split(/\s+/).filter(Boolean);
  if (keywords.length === 0) return <>{text}</>;

  const pattern = keywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  try {
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          keywords.some(kw => kw.toLowerCase() === part.toLowerCase()) ? (
            <mark 
              key={i} 
              className="bg-amber-200 dark:bg-amber-900/70 dark:text-amber-200 text-slate-900 rounded px-1 font-bold"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
};

const PollList: React.FC = () => {
  const polls = useSelector((state: RootState) => state.polls);
  const userVotes = useSelector((state: RootState) => state.userVotes);
  const loading = useSelector((state: RootState) => state.loading);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'closed'>('active');
  const [filter, setFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('Newest');
  const [showMyVotesOnly, setShowMyVotesOnly] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses the real-time search bar, 'Escape' clears it
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = ['All', ...Object.values(PollCategory)];
  const sortOptions = [
    { label: 'Newest First', value: 'Newest' },
    { label: 'Trending / Most Votes', value: 'Trending' },
    { label: 'Closing Soon', value: 'Closing Soon' }
  ];

  // Active and total poll counts
  const activePollCount = useMemo(() => {
    const now = Date.now();
    return polls.filter(p => !p.isPrivate && (!p.expiresAt || now <= p.expiresAt)).length;
  }, [polls]);

  const totalPollCount = useMemo(() => {
    return polls.filter(p => !p.isPrivate).length;
  }, [polls]);

  // Overall statistics
  const stats = useMemo(() => {
    const publicPolls = polls.filter(p => !p.isPrivate);
    const totalVotes = publicPolls.reduce((acc, p) => acc + p.totalVotes, 0);
    const myVoteCount = Object.keys(userVotes).length;
    return {
      totalPolls: publicPolls.length,
      totalVotes,
      myVoteCount
    };
  }, [polls, userVotes]);

  // Real-time filtering by title keyword, active poll status, category, and votes
  const filteredPolls = useMemo(() => {
    const now = Date.now();
    const query = searchQuery.trim().toLowerCase();
    const keywords = query ? query.split(/\s+/).filter(Boolean) : [];

    return polls.filter(p => {
      if (p.isPrivate) return false;

      // Status filter: active (not expired) vs closed vs all
      const isExpired = p.expiresAt ? now > p.expiresAt : false;
      if (statusFilter === 'active' && isExpired) return false;
      if (statusFilter === 'closed' && !isExpired) return false;

      // Category filter
      const matchesCategory = filter === 'All' || p.category === filter;

      // Real-time title keyword matching
      let matchesSearch = true;
      if (keywords.length > 0) {
        const titleLower = p.question.toLowerCase();
        // Checks direct phrase inclusion or all keywords matching title
        matchesSearch = titleLower.includes(query) || keywords.every(kw => titleLower.includes(kw));
      }

      // Voted by me filter
      const matchesMyVotes = !showMyVotesOnly || !!userVotes[p.id];

      return matchesCategory && matchesSearch && matchesMyVotes;
    });
  }, [polls, filter, searchQuery, statusFilter, showMyVotesOnly, userVotes]);

  const sortedPolls = useMemo(() => {
    return [...filteredPolls].sort((a, b) => {
      if (sortBy === 'Trending') {
        return b.totalVotes - a.totalVotes;
      } else if (sortBy === 'Closing Soon') {
        const now = Date.now();
        const aActiveExpiry = a.expiresAt && now <= a.expiresAt;
        const bActiveExpiry = b.expiresAt && now <= b.expiresAt;
        
        if (aActiveExpiry && bActiveExpiry) {
          return a.expiresAt! - b.expiresAt!;
        } else if (aActiveExpiry) {
          return -1;
        } else if (bActiveExpiry) {
          return 1;
        } else {
          return b.createdAt - a.createdAt;
        }
      }
      return b.createdAt - a.createdAt;
    });
  }, [filteredPolls, sortBy]);

  if (loading) {
    return <PollListSkeleton cardCount={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Real-time Search Input Bar at the Top of the PollList Page */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md shadow-slate-900/5 transition-all">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Real-time Search Input */}
          <div className="relative flex-grow">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
              <Search className={`w-4 h-4 transition-colors ${searchQuery ? 'text-primary-600 dark:text-primary-400' : ''}`} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder={
                statusFilter === 'active'
                  ? "Search active polls by title keyword... (e.g. 'framework', 'coffee')"
                  : "Search all polls by title keyword..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl sm:rounded-2xl text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white transition-all shadow-xs"
            />
            {/* Clear & Keyboard shortcut */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                  title="Clear search (Esc)"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-xs" title="Press / to focus search">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Active Polls Status Filter Tabs */}
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Active Polls</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                {activePollCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>All Polls</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold">
                {totalPollCount}
              </span>
            </button>
          </div>
        </div>

        {/* Real-time Feedback Status Line */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            {searchQuery.trim() ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-ping"></span>
                <span>
                  Real-time match: <strong className="text-slate-900 dark:text-white">{sortedPolls.length}</strong> {statusFilter === 'active' ? 'active' : ''} {sortedPolls.length === 1 ? 'poll' : 'polls'} matching title keyword <span className="text-primary-600 dark:text-primary-400 font-bold">"{searchQuery.trim()}"</span>
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>
                  Filtering <strong className="text-slate-900 dark:text-white">{sortedPolls.length}</strong> {statusFilter === 'active' ? 'active' : ''} {sortedPolls.length === 1 ? 'poll' : 'polls'} in real-time
                </span>
              </span>
            )}
          </div>

          {(searchQuery || filter !== 'All' || showMyVotesOnly || statusFilter !== 'active') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilter('All');
                setShowMyVotesOnly(false);
                setStatusFilter('active');
              }}
              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Community Pulse Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-[#0b0f19] border border-slate-800/80 p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/10 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Real-Time Voice of the Crowd</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-extrabold tracking-tight text-white leading-tight">
              Vote on what matters. Shape the consensus.
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Explore trending community questions, cast instant anonymous ballots, and watch dynamic results animate in real-time.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full md:w-auto">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
              <span className="block text-xl sm:text-2xl font-display font-bold text-white">{stats.totalPolls}</span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">Polls</span>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
              <span className="block text-xl sm:text-2xl font-display font-bold text-emerald-400">{stats.totalVotes}</span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">Votes Cast</span>
            </div>
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
              <span className="block text-xl sm:text-2xl font-display font-bold text-indigo-300">{stats.myVoteCount}</span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">You Voted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs, My Votes & Sort Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {/* Category Scrollbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar w-full sm:w-auto">
          {categories.map(cat => {
            const isActive = filter === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 border ${
                  isActive 
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-500/30' 
                    : 'bg-white dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          {/* Quick My Votes toggle button */}
          <button
            onClick={() => setShowMyVotesOnly(!showMyVotesOnly)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              showMyVotesOnly 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-sm' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Voted By Me</span>
            {stats.myVoteCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px]">
                {stats.myVoteCount}
              </span>
            )}
          </button>

          {/* Sort Selector */}
          <div className="relative min-w-[160px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:focus:border-primary-500 transition-colors cursor-pointer appearance-none shadow-xs"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Polls Cards Grid or Empty States */}
      {sortedPolls.length === 0 ? (
        searchQuery.length > 0 || showMyVotesOnly || filter !== 'All' || statusFilter !== 'all' ? (
          <div className="text-center py-16 px-4 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-sm">
            <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-1.5">
              {searchQuery.trim() ? `No polls found matching "${searchQuery.trim()}"` : 'No matching polls'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-5">
              {statusFilter === 'active' && searchQuery.trim()
                ? `We couldn't find any active polls with title keyword "${searchQuery.trim()}". Try searching all polls or clearing the query.`
                : "We couldn't find any polls matching your active filters. Try clearing your search query or reset the category."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 hover:bg-primary-100 rounded-xl transition-colors border border-primary-200 dark:border-primary-800"
                >
                  Clear search query
                </button>
              )}
              {statusFilter === 'active' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
                >
                  Search all polls instead
                </button>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilter('All');
                  setShowMyVotesOnly(false);
                  setStatusFilter('active');
                }}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
              >
                Reset all filters
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 px-4 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-sm">
            <div className="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-5 relative">
              <div className="absolute inset-0 bg-primary-500/10 rounded-full animate-ping opacity-60"></div>
              <ClipboardList className="w-10 h-10 relative z-10" />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-2">No active polls yet</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm sm:text-base leading-relaxed">
              Be the first to ignite a conversation! Create a poll to gather opinions, settle debates, or survey your audience in real-time.
            </p>
            <Link 
              to="/create" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/25 hover:shadow-glow transition-all duration-200"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Create Your First Poll</span>
            </Link>
          </div>
        )
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sortedPolls.map((poll) => {
            const isExpired = poll.expiresAt ? Date.now() > poll.expiresAt : false;
            const hasVoted = !!userVotes[poll.id];
            
            // Calculate leading option
            let leadingOption = null;
            if (poll.totalVotes > 0 && poll.options.length > 0) {
              leadingOption = [...poll.options].sort((a, b) => b.votes - a.votes)[0];
            }
            const leadingPercentage = leadingOption && poll.totalVotes > 0
              ? Math.round((leadingOption.votes / poll.totalVotes) * 100)
              : 0;

            return (
              <motion.div key={poll.id} variants={itemVariants} className="h-full">
                <Link 
                  to={`/poll/${poll.id}`}
                  className="group relative bg-white dark:bg-slate-900/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200/80 dark:border-slate-800/80 hover:border-primary-500/50 dark:hover:border-primary-500/50 flex flex-col h-full overflow-hidden"
                >
                  {/* Subtle top accent border if custom themed */}
                  {poll.theme?.accentColor && (
                    <div 
                      className="absolute top-0 left-0 right-0 h-1" 
                      style={{ backgroundColor: poll.theme.accentColor }} 
                    />
                  )}

                  {/* Header Badges */}
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border uppercase tracking-wider ${getCategoryBadgeClass(poll.category)}`}>
                        {poll.category || 'General'}
                      </span>
                      {isExpired ? (
                        <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-semibold rounded-full border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                          Closed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold rounded-full border border-emerald-200/60 dark:border-emerald-800/50 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Live
                        </span>
                      )}
                    </div>

                    {hasVoted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full border border-emerald-200/60 dark:border-emerald-800/50">
                        <CheckCircle2 className="w-3 h-3" />
                        Voted
                      </span>
                    )}
                  </div>
                  
                  {/* Question with real-time keyword highlighting */}
                  <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug">
                    <HighlightedText text={poll.question} query={searchQuery} />
                  </h2>
                  
                  {/* Description */}
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-4 flex-grow line-clamp-2 leading-relaxed">
                    {poll.description || "No description provided."}
                  </p>

                  {/* Leading Option Preview Bar (if votes exist) */}
                  {leadingOption && poll.totalVotes > 0 && (
                    <div className="mb-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
                          🏆 {leadingOption.text}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {leadingPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${leadingPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Footer Meta */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-400 dark:text-slate-500 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center" title="Total votes">
                        <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span className="font-medium text-slate-600 dark:text-slate-400">{poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}</span>
                      </div>
                      {poll.comments && poll.comments.length > 0 && (
                        <div className="flex items-center" title="Comments">
                          <MessageSquare className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          <span>{poll.comments.length}</span>
                        </div>
                      )}
                      <div className="flex items-center" title="Created date">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-primary-600 dark:text-primary-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default PollList;