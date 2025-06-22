import React, { useState, useEffect } from 'react';
import Landing from './components/Landing';
import Game from './components/Game';
import ProximityUI from './components/ProximityUI';
import VideoCall, { cleanupVideoCall } from './components/VideoCall';
import Avatar from './components/Avatar';
import io from 'socket.io-client';

function App() {
  const [socket, setSocket] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [nearbyPlayers, setNearbyPlayers] = useState([]);
  const [isInProximity, setIsInProximity] = useState(false);
  const [videoCallUrl, setVideoCallUrl] = useState('');
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [proximityMessages, setProximityMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const [pendingJoin, setPendingJoin] = useState(null);
  const [showHeader, setShowHeader] = useState(false);
  const [videoCallData, setVideoCallData] = useState(null);
  const [isVideoCallRequesting, setIsVideoCallRequesting] = useState(false);
  const [incomingVideoCall, setIncomingVideoCall] = useState(null);

  // Establish socket connection immediately
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // If there's a pending join, execute it now
      if (pendingJoin) {
        console.log('Executing pending join:', pendingJoin);
        newSocket.emit('joinRoom', pendingJoin);
        setPendingJoin(null);
        setShowLanding(false);
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    // Listen for player joined
    newSocket.on('playerJoined', (data) => {
      console.log('Player joined event received:', data);
      if (data.player.socketId === newSocket.id) {
        setCurrentPlayer(data.player);
      }
      setAllPlayers(data.allPlayers);
      if (data.room) {
        setCurrentRoom(data.room);
      }
    });

    // Listen for player movement
    newSocket.on('playerMoved', (data) => {
      setAllPlayers(prev => prev.map(player => 
        player.id === data.player.id ? data.player : player
      ));
      
      if (data.player.socketId === newSocket.id) {
        setNearbyPlayers(data.nearbyPlayers);
      }
    });

    // Listen for proximity events
    newSocket.on('proximityEntered', (data) => {
      setIsInProximity(true);
      setNearbyPlayers(data.nearbyPlayers);
    });

    newSocket.on('proximityExited', () => {
      setIsInProximity(false);
      setNearbyPlayers([]);
    });

    // Listen for player left
    newSocket.on('playerLeft', (data) => {
      setAllPlayers(prev => prev.filter(player => player.id !== data.playerId));
      setNearbyPlayers(prev => prev.filter(player => player.id !== data.playerId));
    });

    // Listen for video call events
    newSocket.on('videoCallRequest', (data) => {
      console.log('Received video call request:', data);
      setIncomingVideoCall(data);
    });

    newSocket.on('videoCallAccepted', (data) => {
      setIsVideoCallRequesting(false);
      setVideoCallData({
        roomUrl: data.roomUrl,
        roomName: data.roomName,
        isDemo: data.isDemo,
        paymentRequired: data.paymentRequired
      });
      setShowVideoCall(true);
      
      // Show message if falling back to demo mode
      if (data.paymentRequired) {
        setTimeout(() => {
          alert('Daily.co account requires payment setup. Using demo mode for video calls.');
        }, 1000);
      }
    });

    newSocket.on('videoCallRejected', (data) => {
      setIsVideoCallRequesting(false);
      alert(`${data.fromPlayer.name} rejected your video call request.`);
    });

    newSocket.on('videoCallError', (data) => {
      setIsVideoCallRequesting(false);
      console.error('Video call error:', data.details);
      
      // Show a more user-friendly error message
      let errorMessage = 'Failed to start video call';
      if (data.details && data.details.includes('400')) {
        errorMessage = 'Video call service temporarily unavailable. Please try again.';
      } else if (data.details && data.details.includes('401')) {
        errorMessage = 'Video call service authentication failed. Please check your API key.';
      } else if (data.details && data.details.includes('429')) {
        errorMessage = 'Too many video calls. Please wait a moment and try again.';
      } else if (data.details && data.details.includes('Invalid room name')) {
        errorMessage = 'Unable to create video call room. Please try again.';
      }
      
      alert(errorMessage);
    });

    // Listen for proximity messages
    newSocket.on('proximityMessage', (data) => {
      setProximityMessages(prev => [...prev, {
        id: Date.now(),
        message: data.message,
        fromPlayer: data.fromPlayer,
        timestamp: new Date(),
        type: 'received'
      }]);
      
      // Remove message after 10 seconds
      setTimeout(() => {
        setProximityMessages(prev => prev.filter(msg => msg.id !== Date.now()));
      }, 10000);
    });

    // Listen for errors
    newSocket.on('error', (data) => {
      console.error('Socket error:', data);
      alert(data.message);
      // Return to landing page on error
      setShowLanding(true);
      setCurrentPlayer(null);
      setAllPlayers([]);
      setCurrentRoom(null);
      setPendingJoin(null);
    });

    return () => {
      newSocket.close();
      // Clean up any video calls when component unmounts
      cleanupVideoCall();
    };
  }, []);

  const handleJoinRoom = (roomId, playerName) => {
    console.log('handleJoinRoom called:', { roomId, playerName, isConnected });
    
    const joinData = { roomId, playerName };
    
    if (socket && isConnected) {
      // Socket is ready, join immediately
      console.log('Socket ready, joining immediately');
      socket.emit('joinRoom', joinData);
      setShowLanding(false);
    } else {
      // Socket not ready yet, store the join data for when it connects
      console.log('Socket not ready, storing pending join');
      setPendingJoin(joinData);
      setConnectionStatus('connecting');
    }
  };

  const handlePlayerMove = (x, y) => {
    if (socket && currentPlayer) {
      socket.emit('playerMove', { x, y });
    }
  };

  const handleVideoCallRequest = (targetPlayerId) => {
    if (isVideoCallRequesting) {
      alert('Video call request already in progress. Please wait.');
      return;
    }
    
    setIsVideoCallRequesting(true);
    socket.emit('requestVideoCall', {
      targetPlayerId
    });
    
    // Reset the requesting state after a timeout
    setTimeout(() => {
      setIsVideoCallRequesting(false);
    }, 5000);
  };

  const handleAcceptVideoCall = () => {
    if (!incomingVideoCall) return;
    
    setVideoCallData({
      roomUrl: incomingVideoCall.roomUrl,
      roomName: incomingVideoCall.roomName,
      isDemo: incomingVideoCall.isDemo,
      fromPlayer: incomingVideoCall.fromPlayer
    });
    setShowVideoCall(true);
    socket.emit('acceptVideoCall', {
      fromPlayerId: incomingVideoCall.fromPlayer.id,
      roomUrl: incomingVideoCall.roomUrl,
      roomName: incomingVideoCall.roomName,
      isDemo: incomingVideoCall.isDemo
    });
    setIncomingVideoCall(null);
  };

  const handleRejectVideoCall = () => {
    if (!incomingVideoCall) return;
    
    socket.emit('rejectVideoCall', {
      fromPlayerId: incomingVideoCall.fromPlayer.id
    });
    setIncomingVideoCall(null);
  };

  const handleSendProximityMessage = (message) => {
    if (socket && nearbyPlayers.length > 0) {
      // Add the sent message to local state immediately
      setProximityMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        message: message,
        fromPlayer: currentPlayer,
        timestamp: new Date(),
        type: 'sent'
      }]);
      
      socket.emit('sendProximityChat', {
        message,
        nearbyPlayerIds: nearbyPlayers.map(p => p.id)
      });
    }
  };

  const handleLeaveRoom = () => {
    // Clean up any active video calls
    cleanupVideoCall();
    
    if (socket) {
      socket.disconnect();
    }
    setSocket(null);
    setCurrentPlayer(null);
    setAllPlayers([]);
    setCurrentRoom(null);
    setShowLanding(true);
    setIsInProximity(false);
    setNearbyPlayers([]);
    setProximityMessages([]);
    setPendingJoin(null);
    setShowHeader(false);
    setVideoCallData(null);
    setShowVideoCall(false);
    setIsVideoCallRequesting(false);
    
    // Reconnect for next use
    window.location.reload();
  };

  const toggleHeader = () => {
    setShowHeader(!showHeader);
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getMapDisplayName = (mapType) => {
    const mapNames = {
      office: 'Modern Office',
      park: 'Central Park',
      cafe: 'Cozy Café',
      campus: 'University Campus',
      beach: 'Tropical Beach',
      space: 'Space Station'
    };
    return mapNames[mapType] || 'Unknown Map';
  };

  // Keyboard shortcuts for UI toggle
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'h' || event.key === 'H') {
        setShowHeader(!showHeader);
      }
      if (event.key === 'Escape') {
        setShowHeader(false);
      }
    };

    if (!showLanding && currentPlayer) {
      window.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [showHeader, showLanding, currentPlayer]);

  if (showLanding) {
    return <Landing onJoinRoom={handleJoinRoom} />;
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Floating Header Toggle Button */}
      {currentPlayer && (
        <button
          onClick={toggleHeader}
          className="fixed top-4 left-4 z-50 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
          title="Toggle Header (H)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18m-9-9v18"/>
          </svg>
        </button>
      )}

      {/* Collapsible Header */}
      {showHeader && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md text-white shadow-2xl border-b border-white/10 transform transition-transform duration-300">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Social
                  </h1>
                  {currentRoom && (
                    <p className="text-xs text-gray-300">{currentRoom.name} • {getMapDisplayName(currentRoom.mapType)}</p>
                  )}
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()} ${isConnected ? 'animate-pulse' : ''}`}></div>
                <span className="text-sm text-gray-300 capitalize">{connectionStatus}</span>
              </div>
              
              {/* Online Players Count */}
              <div className="bg-white/10 rounded-full px-3 py-1">
                <span className="text-sm text-gray-200">{allPlayers.length} online</span>
              </div>

              {/* Room Code Display */}
              {currentRoom?.code && (
                <div className="bg-purple-500/30 text-purple-200 rounded-full px-3 py-1">
                  <span className="text-sm font-medium">Code: {currentRoom.code}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {currentPlayer && (
                <div className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 shadow-sm">
                  <Avatar 
                    avatar={currentPlayer.avatar} 
                    size={32} 
                    name={currentPlayer.name}
                  />
                  <span className="text-sm font-medium text-gray-200">{currentPlayer.name}</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
              )}
              
              {/* Leave Room Button */}
              <button
                onClick={handleLeaveRoom}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg"
              >
                Leave Room
              </button>

              {/* Close Header Button */}
              <button
                onClick={() => setShowHeader(false)}
                className="text-gray-400 hover:text-white p-1"
                title="Hide Header (Esc)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Game Canvas */}
      <div className="relative w-full h-screen">
        {currentPlayer ? (
          <Game 
            currentPlayer={currentPlayer}
            allPlayers={allPlayers}
            onPlayerMove={handlePlayerMove}
            room={currentRoom}
          />
        ) : (
          <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin mx-auto mb-6 flex items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-full"></div>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3">
                {pendingJoin ? 'Connecting...' : 'Joining Room...'}
              </h2>
              <p className="text-gray-300 text-lg">
                {pendingJoin ? 'Establishing connection...' : 'Setting up your avatar...'}
              </p>
              <div className="mt-6 text-sm text-gray-400">
                Status: {connectionStatus}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Proximity UI */}
      {isInProximity && (
        <ProximityUI 
          nearbyPlayers={nearbyPlayers}
          onVideoCall={handleVideoCallRequest}
          onSendMessage={handleSendProximityMessage}
          messages={proximityMessages}
          currentPlayer={currentPlayer}
          isVideoCallRequesting={isVideoCallRequesting}
        />
      )}

      {/* Video Call Request Modal */}
      {incomingVideoCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Incoming Video Call
              </h3>
              
              <p className="text-gray-600 mb-6">
                <span className="font-semibold text-purple-600">{incomingVideoCall.fromPlayer.name}</span> wants to start a video call with you.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleAcceptVideoCall}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Accept
                </button>
                <button
                  onClick={handleRejectVideoCall}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Decline
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                This will open a video call window
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Video Call */}
      {showVideoCall && (
        <VideoCall 
          key={`${videoCallData?.roomUrl}-${Date.now()}`}
          roomUrl={videoCallData?.roomUrl}
          roomName={videoCallData?.roomName}
          isDemo={videoCallData?.isDemo}
          onClose={() => {
            setShowVideoCall(false);
            // Clean up the video call room
            if (socket && videoCallData?.roomName) {
              socket.emit('endVideoCall', {
                roomName: videoCallData.roomName,
                isDemo: videoCallData.isDemo
              });
            }
            // Force global cleanup
            cleanupVideoCall();
            // Reset video call data after a short delay to ensure cleanup
            setTimeout(() => {
              setVideoCallData(null);
            }, 100);
          }}
        />
      )}

      {/* Floating Instructions */}
      <div className="fixed bottom-6 left-6 bg-black/80 backdrop-blur-sm text-white p-4 rounded-xl text-sm max-w-xs shadow-2xl">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-xs">?</span>
          </div>
          <span className="font-semibold">Controls</span>
        </div>
        <div className="space-y-2 text-xs text-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-purple-300">⌨️</span>
            <span>Arrow keys to move</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-purple-300">H</span>
            <span>Toggle header</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-purple-300">ESC</span>
            <span>Hide UI</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-purple-300">👥</span>
            <span>Get close to others to chat</span>
          </div>
        </div>
      </div>

      {/* Floating room info when header is hidden */}
      {!showHeader && currentRoom && (
        <div className="fixed top-4 right-4 bg-black/60 backdrop-blur-sm text-white p-3 rounded-lg text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{currentRoom.name}</span>
            {currentRoom.code && (
              <span className="text-purple-300">({currentRoom.code})</span>
            )}
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {allPlayers.length} players • {getMapDisplayName(currentRoom.mapType)}
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 