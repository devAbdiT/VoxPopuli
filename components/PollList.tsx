import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Link } from 'react-router-dom';
import { Poll, PollCategory } from '../types';
import { BarChart2, Clock, Users, ChevronRight, Search, SearchX, ClipboardList } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('Newest');

  const categories = ['All', ...Object.values(PollCategory)];
  const sortOptions = ['Newest', 'Trending', 'Closing Soon'];

  const filteredPolls = polls.filter(p => {
    if (p.isPrivate) return false;
    const matchesCategory = filter === 'All' || p.category === filter;
    const matchesSearch = p.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedPolls = [...filteredPolls].sort((a, b) => {
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
    // Default: Newest
    return b.createdAt - a.createdAt;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h2 className="text-3xl font-display font-bold text-gray-800 dark:text-white transition-colors duration-200">Active Polls</h2>
        
        <div className="flex flex-col sm:flex-row items-center w-full lg:w-auto gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search polls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white transition-colors"
            />
          </div>
          
          <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
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
          
          <div className="w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white transition-colors"
            >
              {sortOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {sortedPolls.length === 0 ? (
        searchQuery.length > 0 ? (
          <div className="text-center py-20 bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors duration-200 backdrop-blur-sm shadow-sm">
            <div className="bg-gray-100 dark:bg-gray-700/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <SearchX className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-2">No polls found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              We couldn't find any polls matching "{searchQuery}". Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="text-center py-24 bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors duration-200 backdrop-blur-sm shadow-sm">
            <div className="bg-primary/10 dark:bg-primary/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 rounded-full animate-ping opacity-75"></div>
              <ClipboardList className="w-12 h-12 text-primary relative z-10" />
            </div>
            <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3">No active polls yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 text-lg">
              {filter !== 'All' 
                ? `There are currently no active polls in the ${filter} category. Check back later or start your own!`
                : "It's quiet here. Be the first to spark a conversation by creating a new poll for the community."}
            </p>
            <Link 
              to="/create" 
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
            >
              <BarChart2 className="w-5 h-5 mr-2" />
              Create Your First Poll
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
            return (
            <motion.div key={poll.id} variants={itemVariants} className="h-full">
              <Link 
                to={`/poll/${poll.id}`}
                className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700/50 hover:border-primary/50 dark:hover:border-primary/50 flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                    {poll.category || 'General'}
                  </span>
                  {isExpired && (
                    <span className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                      Closed
                    </span>
                  )}
                </div>
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
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default PollList;