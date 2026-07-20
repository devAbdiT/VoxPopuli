import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PollList from './components/PollList';
import CreatePoll from './components/CreatePoll';
import PollView from './components/PollView';
import { PlusCircle, Activity } from 'lucide-react';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center group">
                  <div className="bg-primary text-white p-2 rounded-lg mr-3 group-hover:rotate-3 transition-transform">
                     <Activity className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-xl text-gray-900 tracking-tight">Vox<span className="text-primary">Populi</span></span>
                </Link>
              </div>
              <div className="flex items-center">
                <Link 
                  to="/create" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  New Poll
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<PollList />} />
              <Route path="/create" element={<CreatePoll />} />
              <Route path="/poll/:id" element={<PollView />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-400">
              &copy; 2024 VoxPopuli. Powered by React, Redux & Gemini.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;