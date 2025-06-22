// Load environment variables
require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fetch = require('node-fetch');

// Daily.co API configuration
const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

// Validate Daily.co API key
if (!DAILY_API_KEY) {
  console.warn('⚠️  DAILY_API_KEY not found. Video calls will use demo mode.');
}

// Daily.co API helper functions
async function createDailyRoom(roomName, maxParticipants = 10) {
  if (!DAILY_API_KEY) {
    // Return a demo room URL for development
    return {
      url: `https://gather-clone.daily.co/demo-${Date.now()}`,
      name: roomName,
      isDemo: true
    };
  }

  try {
    // Clean and validate room name (Daily.co has specific requirements)
    const cleanRoomName = roomName
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace invalid chars with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .toLowerCase()
      .substring(0, 50); // Limit length
    
    if (!cleanRoomName) {
      throw new Error('Invalid room name after cleaning');
    }

    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: cleanRoomName,
        privacy: 'private',
        properties: {
          max_participants: maxParticipants,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.round(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiry
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Daily.co API response:', errorText);
      
      // Check for payment-related errors
      if (response.status === 402 || errorText.includes('payment')) {
        console.warn('Daily.co account requires payment setup. Falling back to demo mode.');
        return {
          url: `https://gather-clone.daily.co/demo-${Date.now()}`,
          name: roomName,
          isDemo: true,
          paymentRequired: true
        };
      }
      
      throw new Error(`Daily.co API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const room = await response.json();
    return {
      url: room.url,
      name: room.name,
      id: room.id,
      isDemo: false
    };
  } catch (error) {
    console.error('Error creating Daily.co room:', error);
    
    // If it's a payment-related error, fall back to demo mode
    if (error.message.includes('payment') || error.message.includes('402')) {
      console.warn('Falling back to demo mode due to payment issues');
      return {
        url: `https://gather-clone.daily.co/demo-${Date.now()}`,
        name: roomName,
        isDemo: true,
        paymentRequired: true
      };
    }
    
    throw error;
  }
}

async function deleteDailyRoom(roomName) {
  if (!DAILY_API_KEY || !roomName) return;

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (response.ok) {
      console.log(`Deleted Daily.co room: ${roomName}`);
    }
  } catch (error) {
    console.error('Error deleting Daily.co room:', error);
  }
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:5173"
}));
app.use(express.json());

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Store rooms and players
const rooms = new Map();
const players = new Map();

// Generate random player names
const adjectives = ['Happy', 'Brave', 'Swift', 'Clever', 'Gentle', 'Mighty', 'Cosmic', 'Golden', 'Silver', 'Crimson'];
const animals = ['Fox', 'Wolf', 'Eagle', 'Tiger', 'Bear', 'Rabbit', 'Falcon', 'Lion', 'Panda', 'Dragon'];

function generatePlayerName() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adjective}${animal}${number}`;
}

function getRandomColor() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomAvatar() {
  const avatars = [
    { 
      skinTone: '#FDBCB4', 
      hairColor: '#8B4513', 
      shirtColor: '#4F46E5', 
      gender: 'male',
      hairStyle: 'short'
    },
    { 
      skinTone: '#F1C27D', 
      hairColor: '#000000', 
      shirtColor: '#EC4899', 
      gender: 'female',
      hairStyle: 'long'
    },
    { 
      skinTone: '#E0AC69', 
      hairColor: '#FFD700', 
      shirtColor: '#10B981', 
      gender: 'male',
      hairStyle: 'curly'
    },
    { 
      skinTone: '#C68642', 
      hairColor: '#8B0000', 
      shirtColor: '#F59E0B', 
      gender: 'female',
      hairStyle: 'braids'
    },
    { 
      skinTone: '#8D5524', 
      hairColor: '#000000', 
      shirtColor: '#8B5CF6', 
      gender: 'male',
      hairStyle: 'fade'
    },
    { 
      skinTone: '#FFDBAC', 
      hairColor: '#CD853F', 
      shirtColor: '#EF4444', 
      gender: 'female',
      hairStyle: 'bob'
    }
  ];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

function calculateDistance(pos1, pos2) {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

function createRoom(name, isPrivate, maxPlayers, mapType, creatorId) {
  const roomId = uuidv4();
  const roomCode = isPrivate ? generateRoomCode() : null;
  
  const room = {
    id: roomId,
    name: name,
    code: roomCode,
    isPrivate: isPrivate,
    maxPlayers: maxPlayers,
    mapType: mapType,
    createdAt: new Date(),
    creatorId: creatorId,
    players: new Map()
  };
  
  rooms.set(roomId, room);
  return room;
}

// API Routes
app.get('/api/rooms', (req, res) => {
  const publicRooms = Array.from(rooms.values())
    .filter(room => !room.isPrivate)
    .map(room => ({
      id: room.id,
      name: room.name,
      mapType: room.mapType,
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers,
      createdAt: room.createdAt
    }));
  
  res.json(publicRooms);
});

app.post('/api/rooms', (req, res) => {
  const { name, isPrivate, maxPlayers, mapType, creatorId } = req.body;
  
  if (!name || !mapType || !creatorId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const room = createRoom(name, isPrivate, maxPlayers || 20, mapType, creatorId);
  
  res.json({
    id: room.id,
    name: room.name,
    code: room.code,
    isPrivate: room.isPrivate,
    maxPlayers: room.maxPlayers,
    mapType: room.mapType
  });
});

app.get('/api/rooms/:code', (req, res) => {
  const roomCode = req.params.code.toUpperCase();
  const room = Array.from(rooms.values()).find(r => r.code === roomCode);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    id: room.id,
    name: room.name,
    mapType: room.mapType,
    playerCount: room.players.size,
    maxPlayers: room.maxPlayers
  });
});

// Video Call API Routes
app.post('/api/video-calls/create', async (req, res) => {
  try {
    const { roomName, maxParticipants } = req.body;
    
    if (!roomName) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const dailyRoom = await createDailyRoom(roomName, maxParticipants || 10);
    
    res.json({
      success: true,
      room: dailyRoom
    });
  } catch (error) {
    console.error('Error creating video call:', error);
    res.status(500).json({ 
      error: 'Failed to create video call',
      details: error.message 
    });
  }
});

app.delete('/api/video-calls/:roomName', async (req, res) => {
  try {
    const { roomName } = req.params;
    await deleteDailyRoom(roomName);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting video call:', error);
    res.status(500).json({ 
      error: 'Failed to delete video call',
      details: error.message 
    });
  }
});

// Catch-all handler for React app (serve index.html for non-API routes)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('joinRoom', (data) => {
    const { roomId, playerName } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    if (room.players.size >= room.maxPlayers) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }
    
    // Initialize new player
    const playerId = uuidv4();
    const name = playerName || generatePlayerName();
    const avatar = getRandomAvatar();
    
    const newPlayer = {
      id: playerId,
      socketId: socket.id,
      name: name,
      avatar: avatar,
      x: Math.random() * 800 + 100, // Random spawn position
      y: Math.random() * 600 + 100,
      roomId: roomId,
      isInProximity: false
    };

    // Add player to room and global players map
    room.players.set(socket.id, newPlayer);
    players.set(socket.id, newPlayer);
    
    // Join socket room
    socket.join(roomId);

    // Send player data to the connecting client
    socket.emit('playerJoined', {
      player: newPlayer,
      room: {
        id: room.id,
        name: room.name,
        mapType: room.mapType,
        playerCount: room.players.size,
        code: room.code
      },
      allPlayers: Array.from(room.players.values())
    });

    // Notify other players in the room about the new player
    socket.to(roomId).emit('playerJoined', {
      player: newPlayer,
      room: {
        id: room.id,
        name: room.name,
        mapType: room.mapType,
        playerCount: room.players.size,
        code: room.code
      },
      allPlayers: Array.from(room.players.values())
    });
  });

  // Handle player movement
  socket.on('playerMove', (data) => {
    const player = players.get(socket.id);
    if (player) {
      const room = rooms.get(player.roomId);
      if (room) {
        player.x = data.x;
        player.y = data.y;
        
        // Check proximity with other players in the same room
        const nearbyPlayers = [];
        room.players.forEach((otherPlayer, otherSocketId) => {
          if (otherSocketId !== socket.id) {
            const distance = calculateDistance(player, otherPlayer);
            if (distance <= 80) { // 80px proximity threshold
              nearbyPlayers.push(otherPlayer);
            }
          }
        });

        // Update proximity status
        const wasInProximity = player.isInProximity;
        player.isInProximity = nearbyPlayers.length > 0;

        // Emit movement update to all clients in the room
        io.to(player.roomId).emit('playerMoved', {
          player: player,
          nearbyPlayers: nearbyPlayers
        });

        // Trigger proximity events
        if (player.isInProximity && !wasInProximity) {
          socket.emit('proximityEntered', { nearbyPlayers });
          nearbyPlayers.forEach(nearbyPlayer => {
            const nearbySocket = [...room.players.entries()].find(([_, p]) => p.id === nearbyPlayer.id)?.[0];
            if (nearbySocket) {
              io.to(nearbySocket).emit('proximityEntered', { nearbyPlayers: [player] });
            }
          });
        } else if (!player.isInProximity && wasInProximity) {
          socket.emit('proximityExited');
        }
      }
    }
  });

  // Handle video call requests
  socket.on('requestVideoCall', async (data) => {
    const player = players.get(socket.id);
    if (player) {
      const room = rooms.get(player.roomId);
      if (room) {
        const targetPlayer = [...room.players.values()].find(p => p.id === data.targetPlayerId);
        if (targetPlayer) {
          try {
            // Create a cleaner Daily.co room name
            const timestamp = Date.now();
            const roomName = `social-${timestamp}-${Math.random().toString(36).substring(2, 8)}`;
            const dailyRoom = await createDailyRoom(roomName, 2);
            
            const targetSocket = [...room.players.entries()].find(([_, p]) => p.id === targetPlayer.id)?.[0];
            if (targetSocket) {
              io.to(targetSocket).emit('videoCallRequest', {
                fromPlayer: player,
                roomUrl: dailyRoom.url,
                roomName: dailyRoom.name,
                isDemo: dailyRoom.isDemo,
                paymentRequired: dailyRoom.paymentRequired
              });
            }
          } catch (error) {
            console.error('Error creating video call room:', error);
            socket.emit('videoCallError', {
              message: 'Failed to create video call room',
              details: error.message
            });
          }
        }
      }
    }
  });

  // Handle video call acceptance
  socket.on('acceptVideoCall', (data) => {
    const player = players.get(socket.id);
    if (player) {
      const room = rooms.get(player.roomId);
      if (room) {
        const requesterPlayer = [...room.players.values()].find(p => p.id === data.fromPlayerId);
        if (requesterPlayer) {
          const requesterSocket = [...room.players.entries()].find(([_, p]) => p.id === requesterPlayer.id)?.[0];
          if (requesterSocket) {
            io.to(requesterSocket).emit('videoCallAccepted', {
              roomUrl: data.roomUrl,
              roomName: data.roomName,
              isDemo: data.isDemo,
              paymentRequired: data.paymentRequired
            });
          }
        }
      }
    }
  });

  // Handle video call rejection
  socket.on('rejectVideoCall', (data) => {
    const player = players.get(socket.id);
    if (player) {
      const room = rooms.get(player.roomId);
      if (room) {
        const requesterPlayer = [...room.players.values()].find(p => p.id === data.fromPlayerId);
        if (requesterPlayer) {
          const requesterSocket = [...room.players.entries()].find(([_, p]) => p.id === requesterPlayer.id)?.[0];
          if (requesterSocket) {
            io.to(requesterSocket).emit('videoCallRejected', {
              fromPlayer: player
            });
          }
        }
      }
    }
  });

  // Handle video call cleanup
  socket.on('endVideoCall', async (data) => {
    if (data.roomName && !data.isDemo) {
      try {
        await deleteDailyRoom(data.roomName);
        console.log(`Cleaned up video call room: ${data.roomName}`);
      } catch (error) {
        console.error('Error cleaning up video call room:', error);
      }
    }
  });

  // Handle chat messages
  socket.on('sendProximityChat', (data) => {
    const player = players.get(socket.id);
    if (player && data.nearbyPlayerIds) {
      const room = rooms.get(player.roomId);
      if (room) {
        data.nearbyPlayerIds.forEach(playerId => {
          const targetPlayer = [...room.players.values()].find(p => p.id === playerId);
          if (targetPlayer) {
            const targetSocket = [...room.players.entries()].find(([_, p]) => p.id === targetPlayer.id)?.[0];
            if (targetSocket) {
              io.to(targetSocket).emit('proximityMessage', {
                message: data.message,
                fromPlayer: player
              });
            }
          }
        });
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    const player = players.get(socket.id);
    if (player) {
      const room = rooms.get(player.roomId);
      if (room) {
        room.players.delete(socket.id);
        // Notify other players in the room about the disconnection
        socket.to(player.roomId).emit('playerLeft', { playerId: player.id });
        
        // Clean up empty rooms
        if (room.players.size === 0) {
          rooms.delete(player.roomId);
        }
      }
      players.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 