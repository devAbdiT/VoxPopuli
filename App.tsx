import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import PollList from './components/PollList';
import CreatePoll from './components/CreatePoll';
import PollView from './components/PollView';
import UserProfile from './components/UserProfile';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from './ThemeContext';
import { Plus, Radio, User } from 'lucide-react';

const Navigation: React.FC = () => {
  const location = useLocation();
  const isCreatePage = location.pathname === '/create';
  const isProfilePage = location.pathname === '/profile';
  const userVotes = useSelector((state: RootState) => state.userVotes);
  const votedCount = Object.keys(userVotes).length;

  return (
    <nav className="backdrop-blur-xl bg-white/80 dark:bg-[#0f172a]/80 border-b border-slate-200/70 dark:border-slate-800/80 sticky top-0 z-50 transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white shadow-md shadow-primary-500/25 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary-500/30 transition-all duration-300">
                <Radio className="w-5 h-5 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">
                    Pulse
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 tracking-wider">
                    LIVE
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden md:block -mt-1 font-medium">
                  Real-time interactive polling
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Profile / Recently Voted Activity Nav Link */}
            <Link
              to="/profile"
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 border cursor-pointer ${
                isProfilePage
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                  : 'bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="View your voter profile and recently voted polls"
            >
              <User className={`w-4 h-4 ${isProfilePage ? 'text-white dark:text-slate-900' : 'text-primary-500'}`} />
              <span className="hidden sm:inline">Profile</span>
              {votedCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                  isProfilePage
                    ? 'bg-white/20 dark:bg-slate-900/20 text-current'
                    : 'bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300'
                }`}>
                  {votedCount}
                </span>
              )}
            </Link>

            <ThemeToggle />

            {!isCreatePage && (
              <Link 
                to="/create" 
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 shadow-sm hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Poll</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a0e17] text-slate-900 dark:text-slate-100 transition-colors duration-300 relative selection:bg-primary-500/20">
          {/* Subtle Ambient Glow Effect */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-primary-500/10 via-indigo-500/5 to-transparent blur-3xl dark:from-primary-600/15 dark:via-indigo-600/10 opacity-70"></div>
          </div>

          {/* Navigation Bar */}
          <Navigation />

          {/* Main Content View */}
          <main className="flex-grow relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
              <Routes>
                <Route path="/" element={<PollList />} />
                <Route path="/create" element={<CreatePoll />} />
                <Route path="/poll/:id" element={<PollView />} />
                <Route path="/profile" element={<UserProfile />} />
              </Routes>
            </div>
          </main>

          {/* Polished Footer */}
          <footer className="relative z-10 backdrop-blur-md bg-white/70 dark:bg-[#0f172a]/70 border-t border-slate-200/70 dark:border-slate-800/80 mt-auto transition-colors duration-300">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Socket.io Real-Time Synchronization Active</span>
              </div>
              <p className="text-center sm:text-right">
                &copy; 2026 Pulse. Powered by React & Redux.
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;