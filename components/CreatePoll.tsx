import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createPollEvent } from '../store';
import { generatePollContent } from '../services/geminiService';
import { PollCategory } from '../types';
import { Sparkles, Plus, Trash2, Loader2, Save, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // We will use a simple random string generator instead of uuid package to save imports if needed, but standard library usage implies best effort. I'll use Math.random for simplicity in this constrained env.

const generateId = () => Math.random().toString(36).substring(2, 9);

const CreatePoll: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(PollCategory.TECH);
  const [options, setOptions] = useState<string[]>(['', '']);
  const [expiry, setExpiry] = useState<string>('never');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState<boolean>(false);
  const [hideResultsUntilClosed, setHideResultsUntilClosed] = useState<boolean>(false);
  const [accentColor, setAccentColor] = useState<string>('#4f46e5'); // Default primary (indigo-600)
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleGenerateAI = async () => {
    if (!topic.trim()) {
      setErrors({ topic: 'Please enter a topic first' });
      return;
    }
    setIsGenerating(true);
    setErrors({});
    
    try {
      const data = await generatePollContent(topic);
      setQuestion(data.question);
      setDescription(data.description);
      setOptions(data.options);
    } catch (error) {
      setErrors({ ai: 'Failed to generate content. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!question.trim()) newErrors.question = 'Question is required';
    if (options.some(o => !o.trim())) newErrors.options = 'All options must be filled';
    if (options.length < 2) newErrors.options = 'At least 2 options are required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let expiresAt: number | undefined;
    if (expiry !== 'never') {
      const now = Date.now();
      if (expiry === '1h') expiresAt = now + 60 * 60 * 1000;
      else if (expiry === '24h') expiresAt = now + 24 * 60 * 60 * 1000;
      else if (expiry === '7d') expiresAt = now + 7 * 24 * 60 * 60 * 1000;
    }

    const newPoll = {
      id: generateId(),
      question,
      description,
      category,
      createdAt: Date.now(),
      totalVotes: 0,
      expiresAt,
      isPrivate,
      allowMultipleVotes,
      hideResultsUntilClosed,
      theme: {
        accentColor: accentColor !== '#4f46e5' ? accentColor : undefined,
        backgroundImage: backgroundImage.trim() !== '' ? backgroundImage.trim() : undefined,
      },
      options: options.map(text => ({
        id: generateId(),
        text,
        votes: 0
      }))
    };

    createPollEvent(newPoll);
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 transition-colors duration-200">
        <div className="mb-8 border-b border-gray-100 dark:border-gray-700/50 pb-6">
          <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">Create New Poll</h2>
          <p className="text-gray-500 dark:text-gray-400">Design your poll manually or use AI to spark ideas.</p>
        </div>

        {/* AI Section */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 mb-8 border border-indigo-100 dark:border-indigo-800/30 transition-colors duration-200">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
              <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                Generate with AI
              </label>
              <div className="relative">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Future of Remote Work"
                    className="w-full pl-4 pr-4 py-3 bg-white dark:bg-gray-700 border border-indigo-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white dark:placeholder-gray-400 transition-all"
                />
                <Sparkles className="absolute right-3 top-3.5 w-5 h-5 text-indigo-400" />
              </div>
              {errors.topic && <p className="text-red-500 text-xs mt-1">{errors.topic}</p>}
              {errors.ai && <p className="text-red-500 text-xs mt-1">{errors.ai}</p>}
            </div>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center justify-center transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Poll Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              className={`w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border ${errors.question ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 dark:border-gray-600 focus:ring-primary/20'} focus:border-primary dark:focus:border-primary focus:outline-none transition-all`}
            />
            {errors.question && <p className="text-red-500 text-xs mt-1">{errors.question}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add some context..."
              rows={3}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
              >
                  {Object.values(PollCategory).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                  ))}
              </select>
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Poll Duration
              </label>
              <select
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
              >
                  <option value="never">Never expires</option>
                  <option value="1h">1 Hour</option>
                  <option value="24h">24 Hours</option>
                  <option value="7d">7 Days</option>
              </select>
            </div>
          </div>

          {/* Privacy & Multiple Choice Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Unlisted Poll</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Only people with the link can vote.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Multiple Choice</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Allow voters to select multiple options.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={allowMultipleVotes}
                  onChange={(e) => setAllowMultipleVotes(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Hidden Results</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Hide results until poll closes.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={hideResultsUntilClosed}
                  onChange={(e) => setHideResultsUntilClosed(e.target.checked)}
                  disabled={expiry === 'never'}
                />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary ${expiry === 'never' ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
              </label>
            </div>
          </div>

          {/* Custom Theme */}
          <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Custom Theming</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded border-0 cursor-pointer bg-transparent p-0"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 uppercase font-mono">{accentColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Background Image URL</label>
                <input
                  type="text"
                  value={backgroundImage}
                  onChange={(e) => setBackgroundImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Options <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-grow px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-3 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.options && <p className="text-red-500 text-xs mt-1">{errors.options}</p>}
            
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-3 text-sm font-medium text-primary hover:text-indigo-700 flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Option
            </button>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="w-full py-4 bg-primary hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform transition-all active:scale-[0.98] flex items-center justify-center"
            >
              <Save className="w-5 h-5 mr-2" />
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePoll;