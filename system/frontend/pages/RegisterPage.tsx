import React from 'react';
import { useNavigate } from 'react-router-dom';
import Register from '../components/Register';
import { User } from '../types';

interface RegisterPageProps {
  onRegister: (user: User, token: string) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister }) => {
  const navigate = useNavigate();

  const handleRegister = (user: User, token: string) => {
    onRegister(user, token);
    navigate('/chat');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return <Register onRegister={handleRegister} onGoToLogin={handleGoToLogin} />;
};

export default RegisterPage;

