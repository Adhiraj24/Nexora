import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const SpecialMessageExperience = ({ type, senderName, onClose }) => {
  const [stage, setStage] = useState(0);
  
  useEffect(() => {
    if (type === 'good-night') {
      // Stage 0: Overlay appears
      // Stage 1: Moon and stars
      // Stage 2: Text 1
      // Stage 3: Text 2
      const timers = [
        setTimeout(() => setStage(1), 500),
        setTimeout(() => setStage(2), 1500),
        setTimeout(() => setStage(3), 3000),
        setTimeout(() => onClose(), 5500)
      ];
      return () => timers.forEach(clearTimeout);
    } else if (type === 'good-morning') {
      const timers = [
        setTimeout(() => setStage(1), 500),
        setTimeout(() => setStage(2), 1500),
        setTimeout(() => setStage(3), 3000),
        setTimeout(() => onClose(), 5500)
      ];
      return () => timers.forEach(clearTimeout);
    } else if (type === 'hi-hello') {
      const timers = [
        setTimeout(() => setStage(1), 300),
        setTimeout(() => setStage(2), 1500),
        setTimeout(() => onClose(), 4000)
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [type, onClose]);

  if (type === 'good-night') {
    return (
      <GoodNightExperience 
        stage={stage} 
        senderName={senderName} 
        onClose={onClose} 
      />
    );
  } else if (type === 'good-morning') {
    return (
      <GoodMorningExperience 
        stage={stage} 
        senderName={senderName} 
        onClose={onClose} 
      />
    );
  } else if (type === 'hi-hello') {
    return (
      <HiHelloExperience 
        stage={stage} 
        senderName={senderName} 
        onClose={onClose} 
      />
    );
  }
  
  return null;
};

// Good Night Experience
const GoodNightExperience = ({ stage, senderName, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(to bottom, #0f172a, #1e293b, #334155)'
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
      >
        <FiX size={20} />
      </button>

      {/* Stars */}
      <AnimatePresence>
        {stage >= 1 && (
          <>
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0.8, 1],
                  scale: [0, 1, 1.2, 1]
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: `${Math.random() * 80 + 10}%`,
                  left: `${Math.random() * 90 + 5}%`,
                  boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Moon */}
      <AnimatePresence>
        {stage >= 1 && (
          <motion.div
            initial={{ scale: 0, y: -100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="absolute top-20"
          >
            <div 
              className="w-24 h-24 rounded-full bg-yellow-100 shadow-2xl"
              style={{
                boxShadow: '0 0 60px rgba(254, 252, 191, 0.6), 0 0 100px rgba(254, 252, 191, 0.4)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clouds */}
      <AnimatePresence>
        {stage >= 1 && (
          <>
            <motion.div
              initial={{ x: -200, opacity: 0 }}
              animate={{ x: 0, opacity: 0.6 }}
              transition={{ duration: 2 }}
              className="absolute bottom-40 left-10 w-32 h-16 bg-white/20 rounded-full blur-sm"
            />
            <motion.div
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 0.4 }}
              transition={{ duration: 2.5 }}
              className="absolute bottom-32 right-10 w-40 h-20 bg-white/15 rounded-full blur-sm"
            />
          </>
        )}
      </AnimatePresence>

      {/* Floating particles */}
      <AnimatePresence>
        {stage >= 1 && (
          <>
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                initial={{ y: 100, opacity: 0 }}
                animate={{ 
                  y: -100,
                  opacity: [0, 0.6, 0],
                  x: Math.sin(i) * 50
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="absolute w-1 h-1 bg-blue-200 rounded-full"
                style={{
                  left: `${Math.random() * 90 + 5}%`,
                  bottom: '10%'
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Text */}
      <div className="relative z-10 text-center">
        <AnimatePresence mode="wait">
          {stage === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-white"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Good night 🌙
              </h2>
              <p className="text-lg md:text-xl text-blue-200">
                from {senderName}
              </p>
            </motion.div>
          )}
          
          {stage === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-white"
            >
              <h2 className="text-2xl md:text-3xl font-light">
                Sleep well ✨
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Good Morning Experience
const GoodMorningExperience = ({ stage, senderName, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: stage >= 1 
          ? 'linear-gradient(to bottom, #fef3c7, #fed7aa, #fdba74)'
          : 'linear-gradient(to bottom, #1e293b, #334155, #475569)'
      }}
      transition={{ duration: 2 }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-gray-800 transition z-20"
      >
        <FiX size={20} />
      </button>

      {/* Sun */}
      <AnimatePresence>
        {stage >= 1 && (
          <motion.div
            initial={{ scale: 0, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="absolute top-16"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: 360
              }}
              transition={{
                scale: { duration: 2, repeat: Infinity },
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' }
              }}
              className="w-28 h-28 rounded-full bg-yellow-400"
              style={{
                boxShadow: '0 0 60px rgba(251, 191, 36, 0.8), 0 0 100px rgba(251, 191, 36, 0.5)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rays */}
      <AnimatePresence>
        {stage >= 1 && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`ray-${i}`}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: [0.3, 0.6, 0.3], scaleY: 1 }}
                transition={{
                  opacity: { duration: 2, repeat: Infinity },
                  scaleY: { duration: 1 }
                }}
                className="absolute top-16 w-2 h-40 bg-yellow-300/50 origin-top"
                style={{
                  left: '50%',
                  transform: `rotate(${i * 45}deg) translateX(-50%)`
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Clouds */}
      <AnimatePresence>
        {stage >= 1 && (
          <>
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: [0, 50, 0], opacity: 0.7 }}
              transition={{ 
                x: { duration: 8, repeat: Infinity },
                opacity: { duration: 1 }
              }}
              className="absolute top-1/3 left-10 w-40 h-20 bg-white/60 rounded-full blur-sm"
            />
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: [0, -30, 0], opacity: 0.5 }}
              transition={{ 
                x: { duration: 6, repeat: Infinity },
                opacity: { duration: 1 }
              }}
              className="absolute top-1/2 right-10 w-32 h-16 bg-white/50 rounded-full blur-sm"
            />
          </>
        )}
      </AnimatePresence>

      {/* Sparkles */}
      <AnimatePresence>
        {stage >= 1 && (
          <>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  y: [-20, -60]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                style={{
                  left: `${Math.random() * 80 + 10}%`,
                  top: `${Math.random() * 60 + 20}%`
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Text */}
      <div className="relative z-10 text-center">
        <AnimatePresence mode="wait">
          {stage === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Good morning ☀️
              </h2>
              <p className="text-lg md:text-xl text-orange-800">
                from {senderName}
              </p>
            </motion.div>
          )}
          
          {stage === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-2xl md:text-3xl font-light text-gray-800">
                Hope today is kind to you
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Hi/Hello Experience
const HiHelloExperience = ({ stage, senderName, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/50 hover:bg-white/70 text-gray-800 transition z-20"
      >
        <FiX size={20} />
      </button>

      {/* Hearts */}
      <AnimatePresence>
        {stage >= 1 && (
          <>
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`heart-${i}`}
                initial={{ 
                  x: i % 2 === 0 ? -100 : window.innerWidth + 100,
                  y: Math.random() * window.innerHeight,
                  opacity: 0,
                  scale: 0
                }}
                animate={{ 
                  x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
                  y: window.innerHeight / 2 + (Math.random() - 0.5) * 200,
                  opacity: [0, 1, 0.8, 0],
                  scale: [0, 1.5, 1, 0.8],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1
                }}
                className="absolute text-4xl"
              >
                {['💕', '💖', '💗', '💓', '💝'][i % 5]}
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Sparkles */}
      <AnimatePresence>
        {stage >= 1 && (
          <>
            {[...Array(25)].map((_, i) => (
              <motion.div
                key={`spark-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  rotate: Math.random() * 360
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05,
                  repeat: 2
                }}
                className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  boxShadow: '0 0 8px rgba(251, 191, 36, 0.8)'
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Text */}
      <div className="relative z-10 text-center">
        <AnimatePresence mode="wait">
          {stage === 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ 
                opacity: 1, 
                scale: [0.5, 1.2, 1],
                rotate: [- 10, 5, 0]
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                Hiiii 👋
              </h2>
            </motion.div>
          )}
          
          {stage === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-3xl md:text-4xl font-light text-gray-800 mb-2">
                Well, hello there ✨
              </h2>
              <p className="text-lg text-gray-600">
                from {senderName}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SpecialMessageExperience;