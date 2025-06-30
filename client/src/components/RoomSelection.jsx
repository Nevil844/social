import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserProfile, { UserAvatar } from './UserProfile';

const RoomSelection = ({ onJoinRoom }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('join');
  const [publicRooms, setPublicRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [createRoomData, setCreateRoomData] = useState({
    name: '',
    isPrivate: false,
    maxPlayers: 20,
    mapType: 'office'
  });
  const [createdRoomCode, setCreatedRoomCode] = useState(null);

  const mapTypes = [
    {
      id: 'office',
      name: 'Modern Office',
      description: 'A sleek modern office environment',
      preview: '🏢',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'park',
      name: 'Central Park',
      description: 'Beautiful outdoor park setting',
      preview: '🌳',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'cafe',
      name: 'Cozy Café',
      description: 'Warm and inviting café atmosphere',
      preview: '☕',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 'campus',
      name: 'University Campus',
      description: 'Academic campus environment',
      preview: '🎓',
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'beach',
      name: 'Tropical Beach',
      description: 'Relaxing beachside location',
      preview: '🏖️',
      color: 'from-cyan-500 to-blue-600'
    },
    {
      id: 'space',
      name: 'Space Station',
      description: 'Futuristic space environment',
      preview: '🚀',
      color: 'from-gray-500 to-slate-600'
    }
  ];

  useEffect(() => {
    if (user && user.name) {
      setPlayerName(user.name);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.preferences) {
      setCreateRoomData(prev => ({
        ...prev,
        maxPlayers: user.preferences.defaultMaxPlayers || 20,
        mapType: user.preferences.defaultMap || 'office'
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchPublicRooms();
  }, []);

  const fetchPublicRooms = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/rooms');
      const rooms = await response.json();
      setPublicRooms(rooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (!createRoomData.name.trim()) {
      alert('Please enter a room name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createRoomData,
          creatorId: user.id
        }),
      });

      const room = await response.json();
      
      // If it's a private room, show the room code first
      if (room.isPrivate && room.code) {
        setCreatedRoomCode(room.code);
        // Don't join immediately, let user see the code
        return;
      }
      
      // For public rooms, join immediately
      onJoinRoom(room.id, playerName);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCreatedRoom = () => {
    if (createdRoomCode) {
      // Find the room by code and join
      fetch(`http://localhost:3001/api/rooms/${createdRoomCode}`)
        .then(response => response.json())
        .then(room => {
          onJoinRoom(room.id, playerName);
          setCreatedRoomCode(null);
        })
        .catch(error => {
          console.error('Failed to join created room:', error);
          alert('Failed to join room');
        });
    }
  };

  const handleJoinByCode = async () => {
    if (!roomCode.trim()) {
      alert('Please enter a room code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/rooms/${roomCode}`);
      if (response.ok) {
        const room = await response.json();
        onJoinRoom(room.id, playerName);
      } else {
        alert('Room not found');
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPublicRoom = (roomId) => {
    onJoinRoom(roomId, playerName);
  };

  return (
    <div className="min-h-screen animated-bg p-4 overflow-y-auto">
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

      <div className="relative z-10 w-full max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl sm:text-2xl">S</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold gradient-text">
              Social
            </h1>
          </div>
          <p className="text-gray-300 text-sm sm:text-lg px-4">Connect, collaborate, and chat in beautiful virtual spaces</p>
          
          {/* User Section */}
          <div className="mt-6 flex justify-center items-center space-x-4">
            <div className="flex items-center space-x-3">
              <UserAvatar user={user} size="sm" />
              <span className="text-gray-200 font-medium">
                {user?.name}
                {user?.isGuest && <span className="text-gray-400 text-sm ml-1">(Guest)</span>}
              </span>
              <button
                onClick={() => setShowProfile(true)}
                className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-colors border border-purple-500/30"
              >
                Profile
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors border border-red-500/30"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl shadow-2xl border border-purple-500/20 overflow-hidden">
          {/* Player Name Input */}
          <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <div className="max-w-md mx-auto">
              <label className="block text-sm font-medium mb-2">Your Display Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 rounded-xl text-gray-800 placeholder-gray-500 border-0 focus:ring-2 focus:ring-white/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-purple-500/20">
            {[
              { id: 'join', label: 'Join Room', icon: '🚪' },
              { id: 'create', label: 'Create Room', icon: '➕' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                    : 'text-gray-300 hover:text-gray-100 hover:bg-purple-500/5'
                }`}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'join' && (
              <div className="space-y-6">
                {/* Join by Code */}
                <div className="card-dark rounded-2xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-200">
                    <span className="mr-2">🔐</span>
                    Join Private Room
                  </h3>
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="Enter room code..."
                      className="flex-1 input-dark rounded-xl"
                      maxLength={6}
                    />
                    <button
                      onClick={handleJoinByCode}
                      disabled={loading || !roomCode.trim() || !playerName.trim()}
                      className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Joining...' : 'Join'}
                    </button>
                  </div>
                </div>

                {/* Public Rooms */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-200">
                    <span className="mr-2">🌐</span>
                    Public Rooms
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {publicRooms.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">🏠</div>
                        <p>No public rooms available</p>
                        <p className="text-sm">Create the first one!</p>
                      </div>
                    ) : (
                      publicRooms.map(room => {
                        const mapInfo = mapTypes.find(m => m.id === room.mapType) || mapTypes[0];
                        return (
                          <div key={room.id} className="card-dark rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className={`h-24 bg-gradient-to-r ${mapInfo.color} rounded-t-xl flex items-center justify-center text-4xl`}>
                              {mapInfo.preview}
                            </div>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-200 mb-1">{room.name}</h4>
                              <p className="text-sm text-gray-400 mb-2">{mapInfo.name}</p>
                              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                                <span>{room.playerCount}/{room.maxPlayers} players</span>
                                <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                              </div>
                              <button
                                onClick={() => handleJoinPublicRoom(room.id)}
                                disabled={!playerName.trim()}
                                className="w-full btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Join Room
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'create' && (
              <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
                {/* Room Code Display */}
                {createdRoomCode && (
                  <div className="card-dark border border-green-500/30 rounded-2xl p-4 sm:p-6 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white text-xl sm:text-2xl">🎉</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-200 mb-2">Room Created Successfully!</h3>
                    <p className="text-gray-400 mb-4 text-sm sm:text-base">Share this code with others to invite them to your private room:</p>
                    
                    <div className="bg-gray-800/50 rounded-xl p-4 border-2 border-green-500/30 mb-4">
                      <div className="text-xl sm:text-2xl font-bold text-green-400 tracking-wider">{createdRoomCode}</div>
                      <p className="text-sm text-gray-500 mt-1">Room Code</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(createdRoomCode);
                          alert('Room code copied to clipboard!');
                        }}
                        className="flex-1 btn-primary py-3 px-6"
                      >
                        📋 Copy Code
                      </button>
                      <button
                        onClick={handleJoinCreatedRoom}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        🚪 Join Room
                      </button>
                    </div>
                    
                    <button
                      onClick={() => setCreatedRoomCode(null)}
                      className="text-gray-400 hover:text-gray-300 text-sm mt-4 underline"
                    >
                      Create Another Room
                    </button>
                  </div>
                )}

                {/* Room Settings */}
                {!createdRoomCode && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Room Name</label>
                      <input
                        type="text"
                        value={createRoomData.name}
                        onChange={(e) => setCreateRoomData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter room name..."
                        className="w-full input-dark rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Map Type</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {mapTypes.map(map => (
                          <button
                            key={map.id}
                            onClick={() => setCreateRoomData(prev => ({ ...prev, mapType: map.id }))}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              createRoomData.mapType === map.id
                                ? 'border-purple-500 bg-purple-500/20'
                                : 'border-gray-600 hover:border-gray-500'
                            }`}
                          >
                            <div className="text-2xl mb-1">{map.preview}</div>
                            <div className="text-sm font-medium text-gray-200">{map.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Max Players</label>
                        <select
                          value={createRoomData.maxPlayers}
                          onChange={(e) => setCreateRoomData(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                          className="w-full input-dark rounded-xl"
                        >
                          <option value={5}>5 players</option>
                          <option value={10}>10 players</option>
                          <option value={20}>20 players</option>
                          <option value={50}>50 players</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Privacy</label>
                        <select
                          value={createRoomData.isPrivate}
                          onChange={(e) => setCreateRoomData(prev => ({ ...prev, isPrivate: e.target.value === 'true' }))}
                          className="w-full input-dark rounded-xl"
                        >
                          <option value={false}>Public</option>
                          <option value={true}>Private</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleCreateRoom}
                      disabled={loading || !createRoomData.name.trim() || !playerName.trim()}
                      className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating...' : `Create ${createRoomData.isPrivate ? 'Private' : 'Public'} Room`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && user && (
        <UserProfile 
          user={user} 
          onClose={() => setShowProfile(false)} 
        />
      )}
    </div>
  );
};

export default RoomSelection; 