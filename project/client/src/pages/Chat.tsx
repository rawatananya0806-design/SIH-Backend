import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Clock,
  AlertTriangle,
  Heart,
  Lightbulb
} from 'lucide-react';
import api from '../services/api';
import { Chat as ChatType } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const Chat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatType[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchChatHistory();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const fetchChatHistory = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await api.get(`/chats/${user.id}?limit=50`);
      setChats(response.data.chats);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    const userMessage = message.trim();
    setMessage('');
    setIsSending(true);

    // Optimistically add user message
    const tempUserMessage: ChatType = {
      _id: `temp-${Date.now()}`,
      userId: user!.id,
      message: userMessage,
      response: '',
      category: 'general',
      sentiment: 'neutral',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setChats(prev => [...prev, tempUserMessage]);

    try {
      const response = await api.post('/chats', { message: userMessage });
      
      // Replace temp message with real chat
      setChats(prev => [
        ...prev.slice(0, -1), // Remove temp message
        response.data.chat
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setChats(prev => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const getSentimentIcon = (sentiment: ChatType['sentiment']) => {
    switch (sentiment) {
      case 'urgent': return AlertTriangle;
      case 'positive': return Heart;
      case 'negative': return AlertTriangle;
      default: return Lightbulb;
    }
  };

  const getSentimentColor = (sentiment: ChatType['sentiment']) => {
    switch (sentiment) {
      case 'urgent': return 'text-emergency-600';
      case 'positive': return 'text-success-600';
      case 'negative': return 'text-warning-600';
      default: return 'text-primary-600';
    }
  };

  const quickPrompts = [
    "How do I prepare an emergency kit?",
    "What should I do during an earthquake?",
    "How to create a family emergency plan?",
    "First aid for burns",
    "What to do in a flood?",
    "How to stay safe during a storm?"
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-t-xl shadow-md p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary-100 rounded-full">
            <MessageCircle className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Emergency Assistant</h1>
            <p className="text-gray-600">Get personalized emergency preparedness advice</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-white overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : chats.length > 0 ? (
          <>
            {chats.map((chat) => (
              <div key={chat._id} className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                    <div className="bg-primary-600 text-white p-4 rounded-2xl rounded-br-md">
                      <p className="text-sm">{chat.message}</p>
                    </div>
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                {chat.response && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2 max-w-xs lg:max-w-2xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 text-gray-900 p-4 rounded-2xl rounded-bl-md">
                        <p className="text-sm whitespace-pre-wrap">{chat.response}</p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center space-x-2">
                            {(() => {
                              const Icon = getSentimentIcon(chat.sentiment);
                              return <Icon className={`w-4 h-4 ${getSentimentColor(chat.sentiment)}`} />;
                            })()}
                            <span className="text-xs text-gray-500 capitalize">
                              {chat.category} • {chat.sentiment}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(chat.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-md">
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Start a conversation
                </h2>
                <p className="text-gray-600 mb-6">
                  Ask me anything about emergency preparedness and safety!
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Quick prompts to get started:</p>
                <div className="grid gap-2 max-w-md mx-auto">
                  {quickPrompts.slice(0, 3).map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setMessage(prompt)}
                      className="text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white rounded-b-xl shadow-md p-6 border-t">
        <form onSubmit={sendMessage} className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me about emergency preparedness..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              disabled={isSending}
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Prompts Bar */}
        {chats.length === 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {quickPrompts.slice(0, 3).map((prompt, index) => (
              <button
                key={index}
                onClick={() => setMessage(prompt)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;