import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Poll, AppState, PollOption } from './types';

// --- Local Storage Helpers ---
const loadState = (): AppState | undefined => {
  try {
    const serializedState = localStorage.getItem('voxpopuli_state');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

const saveState = (state: AppState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('voxpopuli_state', serializedState);
  } catch {
    // ignore write errors
  }
};

// --- Initial Data ---
const initialPolls: Poll[] = [
  {
    id: '1',
    question: 'What is your favorite frontend framework?',
    description: 'Help us decide which framework rules the web in 2024.',
    createdAt: Date.now(),
    totalVotes: 150,
    category: 'Technology',
    options: [
      { id: 'opt_1', text: 'React', votes: 85 },
      { id: 'opt_2', text: 'Vue', votes: 30 },
      { id: 'opt_3', text: 'Angular', votes: 20 },
      { id: 'opt_4', text: 'Svelte', votes: 15 },
    ]
  },
  {
    id: '2',
    question: 'Coffee or Tea?',
    description: 'The ultimate morning beverage showdown.',
    createdAt: Date.now() - 100000,
    totalVotes: 82,
    category: 'Lifestyle',
    options: [
      { id: 'opt_c', text: 'Coffee', votes: 50 },
      { id: 'opt_t', text: 'Tea', votes: 32 },
    ]
  }
];

const initialState: AppState = loadState() || {
  polls: initialPolls,
  userVotes: {},
  loading: false,
  error: null,
};

// --- Slices ---
const pollsSlice = createSlice({
  name: 'polls',
  initialState,
  reducers: {
    addPoll: (state, action: PayloadAction<Poll>) => {
      state.polls.unshift(action.payload);
    },
    votePoll: (state, action: PayloadAction<{ pollId: string; optionId: string }>) => {
      const { pollId, optionId } = action.payload;
      
      // Prevent double voting logic is handled in UI, but safe guard here
      if (state.userVotes[pollId]) {
         // If we wanted to allow changing votes, we'd decrement old one here
         return; 
      }

      const poll = state.polls.find(p => p.id === pollId);
      if (poll) {
        const option = poll.options.find(o => o.id === optionId);
        if (option) {
          option.votes += 1;
          poll.totalVotes += 1;
          state.userVotes[pollId] = optionId;
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    deletePoll: (state, action: PayloadAction<string>) => {
        state.polls = state.polls.filter(p => p.id !== action.payload);
        delete state.userVotes[action.payload];
    }
  },
});

export const { addPoll, votePoll, setLoading, setError, deletePoll } = pollsSlice.actions;

export const store = configureStore({
  reducer: pollsSlice.reducer,
});

// Subscribe to store updates to persist state
store.subscribe(() => {
  saveState(store.getState());
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;