import { useState, useEffect } from 'react';
import { memoryAPI, conversationAPI } from '../services/api';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Universe = () => {
  const { user } = useAuth();
  const [memories, setMemories] = useState([]);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: convData } = await conversationAPI.getAll();
      setConversations(convData.conversations);

      if (convData.conversations.length > 0) {
        const allMemories = [];
        for (const conv of convData.conversations) {
          const { data } = await memoryAPI.getMemories(conv._id);
          allMemories.push(...data.memories);
        }
        setMemories(allMemories);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  return (
    <div className="flex-1 overflow-hidden bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 relative">
      {/* Stars Background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 text-center pt-12 pb-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
            Our Little Universe
          </h1>
          <p className="text-purple-200">
            {memories.length} memories among the stars
          </p>
        </motion.div>
      </div>

      {/* Memory Stars */}
      <div className="relative z-10 h-full px-4 pb-20">
        <div className="max-w-6xl mx-auto h-full relative">
          {memories.map((memory, index) => {
            const angle = (index / memories.length) * Math.PI * 2;
            const radius = 200 + (index % 3) * 80;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <motion.div
                key={memory._id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="absolute cursor-pointer group"
                style={{
                  left: '50%',
                  top: '40%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                }}
                onClick={() => setSelectedMemory(memory)}
              >
                <div className="relative">
                  <div className="w-4 h-4 bg-yellow-300 rounded-full shadow-lg group-hover:scale-150 transition-transform" />
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {memory.title || memory.content.substring(0, 30)}...
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Memory */}
      {selectedMemory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedMemory(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 lg:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedMemory.imageUrl && (
              <img
                src={selectedMemory.imageUrl}
                alt={selectedMemory.title}
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
            )}
            {selectedMemory.title && (
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedMemory.title}
              </h3>
            )}
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {selectedMemory.content}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(selectedMemory.date).toLocaleDateString()}
            </p>
            <button
              onClick={() => setSelectedMemory(null)}
              className="mt-4 w-full bg-primary text-white py-2 rounded-xl hover:bg-primary/90 transition"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}

      {memories.length === 0 && (
        <div className="relative z-10 text-center text-white">
          <p className="text-xl">Your universe is waiting for memories...</p>
        </div>
      )}
    </div>
  );
};

export default Universe;