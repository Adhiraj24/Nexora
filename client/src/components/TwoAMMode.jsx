import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TwoAMMode = () => {
  const [show, setShow] = useState(false);
  const [question, setQuestion] = useState('');

  const lateNightQuestions = [
    "Still awake?",
    "Can't sleep either?",
    "What are you thinking about?",
    "Sometimes the best conversations happen at this hour...",
    "Night owl mode activated 🌙"
  ];

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      const is2AM = hour >= 22 || hour < 4;
      
      if (is2AM && !show) {
        setQuestion(lateNightQuestions[Math.floor(Math.random() * lateNightQuestions.length)]);
        setShow(true);
        setTimeout(() => setShow(false), 10000);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 right-4 bg-gradient-to-r from-indigo-900 to-purple-900 text-white p-6 rounded-2xl shadow-2xl max-w-sm z-40"
        >
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-2xl">🌙</span>
            <span className="text-sm font-medium opacity-75">2 AM Mode</span>
          </div>
          <p className="text-lg font-medium">{question}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TwoAMMode;