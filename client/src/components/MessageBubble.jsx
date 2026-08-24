import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { messageAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { FiCornerUpLeft, FiTrash2, FiSmile } from 'react-icons/fi';
import { playCrystalBreak } from '../utils/sounds';

const MessageBubble = ({ message, isOwn, onReply, conversationId, onDelete }) => {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const reactions = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

  const handleReaction = async (emoji) => {
    try {
      const currentUserId = user?._id || user?.id || user?.userId;

      if (!currentUserId) {
        console.error('Current user ID not found');
        return;
      }

      const newReaction = {
        user: currentUserId,
        emoji
      };

      const existingReactionIndex = (message.reactions || []).findIndex(
        (r) => {
          const reactionUserId =
            typeof r?.user === 'object'
              ? r?.user?._id || r?.user?.id || r?.user?.userId
              : r?.user;

          return (
            reactionUserId &&
            reactionUserId.toString() === currentUserId.toString()
          );
        }
      );

      let updatedReactions;

      if (existingReactionIndex !== -1) {
        updatedReactions = [...(message.reactions || [])];
        updatedReactions[existingReactionIndex] = newReaction;
      } else {
        updatedReactions = [
          ...(message.reactions || []),
          newReaction
        ];
      }

      // Keep local UI updated immediately
      message.reactions = updatedReactions;

      setShowReactions(false);
      setShowActions(false);

      await messageAPI.addReaction(message._id, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleDelete = async () => {
    try {
      // Start delete animation
      setIsDeleting(true);

      // Play crystal break sound
      playCrystalBreak();

      // Wait for animation to complete
      setTimeout(async () => {
        try {
          await messageAPI.deleteMessage(message._id);

          // Notify parent component
          if (onDelete) {
            onDelete(message._id);
          }
        } catch (error) {
          console.error('Failed to delete message:', error);
          setIsDeleting(false);
        }
      }, 600);

    } catch (error) {
      console.error('Failed to delete message:', error);
      setIsDeleting(false);
    }
  };

  if (!message || message.deleted) return null;

  const senderName =
    message.sender?.name ||
    (typeof message.sender === 'string'
      ? message.sender
      : 'Unknown');

  return (
    <AnimatePresence mode="wait">
      {!isDeleting ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            scale: 0.3,
            rotateZ: 15,
            transition: { duration: 0.4 }
          }}
          className={`flex ${
            isOwn ? 'justify-end' : 'justify-start'
          } group`}

          // Desktop
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}

          // Mobile / Touch
          onTouchStart={() => {
            setShowActions(true);
          }}
          onTouchEnd={() => {
            setTimeout(() => {
              setShowActions(false);
            }, 3000);
          }}
        >
          <div
            className={`max-w-[85%] lg:max-w-md flex flex-col ${
              isOwn ? 'items-end' : 'items-start'
            }`}
          >
            {/* Sender Name */}
            {!isOwn && (
              <div className="px-3 mb-1">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {senderName}
                </p>
              </div>
            )}

            {/* Reply Reference */}
            {message.replyTo && (
              <div
                className={`mb-1 px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-xs max-w-full ${
                  isOwn ? 'self-end' : 'self-start'
                }`}
              >
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  {message.replyTo?.sender?.name || 'Unknown'}
                </p>

                <p className="text-gray-900 dark:text-white truncate">
                  {message.replyTo?.content || ''}
                </p>
              </div>
            )}

            {/* Message Content */}
            <div
              className={`relative px-4 py-3 rounded-2xl shadow-md ${
                isOwn
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md'
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-600'
              } ${
                message.vanish ? 'animate-pulse' : ''
              }`}
            >
              {message.type === 'image' &&
                message.fileUrl && (
                  <img
                    src={message.fileUrl}
                    alt="Shared"
                    className="rounded-lg mb-2 max-w-full h-auto max-h-64 object-cover"
                  />
                )}

              {message.content && (
                <p className="text-sm lg:text-base break-words whitespace-pre-wrap">
                  {message.content}
                </p>
              )}

              {/* ================================================= */}
              {/* Message Actions */}
              {/* ================================================= */}

              <div
                className={`${
                  showActions
                    ? 'opacity-100'
                    : 'opacity-0 lg:opacity-0 lg:group-hover:opacity-100'
                } transition-opacity`}
              >
                <div
                  className={`absolute -top-10 ${
                    isOwn ? 'right-0' : 'left-0'
                  } flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-full shadow-lg px-2 py-1 z-10 border border-gray-200 dark:border-gray-600`}
                >
                  {/* React */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReactions(!showReactions);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition active:scale-95"
                    title="React"
                  >
                    <FiSmile
                      size={18}
                      className="text-gray-600 dark:text-gray-300"
                    />
                  </button>

                  {/* Reply */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                      if (onReply) {
                        onReply(message);
                      }

                      setShowActions(false);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition active:scale-95"
                    title="Reply"
                  >
                    <FiCornerUpLeft
                      size={18}
                      className="text-gray-600 dark:text-gray-300"
                    />
                  </button>

                  {/* Delete */}
                  {isOwn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition active:scale-95"
                      title="Delete"
                    >
                      <FiTrash2
                        size={18}
                        className="text-red-500"
                      />
                    </button>
                  )}
                </div>
              </div>

              {/* ================================================= */}
              {/* Reaction Picker */}
              {/* ================================================= */}

              {showReactions && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -10,
                    scale: 0.9
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1
                  }}
                  className={`absolute -top-20 ${
                    isOwn ? 'right-0' : 'left-0'
                  } flex space-x-1 bg-white dark:bg-gray-700 rounded-full shadow-xl px-3 py-2 z-20 border border-gray-200 dark:border-gray-600`}
                >
                  {reactions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(emoji);
                      }}
                      className="text-xl hover:scale-125 transition-transform active:scale-95 p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* ================================================= */}
            {/* Reactions Display */}
            {/* ================================================= */}

            {message.reactions &&
              message.reactions.length > 0 && (
                <div
                  className={`flex items-center flex-wrap gap-1 mt-1 px-2 ${
                    isOwn ? 'self-end' : 'self-start'
                  }`}
                >
                  {message.reactions.map(
                    (reaction, idx) => (
                      <span
                        key={`${reaction?.user || idx}-${idx}`}
                        className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700"
                      >
                        {reaction?.emoji || '❤️'}
                      </span>
                    )
                  )}
                </div>
              )}

            {/* ================================================= */}
            {/* Timestamp & Read Status */}
            {/* ================================================= */}

            <div
              className={`flex items-center space-x-1 mt-1 px-2 text-xs ${
                isOwn
                  ? 'self-end text-gray-500 dark:text-gray-400'
                  : 'self-start text-gray-500 dark:text-gray-400'
              }`}
            >
              <span>
                {message.createdAt
                  ? formatDistanceToNow(
                      new Date(message.createdAt),
                      {
                        addSuffix: true
                      }
                    )
                  : 'Just now'}
              </span>

              {isOwn && (
                <span
                  className={
                    message.read
                      ? 'text-blue-500'
                      : 'text-gray-400'
                  }
                >
                  {message.read ? '✓✓' : '✓'}
                </span>
              )}

              {message.vanish && (
                <span
                  className="text-purple-500"
                  title="Vanish mode active"
                >
                  🔥
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        /* ===================================================== */
        /* Delete / Crystal Break Animation */
        /* ===================================================== */

        <motion.div
          className={`flex ${
            isOwn ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[85%] lg:max-w-md flex flex-col ${
              isOwn ? 'items-end' : 'items-start'
            }`}
          >
            <motion.div
              initial={{
                scale: 1,
                opacity: 1
              }}
              animate={{
                scale: [
                  1,
                  1.1,
                  0.9,
                  1.15,
                  0
                ],
                opacity: [
                  1,
                  0.8,
                  0.6,
                  0.3,
                  0
                ],
                rotateZ: [
                  0,
                  -5,
                  5,
                  -10,
                  15
                ]
              }}
              transition={{
                duration: 0.6,
                times: [
                  0,
                  0.2,
                  0.4,
                  0.7,
                  1
                ],
                ease: 'easeInOut'
              }}
              className={`relative px-4 py-3 rounded-2xl ${
                isOwn
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {/* Shatter effect overlay */}
              <motion.div
                initial={{
                  opacity: 0
                }}
                animate={{
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 0.6
                }}
                className="absolute inset-0 pointer-events-none"
              >
                {/* Crystal shards */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      x: 0,
                      y: 0,
                      opacity: 0,
                      scale: 0
                    }}
                    animate={{
                      x:
                        Math.cos(
                          (i * 45 * Math.PI) / 180
                        ) * 100,
                      y:
                        Math.sin(
                          (i * 45 * Math.PI) / 180
                        ) * 100,
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0.5],
                      rotate:
                        Math.random() * 360
                    }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.05,
                      ease: 'easeOut'
                    }}
                    className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-400 rounded-sm"
                    style={{
                      boxShadow:
                        '0 0 8px rgba(59, 130, 246, 0.8)'
                    }}
                  />
                ))}
              </motion.div>

              <p className="text-sm lg:text-base break-words whitespace-pre-wrap opacity-0">
                {message.content || 'Message'}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MessageBubble;