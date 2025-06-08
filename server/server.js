const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

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
        playerCount: room.players.size
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
        playerCount: room.players.size
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
  socket.on('requestVideoCall', (data) => {
    const player = players.get(socket.id);
    if (player) {
      const room = rooms.get(player.roomId);
      if (room) {
        const targetPlayer = [...room.players.values()].find(p => p.id === data.targetPlayerId);
        if (targetPlayer) {
          const targetSocket = [...room.players.entries()].find(([_, p]) => p.id === targetPlayer.id)?.[0];
          if (targetSocket) {
            io.to(targetSocket).emit('videoCallRequest', {
              fromPlayer: player,
              roomUrl: data.roomUrl
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
              roomUrl: data.roomUrl
            });
          }
        }
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