import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiHeart } from 'react-icons/fi';

const affirmations = [
  "You're doing better than you think 💕",
  "Your smile is contagious ✨",
  "You make ordinary moments special 🌟",
  "You're someone's reason to smile today 💫",
  "You deserve all the good things coming your way 🌈",
  "Your presence makes a difference 💝",
  "You're exactly where you need to be 🌸",
  "You're braver than you believe 🦋",
  "Your kindness is a gift to the world 🎁",
  "You're appreciated more than you know 💗"
];

const DailyAffirmation = () => {
  const [show, setShow] = useState(false);
  const [affirmation, setAffirmation] = useState('');

  useEffect(() => {
    // Check if affirmation was shown today
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem('lastAffirmationDate');

    if (lastShown !== today) {
      // Show after 3 seconds
      setTimeout(() => {
        const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
        setAffirmation(randomAffirmation);
        setShow(true);
        localStorage.setItem('lastAffirmationDate', today);

        // Auto hide after 8 seconds
        setTimeout(() => setShow(false), 8000);
      }, 3000);
    }
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-40"
        >
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-1 rounded-2xl shadow-2xl">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 relative">
              <button
                onClick={() => setShow(false)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <FiX className="text-gray-500 dark:text-gray-400" size={18} />
              </button>

              <div className="flex items-start space-x-3">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                >
                  <FiHeart className="text-pink-500 mt-1" size={24} fill="currentColor" />
                </motion.div>
                
                <div className="flex-1">
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                    Daily Reminder
                  </p>
                  <p className="text-base font-medium text-gray-800 dark:text-white">
                    {affirmation}
                  </p>
                </div>
              </div>

              {/* Sparkle effect */}
              <div className="absolute -top-2 -right-2">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.3, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity
                  }}
                  className="text-2xl"
                >
                  ✨
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DailyAffirmation;