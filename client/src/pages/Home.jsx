import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Chat from '../components/Chat';
import Memories from '../components/Memories';
import Surprises from '../components/Surprises';
import DailyQuestion from '../components/DailyQuestion';
import Games from '../components/Games';
import OpenWhen from '../components/OpenWhen';
import AdminPanel from '../components/AdminPanel';
import Universe from '../components/Universe';
import Profile from '../components/Profile';
import TwoAMMode from '../components/TwoAMMode';
import CameraRequestNotification from '../components/CameraRequestNotification';
import WelcomeExperience from '../components/WelcomeExperience';
import DailyAffirmation from '../components/DailyAffirmation';

const Home = () => {
  const { user, updateUser } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if user should see welcome (only first visit per session)
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');

    if (!hasSeenWelcome && user && !user.isAdmin) {
      // Show welcome for non-admin users on first load
      setShowWelcome(true);
      sessionStorage.setItem('hasSeenWelcome', 'true');
    }
  }, [user]);

  useEffect(() => {
    // Apply theme
    if (user.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Check for 2AM mode (10 PM - 4 AM)
    const checkTime = () => {
      const hour = new Date().getHours();
      const is2AM = hour >= 22 || hour < 4;

      if (is2AM) {
        document.body.classList.add('night-mode');
      } else {
        document.body.classList.remove('night-mode');
      }
    };

    checkTime();

    const interval = setInterval(checkTime, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user.theme]);

  return (
    <>
      {/* Welcome Experience */}
      <AnimatePresence>
        {showWelcome && (
          <WelcomeExperience
            userName={user.name}
            onComplete={() => setShowWelcome(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Sidebar - Hidden on mobile when chat is open */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/chat/:conversationId" element={<Chat />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/surprises" element={<Surprises />} />
            <Route path="/question" element={<DailyQuestion />} />
            <Route path="/games" element={<Games />} />
            <Route path="/open-when" element={<OpenWhen />} />
            <Route path="/universe" element={<Universe />} />
            <Route path="/profile" element={<Profile />} />
            {user.isAdmin && <Route path="/admin" element={<AdminPanel />} />}
          </Routes>
        </div>

        {/* Global Components */}
        <DailyAffirmation />
        <TwoAMMode />
        {!user.isAdmin && <CameraRequestNotification />}
      </div>
    </>
  );
};

export default Home;