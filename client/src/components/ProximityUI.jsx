import React, { useState, useRef, useEffect } from 'react';
import Avatar from './Avatar';
import { useAuth } from '../contexts/AuthContext';

const ProximityUI = ({ nearbyPlayers, onSendMessage, messages, currentPlayer, onChatFocusChange }) => {
  const { isAuthenticated, login } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Track unread messages
  useEffect(() => {
    if (messages.length > lastMessageCount && !showChat) {
      const newMessages = messages.length - lastMessageCount;
      setUnreadCount(prev => prev + newMessages);
    }
    setLastMessageCount(messages.length);
  }, [messages.length, lastMessageCount, showChat]);

  // Clear unread count when chat is opened
  useEffect(() => {
    if (showChat) {
      setUnreadCount(0);
    }
  }, [showChat]);

  // Handle chat input focus changes
  const handleChatInputFocus = () => {
    console.log('Chat input focused - disabling movement');
    if (onChatFocusChange) {
      onChatFocusChange(true);
    }
  };

  const handleChatInputBlur = () => {
    console.log('Chat input blurred - enabling movement');
    if (onChatFocusChange) {
      onChatFocusChange(false);
    }
  };

  // Also track when chat is open/closed to ensure movement is properly controlled
  const handleChatToggle = () => {
    const newShowChat = !showChat;
    setShowChat(newShowChat);
    
    // If closing chat, make sure movement is re-enabled
    if (!newShowChat && onChatFocusChange) {
      onChatFocusChange(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      onSendMessage(chatMessage.trim());
      setChatMessage('');
    }
  };

  const handleVideoCallComingSoon = () => {
    setShowComingSoonModal(true);
  };

  const handleSignIn = () => {
    setShowSignInModal(false);
    login();
  };

  if (nearbyPlayers.length === 0) return null;

  return (
    <>
      <div className="fixed top-20 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]">
        <div className="glass-card rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Nearby People</h3>
                <p className="text-purple-100 text-sm">{nearbyPlayers.length} people nearby</p>
              </div>
            </div>
          </div>

          {/* People List */}
          <div className="p-4 space-y-3">
            {nearbyPlayers.map(player => (
              <div key={player.id} className="group">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center space-x-3">
                    <div className="relative transition-transform group-hover:scale-105">
                      <Avatar 
                        avatar={player.avatar} 
                        size={40} 
                        name={player.name}
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-200">{player.name}</span>
                      <p className="text-xs text-gray-400">Online now</p>
                    </div>
                  </div>
                  <button
                    onClick={handleVideoCallComingSoon}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-105 text-white p-2 rounded-lg transition-all duration-200 hover:shadow-lg group"
                    title="Video calls coming soon!"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Toggle */}
          <div className="p-4 border-t border-purple-500/20">
            <button
              onClick={handleChatToggle}
              className="w-full btn-primary py-2 text-sm flex items-center justify-center space-x-2 relative"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span>{showChat ? 'Hide Chat' : 'Open Chat'}</span>
              {unreadCount > 0 && !showChat && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="glass-card rounded-2xl shadow-2xl mt-4 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">Proximity Chat</h3>
                {/* Debug indicator for chat focus */}
                <div className={`w-3 h-3 rounded-full ${showChat ? 'bg-green-400' : 'bg-gray-400'}`} title="Chat Focus Status">
                  {showChat && (
                    <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="p-3 h-48 overflow-y-auto bg-gray-900/50">
              <div className="space-y-2">
                {messages.map((msg, index) => (
                  <div 
                    key={index}
                    className={`p-2 rounded-lg text-sm max-w-[80%] ${
                      msg.type === 'sent' 
                        ? 'bg-purple-600 text-white ml-auto' 
                        : 'bg-gray-700 text-gray-200'
                    }`}
                  >
                    {msg.type === 'received' && (
                      <div className="text-xs text-purple-400 mb-1">
                        {msg.fromPlayer?.name}
                      </div>
                    )}
                    <div>{msg.message}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-purple-500/20">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onFocus={handleChatInputFocus}
                  onBlur={handleChatInputBlur}

                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Video Calls Coming Soon!</h3>
              <p className="text-purple-100 text-sm">
                We're working on bringing you amazing video calling features
              </p>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <p className="text-gray-300 mb-6">
                Video calling with nearby users will be available soon. For now, you can use the proximity chat to communicate!
              </p>
              
              <button
                onClick={() => setShowComingSoonModal(false)}
                className="btn-primary w-full py-3"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
              <p className="text-purple-100 text-sm">
                Connect with Google to access premium features
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-300 text-center">
                Sign in to access advanced features and connect with other users.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleSignIn}
                  className="w-full bg-white text-gray-900 py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-3 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
                
                <button
                  onClick={() => setShowSignInModal(false)}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProximityUI; 