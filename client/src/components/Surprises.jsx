import { useState, useEffect } from 'react';
import { surpriseAPI, complimentAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast } from 'date-fns';
import { FiGift, FiLock, FiUnlock, FiHeart } from 'react-icons/fi';

const Surprises = () => {
  const [surprises, setSurprises] = useState([]);
  const [compliment, setCompliment] = useState(null);
  const [showCompliment, setShowCompliment] = useState(false);
  const [unlocking, setUnlocking] = useState(null);

  useEffect(() => {
    fetchSurprises();
  }, []);

  const fetchSurprises = async () => {
    try {
      const { data } = await surpriseAPI.getSurprises();
      setSurprises(data.surprises);
    } catch (error) {
      console.error('Failed to fetch surprises:', error);
    }
  };

  const getRandomCompliment = async () => {
    try {
      const { data } = await complimentAPI.getRandom();
      setCompliment(data.compliment);
      setShowCompliment(true);
      setTimeout(() => setShowCompliment(false), 5000);
    } catch (error) {
      console.error('Failed to fetch compliment:', error);
    }
  };

  const unlockSurprise = async (surprise) => {
    if (!isPast(new Date(surprise.unlockAt))) {
      alert('This surprise is not yet unlockable!');
      return;
    }

    setUnlocking(surprise._id);
    try {
      await surpriseAPI.unlockSurprise(surprise._id);
      fetchSurprises();
    } catch (error) {
      console.error('Failed to unlock surprise:', error);
    } finally {
      setUnlocking(null);
    }
  };

  const pendingSurprises = surprises.filter(s => !s.unlocked);
  const unlockedSurprises = surprises.filter(s => s.unlocked);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Surprises
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You have something waiting for you...
          </p>
          <button
            onClick={getRandomCompliment}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition inline-flex items-center space-x-2"
          >
            <FiHeart size={20} />
            <span>Get a compliment</span>
          </button>
        </motion.div>

        {/* Pending Surprises */}
        {pendingSurprises.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Locked Surprises
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSurprises.map((surprise) => (
                <SurpriseCard
                  key={surprise._id}
                  surprise={surprise}
                  onUnlock={unlockSurprise}
                  unlocking={unlocking === surprise._id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Unlocked Surprises */}
        {unlockedSurprises.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Unlocked Surprises
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unlockedSurprises.map((surprise) => (
                <UnlockedSurpriseCard key={surprise._id} surprise={surprise} />
              ))}
            </div>
          </div>
        )}

        {surprises.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎁</div>
            <p className="text-gray-600 dark:text-gray-400">
              No surprises yet. Stay tuned!
            </p>
          </div>
        )}

        {/* Compliment Toast */}
        <AnimatePresence>
          {showCompliment && compliment && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-2xl shadow-2xl z-50"
            >
              <p className="text-lg font-medium">{compliment.text}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const SurpriseCard = ({ surprise, onUnlock, unlocking }) => {
  const canUnlock = isPast(new Date(surprise.unlockAt));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
          {canUnlock ? (
            <FiUnlock className="text-purple-600 dark:text-purple-400" size={24} />
          ) : (
            <FiLock className="text-gray-400" size={24} />
          )}
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {surprise.type}
        </span>
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        Mystery Surprise
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {canUnlock ? (
          'Ready to unlock!'
        ) : (
          `Unlocks ${format(new Date(surprise.unlockAt), 'MMM dd, yyyy HH:mm')}`
        )}
      </p>

      <button
        onClick={() => onUnlock(surprise)}
        disabled={!canUnlock || unlocking}
        className="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {unlocking ? 'Unlocking...' : canUnlock ? 'Unlock Now' : 'Locked'}
      </button>
    </motion.div>
  );
};

const UnlockedSurpriseCard = ({ surprise }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 shadow-lg border-2 border-purple-200 dark:border-purple-800"
    >
      {surprise.imageUrl && (
        <img
          src={surprise.imageUrl}
          alt="Surprise"
          className="w-full h-48 object-cover rounded-xl mb-4"
        />
      )}
      <div className="flex items-center space-x-2 mb-3">
        <FiGift className="text-purple-600 dark:text-purple-400" />
        <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase">
          {surprise.type}
        </span>
      </div>
      <p className="text-gray-900 dark:text-white font-medium">
        {surprise.content}
      </p>
    </motion.div>
  );
};

export default Surprises;