import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart } from 'react-icons/fi';

const WelcomeExperience = ({ userName, onComplete }) => {
  const [stage, setStage] = useState(0);
  const [showHearts, setShowHearts] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setShowHearts(true), 1000),
      setTimeout(() => setStage(2), 2000),
      setTimeout(() => setStage(3), 3500),
      setTimeout(() => setStage(4), 5000),
      setTimeout(() => onComplete(), 6500)
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-purple-900 dark:via-pink-900 dark:to-blue-900"
    >
      {/* Floating Hearts Background */}
      <AnimatePresence>
        {showHearts && (
          <>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: typeof window !== 'undefined' ? window.innerHeight + 50 : 800,
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
                  opacity: 0 
                }}
                animate={{ 
                  y: -100,
                  opacity: [0, 1, 0.8, 0],
                  scale: [0.5, 1, 0.8]
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className="absolute"
              >
                <FiHeart 
                  className="text-pink-400 dark:text-pink-300" 
                  size={20 + Math.random() * 20}
                  fill="currentColor"
                />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Sparkles */}
      <AnimatePresence>
        {stage >= 1 && (
          <>
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  rotate: Math.random() * 360
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: `hsl(${Math.random() * 60 + 300}, 70%, 70%)`,
                  boxShadow: '0 0 10px currentColor'
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 text-center px-4">
        <AnimatePresence mode="wait">
          {/* Stage 1: Welcome */}
          {stage === 1 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-7xl mb-6"
              >
                ✨
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400">
                Welcome back!
              </h1>
            </motion.div>
          )}

          {/* Stage 2: Personalized Message */}
          {stage === 2 && (
            <motion.div
              key="message"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                className="text-7xl mb-6"
              >
                💝
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                Hey {userName}!
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Someone special is waiting to talk to you
              </p>
            </motion.div>
          )}

          {/* Stage 3: Sweet Message */}
          {stage === 3 && (
            <motion.div
              key="sweet"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-7xl mb-6"
              >
                🌟
              </motion.div>
              <p className="text-2xl md:text-3xl font-light text-gray-700 dark:text-gray-200 italic">
                "Hope you had a great day"
              </p>
            </motion.div>
          )}

          {/* Stage 4: Final */}
          {stage === 4 && (
            <motion.div
              key="final"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 0.8, repeat: 2 }}
                className="text-7xl mb-6"
              >
                💬
              </motion.div>
              <h3 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-white">
                Let's chat! ✨
              </h3>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/50 to-transparent dark:from-black/30 pointer-events-none" />
    </motion.div>
  );
};

export default WelcomeExperience;