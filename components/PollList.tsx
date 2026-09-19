import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Link } from 'react-router-dom';
import { Poll, PollCategory } from '../types';
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

const PollList: React.FC = () => {
  const polls = useSelector((state: RootState) => state.polls);
  const userVotes = useSelector((state: RootState) => state.userVotes);
  const loading = useSelector((state: RootState) => state.loading);
  const [filter, setFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('Newest');
  const [showMyVotesOnly, setShowMyVotesOnly] = useState<boolean>(false);

  const categories = ['All', ...Object.values(PollCategory)];
  const sortOptions = [
    { label: 'Newest First', value: 'Newest' },
    { label: 'Trending / Most Votes', value: 'Trending' },
    { label: 'Closing Soon', value: 'Closing Soon' }
  ];

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

  const filteredPolls = useMemo(() => {
    return polls.filter(p => {
      if (p.isPrivate) return false;
      const matchesCategory = filter === 'All' || p.category === filter;
      const matchesSearch = 
        p.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesMyVotes = !showMyVotesOnly || !!userVotes[p.id];
      return matchesCategory && matchesSearch && matchesMyVotes;
    });
  }, [polls, filter, searchQuery, showMyVotesOnly, userVotes]);

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
    return (
      <div className="flex flex-col justify-center items-center h-72 gap-4">
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 dark:border-slate-800 border-t-primary-600 animate-spin"></div>
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading live ballots...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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

      {/* Search, Filter Tabs & Sort Controls */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          {/* Search bar */}
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search polls, keywords, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick My Votes toggle button */}
            <button
              onClick={() => setShowMyVotesOnly(!showMyVotesOnly)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                showMyVotesOnly 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-sm' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Voted By Me</span>
              {stats.myVoteCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px]">
                  {stats.myVoteCount}
                </span>
              )}
            </button>

            {/* Sort Selector */}
            <div className="relative min-w-[170px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ArrowUpDown className="w-3.5 h-3.5" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:focus:border-primary-500 transition-colors cursor-pointer appearance-none shadow-sm"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Scrollbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
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
      </div>

      {/* Polls Cards Grid or Empty States */}
      {sortedPolls.length === 0 ? (
        searchQuery.length > 0 || showMyVotesOnly || filter !== 'All' ? (
          <div className="text-center py-16 px-4 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-sm">
            <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-1.5">No matching polls</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-5">
              We couldn't find any polls matching your active filters. Try clearing your search query or reset the category.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilter('All');
                setShowMyVotesOnly(false);
              }}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
            >
              Reset Filters
            </button>
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
                  
                  {/* Question */}
                  <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug">
                    {poll.question}
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