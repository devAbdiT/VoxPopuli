import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Link } from 'react-router-dom';
import { Poll, PollCategory } from '../types';
import { BarChart2, Clock, Users, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const PollList: React.FC = () => {
  const polls = useSelector((state: RootState) => state.polls);
  const userVotes = useSelector((state: RootState) => state.userVotes);
  const loading = useSelector((state: RootState) => state.loading);
  const [filter, setFilter] = useState<string>('All');

  const categories = ['All', ...Object.values(PollCategory)];

  const filteredPolls = filter === 'All' 
    ? polls 
    : polls.filter(p => p.category === filter);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-display font-bold text-gray-800 dark:text-white transition-colors duration-200">Active Polls</h2>
        
        <div className="flex space-x-2 overflow-x-auto pb-2 w-full sm:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === cat 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredPolls.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 transition-colors duration-200">
          <BarChart2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No polls found in this category.</p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredPolls.map((poll) => (
            <motion.div key={poll.id} variants={itemVariants} className="h-full">
              <Link 
                to={`/poll/${poll.id}`}
                className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700/50 hover:border-primary/50 dark:hover:border-primary/50 flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                  {poll.category || 'General'}
                </span>
                {userVotes[poll.id] && (
                  <span className="flex items-center text-green-600 dark:text-green-400 text-xs font-medium">
                    <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mr-1.5"></span>
                    Voted
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-2">
                {poll.question}
              </h3>
              
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 flex-grow line-clamp-2">
                {poll.description || "No description provided."}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-400 dark:text-gray-500 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1.5" />
                        <span>{poll.totalVotes} votes</span>
                    </div>
                    <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1.5" />
                        <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-primary dark:group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default PollList;