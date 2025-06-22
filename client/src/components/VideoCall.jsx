import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { useAuth } from '../contexts/AuthContext';

// Singleton pattern for DailyIframe
class DailyIframeSingleton {
  constructor() {
    this.instance = null;
    this.isInitializing = false;
    this.initializationPromise = null;
  }

  async initialize(element, options) {
    // If already initializing, wait for that to complete
    if (this.isInitializing) {
      return this.initializationPromise;
    }

    // If instance exists, destroy it first
    if (this.instance) {
      await this.destroy();
    }

    this.isInitializing = true;
    this.initializationPromise = this._createInstance(element, options);
    
    try {
      const result = await this.initializationPromise;
      return result;
    } finally {
      this.isInitializing = false;
      this.initializationPromise = null;
    }
  }

  async _createInstance(element, options) {
    // Wait a bit to ensure any previous instance is fully cleaned up
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      this.instance = DailyIframe.createFrame(element, options);
      return this.instance;
    } catch (error) {
      console.error('Error creating DailyIframe instance:', error);
      this.instance = null;
      throw error;
    }
  }

  async destroy() {
    if (this.instance) {
      try {
        await this.instance.leave();
        this.instance.destroy();
      } catch (error) {
        console.log('Error destroying DailyIframe instance:', error);
      } finally {
        this.instance = null;
      }
    }
  }

  getInstance() {
    return this.instance;
  }
}

// Global singleton
const dailySingleton = new DailyIframeSingleton();

// Global cleanup function
export const cleanupVideoCall = () => {
  return dailySingleton.destroy();
};

const VideoCall = ({ roomUrl, roomName, isDemo = false, onClose }) => {
  const { user, isAuthenticated, getVideoCallLimits } = useAuth();
  const callFrameRef = useRef();
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState({});
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState(null);
  const [limits, setLimits] = useState(null);

  useEffect(() => {
    // Load video call limits for authenticated users
    if (isAuthenticated) {
      loadVideoCallLimits();
    }
  }, [isAuthenticated]);

  const loadVideoCallLimits = async () => {
    const limitsData = await getVideoCallLimits();
    setLimits(limitsData);
  };

  useEffect(() => {
    const createCallFrame = async () => {
      try {
        // Check if user is authenticated
        if (!isAuthenticated) {
          setError('Authentication required');
          setIsConnecting(false);
          setTimeout(() => {
            alert('Please sign in with Google to use video calls.');
            onClose();
          }, 1000);
          return;
        }

        // Check video call limits for authenticated users
        if (limits && !limits.canMakeCall) {
          setError('Video call limit exceeded');
          setIsConnecting(false);
          setTimeout(() => {
            alert(`You've reached your daily video call limit (${limits.videoCallLimit} minutes). Premium features coming soon!`);
            onClose();
          }, 1000);
          return;
        }

        // For demo mode, we'll use a simple Daily.co room URL
        // For real mode, we'll use the provided roomUrl
        const demoRoomUrl = `https://social.daily.co/demo-${Date.now()}`;
        const finalRoomUrl = isDemo ? demoRoomUrl : roomUrl;
        
        if (!finalRoomUrl) {
          throw new Error('No room URL provided');
        }
        
        // Initialize the singleton
        const frame = await dailySingleton.initialize(callFrameRef.current, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '12px'
          },
          showLeaveButton: true,
          showFullscreenButton: true,
        });

        if (!frame) {
          throw new Error('Failed to create DailyIframe instance');
        }

        // Event listeners
        frame.on('joined-meeting', () => {
          setIsJoined(true);
          setIsConnecting(false);
          setError(null);
          
          // Update limits after successful join
          if (isAuthenticated) {
            loadVideoCallLimits();
          }
        });

        frame.on('left-meeting', () => {
          setIsJoined(false);
          onClose();
        });

        frame.on('participant-joined', (event) => {
          setParticipants(prev => ({
            ...prev,
            [event.participant.session_id]: event.participant
          }));
        });

        frame.on('participant-left', (event) => {
          setParticipants(prev => {
            const updated = { ...prev };
            delete updated[event.participant.session_id];
            return updated;
          });
        });

        frame.on('error', (event) => {
          console.error('Daily.co frame error:', event);
          setError(event.errorMsg || 'Video call error occurred');
          setIsConnecting(false);
          
          // Handle specific errors
          if (event.errorMsg === 'account-missing-payment-method') {
            alert('Daily.co account requires payment setup. Video calls will use demo mode.');
            onClose();
          }
        });

        // Join the room
        await frame.join({ url: finalRoomUrl });

      } catch (error) {
        console.error('Error creating call frame:', error);
        setIsConnecting(false);
        setError(error.message || 'Failed to create video call');
        
        // Show error message
        setTimeout(() => {
          if (isDemo) {
            alert('Demo video call feature is not available. This would normally use Daily.co API.');
          } else {
            alert(`Video call error: ${error.message || 'Failed to join video call'}`);
          }
          onClose();
        }, 2000);
      }
    };

    createCallFrame();

    return () => {
      // Component cleanup - don't destroy here, let the next instance handle it
    };
  }, [roomUrl, isDemo, onClose, isAuthenticated, limits]);

  const handleLeave = () => {
    cleanupVideoCall();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Video Call Container */}
      <div className="relative glass-card rounded-2xl w-full max-w-6xl h-[80vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold gradient-text">Video Call</h3>
              <p className="text-sm text-gray-400">
                {isDemo ? 'Demo Mode' : 'Live Call'} • {Object.keys(participants).length} participants
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLeave}
            className="px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors border border-red-500/30 text-sm"
          >
            Leave Call
          </button>
        </div>

        {/* Video Content */}
        <div className="flex-1 relative">
          {isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm z-10">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center animate-spin">
                  <div className="w-12 h-12 bg-gray-900 rounded-full"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-200 mb-2">Connecting...</h3>
                <p className="text-gray-400">Joining video call room</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm z-10">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-200 mb-2">Connection Error</h3>
                <p className="text-gray-400 mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="btn-primary px-6 py-2"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Daily.co iframe */}
          <div 
            ref={callFrameRef} 
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* Footer with limits info */}
        {isAuthenticated && limits && (
          <div className="p-4 border-t border-purple-500/20 bg-gray-900/30">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-400">Daily Usage:</span>
                <span className="text-purple-400 font-medium">
                  {limits.videoCallMinutes}/{limits.videoCallLimit} minutes
                </span>
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(limits.videoCallMinutes / limits.videoCallLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
              {isDemo && (
                <span className="text-yellow-400 text-xs font-medium">
                  Demo Mode
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall; 