import React from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User, token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();

  const handleLogin = (user: User, token: string) => {
    onLogin(user, token);
    navigate('/chat');
  };

  const handleGoToRegister = () => {
    navigate('/register');
  };

  return <Login onLogin={handleLogin} onGoToRegister={handleGoToRegister} />;
};

export default LoginPage;

