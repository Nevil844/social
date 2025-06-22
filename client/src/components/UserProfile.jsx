import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative glass-card rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Profile Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4 purple-glow">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold gradient-text mb-1">{user?.name || 'User'}</h2>
          <p className="text-gray-400 text-sm">{user?.email}</p>
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card-dark text-center">
            <div className="text-2xl font-bold gradient-text">20</div>
            <div className="text-gray-400 text-sm">Daily Minutes</div>
          </div>
          <div className="card-dark text-center">
            <div className="text-2xl font-bold gradient-text">Free</div>
            <div className="text-gray-400 text-sm">Plan</div>
          </div>
        </div>

        {/* Usage Info */}
        <div className="card-dark mb-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-3">Video Call Usage</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Daily Limit</span>
              <span className="text-purple-400 font-medium">20 minutes</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Used Today</span>
              <span className="text-purple-400 font-medium">0 minutes</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>

        {/* Premium Upgrade */}
        <div className="card-dark mb-6 border border-purple-500/30">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Upgrade to Premium</h3>
            <p className="text-gray-400 text-sm mb-4">
              Get unlimited video calls, priority support, and advanced features
            </p>
            <button className="btn-primary w-full">
              Coming Soon
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={logout}
            className="w-full px-4 py-3 bg-red-600/20 text-red-300 rounded-xl hover:bg-red-600/30 transition-colors border border-red-500/30"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 