import React from 'react';

/**
 * Shimmering placeholder effect overlay
 */
export const ShimmerOverlay: React.FC = () => (
  <div 
    className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent pointer-events-none" 
    aria-hidden="true" 
  />
);

/**
 * Individual Poll Card Skeleton with shimmering placeholders
 */
export const PollCardSkeleton: React.FC = () => {
  return (
    <div className="relative bg-white dark:bg-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col h-full overflow-hidden">
      <ShimmerOverlay />

      {/* Top Accent Line Placeholder */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800" />

      {/* Header Badges Placeholder */}
      <div className="flex justify-between items-start mb-3.5 gap-2">
        <div className="flex items-center gap-2">
          {/* Category Pill Skeleton */}
          <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
          {/* Status Pill Skeleton */}
          <div className="h-5 w-14 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Title / Question Placeholder (two lines) */}
      <div className="space-y-2 mb-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-11/12 animate-pulse" />
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4 animate-pulse" />
      </div>

      {/* Description Placeholder */}
      <div className="space-y-1.5 mb-5 flex-grow">
        <div className="h-3.5 bg-slate-100 dark:bg-slate-800/60 rounded w-full animate-pulse" />
        <div className="h-3.5 bg-slate-100 dark:bg-slate-800/60 rounded w-4/5 animate-pulse" />
      </div>

      {/* Leading Option Highlight Bar Placeholder */}
      <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-2">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-700/80 rounded w-28 animate-pulse" />
          <div className="h-3.5 bg-slate-200 dark:bg-slate-700/80 rounded w-8 animate-pulse" />
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div className="bg-slate-300 dark:bg-slate-600 h-full rounded-full w-2/5 animate-pulse" />
        </div>
      </div>

      {/* Footer Meta Placeholder */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-16 animate-pulse" />
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-12 animate-pulse" />
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-14 animate-pulse" />
        </div>
        <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    </div>
  );
};

/**
 * Hero Pulse Banner Skeleton
 */
export const HeroBannerSkeleton: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800/80 p-6 sm:p-8 shadow-xl shadow-slate-900/10">
      <ShimmerOverlay />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3 max-w-xl w-full">
          <div className="h-5 w-48 bg-slate-800 rounded-full animate-pulse" />
          <div className="h-8 sm:h-10 bg-slate-800 rounded-xl w-4/5 animate-pulse" />
          <div className="space-y-1.5 pt-1">
            <div className="h-4 bg-slate-800/80 rounded w-full animate-pulse" />
            <div className="h-4 bg-slate-800/80 rounded w-3/4 animate-pulse" />
          </div>
        </div>

        {/* Quick Metrics Skeletons */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full md:w-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-center min-w-[85px] sm:min-w-[100px]">
              <div className="h-6 w-10 bg-slate-800 rounded mx-auto mb-1.5 animate-pulse" />
              <div className="h-3 w-12 bg-slate-800/70 rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Top Search Bar & Category Filters Skeleton
 */
export const SearchAndFiltersSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Top Search Bar Skeleton */}
      <div className="relative bg-white dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md shadow-slate-900/5 overflow-hidden">
        <ShimmerOverlay />
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="h-11 bg-slate-100 dark:bg-slate-800/70 rounded-xl sm:rounded-2xl flex-grow animate-pulse" />
          <div className="h-11 w-48 bg-slate-100 dark:bg-slate-800/80 rounded-xl animate-pulse" />
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="h-3.5 w-44 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>

      {/* Category Pills & Sort Bar Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[18, 22, 24, 20, 26, 22].map((w, index) => (
            <div 
              key={index} 
              className={`h-8 rounded-full bg-slate-200 dark:bg-slate-800/80 animate-pulse`} 
              style={{ width: `${w * 4}px` }} 
            />
          ))}
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800/80 rounded-xl animate-pulse" />
          <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800/80 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
};

/**
 * Complete PollList Skeleton Layout
 * Replaces generic loading spinners or text with an authentic shimmering placeholder view
 */
export const PollListSkeleton: React.FC<{ cardCount?: number }> = ({ cardCount = 6 }) => {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading active polls...">
      {/* Search & Filter Bar Placeholder */}
      <SearchAndFiltersSkeleton />

      {/* Hero Pulse Banner Placeholder */}
      <HeroBannerSkeleton />

      {/* Shimmering Grid of Poll Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: cardCount }).map((_, index) => (
          <PollCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export default PollListSkeleton;
