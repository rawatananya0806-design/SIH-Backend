import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Users,
  Crown,
  Star,
  Target
} from 'lucide-react';
import api from '../services/api';
import { LeaderboardEntry } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<{ rank: number; user: any; nearbyUsers: LeaderboardEntry[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState('points');

  useEffect(() => {
    fetchLeaderboard();
  }, [category]);

  useEffect(() => {
    if (user) {
      fetchUserPosition();
    }
  }, [user, category]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/leaderboard?category=${category}&limit=50`);
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosition = async () => {
    if (!user) return;
    
    try {
      const response = await api.get(`/leaderboard/position/${user.id}`);
      setUserPosition(response.data);
    } catch (error) {
      console.error('Error fetching user position:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number, isCurrentUser?: boolean) => {
    if (isCurrentUser) {
      return 'bg-primary-50 border-primary-200 ring-2 ring-primary-500';
    }
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 2: return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3: return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
      default: return 'bg-white border-gray-200';
    }
  };

  const getCategoryValue = (entry: LeaderboardEntry, cat: string) => {
    switch (cat) {
      case 'points': return entry.points;
      case 'streak': return entry.streak;
      case 'badges': return entry.badgeCount;
      case 'progress': return `${entry.progress}%`;
      default: return entry.points;
    }
  };

  const categories = [
    { key: 'points', label: 'Points', icon: Trophy },
    { key: 'streak', label: 'Streak', icon: TrendingUp },
    { key: 'badges', label: 'Badges', icon: Award },
    { key: 'progress', label: 'Progress', icon: Target }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
        <p className="text-gray-600">See how you rank against other emergency preparedness enthusiasts</p>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ranking Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  category === cat.key
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">{cat.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* User Position Card */}
      {userPosition && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                {getRankIcon(userPosition.rank)}
              </div>
              <div>
                <h2 className="text-xl font-bold">Your Position</h2>
                <p className="text-primary-100">
                  Rank #{userPosition.rank} • {getCategoryValue(userPosition.user, category)} {category}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{userPosition.user.username}</div>
              <div className="text-primary-200">Keep it up!</div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-warning-500" />
            <span>Top {category.charAt(0).toUpperCase() + category.slice(1)} Leaders</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`p-6 transition-all duration-200 ${getRankColor(entry.rank, entry.isCurrentUser)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {entry.username[0].toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {entry.username}
                        </h3>
                        {entry.isCurrentUser && (
                          <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                            You
                          </span>
                        )}
                        {entry.rank <= 3 && (
                          <Star className="w-4 h-4 text-warning-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>{entry.points} points</span>
                        <span>•</span>
                        <span>{entry.streak} streak</span>
                        <span>•</span>
                        <span>{entry.badgeCount} badges</span>
                        <span>•</span>
                        <span>{entry.progress}% progress</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {getCategoryValue(entry, category)}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {category}
                    </div>
                  </div>
                </div>

                {/* Badge Display for top 3 */}
                {entry.rank <= 3 && entry.badges.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Latest badges:</span>
                      <div className="flex space-x-1">
                        {entry.badges.slice(-3).map((badge, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-warning-100 text-warning-800 text-xs rounded-full"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No rankings yet</h3>
            <p className="text-gray-500">Be the first to earn points and claim the top spot!</p>
          </div>
        )}
      </div>

      {/* Achievement Info */}
      <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-warning-200 rounded-lg">
            <Trophy className="w-5 h-5 text-warning-700" />
          </div>
          <div>
            <h3 className="font-semibold text-warning-900 mb-2">How to Climb the Leaderboard</h3>
            <ul className="text-sm text-warning-800 space-y-1">
              <li>• Complete quizzes correctly to earn points and maintain your streak</li>
              <li>• Engage with the AI assistant to build your knowledge</li>
              <li>• Earn badges by achieving milestones in emergency preparedness</li>
              <li>• Stay consistent to build long streaks and boost your progress</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;