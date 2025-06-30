#!/usr/bin/env node

const { getActiveUsers, getUserLoginHistory } = require('./logger');

function displayActiveUsers() {
  console.log('\n🟢 === WHO IS LOGGED IN ===');
  console.log(`📅 ${new Date().toLocaleString()}\n`);
  
  try {
    const activeUsers = getActiveUsers();
    
    if (activeUsers.length === 0) {
      console.log('👤 No users currently logged in\n');
      return;
    }
    
    console.log(`👥 Total active users: ${activeUsers.length}\n`);
    
    activeUsers.forEach((user, index) => {
      const loginTime = new Date(user.loginTime);
      const timeAgo = getTimeAgo(user.loginTime);
      
      console.log(`${index + 1}. 👤 ${user.name}`);
      console.log(`   📧 ${user.email}`);
      console.log(`   🔐 ${user.userType} User`);
      console.log(`   🕐 Logged in: ${loginTime.toLocaleString()}`);
      console.log(`   ⏰ ${timeAgo}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error reading user logs:', error.message);
  }
}

function displayRecentLogins(hours = 24) {
  console.log(`\n📊 === RECENT LOGINS (Last ${hours} hours) ===\n`);
  
  try {
    const recentLogins = getUserLoginHistory(hours);
    
    if (recentLogins.length === 0) {
      console.log(`📝 No logins in the last ${hours} hours\n`);
      return;
    }
    
    console.log(`📈 Total logins: ${recentLogins.length}\n`);
    
    recentLogins.slice(0, 10).forEach((login, index) => {
      const loginTime = new Date(login.timestamp);
      const timeAgo = getTimeAgo(login.timestamp);
      
      console.log(`${index + 1}. ${login.data.name} (${login.data.loginMethod})`);
      console.log(`   🕐 ${loginTime.toLocaleString()} - ${timeAgo}`);
      console.log('');
    });
    
    if (recentLogins.length > 10) {
      console.log(`... and ${recentLogins.length - 10} more logins\n`);
    }
    
  } catch (error) {
    console.error('❌ Error reading login history:', error.message);
  }
}

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

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'recent':
    const hours = parseInt(args[1]) || 24;
    displayRecentLogins(hours);
    break;
  case 'help':
    console.log('\n📖 Usage:');
    console.log('  node check-users.js          - Show currently active users');
    console.log('  node check-users.js recent   - Show recent logins (last 24 hours)');
    console.log('  node check-users.js recent 6 - Show recent logins (last 6 hours)');
    console.log('  node check-users.js help     - Show this help\n');
    break;
  default:
    displayActiveUsers();
    break;
} 