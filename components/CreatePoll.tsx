import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createPollEvent } from '../store';
import { generatePollContent } from '../services/geminiService';
import { PollCategory } from '../types';
import { getCategoryMeta } from './PollList';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  ArrowLeft, 
  Eye, 
  Settings2, 
  Palette, 
  HelpCircle,
  Clock,
  Layers,
  CheckCircle2,
  Lock,
  ListFilter,
  Tag,
  Tags,
  X
} from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 9);

const PRESET_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Sky', value: '#0ea5e9' },
];

const SUGGESTED_TOPICS = [
  'Web Frameworks in 2026',
  'Remote vs Hybrid Work',
  'Coffee vs Matcha',
  'AI Productivity Tools'
];

const CATEGORY_SUGGESTED_TAGS: Record<string, string[]> = {
  [PollCategory.TECH]: ['Frontend', 'AI', 'JavaScript', 'Cloud', 'OpenSource', 'Mobile'],
  [PollCategory.POLITICS]: ['Elections', 'Policy', 'Democracy', 'GlobalAffairs', 'Debate'],
  [PollCategory.LIFESTYLE]: ['WorkLife', 'MorningRoutine', 'Wellness', 'Habits', 'Coffee'],
  [PollCategory.FOOD]: ['Dining', 'Cooking', 'Pizza', 'CoffeeVsTea', 'StreetFood'],
  [PollCategory.ENTERTAINMENT]: ['Movies', 'Gaming', 'Streaming', 'Music', 'Series'],
  [PollCategory.SPORTS]: ['Football', 'Basketball', 'Fitness', 'Running', 'Esports'],
  [PollCategory.EDUCATION]: ['Learning', 'Students', 'HigherEd', 'StudyTips'],
  [PollCategory.TRAVEL]: ['Vacation', 'Adventure', 'Destinations', 'FlightTips'],
  [PollCategory.HEALTH]: ['MentalHealth', 'Nutrition', 'Sleep', 'FitnessGoal'],
  [PollCategory.FINANCE]: ['Investing', 'Crypto', 'Budgeting', 'Savings', 'Stocks'],
  [PollCategory.SCIENCE]: ['Space', 'Physics', 'Biotech', 'Climate', 'Innovation'],
  [PollCategory.ART]: ['Design', 'Photography', 'Illustration', 'Music', 'Architecture'],
  [PollCategory.OTHER]: ['Discussion', 'Opinion', 'Trending', 'Community'],
};

const CreatePoll: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(PollCategory.TECH);
  const [tags, setTags] = useState<string[]>(['Technology']);
  const [tagInput, setTagInput] = useState<string>('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [expiry, setExpiry] = useState<string>('never');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState<boolean>(false);
  const [hideResultsUntilClosed, setHideResultsUntilClosed] = useState<boolean>(false);
  const [accentColor, setAccentColor] = useState<string>('#6366f1');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  const handleSelectCategory = (newCat: string) => {
    setCategory(newCat);
    setTags(prev => {
      // Remove other top-level enum category tags so we don't pile up multiple primary categories
      const nonCategoryTags = prev.filter(t => !Object.values(PollCategory).includes(t as any));
      return [newCat, ...nonCategoryTags];
    });
  };

  const handleAddTag = (rawTag: string) => {
    const cleaned = rawTag.replace(/^#/, '').trim();
    if (!cleaned) return;
    if (tags.length >= 6) return;
    if (!tags.some(t => t.toLowerCase() === cleaned.toLowerCase())) {
      setTags([...tags, cleaned]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      handleRemoveTag(tags.length - 1);
    }
  };

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleGenerateAI = async (selectedTopic?: string) => {
    const queryTopic = selectedTopic || topic;
    if (!queryTopic.trim()) {
      setErrors({ topic: 'Please enter or select a topic first' });
      return;
    }
    setIsGenerating(true);
    setErrors({});
    if (selectedTopic) setTopic(selectedTopic);
    
    try {
      const data = await generatePollContent(queryTopic);
      setQuestion(data.question);
      setDescription(data.description);
      setOptions(data.options);
      
      let matchedCategory = category;
      if (data.category) {
        const found = Object.values(PollCategory).find(
          c => c.toLowerCase() === data.category!.toLowerCase()
        );
        if (found) {
          matchedCategory = found;
          setCategory(found);
        }
      }

      if (data.tags && Array.isArray(data.tags)) {
        const cleanTags = data.tags.map(t => t.replace(/^#/, '').trim()).filter(Boolean);
        const combined = Array.from(new Set([matchedCategory, ...cleanTags]));
        setTags(combined.slice(0, 6));
      } else {
        setTags([matchedCategory]);
      }
    } catch (error) {
      setErrors({ ai: 'Failed to generate content. You can write your question manually.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!question.trim()) newErrors.question = 'Question is required';
    if (options.some(o => !o.trim())) newErrors.options = 'All option fields must have text';
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
      question: question.trim(),
      description: description.trim(),
      category,
      tags: tags.length > 0 ? tags : [category],
      createdAt: Date.now(),
      totalVotes: 0,
      expiresAt,
      isPrivate,
      allowMultipleVotes,
      hideResultsUntilClosed,
      theme: {
        accentColor: accentColor !== '#6366f1' ? accentColor : undefined,
        backgroundImage: backgroundImage.trim() !== '' ? backgroundImage.trim() : undefined,
      },
      options: options.map(text => ({
        id: generateId(),
        text: text.trim(),
        votes: 0
      }))
    };

    createPollEvent(newPoll);
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Polls
        </button>

        {/* Live Preview Toggle Button */}
        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            previewMode 
              ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 border-primary-200 dark:border-primary-800' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{previewMode ? 'Hide Preview' : 'Live Preview'}</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 transition-colors">
        <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create a New Poll
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Publish an engaging ballot with real-time analytics and customizable options.
          </p>
        </div>

        {/* AI Generator Section */}
        <div className="bg-gradient-to-br from-indigo-500/5 via-primary-500/5 to-purple-500/5 dark:from-indigo-950/30 dark:to-slate-900/50 rounded-2xl p-5 mb-8 border border-primary-100 dark:border-primary-900/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
              Instant AI Assistant
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="flex-grow relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleGenerateAI())}
                placeholder="Enter any topic or question idea..."
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => handleGenerateAI()}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center transition-all disabled:opacity-60 shadow-sm shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </>
              )}
            </button>
          </div>

          {/* Quick topic suggestion pills */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mr-1 font-medium">Try:</span>
            {SUGGESTED_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleGenerateAI(t)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/50 text-slate-600 dark:text-slate-300 hover:text-primary-600 border border-slate-200 dark:border-slate-700/80 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>

          {errors.topic && <p className="text-red-500 text-xs mt-2 font-medium">{errors.topic}</p>}
          {errors.ai && <p className="text-amber-500 text-xs mt-2 font-medium">{errors.ai}</p>}
        </div>

        {/* Real-Time Live Preview Modal / Card */}
        {previewMode && (
          <div className="mb-8 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-primary-200 dark:border-primary-800/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Live Voter Preview
              </span>
              <span className="text-[11px] text-slate-400">What voters will see in the Poll List</span>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 border border-primary-200 dark:border-primary-800/50 uppercase">
                  {category}
                </span>
                {tags
                  .filter(t => t.toLowerCase() !== category.toLowerCase())
                  .map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border border-slate-200/50 dark:border-slate-700/50"
                    >
                      #{t}
                    </span>
                  ))}
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 ml-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live
                </span>
              </div>
              <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                {question.trim() || 'Your poll question will appear here...'}
              </h3>
              {description.trim() && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
              <div className="space-y-2 pt-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 font-medium">
                    <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold mr-2 text-slate-600 dark:text-slate-300">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt.trim() || `Option ${i + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Poll Question <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400">
                {question.length}/150
              </span>
            </div>
            <input
              type="text"
              maxLength={150}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which web framework do you prefer for production apps?"
              className={`w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border ${
                errors.question 
                  ? 'border-red-400 ring-2 ring-red-100 dark:ring-red-950/50' 
                  : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500'
              } text-sm focus:outline-none transition-all shadow-sm`}
            />
            {errors.question && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.question}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Description / Background Context <span className="text-xs font-normal text-slate-400">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background context or instructions for voters..."
              rows={2}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 focus:outline-none text-sm transition-all resize-none shadow-sm"
            />
          </div>

          {/* Interactive Tagging & Categorization System */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
                  <Tags className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Category & Topic Tags <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Organize your poll so voters can filter by categories like Technology, Politics, or Lifestyle
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 self-start sm:self-auto">
                Selected: {category}
              </span>
            </div>

            {/* Category Preset Selection Pills */}
            <div>
              <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                1. Select Primary Category:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.values(PollCategory).map(cat => {
                  const meta = getCategoryMeta(cat);
                  const Icon = meta.icon;
                  const isSelected = category === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 border cursor-pointer ${
                        isSelected
                          ? `${meta.activeClass} shadow-xs ring-2 ring-primary-500/25`
                          : `${meta.badgeClass} hover:opacity-90`
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Topic Tags Input */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  2. Specific Topic Tags ({tags.length}/6 max):
                </span>
                <span className="text-[11px] text-slate-400">Press Enter or comma to add tag</span>
              </div>

              {/* Active Tag Chips List */}
              <div className="flex items-center gap-1.5 flex-wrap min-h-[38px] p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                {tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 animate-in fade-in"
                  >
                    <Tag className="w-3 h-3 opacity-60" />
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="hover:bg-primary-200/60 dark:hover:bg-primary-900 rounded p-0.5 ml-0.5 transition-colors cursor-pointer"
                      title={`Remove #${t}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {tags.length < 6 && (
                  <div className="flex-grow flex items-center min-w-[150px]">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder={tags.length === 0 ? "Type tag & press Enter (e.g. React, Elections)..." : "Add another tag..."}
                      className="w-full px-2 py-1 text-xs bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Quick Suggested Tags based on current category */}
              {CATEGORY_SUGGESTED_TAGS[category] && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">Suggestions for {category}:</span>
                  {CATEGORY_SUGGESTED_TAGS[category]
                    .filter(st => !tags.some(t => t.toLowerCase() === st.toLowerCase()))
                    .slice(0, 5)
                    .map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleAddTag(st)}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/50 text-slate-600 dark:text-slate-300 hover:text-primary-600 border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-slate-400" />
                        <span>#{st}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Poll Duration */}
          <div>
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Poll Duration / Expiry
            </label>
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 focus:outline-none text-sm font-medium transition-all shadow-sm cursor-pointer"
            >
              <option value="never">No Expiration (Always Active)</option>
              <option value="1h">1 Hour</option>
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
            </select>
          </div>

          {/* Voting Options */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Ballot Options <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400">
                {options.length} options (max 8)
              </span>
            </div>

            <div className="space-y-2.5">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-8 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-grow px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 focus:outline-none text-sm transition-all shadow-sm"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors shrink-0"
                      aria-label="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.options && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.options}</p>}

            {options.length < 8 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 border border-dashed border-primary-300 dark:border-primary-800 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Option
              </button>
            )}
          </div>

          {/* Privacy & Voting Behavior Controls */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Poll Rules & Access
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Unlisted */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                <div className="pr-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Unlisted Poll</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Only accessible via direct link.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              {/* Multiple Choice */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                <div className="pr-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Multiple Choice</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Voters can pick multiple options.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={allowMultipleVotes}
                    onChange={(e) => setAllowMultipleVotes(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {/* Hidden Results */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                <div className="pr-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Blind Voting</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Results hidden until closed.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={hideResultsUntilClosed}
                    onChange={(e) => setHideResultsUntilClosed(e.target.checked)}
                    disabled={expiry === 'never'}
                  />
                  <div className={`w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600 ${expiry === 'never' ? 'opacity-40 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>
            </div>
          </div>

          {/* Theme & Styling Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              Theme & Presentation
            </span>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Accent Color Palette</label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setAccentColor(c.value)}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                      accentColor === c.value ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  >
                    {accentColor === c.value && (
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                    )}
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent p-0"
                    title="Custom color"
                  />
                  <span className="text-xs font-mono uppercase text-slate-500">{accentColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 hover:shadow-glow transform transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-base"
            >
              <Save className="w-5 h-5" />
              <span>Publish Live Poll</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePoll;