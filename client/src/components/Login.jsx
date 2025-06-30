import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { login, loginAsGuest, loading: authLoading } = useAuth();
  const [showGuestLogin, setShowGuestLogin] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = async () => {
    if (!guestName.trim()) {
      alert('Please enter a name');
      return;
    }

    setIsLoading(true);
    const success = await loginAsGuest(guestName.trim());
    if (!success) {
      alert('Failed to login as guest');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-purple-200 rounded-full animate-pulse opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <h1 className="text-4xl font-bold gradient-text">
              Social
            </h1>
          </div>
          <p className="text-gray-300 text-lg">Connect, collaborate, and chat in beautiful virtual spaces</p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-3xl shadow-2xl border border-purple-500/20 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-200 mb-2">Welcome!</h2>
            <p className="text-gray-400">Sign in to start connecting with others</p>
          </div>

          {authLoading || isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className="text-gray-400 mt-2">Loading...</p>
            </div>
          ) : showGuestLogin ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 rounded-xl text-gray-800 placeholder-gray-500 border-0 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleGuestLogin()}
                  autoFocus
                />
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleGuestLogin}
                  disabled={!guestName.trim()}
                  className="w-full btn-primary py-3 disabled:opacity-50"
                >
                  Continue as Guest
                </button>
                <button
                  onClick={() => {
                    setShowGuestLogin(false);
                    setGuestName('');
                  }}
                  className="w-full px-4 py-3 bg-gray-600/20 text-gray-300 rounded-lg hover:bg-gray-600/30 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={login}
                className="w-full btn-primary py-4 text-lg font-semibold"
              >
                <span className="mr-2">🔐</span>
                Sign in with Google
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gray-900 px-4 text-gray-400">or</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowGuestLogin(true)}
                className="w-full px-4 py-3 bg-gray-600/20 text-gray-300 rounded-lg hover:bg-gray-600/30 transition-colors border border-gray-500/30"
              >
                <span className="mr-2">👤</span>
                Continue as Guest
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 