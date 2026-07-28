import { configureStore, createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { io } from 'socket.io-client';
import { Poll, AppState } from './types';

// Setup Socket.IO client
export const socket = io(window.location.origin);

const initialState: AppState = {
  polls: [],
  userVotes: {}, // We keep userVotes in local storage and redux state so they persist
  loading: true,
  error: null,
};

// Local storage for user votes to prevent double voting after refresh
const loadUserVotes = () => {
  try {
    const saved = localStorage.getItem('voxpopuli_user_votes');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const saveUserVotes = (votes: Record<string, string | string[]>) => {
  try {
    localStorage.setItem('voxpopuli_user_votes', JSON.stringify(votes));
  } catch {}
};

initialState.userVotes = loadUserVotes();

// --- Slices ---
const pollsSlice = createSlice({
  name: 'polls',
  initialState,
  reducers: {
    setInitialState: (state, action: PayloadAction<Poll[]>) => {
      state.polls = action.payload;
      state.loading = false;
    },
    pollCreated: (state, action: PayloadAction<Poll>) => {
      // Check if poll already exists to prevent duplicates
      if (!state.polls.find(p => p.id === action.payload.id)) {
        state.polls.unshift(action.payload);
      }
    },
    pollVoted: (state, action: PayloadAction<{ pollId: string; optionId: string | string[]; poll: Poll }>) => {
      const { pollId, poll } = action.payload;
      const index = state.polls.findIndex(p => p.id === pollId);
      if (index !== -1) {
        state.polls[index] = poll;
      }
    },
    pollUpdated: (state, action: PayloadAction<Poll>) => {
      const index = state.polls.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.polls[index] = action.payload;
      }
    },
    pollDeleted: (state, action: PayloadAction<string>) => {
      state.polls = state.polls.filter(p => p.id !== action.payload);
    },
    recordUserVote: (state, action: PayloadAction<{ pollId: string; optionId: string | string[] }>) => {
      state.userVotes[action.payload.pollId] = action.payload.optionId;
      saveUserVotes(state.userVotes);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setInitialState, pollCreated, pollVoted, pollUpdated, pollDeleted, recordUserVote, setLoading, setError } = pollsSlice.actions;

export const store = configureStore({
  reducer: pollsSlice.reducer,
});

// Set up Socket listeners
socket.on('initial_state', (polls: Poll[]) => {
  store.dispatch(setInitialState(polls));
});

socket.on('poll_created', (poll: Poll) => {
  store.dispatch(pollCreated(poll));
});

socket.on('poll_voted', (data: { pollId: string; optionId: string | string[]; poll: Poll }) => {
  store.dispatch(pollVoted(data));
});

socket.on('poll_deleted', (pollId: string) => {
  store.dispatch(pollDeleted(pollId));
});

socket.on('poll_updated', (poll: Poll) => {
  store.dispatch(pollUpdated(poll));
});

// Thunk-like helpers for emitting via socket
export const createPollEvent = (poll: Poll) => {
  socket.emit('create_poll', poll);
};

export const votePollEvent = (pollId: string, optionId: string | string[]) => {
  // First record it locally so UI updates instantly and prevents multiple clicks
  store.dispatch(recordUserVote({ pollId, optionId }));
  socket.emit('vote_poll', { pollId, optionId });
};

export const deletePollEvent = (pollId: string) => {
  socket.emit('delete_poll', pollId);
};

export const addCommentEvent = (pollId: string, comment: import('./types').Comment) => {
  socket.emit('add_comment', { pollId, comment });
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;