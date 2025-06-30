const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Log file paths
const serverLogFile = path.join(logsDir, 'server.log');
const userLogFile = path.join(logsDir, 'users.log');
const roomLogFile = path.join(logsDir, 'rooms.log');

// Format timestamp
function getTimestamp() {
  return new Date().toISOString();
}

// Format log entry
function formatLog(level, category, message, data = null) {
  const timestamp = getTimestamp();
  const logEntry = {
    timestamp,
    level,
    category,
    message,
    data
  };
  return JSON.stringify(logEntry) + '\n';
}

// Write log to file
function writeLog(logFile, entry) {
  try {
    fs.appendFileSync(logFile, entry);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Generic logger
function log(level, category, message, data = null) {
  const entry = formatLog(level, category, message, data);
  writeLog(serverLogFile, entry);
  
  // Also log to console with color coding
  const colors = {
    INFO: '\x1b[36m',    // Cyan
    WARN: '\x1b[33m',    // Yellow
    ERROR: '\x1b[31m',   // Red
    SUCCESS: '\x1b[32m', // Green
    USER: '\x1b[35m',    // Magenta
    RESET: '\x1b[0m'     // Reset
  };
  
  const color = colors[level] || colors.RESET;
  console.log(`${color}[${getTimestamp()}] ${level} - ${category}: ${message}${colors.RESET}`);
  
  if (data) {
    console.log(`${color}Data:${colors.RESET}`, data);
  }
}

// Specific logging functions
const logger = {
  info: (category, message, data) => log('INFO', category, message, data),
  warn: (category, message, data) => log('WARN', category, message, data),
  error: (category, message, data) => log('ERROR', category, message, data),
  success: (category, message, data) => log('SUCCESS', category, message, data),
  user: (category, message, data) => {
    log('USER', category, message, data);
    // Also write to user-specific log
    const entry = formatLog('USER', category, message, data);
    writeLog(userLogFile, entry);
  },
  room: (category, message, data) => {
    log('INFO', category, message, data);
    // Also write to room-specific log
    const entry = formatLog('INFO', category, message, data);
    writeLog(roomLogFile, entry);
  }
};

// Function to read recent logs
function getRecentLogs(logFile, lines = 50) {
  try {
    if (!fs.existsSync(logFile)) {
      return [];
    }
    
    const content = fs.readFileSync(logFile, 'utf8');
    const logLines = content.trim().split('\n');
    
    return logLines
      .slice(-lines)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log !== null);
  } catch (error) {
    console.error('Failed to read log file:', error);
    return [];
  }
}

// Function to get user login history
function getUserLoginHistory(hours = 24) {
  const userLogs = getRecentLogs(userLogFile, 1000);
  const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
  
  return userLogs
    .filter(log => 
      log.category === 'LOGIN' && 
      new Date(log.timestamp) > cutoffTime
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Function to get active users
function getActiveUsers() {
  const recentLogins = getUserLoginHistory(24);
  const activeUsers = new Map();
  
  recentLogins.forEach(log => {
    if (log.data && log.data.userId) {
      const userId = log.data.userId;
      if (!activeUsers.has(userId) || new Date(log.timestamp) > new Date(activeUsers.get(userId).timestamp)) {
        activeUsers.set(userId, {
          userId: log.data.userId,
          name: log.data.name,
          email: log.data.email,
          loginTime: log.timestamp,
          userType: log.data.isGuest ? 'Guest' : 'Google',
          isGuest: log.data.isGuest || false
        });
      }
    }
  });
  
  return Array.from(activeUsers.values());
}

module.exports = {
  logger,
  getRecentLogs,
  getUserLoginHistory,
  getActiveUsers,
  logFiles: {
    server: serverLogFile,
    users: userLogFile,
    rooms: roomLogFile
  }
}; 