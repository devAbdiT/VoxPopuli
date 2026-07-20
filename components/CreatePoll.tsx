import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addPoll } from '../store';
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

    const newPoll = {
      id: generateId(),
      question,
      description,
      category,
      createdAt: Date.now(),
      totalVotes: 0,
      options: options.map(text => ({
        id: generateId(),
        text,
        votes: 0
      }))
    };

    dispatch(addPoll(newPoll));
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Poll</h2>
          <p className="text-gray-500">Design your poll manually or use AI to spark ideas.</p>
        </div>

        {/* AI Section */}
        <div className="bg-indigo-50 rounded-xl p-6 mb-8 border border-indigo-100">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
              <label className="block text-sm font-semibold text-indigo-900 mb-2">
                Generate with AI
              </label>
              <div className="relative">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Future of Remote Work"
                    className="w-full pl-4 pr-4 py-3 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poll Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              className={`w-full px-4 py-3 rounded-lg border ${errors.question ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20'} focus:border-primary focus:outline-none transition-all`}
            />
            {errors.question && <p className="text-red-500 text-xs mt-1">{errors.question}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add some context..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none bg-white"
            >
                {Object.values(PollCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="flex-grow px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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