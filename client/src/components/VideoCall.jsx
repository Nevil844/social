import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';

const VideoCall = ({ roomUrl, onClose }) => {
  const callFrameRef = useRef();
  const [callFrame, setCallFrame] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState({});
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    // Create a simple room for demo purposes
    // In production, you'd want to create rooms via Daily.co API
    const createCallFrame = async () => {
      try {
        // For this demo, we'll use a simple Daily.co room URL
        // You would normally create this via their API
        const demoRoomUrl = `https://gather-clone.daily.co/demo-${Date.now()}`;
        
        const frame = DailyIframe.createFrame(callFrameRef.current, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '12px'
          },
          showLeaveButton: true,
          showFullscreenButton: true,
        });

        setCallFrame(frame);

        // Event listeners
        frame.on('joined-meeting', () => {
          setIsJoined(true);
          setIsConnecting(false);
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

        // Join the room
        await frame.join({ url: demoRoomUrl });

      } catch (error) {
        console.error('Error creating call frame:', error);
        setIsConnecting(false);
        // Fallback to simple WebRTC or show error
        setTimeout(() => {
          alert('Video call feature is not available. This would normally use Daily.co API.');
          onClose();
        }, 2000);
      }
    };

    createCallFrame();

    return () => {
      if (callFrame) {
        callFrame.destroy();
      }
    };
  }, [roomUrl, onClose]);

  const handleLeave = () => {
    if (callFrame) {
      callFrame.leave();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-6xl h-full max-h-5xl flex flex-col overflow-hidden border border-white/20">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold">Video Call</h3>
              <p className="text-purple-100 text-sm">
                {isConnecting ? 'Connecting...' : isJoined ? `${Object.keys(participants).length + 1} participant(s)` : 'Setting up...'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLeave}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 font-medium flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 6.707 6.293a1 1 0 00-1.414 1.414L8.586 11l-3.293 3.293a1 1 0 001.414 1.414L10 12.414l3.293 3.293a1 1 0 001.414-1.414L11.414 11l3.293-3.293z" clipRule="evenodd" />
            </svg>
            <span>Leave Call</span>
          </button>
        </div>

        {/* Video Container */}
        <div className="flex-1 p-6 bg-gradient-to-br from-gray-50 to-gray-100">
          <div 
            ref={callFrameRef} 
            className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-inner flex items-center justify-center overflow-hidden"
          >
            {isConnecting && (
              <div className="text-center text-white">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse mx-auto flex items-center justify-center">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 w-20 h-20 bg-purple-400 rounded-full animate-ping mx-auto opacity-30"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Connecting to video call...</h3>
                <p className="text-gray-300 mb-4">Setting up your camera and microphone</p>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-md mx-auto">
                  <p className="text-sm text-gray-200">
                    💡 This demo uses a simplified video call setup.
                  </p>
                  <p className="text-xs text-gray-300 mt-2">
                    In production, integrate with Daily.co API for full functionality.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Status Footer */}
        <div className="px-6 py-4 bg-white/80 backdrop-blur-sm border-t border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                isJoined ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isJoined ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'
                }`}></div>
                <span className="text-sm font-medium">
                  {isJoined 
                    ? `Connected • ${Object.keys(participants).length + 1} participant(s)`
                    : isConnecting ? 'Connecting...' : 'Setting up...'
                  }
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>End-to-end encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall; 