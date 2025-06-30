import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await fetch('http://localhost:3001/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('authToken');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('token');
    
    if (authToken) {
      localStorage.setItem('authToken', authToken);
      setToken(authToken);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const login = () => {
    window.location.href = 'http://localhost:3001/auth/google';
  };

  const loginAsGuest = async (guestName) => {
    try {
      const response = await fetch('http://localhost:3001/auth/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ guestName })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        setToken(data.token);
        setUser(data.user);
        return true;
      } else {
        const error = await response.json();
        console.error('Guest login failed:', error);
        return false;
      }
    } catch (error) {
      console.error('Guest login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:3001/auth/logout', {
        method: 'GET',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    }
  };

  const updatePreferences = async (preferences) => {
    if (!token) return false;

    try {
      const response = await fetch('http://localhost:3001/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences })
      });

      if (response.ok) {
        setUser(prev => ({ ...prev, preferences: { ...prev.preferences, ...preferences } }));
        return true;
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
    return false;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    loginAsGuest,
    logout,
    updatePreferences,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 