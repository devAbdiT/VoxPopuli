import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, votePoll, deletePoll } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ArrowLeft, CheckCircle, Trash2, Share2, Info } from 'lucide-react';
import { motion } from 'motion/react';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
      transition={{ duration: 0.8, ease: "easeOut" }}
      rx={4}
    />
  );
};

const PollView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const poll = useSelector((state: RootState) => state.polls.find(p => p.id === id));
  const userVote = useSelector((state: RootState) => state.userVotes[id || '']);

  if (!poll) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-200">Poll not found</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-primary underline">Go Home</button>
      </div>
    );
  }

  const handleVote = (optionId: string) => {
    if (userVote) return;
    dispatch(votePoll({ pollId: poll.id, optionId }));
  };
  
  const handleDelete = () => {
      if(confirm('Are you sure you want to delete this poll?')) {
          dispatch(deletePoll(poll.id));
          navigate('/');
      }
  }

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
               <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-3 inline-block shadow-sm">
                  {poll.category || 'General'}
                </span>
                <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white leading-tight mb-3 transition-colors duration-200">
                  {poll.question}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed transition-colors duration-200">
                  {poll.description}
                </p>
            </div>

            <div className="space-y-3">
              {poll.options.map((option) => {
                const isSelected = userVote === option.id;
                const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleVote(option.id)}
                    disabled={!!userVote}
                    className={`relative w-full text-left p-4 rounded-xl border-2 transition-all overflow-hidden group ${
                      isSelected 
                        ? 'border-primary bg-indigo-50 dark:bg-indigo-900/20' 
                        : userVote 
                            ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60' 
                            : 'border-gray-100 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:shadow-md bg-white dark:bg-gray-800'
                    }`}
                  >
                    {/* Progress Bar Background (only if voted) */}
                    {userVote && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-indigo-100 dark:bg-indigo-900/40 transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%`, opacity: 0.5 }}
                      />
                    )}
                    
                    <div className="relative flex justify-between items-center z-10">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-4 transition-colors ${
                          isSelected ? 'border-primary bg-primary text-white' : 'border-gray-300 dark:border-gray-600 text-transparent'
                        }`}>
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <span className={`font-medium text-lg ${isSelected ? 'text-primary dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {option.text}
                        </span>
                      </div>
                      
                      {userVote && (
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

            {userVote && (
               <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg flex items-center justify-center animate-fade-in transition-colors duration-200">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>Thanks for voting! Results are updated in real-time.</span>
               </div>
            )}
            
            <div className="mt-6 flex items-center justify-between text-sm text-gray-400 dark:text-gray-500 pt-6 border-t border-gray-100 dark:border-gray-700 transition-colors duration-200">
               <span>Total votes: {totalVotes}</span>
               <button className="flex items-center hover:text-primary transition-colors">
                  <Share2 className="w-4 h-4 mr-1" />
                  Share Poll
               </button>
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
                     <Bar dataKey="votes" shape={<CustomBar />} barSize={32}>
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
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
    </div>
  );
};

export default PollView;