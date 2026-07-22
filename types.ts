export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: number;
  author: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: number;
  totalVotes: number;
  description?: string;
  category?: string;
  comments?: Comment[];
}

export interface PollCreationData {
  question: string;
  options: string[];
  description: string;
}

export interface AppState {
  polls: Poll[];
  userVotes: Record<string, string>; // pollId -> optionId mapping
  loading: boolean;
  error: string | null;
}

export enum PollCategory {
  TECH = 'Technology',
  LIFESTYLE = 'Lifestyle',
  FOOD = 'Food',
  ENTERTAINMENT = 'Entertainment',
  SPORTS = 'Sports',
  POLITICS = 'Politics',
  EDUCATION = 'Education',
  TRAVEL = 'Travel',
  HEALTH = 'Health & Wellness',
  FINANCE = 'Finance',
  SCIENCE = 'Science',
  ART = 'Art & Culture',
  OTHER = 'Other'
}