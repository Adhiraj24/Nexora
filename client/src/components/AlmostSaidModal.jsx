import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const AlmostSaidModal = ({ onClose, onSelect }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data } = await adminAPI.getAlmostSaid();
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

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
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Almost Said It...
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <FiX className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          {messages.map((msg) => (
            <button
              key={msg._id}
              onClick={() => onSelect(msg.text)}
              className="w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition"
            >
              <p className="text-gray-900 dark:text-white">{msg.text}</p>
            </button>
          ))}
        </div>

        {messages.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No messages available
          </p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AlmostSaidModal;