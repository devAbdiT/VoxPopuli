import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState, votePollEvent, deletePollEvent, addCommentEvent } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Trash2, 
  Share2, 
  Info, 
  Copy, 
  MessageSquare, 
  Send, 
  BadgeCheck, 
  Lock, 
  QrCode, 
  X, 
  Code2, 
  Crown, 
  PieChart as PieIcon, 
  BarChart3, 
  Radio, 
  AlertTriangle,
  Clock,
  Timer,
  Hourglass,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { v4 as uuidv4 } from 'uuid';

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9', '#14b8a6', '#f43f5e'];

const CustomBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  
  return (
    <motion.rect
      x={x}
      y={y}
      height={height}
      fill={fill}
      initial={{ width: 0 }}
      animate={{ width: width > 0 ? width : 0 }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
      rx={6}
    />
  );
};

const PollView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const poll = useSelector((state: RootState) => state.polls.find(p => p.id === id));
  const userVote = useSelector((state: RootState) => state.userVotes[id || '']);
  const allUserVotes = useSelector((state: RootState) => state.userVotes);
  const loading = useSelector((state: RootState) => state.loading);

  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [chartView, setChartView] = useState<'bar' | 'donut'>('bar');

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleCopyEmbed = async () => {
    try {
      const embedCode = `<iframe src="${window.location.origin}/poll/${poll?.id}" width="100%" height="600" frameborder="0" style="border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);"></iframe>`;
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy embed code', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-72 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary-200 dark:border-slate-800 border-t-primary-600 animate-spin"></div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading live ballot...</p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="text-center py-20 px-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-2">Poll Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          This poll may have been removed or does not exist.
        </p>
        <button 
          onClick={() => navigate('/')} 
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Live ticking clock to drive real-time countdown every second
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!poll?.expiresAt) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [poll?.expiresAt]);

  const isExpired = poll ? (poll.expiresAt ? currentTime >= poll.expiresAt : false) : false;
  const remainingMs = poll?.expiresAt ? Math.max(0, poll.expiresAt - currentTime) : 0;

  // Breakdown of countdown components
  const countdown = useMemo(() => {
    if (!poll?.expiresAt) return null;
    const totalSecs = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    // Elapsed percentage
    let elapsedPercent = 0;
    if (poll.createdAt && poll.expiresAt > poll.createdAt) {
      const totalDur = poll.expiresAt - poll.createdAt;
      const elapsed = currentTime - poll.createdAt;
      elapsedPercent = Math.min(100, Math.max(0, (elapsed / totalDur) * 100));
    }

    const isUrgent = !isExpired && remainingMs < 3600000; // < 1 hour
    const isWarning = !isExpired && remainingMs < 86400000; // < 24 hours

    return {
      days,
      hours,
      minutes,
      seconds,
      totalSecs,
      elapsedPercent,
      isUrgent,
      isWarning,
      isExpired
    };
  }, [poll?.expiresAt, poll?.createdAt, remainingMs, currentTime, isExpired]);

  const hasVoted = Array.isArray(userVote) ? userVote.length > 0 : !!userVote;
  const isResultsHidden = poll.hideResultsUntilClosed && !isExpired;
  const showResults = (hasVoted || isExpired) && !isResultsHidden;

  const handleVoteClick = (optionId: string) => {
    if (hasVoted || isExpired) return;
    
    if (poll.allowMultipleVotes) {
      setSelectedOptions(prev => 
        prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
      );
    } else {
      submitVotes(optionId);
    }
  };

  const submitVotes = (optionIds: string | string[]) => {
    if (hasVoted || isExpired) return;
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: PALETTE
    });

    votePollEvent(poll.id, optionIds);
  };
  
  const confirmDelete = () => {
    deletePollEvent(poll.id);
    navigate('/');
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !poll) return;

    const isTopContributor = Object.keys(allUserVotes).length > 1;

    const newComment = {
      id: uuidv4(),
      text: commentText.trim(),
      author: authorName.trim() || 'Anonymous Voter',
      createdAt: Date.now(),
      isTopContributor,
    };

    addCommentEvent(poll.id, newComment);
    setCommentText('');
  };

  const chartData = useMemo(() => {
    return poll.options.map((opt, i) => ({
      name: opt.text.length > 18 ? opt.text.substring(0, 18) + '...' : opt.text,
      fullName: opt.text,
      votes: opt.votes,
      color: PALETTE[i % PALETTE.length]
    }));
  }, [poll]);

  const totalVotes = poll.totalVotes;

  // Find leading option
  const leadingOption = useMemo(() => {
    if (totalVotes === 0 || poll.options.length === 0) return null;
    return [...poll.options].sort((a, b) => b.votes - a.votes)[0];
  }, [poll, totalVotes]);

  // Custom Tooltip for Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = totalVotes > 0 ? Math.round((data.votes / totalVotes) * 100) : 0;
      return (
        <div className="bg-slate-900 text-white p-3 shadow-xl rounded-xl text-xs border border-slate-700/80">
          <p className="font-bold mb-1 text-slate-100">{data.fullName}</p>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-extrabold text-sm">{data.votes} votes</span>
            <span className="text-slate-400 font-medium">({pct}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`max-w-6xl mx-auto space-y-6 ${poll.theme?.accentColor ? 'custom-theme-active' : ''}`}>
      {poll.theme?.backgroundImage && (
        <div 
          className="fixed inset-0 z-[-1] bg-cover bg-center transition-opacity duration-500" 
          style={{ 
            backgroundImage: `url(${poll.theme.backgroundImage})`,
            opacity: 0.12 
          }}
        />
      )}
      
      {poll.theme?.accentColor && (
        <style>{`
          .custom-theme-active .text-primary-600 { color: ${poll.theme.accentColor} !important; }
          .custom-theme-active .bg-primary-600 { background-color: ${poll.theme.accentColor} !important; }
          .custom-theme-active .border-primary-500 { border-color: ${poll.theme.accentColor} !important; }
        `}</style>
      )}

      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Polls
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowQRModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 shadow-sm transition-all"
            title="Share or embed"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share & Embed</span>
          </button>
          <button 
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 shadow-sm transition-all"
            title="Copy link"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors" 
            title="Delete poll"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Ballot Card (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 transition-colors">
            {/* Header Tags */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Link
                  to={`/?tag=${encodeURIComponent(poll.category || 'General')}`}
                  className="px-3 py-0.5 text-xs font-semibold rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200/60 dark:border-primary-800/50 uppercase tracking-wider hover:bg-primary-100 dark:hover:bg-primary-900/60 transition-colors"
                  title={`Filter by category: ${poll.category || 'General'}`}
                >
                  {poll.category || 'General'}
                </Link>

                {poll.tags && poll.tags.filter(t => t.toLowerCase() !== (poll.category || '').toLowerCase()).map((t, idx) => {
                  const clean = t.replace(/^#/, '');
                  return (
                    <Link
                      key={idx}
                      to={`/?tag=${encodeURIComponent(clean)}`}
                      className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-200/60 transition-colors"
                      title={`Filter polls by #${clean}`}
                    >
                      #{clean}
                    </Link>
                  );
                })}

                {poll.isPrivate && (
                  <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Unlisted
                  </span>
                )}
                {isExpired ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-full border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                    <Hourglass className="w-3 h-3 text-slate-400" />
                    Closed
                  </span>
                ) : poll.expiresAt && countdown ? (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 text-xs font-bold rounded-full border uppercase tracking-wider ${
                    countdown.isUrgent
                      ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800/60 animate-pulse'
                      : countdown.isWarning
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/60'
                        : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50'
                  }`}>
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>
                      Live • {countdown.days > 0 ? `${countdown.days}d ` : ''}{countdown.hours}h {countdown.minutes}m {countdown.seconds}s left
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full border border-emerald-200/60 dark:border-emerald-800/50 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Voting
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight mb-2">
                {poll.question}
              </h1>
              {poll.description && (
                <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                  {poll.description}
                </p>
              )}
            </div>

            {/* Live Countdown Timer Display Widget */}
            {poll.expiresAt && !isExpired && countdown && (
              <div className={`mb-6 rounded-2xl p-4 sm:p-5 border transition-all ${
                countdown.isUrgent
                  ? 'bg-gradient-to-br from-red-500/10 via-rose-500/5 to-amber-500/5 dark:from-red-950/40 dark:via-rose-950/30 dark:to-slate-900 border-red-300 dark:border-red-800/80 shadow-md shadow-red-500/5 ring-1 ring-red-500/20'
                  : countdown.isWarning
                    ? 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/5 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-slate-900 border-amber-300 dark:border-amber-800/80 shadow-sm'
                    : 'bg-gradient-to-br from-primary-500/10 via-indigo-500/5 to-slate-50 dark:from-primary-950/40 dark:via-indigo-950/30 dark:to-slate-900/60 border-primary-200 dark:border-primary-800/70 shadow-sm'
              }`}>
                {/* Header Row: Label & Urgency badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      countdown.isUrgent
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                        : countdown.isWarning
                          ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                          : 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
                    }`}>
                      <Clock className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Voting Countdown
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                        Ballot officially closes when timer reaches zero
                      </p>
                    </div>
                  </div>

                  {/* Urgency Badge */}
                  <div>
                    {countdown.isUrgent ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Ending Very Soon!
                      </span>
                    ) : countdown.isWarning ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Final 24 Hours
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active Ballot
                      </span>
                    )}
                  </div>
                </div>

                {/* Digital segmented Countdown Timer Cards */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3 my-2 text-center">
                  {/* Days */}
                  <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl p-2 sm:p-3 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <span className="block font-mono text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                      {String(countdown.days).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Days
                    </span>
                  </div>

                  {/* Hours */}
                  <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl p-2 sm:p-3 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <span className="block font-mono text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                      {String(countdown.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Hours
                    </span>
                  </div>

                  {/* Minutes */}
                  <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl p-2 sm:p-3 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                    <span className="block font-mono text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                      {String(countdown.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Minutes
                    </span>
                  </div>

                  {/* Seconds */}
                  <div className={`rounded-xl p-2 sm:p-3 border shadow-xs transition-colors ${
                    countdown.isUrgent
                      ? 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800'
                      : 'bg-white/90 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80'
                  }`}>
                    <span className={`block font-mono text-xl sm:text-3xl font-extrabold tabular-nums tracking-tight ${
                      countdown.isUrgent ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-primary-600 dark:text-primary-400'
                    }`}>
                      {String(countdown.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      Seconds
                    </span>
                  </div>
                </div>

                {/* Progress bar and exact deadline footer */}
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Deadline: <strong className="text-slate-700 dark:text-slate-200">{
                        new Date(poll.expiresAt).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })
                      }</strong>
                    </span>
                  </div>

                  {countdown.elapsedPercent > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-primary-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${countdown.elapsedPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {Math.round(100 - countdown.elapsedPercent)}% left
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Expired Notice Banner */}
            {isExpired && (
              <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-slate-100 via-amber-50/50 to-slate-100 dark:from-slate-800 dark:via-amber-950/20 dark:to-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl flex items-start sm:items-center gap-3.5 border border-slate-200/80 dark:border-slate-700">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                  <Hourglass className="w-5 h-5" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      Poll Officially Closed
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                      Voting Concluded
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {poll.expiresAt 
                      ? `Voting concluded on ${new Date(poll.expiresAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}. Final community results are presented below.`
                      : 'Voting is no longer active. Final verified community results are presented below.'}
                  </p>
                </div>
              </div>
            )}

            {poll.allowMultipleVotes && !hasVoted && !isExpired && (
              <div className="mb-4 p-3 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded-xl flex items-center gap-2 border border-indigo-200/60 dark:border-indigo-800/40 text-xs">
                <Radio className="w-4 h-4 text-indigo-500" />
                <span><strong>Multiple selections allowed:</strong> Pick all options that apply, then hit Submit Vote.</span>
              </div>
            )}

            {/* Ballot Options List */}
            <div className="space-y-3">
              {poll.options.map((option, index) => {
                const isSelected = Array.isArray(userVote) ? userVote.includes(option.id) : userVote === option.id;
                const isPendingSelection = poll.allowMultipleVotes && selectedOptions.includes(option.id);
                const isActiveSelection = isSelected || isPendingSelection;
                const isLeader = leadingOption && leadingOption.id === option.id && totalVotes > 0;
                
                const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleVoteClick(option.id)}
                    disabled={hasVoted || isExpired}
                    className={`relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 overflow-hidden group ${
                      isActiveSelection 
                        ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/20 shadow-sm' 
                        : (hasVoted || isExpired)
                            ? 'border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40' 
                            : 'border-slate-200/80 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md bg-white dark:bg-slate-800/90 cursor-pointer active:scale-[0.995]'
                    }`}
                  >
                    {/* Animated Progress Bar (when results are visible) */}
                    {showResults && (
                      <motion.div 
                        className={`absolute left-0 top-0 bottom-0 ${
                          isLeader 
                            ? 'bg-primary-100/90 dark:bg-primary-950/60' 
                            : 'bg-slate-100 dark:bg-slate-800/80'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
                      />
                    )}
                    
                    <div className="relative flex justify-between items-center z-10 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Option Letter Tag / Checkbox Indicator */}
                        <div className={`w-7 h-7 flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                          poll.allowMultipleVotes ? 'rounded-lg' : 'rounded-full'
                        } ${
                          isActiveSelection 
                            ? 'bg-primary-600 text-white shadow-sm' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {isActiveSelection ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </div>

                        <div className="min-w-0">
                          <span className={`font-semibold text-sm sm:text-base leading-snug block truncate ${
                            isActiveSelection 
                              ? 'text-primary-700 dark:text-primary-300' 
                              : 'text-slate-800 dark:text-slate-100'
                          }`}>
                            {option.text}
                          </span>
                          {showResults && isSelected && (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                              ✓ Your vote
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Percent and Counts */}
                      {showResults && (
                        <div className="text-right shrink-0 flex items-center gap-2">
                          {isLeader && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                              <Crown className="w-3 h-3 text-amber-500" />
                              Leader
                            </span>
                          )}
                          <div>
                            <span className="block font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                              {percentage}%
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Multiple Choice Submit Button */}
            {poll.allowMultipleVotes && !hasVoted && !isExpired && selectedOptions.length > 0 && (
              <div className="mt-5">
                <button
                  onClick={() => submitVotes(selectedOptions)}
                  className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 hover:shadow-glow transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Your Votes ({selectedOptions.length} Selected)</span>
                </button>
              </div>
            )}

            {/* Post-Vote Confirmation Badge */}
            {hasVoted && (
              <div className="mt-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-center justify-center gap-2 border border-emerald-200/70 dark:border-emerald-800/40 text-xs sm:text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {isResultsHidden 
                    ? "Your ballot is recorded. Results will unlock when the poll officially closes." 
                    : "Your ballot is recorded in real-time. Thank you for voting!"}
                </span>
              </div>
            )}
            
            {/* Meta Footer */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 dark:text-slate-500 gap-2">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {totalVotes} total {totalVotes === 1 ? 'ballot' : 'ballots'}
                </span>
                {poll.expiresAt && !isExpired && (
                  <span>• Closes {new Date(poll.expiresAt).toLocaleDateString()}</span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                Created {new Date(poll.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Analytics & Visualization (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-7 flex flex-col transition-colors">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Live Analytics
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time vote breakdown</p>
              </div>

              {/* Chart Mode Toggle */}
              {totalVotes > 0 && !isResultsHidden && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setChartView('bar')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                      chartView === 'bar' 
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="Horizontal bar chart"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setChartView('donut')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                      chartView === 'donut' 
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="Donut distribution"
                  >
                    <PieIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {isResultsHidden ? (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Lock className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Blind Voting Enabled</p>
                <p className="text-xs text-center text-slate-400 mt-1 max-w-xs">
                  The creator configured results to remain secret until the poll closes.
                </p>
              </div>
            ) : totalVotes === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Votes Cast Yet</p>
                <p className="text-xs text-center text-slate-400 mt-1">Be the first to vote to populate the live charts!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Leading Spotlight Metric */}
                {leadingOption && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-950/40 dark:to-indigo-950/20 border border-primary-200/60 dark:border-primary-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-primary-700 dark:text-primary-300 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-500" /> Leading Choice
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate max-w-[200px]">
                        {leadingOption.text}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-primary-600 dark:text-primary-400">
                        {Math.round((leadingOption.votes / totalVotes) * 100)}%
                      </span>
                      <span className="text-[10px] text-slate-500 block -mt-1">of total votes</span>
                    </div>
                  </div>
                )}

                {/* Primary Chart Area */}
                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartView === 'bar' ? (
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={95} 
                          tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)', radius: 8 }} />
                        <Bar dataKey="votes" shape={<CustomBar />} barSize={26} isAnimationActive={false}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="votes"
                          isAnimationActive={false}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Poll Timeline & Schedule Widget */}
          {poll.expiresAt && (
            <div className="bg-white dark:bg-slate-900/90 rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 transition-colors space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    isExpired 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' 
                      : 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400'
                  }`}>
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Poll Timeline
                    </h3>
                    <p className="text-[11px] text-slate-400">Duration & schedule</p>
                  </div>
                </div>

                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isExpired
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    : countdown?.isUrgent
                      ? 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 animate-pulse'
                      : countdown?.isWarning
                        ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                        : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                }`}>
                  {isExpired ? 'Concluded' : countdown?.isUrgent ? 'Closing Soon' : 'Active'}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Created
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(poll.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Closing Date
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(poll.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Hourglass className="w-3.5 h-3.5 text-slate-400" />
                    Time Remaining
                  </span>
                  <span className={`font-mono font-bold ${
                    isExpired 
                      ? 'text-slate-400' 
                      : countdown?.isUrgent 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-primary-600 dark:text-primary-400'
                  }`}>
                    {isExpired 
                      ? 'Expired' 
                      : `${countdown?.days ? `${countdown.days}d ` : ''}${countdown?.hours}h ${countdown?.minutes}m ${countdown?.seconds}s`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Discussion Section */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">
                Community Discussion
              </h3>
              <span className="text-xs text-slate-400">
                {poll.comments ? poll.comments.length : 0} {poll.comments?.length === 1 ? 'comment' : 'comments'}
              </span>
            </div>
          </div>
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 dark:text-white sm:w-48 shadow-sm"
            />
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Share your opinion or why you voted..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 dark:text-white shadow-sm"
                required
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-40 transition-colors"
                aria-label="Send comment"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>

        {/* Comment Stream */}
        <div className="space-y-3">
          <AnimatePresence>
            {poll.comments && poll.comments.length > 0 ? (
              poll.comments.map((comment) => {
                const initials = comment.author ? comment.author.substring(0, 2).toUpperCase() : 'AN';
                return (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/80"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-bold text-xs flex items-center justify-center">
                          {initials}
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{comment.author}</span>
                        {comment.isTopContributor && (
                          <span title="Top Contributor" className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                            <BadgeCheck className="w-3 h-3" />
                            Top Voter
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm pl-9 leading-relaxed">
                      {comment.text}
                    </p>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No discussion comments yet. Be the first to share your perspective!
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Share / Embed Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-slate-200 dark:border-slate-800"
            >
              <button 
                onClick={() => setShowQRModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-6">
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">
                  Share & Embed Poll
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Invite participants via mobile QR code or embed on external sites.
                </p>
              </div>

              <div className="space-y-6">
                {/* QR Code Section */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                    <QRCodeSVG value={`${window.location.origin}/poll/${poll.id}`} size={120} />
                  </div>
                  <div className="space-y-2 text-center sm:text-left">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center sm:justify-start gap-1.5">
                      <QrCode className="w-4 h-4 text-primary-500" />
                      Mobile Quick Scan
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Scan with any smartphone camera to open and vote immediately.
                    </p>
                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                    >
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied Link!' : 'Copy Direct Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Embed Code Snippet */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-primary-500" />
                      HTML Embed Iframe
                    </span>
                    <button
                      onClick={handleCopyEmbed}
                      className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1"
                    >
                      {embedCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{embedCopied ? 'Copied!' : 'Copy Snippet'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
                    {`<iframe src="${window.location.origin}/poll/${poll.id}" width="100%" height="600" frameborder="0"></iframe>`}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-1.5">
                Delete this poll?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                This will permanently delete "{poll.question}" and all associated votes and comments. This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
                >
                  Delete Poll
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PollView;