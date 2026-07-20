import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Link } from 'react-router-dom';
import { Poll, PollCategory } from '../types';
import { BarChart2, Clock, Users, ChevronRight } from 'lucide-react';

const PollList: React.FC = () => {
  const polls = useSelector((state: RootState) => state.polls);
  const userVotes = useSelector((state: RootState) => state.userVotes);
  const [filter, setFilter] = useState<string>('All');

  const categories = ['All', ...Object.values(PollCategory)];

  const filteredPolls = filter === 'All' 
    ? polls 
    : polls.filter(p => p.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Active Polls</h2>
        
        <div className="flex space-x-2 overflow-x-auto pb-2 w-full sm:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === cat 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredPolls.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No polls found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolls.map((poll) => (
            <Link 
              key={poll.id} 
              to={`/poll/${poll.id}`}
              className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full uppercase tracking-wider">
                  {poll.category || 'General'}
                </span>
                {userVotes[poll.id] && (
                  <span className="flex items-center text-green-600 text-xs font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                    Voted
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {poll.question}
              </h3>
              
              <p className="text-gray-500 text-sm mb-6 flex-grow line-clamp-2">
                {poll.description || "No description provided."}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-400">
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
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PollList;