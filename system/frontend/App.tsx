import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import ChatGroupPage from './pages/ChatGroupPage';
import { User } from './types';
import { chatRoomAPI } from './services/api';

// 受保護的路由組件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 公開路由組件（已登入則重定向）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { login, register } = useAuth();

  const handleLogin = async (user: User, token: string) => {
    await login(user, token);
    // 載入聊天室列表
    try {
      await chatRoomAPI.getAll(token);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    }
  };

  const handleRegister = async (user: User, token: string) => {
    await register(user, token);
    // 載入聊天室列表
    try {
      await chatRoomAPI.getAll(token);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    }
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage onLogin={handleLogin} />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage onRegister={handleRegister} />
          </PublicRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:id"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat-group"
        element={
          <ProtectedRoute>
            <ChatGroupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat-group/:id"
        element={
          <ProtectedRoute>
            <ChatGroupPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
