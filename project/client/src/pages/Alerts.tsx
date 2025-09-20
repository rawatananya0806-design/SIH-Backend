import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  AlertTriangle, 
  Shield, 
  Info, 
  Clock,
  MapPin,
  User,
  Filter,
  Plus,
  X
} from 'lucide-react';
import api from '../services/api';
import { Alert } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const Alerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: '',
    severity: '',
    active: 'true'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    type: 'info' as Alert['type'],
    severity: 'medium' as Alert['severity'],
    location: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (filter.type) queryParams.append('type', filter.type);
      if (filter.severity) queryParams.append('severity', filter.severity);
      queryParams.append('active', filter.active);

      const response = await api.get(`/alerts?${queryParams.toString()}`);
      setAlerts(response.data.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      await api.post('/alerts', createFormData);
      setShowCreateModal(false);
      setCreateFormData({
        title: '',
        description: '',
        type: 'info',
        severity: 'medium',
        location: ''
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'emergency': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'drill': return Shield;
      default: return Info;
    }
  };

  const getAlertColor = (type: Alert['type'], severity: Alert['severity']) => {
    if (type === 'emergency' || severity === 'critical') {
      return 'border-emergency-500 bg-emergency-50 text-emergency-700';
    }
    if (type === 'warning' || severity === 'high') {
      return 'border-warning-500 bg-warning-50 text-warning-700';
    }
    if (severity === 'medium') {
      return 'border-primary-500 bg-primary-50 text-primary-700';
    }
    return 'border-gray-500 bg-gray-50 text-gray-700';
  };

  const getSeverityBadgeColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-emergency-600 text-white';
      case 'high': return 'bg-warning-600 text-white';
      case 'medium': return 'bg-primary-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Emergency Alerts</h1>
          <p className="text-gray-600 mt-2">Stay informed about current emergencies and safety information</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-emergency flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Alert</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Alerts</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Types</option>
              <option value="emergency">Emergency</option>
              <option value="warning">Warning</option>
              <option value="drill">Drill</option>
              <option value="info">Information</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={filter.severity}
              onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filter.active}
              onChange={(e) => setFilter(prev => ({ ...prev, active: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
              <option value="all">All Alerts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : alerts.length > 0 ? (
          alerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <div
                key={alert._id}
                className={`p-6 rounded-xl border-l-4 ${getAlertColor(alert.type, alert.severity)} ${
                  alert.severity === 'critical' ? 'emergency-pulse' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-3 rounded-lg bg-white/50">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-bold">{alert.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadgeColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                          {alert.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-lg mb-4">{alert.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {alert.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{alert.location}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(alert.createdAt).toLocaleString()}</span>
                        </div>
                        {alert.createdBy && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>By {alert.createdBy.username}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {!alert.isActive && (
                    <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm font-medium">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No alerts found</h3>
            <p className="text-gray-500">There are no alerts matching your current filters.</p>
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && user?.role === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Alert</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Alert title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  rows={3}
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Detailed alert description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={createFormData.type}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, type: e.target.value as Alert['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="info">Information</option>
                    <option value="warning">Warning</option>
                    <option value="emergency">Emergency</option>
                    <option value="drill">Drill</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <select
                    value={createFormData.severity}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, severity: e.target.value as Alert['severity'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
                <input
                  type="text"
                  value={createFormData.location}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Location or area affected"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 btn-emergency disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? <LoadingSpinner size="sm" /> : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;