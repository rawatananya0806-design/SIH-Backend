import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  Brain, 
  MessageCircle, 
  Trophy, 
  TrendingUp,
  Award,
  Target,
  Activity
} from 'lucide-react';
import api from '../services/api';
import { Alert, Quiz, LeaderboardEntry } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    recentAlerts: [] as Alert[],
    recentQuizzes: [] as Quiz[],
    userPosition: null as { rank: number; user: any } | null,
    weeklyTop: [] as LeaderboardEntry[]
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [alertsRes, quizzesRes, leaderboardRes, profileRes] = await Promise.all([
          api.get('/alerts?limit=5'),
          api.get('/quiz?limit=5'),
          api.get('/leaderboard?limit=5'),
          api.get('/auth/profile')
        ]);

        // Update user data
        updateUser(profileRes.data.user);

        setStats({
          recentAlerts: alertsRes.data.alerts,
          recentQuizzes: quizzesRes.data.quizzes,
          userPosition: null,
          weeklyTop: leaderboardRes.data.weeklyTop || []
        });

        // Get user position if available
        if (user) {
          try {
            const positionRes = await api.get(`/leaderboard/position/${user.id}`);
            setStats(prev => ({
              ...prev,
              userPosition: positionRes.data.userPosition
            }));
          } catch (err) {
            console.log('Could not fetch user position');
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, updateUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  const progressPercentage = Math.min(user.progress, 100);

  const quickActions = [
    { 
      icon: AlertTriangle, 
      title: 'View Alerts', 
      description: 'Check latest emergency alerts',
      link: '/alerts',
      color: 'text-emergency-600 bg-emergency-50',
      count: stats.recentAlerts.filter(alert => alert.isActive).length
    },
    { 
      icon: Brain, 
      title: 'Take Quiz', 
      description: 'Test your preparedness knowledge',
      link: '/quiz',
      color: 'text-primary-600 bg-primary-50',
      count: stats.recentQuizzes.length
    },
    { 
      icon: MessageCircle, 
      title: 'AI Assistant', 
      description: 'Get personalized advice',
      link: '/chat',
      color: 'text-success-600 bg-success-50',
      count: 0
    },
    { 
      icon: Trophy, 
      title: 'Leaderboard', 
      description: 'See your ranking',
      link: '/leaderboard',
      color: 'text-warning-600 bg-warning-50',
      count: stats.userPosition?.rank || 0
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.username}!
            </h1>
            <p className="text-primary-100 text-lg">
              Keep building your emergency preparedness skills
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{user.points} pts</div>
            <div className="text-primary-200">Current streak: {user.streak}</div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Target className="w-6 h-6 text-primary-600" />
            </div>
            <span className="text-2xl font-bold text-primary-600">{progressPercentage}%</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Overall Progress</h3>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-warning-100 rounded-lg">
              <Activity className="w-6 h-6 text-warning-600" />
            </div>
            <span className="text-2xl font-bold text-warning-600">{user.streak}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Current Streak</h3>
          <p className="text-sm text-gray-600">Days of consecutive activity</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-success-100 rounded-lg">
              <Award className="w-6 h-6 text-success-600" />
            </div>
            <span className="text-2xl font-bold text-success-600">{user.badges.length}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Badges Earned</h3>
          <p className="text-sm text-gray-600">Achievement milestones</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emergency-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emergency-600" />
            </div>
            <span className="text-2xl font-bold text-emergency-600">
              #{stats.userPosition?.rank || '—'}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Leaderboard Rank</h3>
          <p className="text-sm text-gray-600">Your current position</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.link}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 group"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                {action.count > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {action.count} available
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity & Badges */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Badges */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Badges</h3>
          {user.badges.length > 0 ? (
            <div className="space-y-3">
              {user.badges.map((badge, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-warning-50 to-warning-100 rounded-lg">
                  <div className="w-10 h-10 bg-warning-500 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{badge}</div>
                    <div className="text-sm text-gray-600">Achievement unlocked</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No badges earned yet</p>
              <p className="text-sm text-gray-500">Complete quizzes and activities to earn badges!</p>
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Latest Alerts</h3>
          {stats.recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {stats.recentAlerts.slice(0, 3).map((alert) => (
                <div key={alert._id} className="p-3 border-l-4 border-emergency-500 bg-emergency-50 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{alert.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {alert.description.substring(0, 100)}...
                      </div>
                      <div className="text-xs text-emergency-600 mt-2 font-medium">
                        {alert.type.toUpperCase()} • {new Date(alert.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Link to="/alerts" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View all alerts →
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No recent alerts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;