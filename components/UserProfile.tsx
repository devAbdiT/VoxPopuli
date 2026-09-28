import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { RootState, removeUserVote, clearAllUserVotes } from '../store';
import { getRecentlyVoted, VotedPollEntry, removeVoteFromStorage, clearRecentlyVotedStorage } from '../services/votedPollsStorage';
import { PollCategory } from '../types';
import { getCategoryMeta } from './PollList';
import { 
  User, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  ExternalLink, 
  Trash2, 
  Search, 
  X, 
  ArrowRight, 
  TrendingUp, 
  Sparkles, 
  Vote, 
  Check, 
  Copy, 
  Filter, 
  Tag, 
  Share2, 
  Award, 
  Calendar, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const formatRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const polls = useSelector((state: RootState) => state.polls);
  const userVotes = useSelector((state: RootState) => state.userVotes);

  const [recentlyVoted, setRecentlyVoted] = useState<VotedPollEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'closed'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'votes'>('recent');

  const [copiedPollId, setCopiedPollId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('pulse_profile_name') || 'Voter Community Member';
  });
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(userName);

  // Load and refresh recently voted entries from local storage
  const refreshRecentlyVoted = () => {
    const records = getRecentlyVoted(polls);
    setRecentlyVoted(records);
  };

  useEffect(() => {
    refreshRecentlyVoted();

    // Listen to storage update events from other tabs or store actions
    const handleStorageEvent = () => {
      refreshRecentlyVoted();
    };

    window.addEventListener('pulse_voted_storage_updated', handleStorageEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('pulse_voted_storage_updated', handleStorageEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [polls, userVotes]);

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = tempName.trim() || 'Voter Community Member';
    setUserName(trimmed);
    localStorage.setItem('pulse_profile_name', trimmed);
    setIsEditingName(false);
  };

  const handleCopyLink = (e: React.MouseEvent, pollId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const origin = window.location.origin;
    const pathname = window.location.pathname.replace(/\/$/, '');
    const url = `${origin}${pathname}/#/poll/${pollId}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).catch(() => {
        copyFallback(url);
      });
    } else {
      copyFallback(url);
    }
    setCopiedPollId(pollId);
    setTimeout(() => setCopiedPollId(null), 2000);
  };

  const copyFallback = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleRemoveSingle = (e: React.MouseEvent, pollId: string) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(removeUserVote(pollId));
    setRecentlyVoted(prev => prev.filter(p => p.pollId !== pollId));
  };

  const handleClearAllHistory = () => {
    dispatch(clearAllUserVotes());
    setRecentlyVoted([]);
    setShowClearConfirm(false);
  };

  // Map recently voted records to live poll objects for rich data display
  const enrichedVotedList = useMemo(() => {
    const pollMap = new Map(polls.map(p => [p.id, p]));

    return recentlyVoted.map(record => {
      const livePoll = pollMap.get(record.pollId);
      const isExpired = livePoll?.expiresAt ? Date.now() > livePoll.expiresAt : false;

      // Find user selected options
      const chosenOptionObjects = livePoll
        ? livePoll.options.filter(o => record.optionIds.includes(o.id))
        : [];

      // Determine leading option
      let leadingOption = null;
      if (livePoll && livePoll.options.length > 0 && livePoll.totalVotes > 0) {
        leadingOption = [...livePoll.options].sort((a, b) => b.votes - a.votes)[0];
      }

      // Check if user's choice is leading
      const userChoiceIsLeading = leadingOption && chosenOptionObjects.some(o => o.id === leadingOption?.id);

      return {
        ...record,
        livePoll,
        isExpired,
        chosenOptionObjects,
        leadingOption,
        userChoiceIsLeading,
        totalVotes: livePoll?.totalVotes ?? record.totalVotesAtTime ?? 0,
        question: livePoll?.question || record.pollQuestion || 'Community Poll',
        category: livePoll?.category || record.category || 'General',
      };
    });
  }, [recentlyVoted, polls]);

  // Overall User Statistics
  const profileStats = useMemo(() => {
    const totalVotedCount = recentlyVoted.length;
    
    // Calculate category distribution
    const categoryCounts: Record<string, number> = {};
    enrichedVotedList.forEach(item => {
      const cat = item.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    let topCategory = 'None';
    let topCategoryCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > topCategoryCount) {
        topCategory = cat;
        topCategoryCount = count;
      }
    });

    // Count live vs closed
    const activePollsCount = enrichedVotedList.filter(item => !item.isExpired).length;
    const winningChoicesCount = enrichedVotedList.filter(item => item.userChoiceIsLeading).length;

    return {
      totalVotedCount,
      topCategory,
      activePollsCount,
      winningChoicesCount,
    };
  }, [recentlyVoted, enrichedVotedList]);

  // Filter and Sort Recently Voted items
  const filteredVotedList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return enrichedVotedList.filter(item => {
      // Search keyword filter
      if (query) {
        const matchesQuestion = item.question.toLowerCase().includes(query);
        const matchesOptions = item.chosenOptionObjects.some(opt => 
          opt.text.toLowerCase().includes(query)
        ) || (item.selectedOptionTexts && item.selectedOptionTexts.some(t => t.toLowerCase().includes(query)));
        if (!matchesQuestion && !matchesOptions) return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'live' && item.isExpired) return false;
      if (statusFilter === 'closed' && !item.isExpired) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'recent') return b.votedAt - a.votedAt;
      if (sortBy === 'oldest') return a.votedAt - b.votedAt;
      if (sortBy === 'votes') return b.totalVotes - a.totalVotes;
      return 0;
    });
  }, [enrichedVotedList, searchQuery, selectedCategory, statusFilter, sortBy]);

  // Unique categories user has actually voted in
  const userVotedCategories = useMemo(() => {
    const cats = new Set<string>();
    enrichedVotedList.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    return ['All', ...Array.from(cats)];
  }, [enrichedVotedList]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/20">
        <div className="absolute -right-12 -top-12 w-60 h-60 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/30 font-display font-extrabold text-2xl sm:text-3xl shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verified Voter Profile
                </span>
              </div>

              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-base font-display font-bold focus:outline-none focus:ring-2 focus:ring-primary-400"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempName(userName);
                      setIsEditingName(false);
                    }}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                    {userName}
                  </h1>
                  <button
                    onClick={() => {
                      setTempName(userName);
                      setIsEditingName(true);
                    }}
                    className="text-xs text-slate-400 hover:text-indigo-300 transition-colors p-1"
                    title="Edit profile display name"
                  >
                    Edit
                  </button>
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-300">
                Participation data stored safely in your browser local storage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/15 transition-all w-full md:w-auto"
            >
              <span>Explore More Polls</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Profile Activity Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 backdrop-blur-sm">
            <span className="block text-xl sm:text-2xl font-display font-bold text-white">
              {profileStats.totalVotedCount}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">
              Ballots Cast
            </span>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 backdrop-blur-sm">
            <span className="block text-xl sm:text-2xl font-display font-bold text-emerald-400">
              {profileStats.activePollsCount}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">
              Live Ballots
            </span>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 backdrop-blur-sm">
            <span className="block text-xl sm:text-2xl font-display font-bold text-indigo-300 truncate">
              {profileStats.topCategory}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">
              Top Interest
            </span>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 backdrop-blur-sm">
            <span className="block text-xl sm:text-2xl font-display font-bold text-amber-300">
              {profileStats.winningChoicesCount}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">
              Consensus Leads
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LOCAL STORAGE-BACKED 'RECENTLY VOTED' SECTION                             */}
      {/* ========================================================================= */}
      <section className="space-y-4" aria-labelledby="recently-voted-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Vote className="w-5 h-5" />
              </div>
              <h2 
                id="recently-voted-heading" 
                className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white"
              >
                Recently Voted
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {profileStats.totalVotedCount} {profileStats.totalVotedCount === 1 ? 'poll' : 'polls'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track polls you've participated in, review your chosen options, and monitor live consensus in real-time.
            </p>
          </div>

          {profileStats.totalVotedCount > 0 && (
            <div className="flex items-center gap-2">
              {showClearConfirm ? (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/50 p-1.5 rounded-xl border border-red-200 dark:border-red-900 animate-in fade-in">
                  <span className="text-xs text-red-700 dark:text-red-300 font-medium pl-1">
                    Clear all history?
                  </span>
                  <button
                    onClick={handleClearAllHistory}
                    className="px-2.5 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Yes, Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
                  title="Clear your local voting history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter and Search Bar for Recently Voted */}
        {profileStats.totalVotedCount > 0 && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Keyword Search */}
              <div className="relative flex-grow">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search voted polls or chosen options..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status and Sort Controls */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('live')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      statusFilter === 'live'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Live
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('closed')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      statusFilter === 'closed'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Closed
                  </button>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs focus:outline-none"
                >
                  <option value="recent">Most Recent First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="votes">Most Total Votes</option>
                </select>
              </div>
            </div>

            {/* Category Tag Pills Row */}
            {userVotedCategories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
                <span className="text-slate-400 text-xs font-medium mr-1 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Tags:
                </span>
                {userVotedCategories.map(cat => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-full font-semibold transition-all whitespace-nowrap border cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Recently Voted Polls List */}
        {profileStats.totalVotedCount === 0 ? (
          /* Empty state: No votes recorded yet */
          <div className="text-center py-16 px-4 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-4">
              <Vote className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2">
              No voting history yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              When you cast ballots in Pulse, your choices and participation history will be automatically stored here in your local storage so you can easily track results over time.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-primary-500/25 transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Participate in Live Polls</span>
            </Link>
          </div>
        ) : filteredVotedList.length === 0 ? (
          /* Empty state: Search/Filter returned 0 results */
          <div className="text-center py-12 px-4 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              No matching polls in your history
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
              Try searching with a different term or reset your category and status filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setStatusFilter('all');
              }}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Grid of Recently Voted Polls */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <AnimatePresence mode="popLayout">
              {filteredVotedList.map(item => {
                const categoryMeta = getCategoryMeta(item.category);
                const CategoryIcon = categoryMeta.icon;

                return (
                  <motion.div
                    key={item.pollId}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-primary-500/40 dark:hover:border-primary-500/40 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badges & Timing Row */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border uppercase tracking-wider ${categoryMeta.badgeClass}`}>
                            <CategoryIcon className="w-3 h-3" />
                            <span>{item.category}</span>
                          </span>

                          {item.isExpired ? (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-semibold rounded-full border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                              Closed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold rounded-full border border-emerald-200/60 dark:border-emerald-800/50 uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Live
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-400 text-xs shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(item.votedAt)}</span>
                        </div>
                      </div>

                      {/* Poll Title */}
                      <Link
                        to={`/poll/${item.pollId}`}
                        className="block text-base font-display font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug mb-3.5"
                      >
                        {item.question}
                      </Link>

                      {/* User's Cast Ballot / Selected Choice Card */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 mb-3 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Your Ballot Selection:
                          </span>
                          {item.userChoiceIsLeading && (
                            <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
                              <Sparkles className="w-3 h-3" />
                              Leading Consensus
                            </span>
                          )}
                        </div>

                        {/* Selected Option Names & Percentages */}
                        {item.chosenOptionObjects.length > 0 ? (
                          item.chosenOptionObjects.map(opt => {
                            const pct = item.totalVotes > 0 ? Math.round((opt.votes / item.totalVotes) * 100) : 0;
                            return (
                              <div key={opt.id} className="space-y-1">
                                <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                  <span className="truncate pr-2">{opt.text}</span>
                                  <span className="text-primary-600 dark:text-primary-400 shrink-0">
                                    {pct}% <span className="text-slate-400 text-xs font-normal">({opt.votes} votes)</span>
                                  </span>
                                </div>
                                {/* Mini Progress bar for this option */}
                                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                  <div
                                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        ) : item.selectedOptionTexts && item.selectedOptionTexts.length > 0 ? (
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                            {item.selectedOptionTexts.join(', ')}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Choice recorded on ballot
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions Row */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Total {item.totalVotes} {item.totalVotes === 1 ? 'vote' : 'votes'} cast
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(e, item.pollId)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Copy share link"
                        >
                          {copiedPollId === item.pollId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleRemoveSingle(e, item.pollId)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Remove from your voting history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          to={`/poll/${item.pollId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/60 font-semibold rounded-lg transition-colors"
                        >
                          <span>Results</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
};

export default UserProfile;
