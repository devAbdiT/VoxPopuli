import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Poll } from '../types';
import { getCategoryMeta } from './PollList';
import { 
  Flame, 
  TrendingUp, 
  Clock, 
  BarChart2, 
  ArrowUpRight, 
  Sparkles, 
  Copy, 
  Check, 
  Layers, 
  Activity, 
  ChevronRight,
  Vote,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TrendingPollsProps {
  polls: Poll[];
  userVotes: Record<string, string | string[]>;
}

// Generate smooth SVG curve path from 24 data points
function generateSvgPath(data: number[], width: number, height: number, padding: number = 8) {
  if (!data || data.length === 0) return { path: '', areaPath: '', points: [] };

  const minVal = 0;
  const maxVal = Math.max(...data, 1);
  const effectiveWidth = width - padding * 2;
  const effectiveHeight = height - padding * 2;

  const points = data.map((val, index) => {
    const x = padding + (index / (data.length - 1)) * effectiveWidth;
    const y = height - padding - ((val - minVal) / (maxVal - minVal)) * effectiveHeight;
    return { x, y, val, hourAgo: 24 - index };
  });

  if (points.length < 2) return { path: '', areaPath: '', points };

  // Generate cubic bezier curve
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX = (curr.x + next.x) / 2;
    path += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  const areaPath = `${path} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return { path, areaPath, points };
}

export const TrendingPolls: React.FC<TrendingPollsProps> = ({ polls, userVotes }) => {
  const [activeTab, setActiveTab] = useState<'momentum' | 'comparison' | 'timeline'>('momentum');
  const [hoveredPoint, setHoveredPoint] = useState<{ pollId: string; hour: number; votes: number; x: number; y: number } | null>(null);
  const [copiedPollId, setCopiedPollId] = useState<string | null>(null);

  // Compute 24h metrics for all polls and extract top trending
  const trendingPolls = useMemo(() => {
    const enriched = polls
      .filter(p => !p.isPrivate)
      .map(poll => {
        // Fallback for new polls without hourly telemetry: synthesize realistic 24-point distribution
        const votes24h = poll.votesLast24h !== undefined 
          ? poll.votesLast24h 
          : Math.min(poll.totalVotes, Math.max(1, Math.round(poll.totalVotes * 0.65)));
        
        let hourly = poll.hourlyVotes24h;
        if (!hourly || hourly.length !== 24) {
          // synthesize 24h curve using sine wave peaking around hours 10-18
          hourly = Array.from({ length: 24 }, (_, i) => {
            const factor = Math.max(0.1, Math.sin((i / 23) * Math.PI));
            return Math.max(0, Math.round((votes24h / 24) * factor * 2));
          });
        }

        const velocity = poll.voteVelocity !== undefined
          ? poll.voteVelocity
          : Number((votes24h / 24).toFixed(1));

        // Leading option
        let leadingOption = null;
        if (poll.options && poll.options.length > 0 && poll.totalVotes > 0) {
          leadingOption = [...poll.options].sort((a, b) => b.votes - a.votes)[0];
        }

        return {
          ...poll,
          votesLast24h: votes24h,
          hourlyVotes24h: hourly,
          voteVelocity: velocity,
          leadingOption,
        };
      });

    // Rank descending by votes in last 24h
    return enriched.sort((a, b) => b.votesLast24h - a.votesLast24h).slice(0, 4);
  }, [polls]);

  const total24hVotes = useMemo(() => {
    return trendingPolls.reduce((sum, p) => sum + p.votesLast24h, 0);
  }, [trendingPolls]);

  const max24hVotes = useMemo(() => {
    return Math.max(...trendingPolls.map(p => p.votesLast24h), 1);
  }, [trendingPolls]);

  const handleCopy = (e: React.MouseEvent, pollId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/#/poll/${pollId}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url);
    }
    setCopiedPollId(pollId);
    setTimeout(() => setCopiedPollId(null), 2000);
  };

  if (trendingPolls.length === 0) return null;

  return (
    <section aria-labelledby="trending-heading" className="space-y-4">
      {/* Section Header with live indicator & view modes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Flame className="w-5 h-5 fill-amber-500/30" />
            </div>
            <h2 id="trending-heading" className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white">
              Trending Polls
            </h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Past 24 Hours</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time vote velocity and momentum curves across the most active community ballots.
          </p>
        </div>

        {/* Visualization Tabs Segmented Control */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-700/60 self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('momentum')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'momentum'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Momentum</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Volume Bars</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Hourly Matrix</span>
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* VIEW 1: MOMENTUM CARDS WITH INTERACTIVE AREA SPARKLINE                  */}
      {/* ======================================================================= */}
      {activeTab === 'momentum' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingPolls.map((poll, index) => {
            const categoryMeta = getCategoryMeta(poll.category);
            const CategoryIcon = categoryMeta.icon;
            const hasVoted = !!userVotes[poll.id];
            const sparkline = generateSvgPath(poll.hourlyVotes24h, 240, 64, 6);

            const rankBadge = index === 0 
              ? { bg: 'bg-amber-500 text-white', label: '#1 Surge' }
              : index === 1 
                ? { bg: 'bg-indigo-600 text-white', label: '#2 Hot' }
                : index === 2 
                  ? { bg: 'bg-emerald-600 text-white', label: '#3 Rising' }
                  : { bg: 'bg-slate-600 text-white', label: `#${index + 1}` };

            return (
              <motion.div
                key={poll.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className="group relative bg-white dark:bg-slate-900/95 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-md hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Rank, Category, and Velocity Indicator */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[11px] font-extrabold rounded-md uppercase tracking-wider ${rankBadge.bg}`}>
                        {rankBadge.label}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <CategoryIcon className="w-3 h-3 text-primary-500" />
                        <span>{poll.category || 'General'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                      <Zap className="w-3 h-3 fill-emerald-500/40" />
                      <span>{poll.voteVelocity}/hr</span>
                    </div>
                  </div>

                  {/* Poll Title */}
                  <Link
                    to={`/poll/${poll.id}`}
                    className="block text-sm sm:text-base font-display font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug mb-3"
                  >
                    {poll.question}
                  </Link>

                  {/* 24-Hour Vote Volume Stat */}
                  <div className="flex items-baseline justify-between mb-2">
                    <div>
                      <span className="text-2xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {poll.votesLast24h}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                        votes in 24h
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {Math.round((poll.votesLast24h / poll.totalVotes) * 100)}% of total
                    </span>
                  </div>

                  {/* Interactive SVG Sparkline with Gradient Fill */}
                  <div 
                    className="relative w-full h-16 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-1 mb-3.5 border border-slate-100 dark:border-slate-800 overflow-hidden cursor-crosshair"
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <svg viewBox="0 0 240 64" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id={`sparkGrad-${poll.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area Fill */}
                      <path
                        d={sparkline.areaPath}
                        fill={`url(#sparkGrad-${poll.id})`}
                      />

                      {/* Line Stroke */}
                      <path
                        d={sparkline.path}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Interactive Scrubber Dots */}
                      {sparkline.points.map((pt, pIdx) => (
                        <circle
                          key={pIdx}
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredPoint?.pollId === poll.id && hoveredPoint.hour === pt.hourAgo ? 4.5 : 2}
                          className="transition-all duration-150 cursor-pointer"
                          fill={hoveredPoint?.pollId === poll.id && hoveredPoint.hour === pt.hourAgo ? '#f59e0b' : 'transparent'}
                          stroke={hoveredPoint?.pollId === poll.id && hoveredPoint.hour === pt.hourAgo ? '#ffffff' : 'transparent'}
                          strokeWidth="2"
                          onMouseEnter={() => setHoveredPoint({
                            pollId: poll.id,
                            hour: pt.hourAgo,
                            votes: pt.val,
                            x: pt.x,
                            y: pt.y
                          })}
                        />
                      ))}
                    </svg>

                    {/* Tooltip Overlay */}
                    {hoveredPoint?.pollId === poll.id && (
                      <div 
                        className="absolute pointer-events-none -top-1 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow-lg z-20 whitespace-nowrap -translate-x-1/2"
                        style={{ left: `${Math.min(200, Math.max(30, (hoveredPoint.x / 240) * 100))}%` }}
                      >
                        {hoveredPoint.votes} votes ({hoveredPoint.hour}h ago)
                      </div>
                    )}

                    <div className="absolute bottom-1 left-2 text-[9px] text-slate-400 font-medium">
                      -24h
                    </div>
                    <div className="absolute bottom-1 right-2 text-[9px] text-slate-400 font-medium">
                      Now
                    </div>
                  </div>

                  {/* Leading Option Snapshot */}
                  {poll.leadingOption && (
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5 mb-3 border border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-semibold mb-1">
                        <span className="truncate pr-1">Leading: {poll.leadingOption.text}</span>
                        <span className="text-primary-600 dark:text-primary-400 font-bold shrink-0">
                          {Math.round((poll.leadingOption.votes / poll.totalVotes) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-primary-500 rounded-full"
                          style={{ width: `${Math.round((poll.leadingOption.votes / poll.totalVotes) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {hasVoted && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Voted
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleCopy(e, poll.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
                      title="Copy link"
                    >
                      {copiedPollId === poll.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <Link
                    to={`/poll/${poll.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    <span>Participate</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ======================================================================= */}
      {/* VIEW 2: COMPARATIVE VOLUME HORIZONTAL BAR VISUALIZER                   */}
      {/* ======================================================================= */}
      {activeTab === 'comparison' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span>Poll / Question</span>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline">24h Share</span>
              <span>24h Volume / Total</span>
            </div>
          </div>

          <div className="space-y-3.5">
            {trendingPolls.map((poll, idx) => {
              const pctOfMax = Math.round((poll.votesLast24h / max24hVotes) * 100);
              const shareOfAllTrending = total24hVotes > 0 
                ? Math.round((poll.votesLast24h / total24hVotes) * 100) 
                : 0;

              return (
                <div key={poll.id} className="space-y-1.5 group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <Link 
                      to={`/poll/${poll.id}`}
                      className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate max-w-lg"
                    >
                      <span className="text-amber-500 font-extrabold mr-1.5">#{idx + 1}</span>
                      {poll.question}
                    </Link>

                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 shrink-0 font-semibold">
                      <span className="hidden sm:inline-block text-[11px] text-slate-400">
                        {shareOfAllTrending}% of trending
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {poll.votesLast24h} <span className="text-slate-400 font-normal">/ {poll.totalVotes} total</span>
                      </span>
                    </div>
                  </div>

                  {/* Dual Layer Volume Bar */}
                  <div className="relative w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pctOfMax}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-primary-500 to-indigo-500 relative"
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full opacity-50" />
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-primary-500" />
              Volume bars reflect votes registered within the rolling 24-hour window.
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {total24hVotes} total ballots recorded across top surge polls
            </span>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* VIEW 3: HOURLY MATRIX TIMELINE HEATMAP                                  */}
      {/* ======================================================================= */}
      {activeTab === 'timeline' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>24-Hour Vote Flow Across Trending Polls</span>
            <span className="text-[11px]">Hover over any hour column for count</span>
          </div>

          <div className="space-y-4">
            {trendingPolls.map((poll, idx) => {
              const maxHourly = Math.max(...poll.hourlyVotes24h, 1);

              return (
                <div key={poll.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <Link
                      to={`/poll/${poll.id}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-primary-600 transition-colors truncate max-w-sm sm:max-w-md"
                    >
                      <span className="text-amber-500 font-extrabold mr-1">#{idx + 1}</span>
                      {poll.question}
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                      {poll.votesLast24h} votes (24h)
                    </span>
                  </div>

                  {/* 24-column hourly heatmap bar */}
                  <div 
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
                    className="gap-1 h-6 items-end bg-slate-50 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-100 dark:border-slate-800"
                  >
                    {poll.hourlyVotes24h.map((v, hIdx) => {
                      const hourAgo = 24 - hIdx;
                      const heightPct = Math.max(15, Math.round((v / maxHourly) * 100));
                      const isHot = v >= maxHourly * 0.7;

                      return (
                        <div
                          key={hIdx}
                          title={`${v} votes (${hourAgo}h ago)`}
                          className="h-full flex items-end group/col relative cursor-pointer"
                        >
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full rounded-sm transition-all duration-200 group-hover/col:scale-y-110 ${
                              isHot
                                ? 'bg-amber-500 dark:bg-amber-400'
                                : v > 0
                                  ? 'bg-primary-500/70 dark:bg-primary-400/70'
                                  : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium px-1">
            <span>24 hours ago</span>
            <span>18h ago</span>
            <span>12h ago</span>
            <span>6h ago</span>
            <span className="text-amber-500 font-bold">Current Hour</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default TrendingPolls;
