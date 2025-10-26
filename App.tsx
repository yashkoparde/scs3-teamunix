
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import Header from './components/Header';
import AuthPage from './components/AuthPage';
import SuccessToast from './components/SuccessToast';
import { CrowdData } from './types';

// Add global type declarations for libraries loaded via script tags
declare global {
  interface Window {
    tf: any;
    cocoSsd: any;
  }
}

const MAX_LOG_ENTRIES = 100;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [historicalData, setHistoricalData] = useState<CrowdData[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const addHistoricalData = (data: CrowdData) => {
    setHistoricalData(prev => [data, ...prev].slice(0, MAX_LOG_ENTRIES));
  };

  const handleLoginSuccess = (username: string, mode: 'login' | 'signup') => {
    setIsAuthenticated(true);
    const welcomeMessage = mode === 'login'
      ? `Welcome back, ${username}!`
      : `Account created! Welcome, ${username}!`;
    setToastMessage(welcomeMessage);
    setShowSuccessToast(true);
    
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
        <AnimatePresence>
          {showSuccessToast && <SuccessToast message={toastMessage} />}
        </AnimatePresence>
        
        {isAuthenticated ? (
          <>
            <Header />
            <main className="p-4 sm:p-6 lg:p-8">
              <Routes>
                <Route path="/admin" element={<AdminDashboard historicalData={historicalData} />} />
                <Route path="/" element={<Dashboard addHistoricalData={addHistoricalData} historicalData={historicalData} />} />
              </Routes>
            </main>
          </>
        ) : (
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        )}
      </div>
    </HashRouter>
  );
};

export default App;
