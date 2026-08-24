import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messageAPI, conversationAPI, userAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import SpecialMessageExperience from './SpecialMessageExperience';
import {
  FiSend,
  FiImage,
  FiMic,
  FiMoreVertical,
  FiStar,
  FiTrash2,
  FiCornerUpLeft,
  FiSmile,
  FiSettings,
  FiPhone,
  FiVideo
} from 'react-icons/fi';
import MessageBubble from './MessageBubble';
import ConversationSettings from './ConversationSettings';
import VoiceCall from './VoiceCall';
import AlmostSaidModal from './AlmostSaidModal';
import { playCrystalBreak } from '../utils/sounds';

const Chat = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [typing, setTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showAlmostSaid, setShowAlmostSaid] = useState(false);
  const [onCall, setOnCall] = useState(false);
  const [callType, setCallType] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [specialExperience, setSpecialExperience] = useState(null);
  const [experienceCooldown, setExperienceCooldown] = useState({});

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const getUserId = (userObject) => {
    if (!userObject) return null;

    return (
      userObject._id ||
      userObject.id ||
      userObject.userId ||
      null
    );
  };

  const getParticipantId = (participant) => {
    if (!participant) return null;

    if (typeof participant === 'string') {
      return participant;
    }

    return (
      participant._id ||
      participant.id ||
      participant.userId ||
      null
    );
  };

  const getSenderId = (sender) => {
    if (!sender) return null;

    if (typeof sender === 'string') {
      return sender;
    }

    return (
      sender._id ||
      sender.id ||
      sender.userId ||
      null
    );
  };

  const currentUserId = getUserId(user);

  // --------------------------------------------------
  // Fetch conversation/messages
  // --------------------------------------------------

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchMessages();
    }
  }, [conversationId]);

  // --------------------------------------------------
  // Scroll
  // --------------------------------------------------

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --------------------------------------------------
  // Socket listeners
  // --------------------------------------------------

  useEffect(() => {
    if (socket && conversationId) {
      socket.on('message:new', handleNewMessage);
      socket.on('message:typing', handleTyping);
      socket.on('message:read', handleMessageRead);
      socket.on('message:reaction', handleReactionUpdate);
      socket.on('message:deleted', handleMessageDeleted);
      socket.on('call:incoming', handleIncomingCall);
      socket.on('special:trigger', handleSpecialTrigger);

      return () => {
        socket.off('message:new', handleNewMessage);
        socket.off('message:typing', handleTyping);
        socket.off('message:read', handleMessageRead);
        socket.off('message:reaction', handleReactionUpdate);
        socket.off('message:deleted', handleMessageDeleted);
        socket.off('call:incoming', handleIncomingCall);
        socket.off('special:trigger', handleSpecialTrigger);
      };
    }
  }, [socket, conversationId]);

  const handleSpecialTrigger = ({
    type,
    messageId,
    conversationId: triggerConvId,
    senderName
  }) => {
    if (triggerConvId !== conversationId) {
      return;
    }

    const now = Date.now();
    const lastTrigger = experienceCooldown[type];

    if (lastTrigger && now - lastTrigger < 15000) {
      return;
    }

    setExperienceCooldown(prev => ({
      ...prev,
      [type]: now
    }));

    setSpecialExperience({ type, senderName });
  };

  const handleMessageDeleted = ({ messageId }) => {
    playCrystalBreak();

    setTimeout(() => {
      setMessages(prev =>
        prev.filter(msg => msg._id !== messageId)
      );
    }, 700);
  };

  // --------------------------------------------------
  // Fetch conversation
  // --------------------------------------------------

const fetchConversation = async () => {
  try {
    const { data } = await conversationAPI.getAll();
    const conv = data.conversations.find(c => c._id === conversationId);
    
    if (!conv) {
      console.error('Conversation not found');
      return;
    }
    
    setConversation(conv);
    
    // FIX: Properly identify other user with multiple ID format checks
    const currentUserId = user?.id || user?._id;
    const other = conv.participants?.find(p => {
      const participantId = p?._id || p;
      return participantId?.toString() !== currentUserId?.toString();
    });
    
    if (!other) {
      console.error('Could not find other user in conversation');
      return;
    }
    
    setOtherUser(other);
  } catch (error) {
    console.error('Failed to fetch conversation:', error);
  }
};

  // --------------------------------------------------
  // Fetch messages
  // --------------------------------------------------

  const fetchMessages = async () => {
    try {
      const { data } = await messageAPI.getMessages(conversationId);

      const fetchedMessages = Array.isArray(data?.messages)
        ? data.messages
        : [];

      setMessages(fetchedMessages);

      fetchedMessages.forEach((msg) => {
        if (!msg) return;

        const senderId = getSenderId(msg.sender);

        if (
          !msg.read &&
          senderId &&
          currentUserId &&
          senderId.toString() !== currentUserId.toString()
        ) {
          messageAPI.markAsRead(msg._id);

          if (socket) {
            socket.emit('message:read', {
              messageId: msg._id,
              recipientId: senderId
            });
          }
        }
      });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  // --------------------------------------------------
  // New message socket event
  // --------------------------------------------------

  const handleNewMessage = (message) => {
    if (!message) return;

    const messageConversationId =
      typeof message.conversation === 'object'
        ? message.conversation?._id
        : message.conversation;

    if (
      messageConversationId?.toString() !==
      conversationId?.toString()
    ) {
      return;
    }

    setMessages((prev) => {
      const exists = prev.some(
        m => m?._id?.toString() === message?._id?.toString()
      );

      if (exists) {
        return prev;
      }

      return [...prev, message];
    });

    const senderId = getSenderId(message.sender);

    if (
      senderId &&
      currentUserId &&
      senderId.toString() !== currentUserId.toString()
    ) {
      messageAPI.markAsRead(message._id);

      if (socket) {
        socket.emit('message:read', {
          messageId: message._id,
          recipientId: senderId
        });
      }
    }
  };

  // --------------------------------------------------
  // Typing
  // --------------------------------------------------

  const handleTyping = (data) => {
    if (!data) return;

    const dataUserId = data.userId;

    if (
      data.conversationId?.toString() === conversationId?.toString() &&
      dataUserId?.toString() !== currentUserId?.toString()
    ) {
      setTyping(Boolean(data.typing));
    }
  };

  // --------------------------------------------------
  // Message read
  // --------------------------------------------------

  const handleMessageRead = ({ messageId }) => {
    if (!messageId) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg?._id?.toString() === messageId?.toString()
          ? {
              ...msg,
              read: true,
              readAt: new Date()
            }
          : msg
      )
    );
  };

  const handleReactionUpdate = ({ messageId, reactions }) => {
    if (!messageId) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg?._id?.toString() === messageId?.toString()
          ? {
              ...msg,
              reactions: reactions || []
            }
          : msg
      )
    );
  };

  // --------------------------------------------------
  // Incoming call
  // --------------------------------------------------

  const handleIncomingCall = ({ from, type, callerName }) => {
    setIncomingCall({
      from,
      type,
      callerName: callerName || 'Someone'
    });
  };

  // --------------------------------------------------
  // Send message
  // --------------------------------------------------

  const sendMessage = async (e) => {
    e.preventDefault();

    const selectedFile = fileInputRef.current?.files?.[0];

    if (!newMessage.trim() && !selectedFile) {
      return;
    }

    try {
      const formData = new FormData();

      formData.append('conversationId', conversationId);
      formData.append('content', newMessage);
      formData.append('type', 'text');

      formData.append(
        'vanish',
        conversation?.vanishMode?.enabled || false
      );

      if (replyTo?._id) {
        formData.append('replyTo', replyTo._id);
      }

      if (selectedFile) {
        formData.append('file', selectedFile);
        formData.append('type', 'image');
      }

      const { data } = await messageAPI.sendMessage(formData);

      if (data?.message) {
        setMessages((prev) => [...prev, data.message]);
      }

      setNewMessage('');
      setReplyTo(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // --------------------------------------------------
  // Input change
  // --------------------------------------------------

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    if (socket && otherUser) {
      const recipientId = getParticipantId(otherUser);

      if (!recipientId) return;

      socket.emit('message:typing', {
        conversationId,
        recipientId,
        typing: true
      });

      clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('message:typing', {
          conversationId,
          recipientId,
          typing: false
        });
      }, 1000);
    }
  };

  // --------------------------------------------------
  // Image select
  // --------------------------------------------------

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  // --------------------------------------------------
  // Scroll
  // --------------------------------------------------

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  // --------------------------------------------------
  // Start call
  // --------------------------------------------------

  const startCall = (type) => {
    setCallType(type);
    setOnCall(true);

    if (socket && otherUser) {
      const recipientId = getParticipantId(otherUser);

      if (recipientId) {
        socket.emit('call:initiate', {
          to: recipientId,
          type,
          callerName: user?.name || 'Someone'
        });
      }
    }
  };

  // --------------------------------------------------
  // Accept call
  // --------------------------------------------------

  const acceptCall = () => {
    if (!incomingCall) return;

    setCallType(incomingCall.type);
    setOnCall(true);
    setIncomingCall(null);
  };

  // --------------------------------------------------
  // Reject call
  // --------------------------------------------------

  const rejectCall = () => {
    if (socket && incomingCall) {
      socket.emit('call:reject', {
        to: incomingCall.from
      });
    }

    setIncomingCall(null);
  };

  // --------------------------------------------------
  // Chat Landing
  // --------------------------------------------------

  const ChatLanding = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    if (conversations.length > 0) {
        console.log('Current User ID:', user?.id || user?._id);
        console.log('Conversations:', conversations.map(c => ({
        id: c._id,
        participants: c.participants?.map(p => ({
            id: p?._id || p,
            name: p?.name || 'unknown'
        }))
        })));
    }
    }, [conversations, user]);

    useEffect(() => {
      fetchData();
    }, []);

    const fetchData = async () => {
      try {
        const [convRes, usersRes] = await Promise.all([
          conversationAPI.getAll(),
          userAPI.getUsers()
        ]);

        setConversations(convRes.data.conversations);
        setUsers(usersRes.data.users);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    const startConversation = async (userId) => {
      try {
        const { data } = await conversationAPI.getOrCreate(userId);
        navigate(`/chat/${data.conversation._id}`);
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }
    };

    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">

        {/* Header with greeting */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 lg:p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="text-6xl mb-4"
          >
            💬
          </motion.div>

          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Hey {user.name}! 👋
          </h1>

          <p className="text-gray-600 dark:text-gray-400">
            Who would you like to talk to?
          </p>
        </motion.div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Recent Conversations */}
            {conversations.length > 0 && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 px-2">
                Recent Chats
                </h2>
                <div className="space-y-3">
                {conversations.map((conv, idx) => {
                    // FIX: Properly identify the other user
                    const otherUser = conv.participants?.find(p => {
                    const participantId = p?._id || p;
                    const currentUserId = user?.id || user?._id;
                    return participantId?.toString() !== currentUserId?.toString();
                    });

                    // Skip if we can't find the other user
                    if (!otherUser) {
                    console.warn('Could not find other user in conversation:', conv._id);
                    return null;
                    }

                    return (
                    <motion.button
                        key={conv._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        onClick={() => navigate(`/chat/${conv._id}`)}
                        className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 group"
                    >
                        <div className="flex items-center space-x-4">
                        <div className="relative flex-shrink-0">
                            {otherUser.profilePicture ? (
                            <img
                                src={otherUser.profilePicture}
                                alt={otherUser.name}
                                className="w-14 h-14 lg:w-16 lg:h-16 rounded-full object-cover ring-2 ring-purple-200 dark:ring-purple-800"
                            />
                            ) : (
                            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center ring-2 ring-purple-200 dark:ring-purple-800">
                                <span className="text-white font-bold text-xl">
                                {otherUser.name?.charAt(0).toUpperCase() || '?'}
                                </span>
                            </div>
                            )}
                            {otherUser.online && (
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                            )}
                            {conv.isFavorite && (
                            <div className="absolute -top-1 -right-1 text-yellow-500">
                                <span className="text-xl">⭐</span>
                            </div>
                            )}
                        </div>

                        <div className="flex-1 text-left min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary transition truncate">
                            {conv.nickname || otherUser.name || 'Unknown User'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {otherUser.online ? (
                                <span className="text-green-500">● Online</span>
                            ) : (
                                `Last seen ${formatDistanceToNow(new Date(otherUser.lastSeen || Date.now()), { addSuffix: true })}`
                            )}
                            </p>
                        </div>

                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-gray-400 group-hover:text-primary transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                        </div>
                    </motion.button>
                    );
                }).filter(Boolean)}
                </div>
            </motion.div>
            )}
            {/* Available Users */}
            {users.filter(
              u =>
                !conversations.some(c =>
                  c.participants.some(p => p._id === u._id)
                )
            ).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 px-2">
                  Start a New Chat
                </h2>

                <div className="space-y-3">
                  {users
                    .filter(
                      u =>
                        !conversations.some(c =>
                          c.participants.some(p => p._id === u._id)
                        )
                    )
                    .map((otherUser, idx) => (
                      <motion.button
                        key={otherUser._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.2 + idx * 0.05
                        }}
                        onClick={() =>
                          startConversation(otherUser._id)
                        }
                        className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 group"
                      >
                        <div className="flex items-center space-x-4">

                          <div className="relative flex-shrink-0">
                            {otherUser.profilePicture ? (
                              <img
                                src={otherUser.profilePicture}
                                alt={otherUser.name}
                                className="w-14 h-14 lg:w-16 lg:h-16 rounded-full object-cover ring-2 ring-blue-200 dark:ring-blue-800"
                              />
                            ) : (
                              <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center ring-2 ring-blue-200 dark:ring-blue-800">
                                <span className="text-white font-bold text-xl">
                                  {otherUser.name
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                            )}

                            {otherUser.online && (
                              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                            )}
                          </div>

                          <div className="flex-1 text-left">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary transition">
                              {otherUser.name}
                            </h3>

                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              @{otherUser.username}
                            </p>
                          </div>

                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </div>
                          </div>

                        </div>
                      </motion.button>
                    ))}
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {conversations.length === 0 && users.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">🌟</div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No conversations yet
                </h3>

                <p className="text-gray-600 dark:text-gray-400">
                  Start chatting with someone special
                </p>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------------------
  // No conversation selected
  // --------------------------------------------------

  if (!conversationId) {
    return <ChatLanding />;
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (!conversation || !otherUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Safe user information
  const otherUserName = otherUser?.name || 'Unknown User';

  const otherUserInitial =
    otherUserName?.charAt?.(0)?.toUpperCase() || '?';

  const lastSeenText = otherUser?.lastSeen
    ? formatDistanceToNow(
        new Date(otherUser.lastSeen),
        { addSuffix: true }
      )
    : 'recently';

  return (
    <>
      <div className="flex-1 flex flex-col h-screen bg-gray-50 dark:bg-gray-900">

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:px-6 lg:py-4">
          <div className="flex items-center justify-between">

            <div className="flex items-center space-x-3 flex-1 min-w-0 ml-0 lg:ml-0">

              <div className="lg:hidden w-12"></div>

              <div className="relative flex-shrink-0">
                {otherUser.profilePicture ? (
                  <img
                    src={otherUser.profilePicture}
                    alt={otherUser.name}
                    className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {otherUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {otherUser.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-sm lg:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {conversation.nickname || otherUser.name}
                </h2>

                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {typing ? (
                    <span className="text-primary">
                      typing...
                    </span>
                  ) : otherUser.online ? (
                    'Online'
                  ) : (
                    `Last seen ${formatDistanceToNow(
                      new Date(otherUser.lastSeen),
                      { addSuffix: true }
                    )}`
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">

              {conversation.isFavorite && (
                <div className="text-yellow-500 hidden sm:block">
                  <FiStar size={18} fill="currentColor" />
                </div>
              )}

              <button
                onClick={() => startCall('voice')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                title="Voice call"
              >
                <FiPhone size={18} className="lg:w-5 lg:h-5" />
              </button>

              <button
                onClick={() => startCall('video')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                title="Video call"
              >
                <FiVideo size={18} className="lg:w-5 lg:h-5" />
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                title="Settings"
              >
                <FiMoreVertical
                  size={18}
                  className="lg:w-5 lg:h-5"
                />
              </button>

            </div>
          </div>

          {/* Vanish Mode Indicator */}
          {conversation.vanishMode?.enabled && (
            <div className="mt-2 flex items-center justify-center">
              <div className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium">
                🔥 Vanish Mode Active
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 scrollbar-hide space-y-4">

          <AnimatePresence mode="popLayout">
            {messages &&
              messages.map((message, idx) => {
                const senderId =
                  message?.sender?._id || message?.sender;

                const currentUserId =
                  user?.id || user?._id;

                const isOwnMessage =
                  senderId &&
                  currentUserId
                    ? senderId.toString() ===
                      currentUserId.toString()
                    : false;

                const handleMessageDelete = (messageId) => {
                  setMessages(prev =>
                    prev.filter(
                      msg => msg._id !== messageId
                    )
                  );
                };

                return (
                  <MessageBubble
                    key={message?._id || idx}
                    message={message}
                    isOwn={isOwnMessage}
                    onReply={setReplyTo}
                    conversationId={conversationId}
                    onDelete={handleMessageDelete}
                  />
                );
              })}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Reply Preview */}
        {replyTo && (
          <div className="px-4 lg:px-6 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">

            <div className="flex items-center justify-between">

              <div className="flex-1 min-w-0">

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Replying to{' '}
                  {replyTo?.sender?.name || 'message'}
                </p>

                <p className="text-sm text-gray-900 dark:text-white truncate">
                  {replyTo?.content || ''}
                </p>

              </div>

              <button
                onClick={() => setReplyTo(null)}
                className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>

            </div>

          </div>
        )}

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 py-3 lg:px-6 lg:py-4 safe-area-inset-bottom">

          <form
            onSubmit={sendMessage}
            className="flex items-end space-x-2"
          >

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={() => {}}
            />

            {/* Action Buttons */}
            <div className="flex items-center space-x-1 pb-2">

              <button
                type="button"
                onClick={handleImageSelect}
                className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition active:scale-95"
                title="Send image"
              >
                <FiImage size={22} />
              </button>

              <button
                type="button"
                onClick={() => setShowAlmostSaid(true)}
                className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition active:scale-95"
                title="Almost Said It"
              >
                <span className="text-xl">💭</span>
              </button>

            </div>

            {/* Input Field */}
            <div className="flex-1 flex items-end space-x-2">

              <textarea
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none max-h-32 text-base"
                style={{ minHeight: '44px' }}
              />

              <button
                type="submit"
                disabled={
                  !newMessage.trim() &&
                  !fileInputRef.current?.files[0]
                }
                className="p-3 rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95 flex-shrink-0"
                style={{
                  minWidth: '44px',
                  minHeight: '44px'
                }}
              >
                <FiSend size={20} />
              </button>

            </div>
          </form>
        </div>
      </div>

      {/* Incoming Call Notification */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full text-center"
          >

            <div className="text-6xl mb-4">
              {incomingCall.type === 'video'
                ? '📹'
                : '📞'}
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Incoming {incomingCall.type} call
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {incomingCall.callerName || 'Someone'} is calling you...
            </p>

            <div className="flex space-x-4">

              <button
                onClick={rejectCall}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition"
              >
                Decline
              </button>

              <button
                onClick={acceptCall}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition"
              >
                Accept
              </button>

            </div>

          </motion.div>
        </div>
      )}

      {/* Conversation Settings Modal */}
      {showSettings && (
        <ConversationSettings
          conversation={conversation}
          otherUser={otherUser}
          onClose={() => setShowSettings(false)}
          onUpdate={fetchConversation}
        />
      )}

      {/* Almost Said Modal */}
      {showAlmostSaid && (
        <AlmostSaidModal
          onClose={() => setShowAlmostSaid(false)}
          onSelect={(text) => {
            setNewMessage(text);
            setShowAlmostSaid(false);
          }}
        />
      )}

      {/* Voice/Video Call */}
      {onCall && (
        <VoiceCall
          type={callType}
          otherUser={otherUser}
          conversationId={conversationId}
          onEnd={() => setOnCall(false)}
        />
      )}

      <AnimatePresence>
        {specialExperience && (
          <SpecialMessageExperience
            type={specialExperience.type}
            senderName={specialExperience.senderName}
            onClose={() => setSpecialExperience(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Chat;