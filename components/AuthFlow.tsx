import React, { useState } from 'react';
import CoverPage from './CoverPage';
import LoginPage from './LoginPage';

interface AuthFlowProps {
  onLogin: () => void;
}

const AuthFlow: React.FC<AuthFlowProps> = ({ onLogin }) => {
  const [view, setView] = useState<'cover' | 'login' | 'signup'>('cover');

  const handleBackToCover = () => {
    setView('cover');
  };

  if (view === 'cover') {
    return (
      <CoverPage 
        onShowLogin={() => setView('login')} 
        onShowSignup={() => setView('signup')} 
      />
    );
  }

  // When view is 'login' or 'signup', render LoginPage with the correct initial state
  return <LoginPage onLogin={onLogin} initialView={view} onBack={handleBackToCover} />;
};

export default AuthFlow;