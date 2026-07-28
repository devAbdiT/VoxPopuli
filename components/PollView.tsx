import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, votePollEvent, deletePollEvent, addCommentEvent } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ArrowLeft, CheckCircle, Trash2, Share2, Info, Copy, MessageSquare, Send, BadgeCheck, Lock, QrCode, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { v4 as uuidv4 } from 'uuid';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  
  return (
    <rect
      x={x}
      y={y}
      height={height}
      fill={fill}
      width={width > 0 ? width : 0}
      rx={4}
      style={{ transition: 'all 0.5s ease-in-out' }}
    />
  );
};

const PollView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const poll = useSelector((state: RootState) => state.polls.find(p => p.id === id));
  const userVote = useSelector((state: RootState) => state.userVotes[id || '']);
  const allUserVotes = useSelector((state: RootState) => state.userVotes);
  const loading = useSelector((state: RootState) => state.loading);
  const [copied, setCopied] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-200">Poll not found</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-primary underline">Go Home</button>
      </div>
    );
  }

  const isExpired = poll.expiresAt ? Date.now() > poll.expiresAt : false;
  const hasVoted = Array.isArray(userVote) ? userVote.length > 0 : !!userVote;

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
      colors: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    });

    votePollEvent(poll.id, optionIds);
  };
  
  const handleDelete = () => {
      if(confirm('Are you sure you want to delete this poll?')) {
          deletePollEvent(poll.id);
          navigate('/');
      }
  }

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !poll) return;

    const isTopContributor = Object.keys(allUserVotes).length > 1;

    const newComment = {
      id: uuidv4(),
      text: commentText.trim(),
      author: authorName.trim() || 'Anonymous',
      createdAt: Date.now(),
      isTopContributor,
    };

    addCommentEvent(poll.id, newComment);
    setCommentText('');
  };

  const chartData = useMemo(() => {
    return poll.options.map(opt => ({
      name: opt.text.length > 15 ? opt.text.substring(0, 15) + '...' : opt.text,
      fullName: opt.text,
      votes: opt.votes
    }));
  }, [poll]);

  const totalVotes = poll.totalVotes;

  // Custom Tooltip for Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 shadow-xl rounded-lg text-sm transition-colors duration-200">
          <p className="font-semibold text-gray-900 dark:text-white">{payload[0].payload.fullName}</p>
          <p className="text-primary font-medium">{payload[0].value} votes</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        <div className="flex space-x-2">
            <button onClick={handleDelete} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors" title="Delete Poll">
                <Trash2 className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Voting Area */}
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 transition-colors duration-200">
            <div className="mb-6">
               <div className="flex items-center gap-2 mb-3 flex-wrap">
                 <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-full uppercase tracking-wider shadow-sm">
                    {poll.category || 'General'}
                  </span>
                  {poll.isPrivate && (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-full uppercase tracking-wider shadow-sm flex items-center">
                      <Lock className="w-3 h-3 mr-1" />
                      Unlisted
                    </span>
                  )}
               </div>
                <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white leading-tight mb-3 transition-colors duration-200">
                  {poll.question}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed transition-colors duration-200">
                  {poll.description}
                </p>
            </div>

              {isExpired && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-lg flex items-center shadow-sm border border-yellow-200 dark:border-yellow-700/50">
                  <Info className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Poll Closed</h4>
                    <p className="text-xs mt-0.5 opacity-90">This poll has ended. You can still view the results and comments.</p>
                  </div>
                </div>
              )}

            <div className="space-y-3">
              {poll.options.map((option) => {
                const isSelected = Array.isArray(userVote) ? userVote.includes(option.id) : userVote === option.id;
                const isPendingSelection = poll.allowMultipleVotes && selectedOptions.includes(option.id);
                const isActiveSelection = isSelected || isPendingSelection;
                
                const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleVoteClick(option.id)}
                    disabled={hasVoted || isExpired}
                    className={`relative w-full text-left p-4 rounded-xl border-2 transition-all overflow-hidden group ${
                      isActiveSelection 
                        ? 'border-primary bg-indigo-50 dark:bg-indigo-900/20' 
                        : (hasVoted || isExpired)
                            ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60' 
                            : 'border-gray-100 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:shadow-md bg-white dark:bg-gray-800'
                    }`}
                  >
                    {/* Progress Bar Background (only if voted or expired) */}
                    {(hasVoted || isExpired) && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-indigo-100 dark:bg-indigo-900/40 transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%`, opacity: 0.5 }}
                      />
                    )}
                    
                    <div className="relative flex justify-between items-center z-10">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 border flex items-center justify-center mr-4 transition-colors ${poll.allowMultipleVotes ? 'rounded' : 'rounded-full'} ${
                          isActiveSelection ? 'border-primary bg-primary text-white' : 'border-gray-300 dark:border-gray-600 text-transparent'
                        }`}>
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <span className={`font-medium text-lg ${isActiveSelection ? 'text-primary dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {option.text}
                        </span>
                      </div>
                      
                      {(hasVoted || isExpired) && (
                        <div className="text-right">
                          <span className="block font-bold text-gray-900 dark:text-white">{percentage}%</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{option.votes} votes</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {poll.allowMultipleVotes && !hasVoted && !isExpired && selectedOptions.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => submitVotes(selectedOptions)}
                  className="w-full py-3 bg-primary hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Submit Vote
                </button>
              </div>
            )}

            {hasVoted && (
               <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg flex items-center justify-center animate-fade-in transition-colors duration-200">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>Thanks for voting! Results are updated in real-time.</span>
               </div>
            )}
            
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-400 dark:text-gray-500 pt-6 border-t border-gray-100 dark:border-gray-700 transition-colors duration-200">
               <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 sm:mb-0">
                 <span>Total votes: {totalVotes}</span>
                 {poll.expiresAt && !isExpired && (
                   <>
                     <span className="hidden sm:inline">&bull;</span>
                     <span>Closes on {new Date(poll.expiresAt).toLocaleDateString()} at {new Date(poll.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </>
                 )}
               </div>
               <div className="flex flex-wrap items-center gap-4">
                 <button 
                   onClick={() => setShowQRModal(true)}
                   className="flex items-center hover:text-primary transition-colors"
                 >
                    <QrCode className="w-4 h-4 mr-1" />
                    Share QR
                 </button>
                 <button 
                   onClick={handleShare}
                   className="flex items-center hover:text-primary transition-colors"
                 >
                    {copied ? <CheckCircle className="w-4 h-4 mr-1 text-green-500" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied ? <span className="text-green-500">Copied!</span> : 'Copy Link'}
                 </button>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visualization */}
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 h-full flex flex-col transition-colors duration-200">
            <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-6 flex items-center transition-colors duration-200">
               Live Results
               {totalVotes === 0 && <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">(No votes yet)</span>}
            </h3>
            
            <div className="flex-grow min-h-[300px]">
               {totalVotes > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart
                     data={chartData}
                     layout="vertical"
                     margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                   >
                     <XAxis type="number" hide />
                     <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100} 
                        tick={{fill: '#6b7280', fontSize: 12}}
                        axisLine={false}
                        tickLine={false}
                     />
                     <Tooltip content={<CustomTooltip />} cursor={{fill: '#f3f4f6', radius: 8}} />
                     <Bar dataKey="votes" shape={<CustomBar />} barSize={32} isAnimationActive={false}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               ) : (
                   <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                       <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center mb-4 transition-colors duration-200">
                           <BarChart className="w-10 h-10 text-gray-300 dark:text-gray-500" />
                       </div>
                       <p>Waiting for the first vote...</p>
                   </div>
               )}
            </div>

             {/* Secondary Viz: Pie Chart (Small) */}
             {totalVotes > 0 && (
                 <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700 transition-colors duration-200">
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Distribution</h4>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="votes"
                                    isAnimationActive={false}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell 
                                          key={`cell-${index}`} 
                                          fill={COLORS[index % COLORS.length]} 
                                          style={{ transition: 'all 0.5s ease-in-out' }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
             )}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 transition-colors duration-200">
        <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <MessageSquare className="w-6 h-6 mr-3 text-primary" />
          Discussion
        </h3>

        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white sm:w-48"
            />
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Share your thoughts..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full pl-4 pr-12 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white"
                required
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-white bg-primary rounded-md disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-4">
          <AnimatePresence>
            {poll.comments && poll.comments.length > 0 ? (
              poll.comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{comment.author}</span>
                      {comment.isTopContributor && (
                        <span title="Top Contributor" className="flex items-center text-primary/80 dark:text-primary">
                          <BadgeCheck className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{comment.text}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">No comments yet. Be the first to share your thoughts!</p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center border border-gray-100 dark:border-gray-700"
            >
              <button 
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-primary rounded-full flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Scan to Vote</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
                Point your camera at this QR code to open the poll on your device.
              </p>
              
              <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100 flex items-center justify-center">
                <QRCodeSVG value={`${window.location.origin}/poll/${poll.id}`} size={200} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PollView;