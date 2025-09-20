export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  points: number;
  streak: number;
  badges: string[];
  progress: number;
  createdAt?: string;
}

export interface Alert {
  _id: string;
  title: string;
  description: string;
  type: 'drill' | 'emergency' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  isActive: boolean;
  expiresAt?: string;
  createdBy?: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  _id: string;
  question: string;
  options: string[];
  answer: number;
  category: 'general' | 'fire' | 'earthquake' | 'flood' | 'medical' | 'weather';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  createdBy?: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  _id: string;
  userId: string;
  message: string;
  response: string;
  category: 'general' | 'emergency' | 'preparation' | 'medical' | 'technical';
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  points: number;
  streak: number;
  badges: string[];
  badgeCount: number;
  progress: number;
  joinedAt?: string;
  isCurrentUser?: boolean;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (username: string, email: string, password: string, role?: string) => Promise<User>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export interface QuizAttemptResult {
  message: string;
  isCorrect: boolean;
  correctAnswer: number;
  correctOption: string;
  userStats: {
    points: number;
    streak: number;
    badges: string[];
    progress: number;
  };
  newBadges: string[];
}