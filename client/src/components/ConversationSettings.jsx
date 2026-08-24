import { useState } from 'react';
import { conversationAPI } from '../services/api';
import { motion } from 'framer-motion';
import { FiX, FiStar, FiImage, FiClock } from 'react-icons/fi';

const ConversationSettings = ({ conversation, otherUser, onClose, onUpdate }) => {
  const [isFavorite, setIsFavorite] = useState(conversation.isFavorite);
  const [nickname, setNickname] = useState(conversation.nickname || '');
  const [vanishEnabled, setVanishEnabled] = useState(
    conversation.vanishMode?.enabled || false
  );
  const [vanishDuration, setVanishDuration] = useState(
    conversation.vanishMode?.duration || 3600
  );
  const [saving, setSaving] = useState(false);

  const durations = [
    { label: '10 seconds', value: 10 },
    { label: '30 seconds', value: 30 },
    { label: '1 minute', value: 60 },
    { label: '1 hour', value: 3600 },
    { label: '24 hours', value: 86400 },
  ];

  const handleSave = async () => {
    setSaving(true);

    try {
      await conversationAPI.update(conversation._id, {
        isFavorite,
        nickname,
        vanishMode: {
          enabled: vanishEnabled,
          duration: vanishDuration
        }
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update conversation:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center p-0 lg:p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 200
        }}
        className="bg-white dark:bg-gray-800 rounded-t-3xl lg:rounded-2xl p-6 w-full lg:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Conversation Settings
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiX className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">

          {/* Favorite */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-3">
                <FiStar
                  className={
                    isFavorite
                      ? 'text-yellow-500'
                      : 'text-gray-400'
                  }
                  size={20}
                />

                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Mark as Favorite
                  </p>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your favorite conversation
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Nickname
            </label>

            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={otherUser.name}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          {/* Vanish Mode */}
          <div>
            <label className="flex items-center justify-between cursor-pointer mb-4">
              <div className="flex items-center space-x-3">
                <FiClock
                  className="text-purple-500"
                  size={20}
                />

                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Vanish Mode
                  </p>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Messages disappear automatically
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={vanishEnabled}
                onChange={(e) => setVanishEnabled(e.target.checked)}
                className="w-5 h-5 text-purple-500 rounded focus:ring-2 focus:ring-purple-500"
              />
            </label>

            {vanishEnabled && (
              <div className="space-y-2 pl-8">
                {durations.map((duration) => (
                  <label
                    key={duration.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="duration"
                      value={duration.value}
                      checked={vanishDuration === duration.value}
                      onChange={(e) =>
                        setVanishDuration(
                          Number(e.target.value)
                        )
                      }
                      className="text-purple-500 focus:ring-purple-500"
                    />

                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {duration.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConversationSettings;