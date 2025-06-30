import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import RoomSelection from './components/RoomSelection';
import Game from './components/Game';
import ProximityUI from './components/ProximityUI';
import VideoCall from './components/VideoCall';
import Avatar from './components/Avatar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserAvatar } from './components/UserProfile';
import io from 'socket.io-client';

function AppContent() {
  const { user, token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [nearbyPlayers, setNearbyPlayers] = useState([]);
  const [isInProximity, setIsInProximity] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [proximityMessages, setProximityMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showLanding, setShowLanding] = useState(true);
  const [pendingJoin, setPendingJoin] = useState(null);
  const [showHeader, setShowHeader] = useState(false);
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);

  // Establish socket connection immediately
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Authenticate socket if user is logged in
      if (isAuthenticated && token) {
        newSocket.emit('authenticate', token);
      }
      
      // If there's a pending join, execute it now
      if (pendingJoin) {
        console.log('Executing pending join:', pendingJoin);
        newSocket.emit('joinRoom', pendingJoin);
        setPendingJoin(null);
        setShowLanding(false);
      }
    });

    newSocket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
    });

    newSocket.on('authError', (data) => {
      console.error('Socket authentication failed:', data);
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
    };
  }, [isAuthenticated, token, pendingJoin]);

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
    
    // Reconnect for next use
    window.location.reload();
  };

  const toggleHeader = () => {
    setShowHeader(!showHeader);
  };

  const handleChatFocusChange = (isFocused) => {
    setIsChatInputFocused(isFocused);
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

  // Authentication-first flow
  if (!isAuthenticated) {
    return <Login />;
  }

  if (showLanding) {
    return <RoomSelection onJoinRoom={handleJoinRoom} />;
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
        <div className="fixed top-0 left-0 right-0 z-40 glass-card text-white shadow-2xl border-b border-purple-500/20 transform transition-transform duration-300">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold gradient-text">
                    Social
                  </h1>
                  {currentRoom && (
                    <p className="text-xs text-gray-300">{currentRoom.name} • {getMapDisplayName(currentRoom.mapType)}</p>
                  )}
                </div>
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
                <UserAvatar 
                  user={{ 
                    name: currentPlayer.name, 
                    picture: currentPlayer.picture 
                  }} 
                  size="sm" 
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
      )}

      {/* Full Screen Game Canvas */}
      <div className="relative w-full h-screen">
        {currentPlayer ? (
          <Game
            currentPlayer={currentPlayer}
            allPlayers={allPlayers}
            onPlayerMove={handlePlayerMove}
            room={currentRoom}
            isChatInputFocused={isChatInputFocused}
          />
        ) : (
          <div className="h-screen flex items-center justify-center animated-bg">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin mx-auto mb-6 flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-900 rounded-full"></div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-200 mb-3">
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
          onSendMessage={handleSendProximityMessage}
          messages={proximityMessages}
          currentPlayer={currentPlayer}
          onChatFocusChange={handleChatFocusChange}
        />
      )}

      {/* Video Call Coming Soon Modal */}
      {showVideoCall && (
        <VideoCall 
          onClose={() => {
            setShowVideoCall(false);
          }}
        />
      )}

      {/* Floating Instructions */}
      <div className="fixed bottom-6 left-6 glass-card text-white p-4 rounded-xl text-sm max-w-xs shadow-2xl">
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
        <div className="fixed top-4 right-4 glass-card text-white p-3 rounded-lg text-sm">
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 