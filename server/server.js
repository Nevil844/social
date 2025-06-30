const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const userManager = require('./users');
const { passport, generateToken, isAuthenticated } = require('./auth');
const { logger, getUserLoginHistory, getActiveUsers } = require('./logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'social-gather-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Store rooms and players
const rooms = new Map();
const players = new Map();
const socketToUser = new Map(); // Map socket IDs to user IDs

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



// Authentication Routes
app.get('/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const token = generateToken(req.user);
      
      // Log successful Google OAuth login
      logger.user('LOGIN', `Google OAuth user logged in: ${req.user.name}`, {
        userId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        loginMethod: 'Google OAuth',
        isGuest: false,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      });
      
      res.redirect(`http://localhost:5173?token=${token}`);
    } catch (error) {
      logger.error('AUTH', 'Google OAuth callback error', { error: error.message });
      res.redirect('/login?error=auth_failed');
    }
  }
);

// Guest authentication for development
app.post('/auth/guest', (req, res) => {
  const { guestName } = req.body;
  
  if (!guestName || guestName.trim().length === 0) {
    logger.warn('AUTH', 'Guest login attempt with empty name', { ip: req.ip });
    return res.status(400).json({ error: 'Guest name is required' });
  }

  // Create a guest user
  const guestUser = {
    id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: `${guestName.toLowerCase().replace(/\s+/g, '')}@guest.local`,
    name: guestName.trim(),
    picture: 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=' + guestName.charAt(0).toUpperCase(),
    isGuest: true,
    preferences: {},
    createdAt: new Date(),
    lastLogin: new Date()
  };

  // Store guest user
  userManager.createOrUpdateGuestUser(guestUser);
  
  // Generate token
  const token = generateToken(guestUser);
  
  // Log successful guest login
  logger.user('LOGIN', `Guest user logged in: ${guestUser.name}`, {
    userId: guestUser.id,
    name: guestUser.name,
    email: guestUser.email,
    loginMethod: 'Guest',
    isGuest: true,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  });
  
  res.json({ 
    success: true, 
    token,
    user: {
      id: guestUser.id,
      name: guestUser.name,
      email: guestUser.email,
      picture: guestUser.picture,
      isGuest: true
    }
  });
});

app.get('/auth/logout', (req, res) => {
  const userId = req.user?.id;
  const userName = req.user?.name;
  
  req.logout((err) => {
    if (err) {
      logger.error('AUTH', 'Logout error', { userId, error: err.message });
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        logger.error('AUTH', 'Session destroy error', { userId, error: err.message });
        return res.status(500).json({ error: 'Session cleanup failed' });
      }
      
      // Log successful logout
      if (userId && userName) {
        logger.user('LOGOUT', `User logged out: ${userName}`, {
          userId,
          name: userName,
          ip: req.ip || req.connection.remoteAddress
        });
      }
      
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

// Logging API Routes
app.get('/api/logs/users', isAuthenticated, (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const loginHistory = getUserLoginHistory(hours);
    res.json(loginHistory);
  } catch (error) {
    logger.error('API', 'Failed to get user login history', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve login history' });
  }
});

app.get('/api/logs/active-users', isAuthenticated, (req, res) => {
  try {
    const activeUsers = getActiveUsers();
    res.json(activeUsers);
  } catch (error) {
    logger.error('API', 'Failed to get active users', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve active users' });
  }
});

// Public endpoint to view active users (formatted for easy reading)
app.get('/api/who-is-online', (req, res) => {
  try {
    const activeUsers = getActiveUsers();
    const formatted = activeUsers.map(user => ({
      name: user.name,
      type: user.userType,
      loginTime: new Date(user.loginTime).toLocaleString(),
      timeAgo: getTimeAgo(user.loginTime)
    }));
    
    res.json({
      totalUsers: formatted.length,
      users: formatted,
      lastUpdated: new Date().toLocaleString()
    });
  } catch (error) {
    logger.error('API', 'Failed to get online users', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve online users' });
  }
});

// Helper function to calculate time ago
function getTimeAgo(timestamp) {
  const now = new Date();
  const loginTime = new Date(timestamp);
  const diffMs = now - loginTime;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? 's' : ''} ago`;
}

// User API Routes
app.get('/api/user/profile', isAuthenticated, (req, res) => {
  const user = userManager.getUser(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    preferences: user.preferences,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  });
});

app.put('/api/user/preferences', isAuthenticated, (req, res) => {
  const { preferences } = req.body;
  
  if (!preferences || typeof preferences !== 'object') {
    return res.status(400).json({ error: 'Invalid preferences data' });
  }

  try {
    const user = userManager.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update preferences
    const updatedPreferences = { ...user.preferences, ...preferences };
    userManager.updateUserPreferences(req.user.id, updatedPreferences);

    res.json({ 
      message: 'Preferences updated successfully',
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Room API Routes
app.get('/api/rooms', (req, res) => {
  const publicRooms = Array.from(rooms.values()).filter(room => !room.isPrivate);
  const roomsWithPlayerCount = publicRooms.map(room => ({
    ...room,
    playerCount: room.players.size,
    players: undefined // Don't send player data in list
  }));
  res.json(roomsWithPlayerCount);
});

app.post('/api/rooms', (req, res) => {
  const { name, isPrivate, maxPlayers, mapType, creatorId } = req.body;
  
  if (!name || !creatorId) {
    return res.status(400).json({ error: 'Room name and creator ID are required' });
  }

  const roomId = generateRoomCode().toLowerCase();
  const room = createRoom(roomId, name, mapType, maxPlayers);
  room.isPrivate = isPrivate;
  room.creatorId = creatorId;
  
  res.json({
    id: room.id,
    name: room.name,
    isPrivate: room.isPrivate,
    maxPlayers: room.maxPlayers,
    mapType: room.mapType,
    code: room.code,
    createdAt: room.createdAt
  });
});

app.get('/api/rooms/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  
  // Find room by code or ID
  let room = null;
  for (const [id, r] of rooms) {
    if (r.code === roomCode.toUpperCase() || id === roomCode) {
      room = r;
      break;
    }
  }
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    id: room.id,
    name: room.name,
    isPrivate: room.isPrivate,
    maxPlayers: room.maxPlayers,
    mapType: room.mapType,
    code: room.code,
    playerCount: room.players.size,
    createdAt: room.createdAt
  });
});

// Room management functions
function createRoom(roomId, name = `Room ${roomId}`, mapType = 'office', maxPlayers = 20) {
  const room = {
    id: roomId,
    name,
    mapType,
    maxPlayers,
    isPrivate: false,
    createdAt: new Date(),
    players: new Map(),
    code: generateRoomCode()
  };
  rooms.set(roomId, room);
  return room;
}

function findOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    const mapTypes = ['office', 'park', 'cafe', 'campus', 'beach', 'space'];
    const randomMap = mapTypes[Math.floor(Math.random() * mapTypes.length)];
    createRoom(roomId, `${roomId}`, randomMap);
  }
  return rooms.get(roomId);
}

function calculateDistance(player1, player2) {
  return Math.sqrt(
    Math.pow(player1.x - player2.x, 2) + 
    Math.pow(player1.y - player2.y, 2)
  );
}

function findNearbyPlayers(currentPlayer, room, proximityThreshold = 150) {
  const nearby = [];
  
  room.players.forEach((player, socketId) => {
    if (player.id !== currentPlayer.id) {
      const distance = calculateDistance(currentPlayer, player);
      if (distance <= proximityThreshold) {
        nearby.push(player);
      }
    }
  });
  
  return nearby;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

io.on('connection', (socket) => {
  logger.info('SOCKET', `User connected: ${socket.id}`, { socketId: socket.id });

  // Handle authentication
  socket.on('authenticate', (token) => {
    try {
      // Verify the token here if needed
      socket.emit('authenticated', { success: true });
    } catch (error) {
      console.error('Socket authentication failed:', error);
      socket.emit('authError', { message: 'Authentication failed' });
    }
  });

  // Handle joining a room
  socket.on('joinRoom', (data) => {
    const { roomId, playerName } = data;
    
    if (!roomId || !playerName) {
      socket.emit('error', { message: 'Room ID and player name are required' });
      return;
    }

    try {
      // Leave any existing room
      if (players.has(socket.id)) {
        const existingPlayer = players.get(socket.id);
        if (existingPlayer.roomId) {
          socket.leave(existingPlayer.roomId);
          const existingRoom = rooms.get(existingPlayer.roomId);
          if (existingRoom) {
            existingRoom.players.delete(socket.id);
            socket.to(existingPlayer.roomId).emit('playerLeft', { playerId: existingPlayer.id });
          }
        }
      }

      // Find or create the room
      const room = findOrCreateRoom(roomId);
      
      // Check if room is full
      if (room.players.size >= room.maxPlayers) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      // Create player object
      const player = {
        id: socket.id,
        socketId: socket.id,
        name: playerName,
        roomId: roomId,
        x: Math.random() * 800 + 100, // Random starting position
        y: Math.random() * 600 + 100,
        lastUpdate: Date.now(),
        avatar: {
          skin: Math.floor(Math.random() * 6),
          hair: Math.floor(Math.random() * 8),
          shirt: Math.floor(Math.random() * 6),
          accessory: Math.floor(Math.random() * 4)
        }
      };

      // Add player to game state
      players.set(socket.id, player);
      room.players.set(socket.id, player);
      socket.join(roomId);

      // Notify all players in the room
      const allPlayers = Array.from(room.players.values());
      socket.emit('playerJoined', { 
        player, 
        allPlayers,
        room: {
          id: room.id,
          name: room.name,
          mapType: room.mapType,
          code: room.code,
          playerCount: room.players.size,
          maxPlayers: room.maxPlayers
        }
      });
      
      socket.to(roomId).emit('playerJoined', { 
        player, 
        allPlayers,
        room: {
          id: room.id,
          name: room.name,
          mapType: room.mapType,
          code: room.code,
          playerCount: room.players.size,
          maxPlayers: room.maxPlayers
        }
      });

      logger.room('JOIN', `Player ${playerName} joined room ${roomId}`, {
      playerId: player.id,
      playerName: playerName,
      roomId: roomId,
      roomName: room.name,
      socketId: socket.id
    });
          } catch (error) {
        logger.error('ROOM', 'Error joining room', { 
          error: error.message, 
          socketId: socket.id,
          roomId: roomId
        });
        socket.emit('error', { message: 'Failed to join room' });
      }
  });

  // Handle player movement
  socket.on('playerMove', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    const { x, y } = data;
    
    // Update player position
    player.x = Math.max(0, Math.min(1200, x)); // Constrain to map bounds
    player.y = Math.max(0, Math.min(800, y));
    player.lastUpdate = Date.now();

    const room = rooms.get(player.roomId);
    if (!room) return;

    // Update room data
    room.players.set(socket.id, player);

    // Find nearby players for proximity detection
    const nearbyPlayers = findNearbyPlayers(player, room);
    
    // Emit position update to all players in room
    io.to(player.roomId).emit('playerMoved', { 
      player,
      nearbyPlayers: nearbyPlayers
    });

    // Handle proximity events
    if (nearbyPlayers.length > 0) {
      socket.emit('proximityEntered', { nearbyPlayers });
    } else {
      socket.emit('proximityExited');
    }
  });

  // Handle proximity chat
  socket.on('sendProximityChat', (data) => {
    const player = players.get(socket.id);
    if (!player) return;

    const { message, nearbyPlayerIds } = data;
    
    if (!message || !nearbyPlayerIds || nearbyPlayerIds.length === 0) return;

    // Send message to nearby players
    nearbyPlayerIds.forEach(playerId => {
      const targetSocket = [...players.entries()].find(([_, p]) => p.id === playerId)?.[0];
      if (targetSocket) {
        io.to(targetSocket).emit('proximityMessage', {
          message,
          fromPlayer: player,
          timestamp: new Date()
        });
      }
    });

    logger.info('CHAT', `Proximity message from ${player.name}: ${message}`, {
      playerId: player.id,
      playerName: player.name,
      roomId: player.roomId,
      messageLength: message.length
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    
    if (player) {
      const room = rooms.get(player.roomId);
      if (room) {
        room.players.delete(socket.id);
        socket.to(player.roomId).emit('playerLeft', { playerId: player.id });
        
        // Clean up empty rooms after 5 minutes
        if (room.players.size === 0) {
          setTimeout(() => {
            if (rooms.has(player.roomId) && rooms.get(player.roomId).players.size === 0) {
              rooms.delete(player.roomId);
              logger.room('CLEANUP', `Cleaned up empty room: ${player.roomId}`, {
          roomId: player.roomId,
          lastPlayerName: player.name
        });
            }
          }, 5 * 60 * 1000);
        }
      }
      
      players.delete(socket.id);
      logger.room('LEAVE', `Player ${player.name} disconnected from room ${player.roomId}`, {
        playerId: player.id,
        playerName: player.name,
        roomId: player.roomId,
        socketId: socket.id
      });
    }
    
    logger.info('SOCKET', `User disconnected: ${socket.id}`, { socketId: socket.id });
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.success('SERVER', `Server started on port ${PORT}`, { 
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    clientUrl: 'http://localhost:5173',
    apiUrl: `http://localhost:${PORT}/health`
  });
  
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Client: http://localhost:5173`);
  console.log(`🔧 API: http://localhost:${PORT}/health`);
  console.log(`📋 Logs saved to: ./logs/`);
  console.log(`👥 View active users: http://localhost:${PORT}/api/logs/active-users`);
});

module.exports = { app, server, io }; 