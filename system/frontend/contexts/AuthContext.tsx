import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authAPI, profileAPI } from '../services/api';
import { initializeEcho, disconnectEcho, getEcho } from '../services/echo';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, authToken: string) => Promise<void>;
  register: (user: User, authToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  // 訂閱 Presence Channel 來追蹤用戶在線狀態
  const subscribeToPresenceChannel = (echo: any, currentUserId: string) => {
    try {
      const presenceChannel = echo.join('presence-users')
        .here((users: any[]) => {
          // 當用戶加入時，這裡會收到所有當前在線的用戶
          console.log('Users online:', users);
        })
        .joining((user: any) => {
          // 當有用戶上線時
          console.log('User joined:', user);
        })
        .leaving((user: any) => {
          // 當有用戶下線時
          console.log('User left:', user);
        })
        .error((error: any) => {
          console.error('Presence channel error:', error);
        });
    } catch (error) {
      console.error('Failed to subscribe to presence channel:', error);
    }
  };

  // 初始化：檢查 token 並載入用戶資料
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const user = await authAPI.getUser(token);
          try {
            const profile = await profileAPI.get(token);
            const apiUser: User = {
              id: user.id.toString(),
              name: user.name,
              email: user.email,
              avatar: profile.avatar_url || null,
              status: 'online',
            };
            setCurrentUser(apiUser);
          } catch {
            const apiUser: User = {
              id: user.id.toString(),
              name: user.name,
              email: user.email,
              avatar: null,
              status: 'online',
            };
            setCurrentUser(apiUser);
          }
          const echo = initializeEcho(token);
          // 訂閱用戶在線狀態頻道
          subscribeToPresenceChannel(echo, user.id.toString());
        } catch (error) {
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (user: User, authToken: string) => {
    setToken(authToken);
    setCurrentUser(user);
    localStorage.setItem('auth_token', authToken);
    const echo = initializeEcho(authToken);
    subscribeToPresenceChannel(echo, user.id);
  };

  const register = async (user: User, authToken: string) => {
    setToken(authToken);
    setCurrentUser(user);
    localStorage.setItem('auth_token', authToken);
    const echo = initializeEcho(authToken);
    subscribeToPresenceChannel(echo, user.id);
  };

  const logout = async () => {
    if (token) {
      try {
        await authAPI.logout(token);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    disconnectEcho();
    localStorage.removeItem('auth_token');
    setToken(null);
    setCurrentUser(null);
  };

  const updateUser = (user: User) => {
    setCurrentUser(user);
  };

  return (
    <AuthContext.Provider value={{ currentUser, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};


