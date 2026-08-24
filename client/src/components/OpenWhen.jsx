import { useState, useEffect } from 'react';
import { openWhenAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiX } from 'react-icons/fi';
import { isPast } from 'date-fns';

const OpenWhen = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [opening, setOpening] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data } = await openWhenAPI.getAll();
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const openMessage = async (message) => {
    if (message.unlockAt && !isPast(new Date(message.unlockAt))) {
      alert('This message is not yet unlockable!');
      return;
    }

    setOpening(message._id);
    try {
      await openWhenAPI.open(message._id);
      setSelectedMessage(message);
      fetchMessages();
    } catch (error) {
      console.error('Failed to open message:', error);
    } finally {
      setOpening(null);
    }
  };

  const unopened = messages.filter(m => !m.opened);
  const opened = messages.filter(m => m.opened);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">💌</div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Open When...
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Letters for special moments
          </p>
        </motion.div>

        {/* Unopened Messages */}
        {unopened.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Waiting for You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unopened.map((message) => (
                <OpenWhenCard
                  key={message._id}
                  message={message}
                  onClick={() => openMessage(message)}
                  opening={opening === message._id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Opened Messages */}
        {opened.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Already Opened
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opened.map((message) => (
                <OpenedCard
                  key={message._id}
                  message={message}
                  onClick={() => setSelectedMessage(message)}
                />
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 dark:text-gray-400">
              No messages yet. Check back later!
            </p>
          </div>
        )}

        {/* Message Modal */}
        <AnimatePresence>
          {selectedMessage && (
            <MessageModal
              message={selectedMessage}
              onClose={() => setSelectedMessage(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const OpenWhenCard = ({ message, onClick, opening }) => {
  const canOpen = !message.unlockAt || isPast(new Date(message.unlockAt));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900/30">
          {canOpen ? (
            <FiMail className="text-pink-600 dark:text-pink-400" size={24} />
          ) : (
            <FiLock className="text-gray-400" size={24} />
          )}
        </div>
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {message.title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {canOpen ? 'Ready to open' : 'Locked until the right moment'}
      </p>
    </motion.div>
  );
};

const OpenedCard = ({ message, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-2xl p-6 shadow-lg cursor-pointer border-2 border-pink-200 dark:border-pink-800"
      onClick={onClick}
    >
      <div className="flex items-center space-x-2 mb-3">
        <FiMail className="text-pink-600 dark:text-pink-400" size={20} />
        <span className="text-xs font-medium text-pink-600 dark:text-pink-400">
          Opened
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        {message.title}
      </h3>
    </motion.div>
  );
};

const MessageModal = ({ message, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt={message.title}
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-6 lg:p-8">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {message.title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiX className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-6">
            {message.content}
          </p>
          {message.openedAt && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Opened on {new Date(message.openedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OpenWhen;