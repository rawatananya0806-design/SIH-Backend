import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Brain, 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Award,
  RotateCcw,
  Target
} from 'lucide-react';
import api from '../services/api';
import { Quiz as QuizType, QuizAttemptResult } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const Quiz = () => {
  const { user, updateUser } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizType[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<QuizType | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState({
    category: '',
    difficulty: ''
  });

  useEffect(() => {
    fetchQuizzes();
  }, [filter]);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (filter.category) queryParams.append('category', filter.category);
      if (filter.difficulty) queryParams.append('difficulty', filter.difficulty);
      queryParams.append('limit', '20');

      const response = await api.get(`/quiz?${queryParams.toString()}`);
      setQuizzes(response.data.quizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = (quiz: QuizType) => {
    setCurrentQuiz(quiz);
    setSelectedOption(null);
    setShowResult(false);
    setResult(null);
  };

  const submitAnswer = async () => {
    if (!currentQuiz || selectedOption === null) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/quiz/attempt', {
        quizId: currentQuiz._id,
        selectedOption
      });

      setResult(response.data);
      setShowResult(true);

      // Update user stats
      if (user) {
        updateUser({
          ...user,
          ...response.data.userStats
        });
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setSelectedOption(null);
    setShowResult(false);
    setResult(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-success-600 bg-success-100';
      case 'medium': return 'text-warning-600 bg-warning-100';
      case 'hard': return 'text-emergency-600 bg-emergency-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    return '🔥'; // You can customize icons for different categories
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show current quiz
  if (currentQuiz) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Quiz Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Brain className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Emergency Quiz</h1>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <span className={`px-3 py-1 rounded-full ${getDifficultyColor(currentQuiz.difficulty)}`}>
                {currentQuiz.difficulty.toUpperCase()}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                {currentQuiz.category.toUpperCase()}
              </span>
              <span className="flex items-center space-x-1">
                <Trophy className="w-4 h-4" />
                <span>{currentQuiz.points} points</span>
              </span>
            </div>
          </div>

          {!showResult ? (
            // Quiz Question
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {currentQuiz.question}
                </h2>
              </div>

              <div className="space-y-3">
                {currentQuiz.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOption(index)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      selectedOption === index
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium text-gray-900">
                      {String.fromCharCode(65 + index)}. {option}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  onClick={resetQuiz}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Quizzes
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={selectedOption === null || isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <LoadingSpinner size="sm" /> : 'Submit Answer'}
                </button>
              </div>
            </div>
          ) : (
            // Quiz Result
            <div className="text-center space-y-6">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                result?.isCorrect ? 'bg-success-100' : 'bg-emergency-100'
              }`}>
                {result?.isCorrect ? (
                  <CheckCircle className="w-10 h-10 text-success-600" />
                ) : (
                  <XCircle className="w-10 h-10 text-emergency-600" />
                )}
              </div>

              <div>
                <h2 className={`text-2xl font-bold mb-2 ${
                  result?.isCorrect ? 'text-success-600' : 'text-emergency-600'
                }`}>
                  {result?.message}
                </h2>
                {!result?.isCorrect && (
                  <p className="text-gray-600">
                    Correct answer: <strong>{result?.correctOption}</strong>
                  </p>
                )}
              </div>

              {/* Updated Stats */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{result?.userStats.points}</div>
                    <div className="text-sm text-gray-600">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning-600">{result?.userStats.streak}</div>
                    <div className="text-sm text-gray-600">Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">{result?.userStats.badges.length}</div>
                    <div className="text-sm text-gray-600">Badges</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emergency-600">{result?.userStats.progress}%</div>
                    <div className="text-sm text-gray-600">Progress</div>
                  </div>
                </div>
              </div>

              {/* New Badges */}
              {result?.newBadges && result.newBadges.length > 0 && (
                <div className="bg-gradient-to-r from-warning-50 to-warning-100 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">🎉 New Badge Earned!</h3>
                  <div className="flex items-center justify-center space-x-2">
                    <Award className="w-6 h-6 text-warning-600" />
                    <span className="font-medium text-warning-800">{result.newBadges[0]}</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={resetQuiz}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Quizzes
                </button>
                <button
                  onClick={() => startQuiz(quizzes[Math.floor(Math.random() * quizzes.length)])}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Another</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show quiz list
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Preparedness Quiz</h1>
        <p className="text-gray-600">Test your knowledge and improve your emergency response skills</p>
      </div>

      {/* User Stats */}
      {user && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Your Progress</h2>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{user.points}</div>
                  <div className="text-primary-200 text-sm">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{user.streak}</div>
                  <div className="text-primary-200 text-sm">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{user.badges.length}</div>
                  <div className="text-primary-200 text-sm">Badges</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{user.progress}%</div>
              <div className="text-primary-200">Complete</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Quizzes</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filter.category}
              onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="fire">Fire Safety</option>
              <option value="earthquake">Earthquake</option>
              <option value="flood">Flood</option>
              <option value="medical">Medical</option>
              <option value="weather">Weather</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={filter.difficulty}
              onChange={(e) => setFilter(prev => ({ ...prev, difficulty: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quiz List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.length > 0 ? (
          quizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">{getCategoryIcon(quiz.category)}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                      {quiz.difficulty}
                    </span>
                    <span className="flex items-center space-x-1 text-sm text-gray-600">
                      <Trophy className="w-3 h-3" />
                      <span>{quiz.points}</span>
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                  {quiz.question}
                </h3>

                <div className="text-sm text-gray-600 mb-4">
                  <span className="px-2 py-1 bg-gray-100 rounded-full">
                    {quiz.category.replace(/([A-Z])/g, ' $1').toUpperCase()}
                  </span>
                </div>

                <button
                  onClick={() => startQuiz(quiz)}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <Target className="w-4 h-4" />
                  <span>Start Quiz</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No quizzes found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more quizzes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;