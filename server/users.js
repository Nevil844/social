// Simple in-memory user management
// In production, this should be replaced with a proper database

class UserManager {
  constructor() {
    this.users = new Map();
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
      preferences: {
        defaultMap: 'office',
        defaultMaxPlayers: 20,
        notifications: true
      }
    };

    // If user exists, update last login and preserve existing data
    if (this.users.has(userId)) {
      const existingUser = this.users.get(userId);
      user.createdAt = existingUser.createdAt;
      user.preferences = existingUser.preferences;
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

  // Update user preferences
  updateUserPreferences(userId, preferences) {
    const user = this.users.get(userId);
    if (user) {
      user.preferences = { ...user.preferences, ...preferences };
      this.users.set(userId, user);
      return user;
    }
    return null;
  }

  // Get all users (for admin purposes)
  getAllUsers() {
    return Array.from(this.users.values());
  }

  // Delete user
  deleteUser(userId) {
    return this.users.delete(userId);
  }

  // Get user count
  getUserCount() {
    return this.users.size;
  }

  // Create or update guest user
  createOrUpdateGuestUser(guestUser) {
    this.users.set(guestUser.id, guestUser);
    return guestUser;
  }
}

module.exports = new UserManager(); 