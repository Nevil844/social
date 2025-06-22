import React, { useState, useRef, useEffect } from 'react';
import Avatar from './Avatar';

const ProximityUI = ({ nearbyPlayers, onVideoCall, onSendMessage, messages, currentPlayer, isVideoCallRequesting = false }) => {
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      onSendMessage(chatMessage.trim());
      setChatMessage('');
    }
  };

  const handleVideoCall = (playerId) => {
    onVideoCall(playerId);
  };

  return (
    <div className="fixed top-24 right-6 z-40 animate-in slide-in-from-right duration-300">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden max-w-sm">
        {/* Proximity Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-white rounded-full animate-ping"></div>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">People Nearby</h3>
              <p className="text-emerald-100 text-xs">
                {nearbyPlayers.length} player{nearbyPlayers.length > 1 ? 's' : ''} in range
              </p>
            </div>
          </div>
        </div>

        {/* Nearby Players List */}
        <div className="p-4 space-y-3">
          {nearbyPlayers.map(player => (
            <div key={player.id} className="group">
              <div className="flex items-center justify-between p-3 bg-gray-50/80 hover:bg-gray-100/80 rounded-xl transition-all duration-200 hover:shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="relative transition-transform group-hover:scale-105">
                    <Avatar 
                      avatar={player.avatar} 
                      size={40} 
                      name={player.name}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-800">{player.name}</span>
                    <p className="text-xs text-gray-500">Online now</p>
                  </div>
                </div>
                <button
                  onClick={() => handleVideoCall(player.id)}
                  disabled={isVideoCallRequesting}
                  className={`${
                    isVideoCallRequesting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:scale-105'
                  } text-white p-2 rounded-lg transition-all duration-200 hover:shadow-lg group`}
                  title={isVideoCallRequesting ? "Video call request in progress..." : "Start video call"}
                >
                  {isVideoCallRequesting ? (
                    <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Toggle */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] flex items-center justify-center space-x-2 font-medium"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span>{showChat ? 'Close Chat' : 'Open Chat'}</span>
            {messages.length > 0 && !showChat && (
              <div className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
                {messages.length}
              </div>
            )}
          </button>
        </div>

        {/* Enhanced Chat Interface */}
        {showChat && (
          <div className="border-t border-gray-200/50 bg-white/50">
            {/* Messages */}
            <div className="h-48 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">No messages yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start a conversation!</p>
                </div>
              ) : (
                messages.map(message => (
                  <div key={message.id} className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs ${message.type === 'sent' ? 'order-2' : 'order-1'}`}>
                      <div className={`rounded-2xl px-4 py-2 ${
                        message.type === 'sent' 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <Avatar 
                            avatar={message.fromPlayer.avatar} 
                            size={16} 
                          />
                          <span className={`text-xs font-medium ${
                            message.type === 'sent' ? 'text-white/90' : 'text-gray-600'
                          }`}>
                            {message.type === 'sent' ? 'You' : message.fromPlayer.name}
                          </span>
                          <span className={`text-xs ${
                            message.type === 'sent' ? 'text-white/70' : 'text-gray-400'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{message.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200/50">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 placeholder-gray-400"
                  maxLength={200}
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-300 text-white px-4 py-3 rounded-xl transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProximityUI; 