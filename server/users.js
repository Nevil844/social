// In-memory user storage (in production, use a database)
const users = new Map();

class UserManager {
  constructor() {
    this.users = users;
  }

  // Create or update user from Google OAuth
  createOrUpdateUser(googleProfile) {
    const userId = googleProfile.id;
    const user = {
      id: userId,
      googleId: googleProfile.id,
      email: googleProfile.emails[0].value,
      name: googleProfile.displayName,
      picture: googleProfile.photos[0]?.value,
      createdAt: new Date(),
      lastLogin: new Date(),
      videoCallMinutes: 0,
      videoCallLimit: 20, // 20 minutes per day
      lastVideoCallReset: new Date().toDateString(),
      preferences: {
        defaultMap: 'office',
        defaultMaxPlayers: 20,
        notifications: true
      }
    };

    // If user exists, update last login and check video call limits
    if (this.users.has(userId)) {
      const existingUser = this.users.get(userId);
      user.createdAt = existingUser.createdAt;
      user.videoCallMinutes = existingUser.videoCallMinutes;
      user.videoCallLimit = existingUser.videoCallLimit;
      user.lastVideoCallReset = existingUser.lastVideoCallReset;
      user.preferences = existingUser.preferences;
      
      // Reset video call minutes if it's a new day
      const today = new Date().toDateString();
      if (user.lastVideoCallReset !== today) {
        user.videoCallMinutes = 0;
        user.lastVideoCallReset = today;
      }
    }

    this.users.set(userId, user);
    return user;
  }

  // Get user by ID
  getUser(userId) {
    return this.users.get(userId);
  }

  // Get user by email
  getUserByEmail(email) {
    for (const [_, user] of this.users) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  // Increment video call minutes
  incrementVideoCallMinutes(userId, minutes = 1) {
    const user = this.users.get(userId);
    if (user) {
      user.videoCallMinutes += minutes;
      this.users.set(userId, user);
      return user.videoCallMinutes;
    }
    return 0;
  }

  // Check if user can make video calls
  canMakeVideoCall(userId) {
    const user = this.users.get(userId);
    if (!user) return false;

    // Check daily limit
    const today = new Date().toDateString();
    if (user.lastVideoCallReset !== today) {
      user.videoCallMinutes = 0;
      user.lastVideoCallReset = today;
      this.users.set(userId, user);
    }

    return user.videoCallMinutes < user.videoCallLimit;
  }

  // Get remaining video call minutes
  getRemainingVideoCallMinutes(userId) {
    const user = this.users.get(userId);
    if (!user) return 0;

    const today = new Date().toDateString();
    if (user.lastVideoCallReset !== today) {
      return user.videoCallLimit;
    }

    return Math.max(0, user.videoCallLimit - user.videoCallMinutes);
  }

  // Update user preferences
  updatePreferences(userId, preferences) {
    const user = this.users.get(userId);
    if (user) {
      user.preferences = { ...user.preferences, ...preferences };
      this.users.set(userId, user);
      return true;
    }
    return false;
  }

  // Get all users (for admin purposes)
  getAllUsers() {
    return Array.from(this.users.values());
  }

  // Delete user
  deleteUser(userId) {
    return this.users.delete(userId);
  }
}

module.exports = new UserManager(); 