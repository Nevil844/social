import React from 'react';
import { useAuth } from '../contexts/AuthContext';

// Reusable UserAvatar component
const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl',
    lg: 'w-24 h-24 text-3xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center ${sizeClass} ${className}`}>
      <span className="text-white font-bold">
        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
      </span>
    </div>
  );
};

const UserProfile = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative glass-card rounded-2xl p-4 sm:p-6 lg:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Profile Header */}
        <div className="text-center mb-4 sm:mb-6 pt-2">
          <div className="inline-block mb-3 sm:mb-4 purple-glow">
            <UserAvatar user={user} size="md" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold gradient-text mb-1">{user?.name || 'User'}</h2>
          <p className="text-gray-400 text-xs sm:text-sm break-words">{user?.email}</p>
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="card-dark text-center p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold gradient-text">20</div>
            <div className="text-gray-400 text-xs sm:text-sm">Daily Minutes</div>
          </div>
          <div className="card-dark text-center p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold gradient-text">Free</div>
            <div className="text-gray-400 text-xs sm:text-sm">Plan</div>
          </div>
        </div>

        {/* Usage Info */}
        <div className="card-dark mb-4 sm:mb-6 p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-200 mb-3">Video Call Usage</h3>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Daily Limit</span>
              <span className="text-purple-400 font-medium text-sm">20 minutes</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Used Today</span>
              <span className="text-purple-400 font-medium text-sm">0 minutes</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>

        {/* Premium Upgrade */}
        <div className="card-dark mb-4 sm:mb-6 border border-purple-500/30 p-3 sm:p-4">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-2 sm:mb-3 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-200 mb-2">Upgrade to Premium</h3>
            <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
              Get unlimited video calls, priority support, and advanced features
            </p>
            <button className="btn-primary w-full text-sm sm:text-base py-2 sm:py-3">
              Coming Soon
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 sm:space-y-3">
          <button
            onClick={logout}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-red-600/20 text-red-300 rounded-xl hover:bg-red-600/30 transition-colors border border-red-500/30 text-sm sm:text-base"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
export { UserAvatar }; 