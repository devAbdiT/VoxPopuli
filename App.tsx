import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PollList from './components/PollList';
import CreatePoll from './components/CreatePoll';
import PollView from './components/PollView';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from './ThemeContext';
import { PlusCircle, Activity } from 'lucide-react';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-gray-50 to-white dark:from-indigo-900/20 dark:via-gray-900 dark:to-gray-900 transition-colors duration-500">
          {/* Navigation */}
          <nav className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50 transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Link to="/" className="flex items-center group">
                    <div className="bg-primary text-white p-2 rounded-lg mr-3 group-hover:rotate-3 transition-transform">
                       <Activity className="w-6 h-6" />
                    </div>
                    <span className="font-display font-bold text-2xl text-gray-900 dark:text-white tracking-tight">Vox<span className="text-primary">Populi</span></span>
                  </Link>
                </div>
                <div className="flex items-center">
                  <ThemeToggle />
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
          <main className="flex-grow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<PollList />} />
              <Route path="/create" element={<CreatePoll />} />
              <Route path="/poll/:id" element={<PollView />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 border-t border-gray-200/50 dark:border-gray-700/50 mt-auto transition-colors duration-500">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-400 dark:text-gray-500">
              &copy; 2024 Live Polling. Powered by React, Redux & Gemini.
            </p>
          </div>
        </footer>
      </div>
    </Router>
    </ThemeProvider>
  );
};

export default App;