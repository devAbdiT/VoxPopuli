import { Poll } from '../types';

export interface VotedPollEntry {
  pollId: string;
  optionIds: string[];
  votedAt: number; // timestamp in milliseconds
  pollQuestion?: string;
  selectedOptionTexts?: string[];
  category?: string;
  totalVotesAtTime?: number;
}

const STORAGE_KEY_RECENT = 'pulse_recently_voted';
const STORAGE_KEY_VOTES = 'pulse_user_votes';
const MAX_RECENT_ITEMS = 60;

/**
 * Dispatches a custom event so components can react immediately across the app
 */
const notifyStorageChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pulse_voted_storage_updated'));
  }
};

/**
 * Safely parse JSON from localStorage
 */
function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Failed to parse ${key} from localStorage:`, e);
    return fallback;
  }
}

/**
 * Retrieves the list of recently voted polls from localStorage.
 * Automatically backfills from `pulse_user_votes` if empty so existing votes are not lost.
 */
export function getRecentlyVoted(currentPolls?: Poll[]): VotedPollEntry[] {
  const recentList = safeParse<VotedPollEntry[]>(STORAGE_KEY_RECENT, []);

  // If recent list already has items, return them sorted by votedAt descending
  if (recentList.length > 0) {
    // Enrich with poll information if passed
    if (currentPolls && currentPolls.length > 0) {
      const pollMap = new Map(currentPolls.map(p => [p.id, p]));
      return recentList.map(entry => {
        const poll = pollMap.get(entry.pollId);
        if (poll) {
          const selectedTexts = poll.options
            .filter(o => entry.optionIds.includes(o.id))
            .map(o => o.text);
          return {
            ...entry,
            pollQuestion: poll.question,
            category: poll.category || entry.category,
            selectedOptionTexts: selectedTexts.length > 0 ? selectedTexts : entry.selectedOptionTexts,
          };
        }
        return entry;
      }).sort((a, b) => b.votedAt - a.votedAt);
    }
    return recentList.sort((a, b) => b.votedAt - a.votedAt);
  }

  // Backfill from `pulse_user_votes` if present
  const userVotes = safeParse<Record<string, string | string[]>>(STORAGE_KEY_VOTES, {});
  const pollIds = Object.keys(userVotes);
  if (pollIds.length === 0) {
    return [];
  }

  const pollMap = new Map((currentPolls || []).map(p => [p.id, p]));
  const backfilled: VotedPollEntry[] = pollIds.map((pollId, idx) => {
    const rawChoice = userVotes[pollId];
    const optionIds = Array.isArray(rawChoice) ? rawChoice : [rawChoice];
    const poll = pollMap.get(pollId);
    const selectedTexts = poll
      ? poll.options.filter(o => optionIds.includes(o.id)).map(o => o.text)
      : undefined;

    return {
      pollId,
      optionIds,
      // Distribute timestamps slightly for realistic ordering
      votedAt: Date.now() - (pollIds.length - idx) * 60000,
      pollQuestion: poll?.question,
      category: poll?.category,
      selectedOptionTexts: selectedTexts,
      totalVotesAtTime: poll?.totalVotes,
    };
  });

  saveRecentlyVoted(backfilled);
  return backfilled.sort((a, b) => b.votedAt - a.votedAt);
}

/**
 * Saves the recent voted entries list to localStorage
 */
export function saveRecentlyVoted(entries: VotedPollEntry[]): void {
  try {
    const trimmed = entries.slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(trimmed));
    notifyStorageChange();
  } catch (e) {
    console.error('Failed to save recently voted to localStorage:', e);
  }
}

/**
 * Records or updates a vote in localStorage
 */
export function recordVoteToStorage(
  pollId: string, 
  optionId: string | string[], 
  poll?: Poll
): VotedPollEntry[] {
  const optionIds = Array.isArray(optionId) ? optionId : [optionId];
  const existingList = safeParse<VotedPollEntry[]>(STORAGE_KEY_RECENT, []);

  // Filter out any previous entry for this same poll to avoid duplicates
  const filtered = existingList.filter(item => item.pollId !== pollId);

  // Get option texts from poll if provided
  let selectedTexts: string[] | undefined = undefined;
  if (poll) {
    selectedTexts = poll.options
      .filter(o => optionIds.includes(o.id))
      .map(o => o.text);
  }

  const newEntry: VotedPollEntry = {
    pollId,
    optionIds,
    votedAt: Date.now(),
    pollQuestion: poll?.question,
    selectedOptionTexts: selectedTexts,
    category: poll?.category,
    totalVotesAtTime: poll?.totalVotes,
  };

  const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_ITEMS);
  saveRecentlyVoted(updated);

  // Also ensure `pulse_user_votes` has it
  const currentVotes = safeParse<Record<string, string | string[]>>(STORAGE_KEY_VOTES, {});
  currentVotes[pollId] = optionId;
  try {
    localStorage.setItem(STORAGE_KEY_VOTES, JSON.stringify(currentVotes));
  } catch {}

  return updated;
}

/**
 * Removes a single poll from recently voted history
 */
export function removeVoteFromStorage(pollId: string): VotedPollEntry[] {
  const existingList = safeParse<VotedPollEntry[]>(STORAGE_KEY_RECENT, []);
  const updated = existingList.filter(item => item.pollId !== pollId);
  saveRecentlyVoted(updated);

  // Also remove from `pulse_user_votes`
  const currentVotes = safeParse<Record<string, string | string[]>>(STORAGE_KEY_VOTES, {});
  delete currentVotes[pollId];
  try {
    localStorage.setItem(STORAGE_KEY_VOTES, JSON.stringify(currentVotes));
  } catch {}

  return updated;
}

/**
 * Clears all voted polls history from localStorage
 */
export function clearRecentlyVotedStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_RECENT);
    localStorage.removeItem(STORAGE_KEY_VOTES);
    notifyStorageChange();
  } catch (e) {
    console.error('Failed to clear voted history from localStorage:', e);
  }
}
