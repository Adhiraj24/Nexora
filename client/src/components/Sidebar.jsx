import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { conversationAPI, userAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiImage, FiStar, FiHelpCircle, FiGift, FiMail, FiGrid, FiSettings, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useSocket } from '../context/SocketContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [showLogout, setShowLogout] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const { conversationId } = useParams();

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('message:new', (message) => {
        fetchConversations();
      });

      socket.on('presence:update', () => {
        fetchUsers();
      });
    }

    return () => {
      if (socket) {
        socket.off('message:new');
        socket.off('presence:update');
      }
    };
  }, [socket]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const fetchConversations = async () => {
    try {
      const { data } = await conversationAPI.getAll();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await userAPI.getUsers();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { icon: FiMessageCircle, label: 'Chats', path: '/' },
    { icon: FiImage, label: 'Memories', path: '/memories' },
    { icon: FiGift, label: 'Surprises', path: '/surprises' },
    { icon: FiHelpCircle, label: 'Question', path: '/question' },
    { icon: FiStar, label: 'Games', path: '/games' },
    { icon: FiMail, label: 'Open When', path: '/open-when' },
    { icon: FiGrid, label: 'Universe', path: '/universe' },
  ];

  if (user.isAdmin) {
    navItems.push({ icon: FiSettings, label: 'Admin', path: '/admin' });
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
            Something Between Us
          </h1>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* User Profile */}
        <Link to="/profile" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              @{user.username}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Quick Nav */}
        <div className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Conversations */}
        {conversations.length > 0 && (
        <div className="px-4 pb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-4">
            Conversations
            </h3>
            <div className="space-y-1">
            {conversations.map((conv) => {
                // FIX: Properly identify other user
                const currentUserId = user?.id || user?._id;
                const otherUser = conv.participants?.find(p => {
                const participantId = p?._id || p;
                return participantId?.toString() !== currentUserId?.toString();
                });
                
                // Skip if no other user found
                if (!otherUser) {
                return null;
                }
                
                const isActive = conversationId === conv._id;
                const hasUnread = conv.unreadCount > 0;
                
                return (
                <button
                    key={conv._id}
                    onClick={() => navigate(`/chat/${conv._id}`)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${
                    isActive
                        ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                        : hasUnread
                        ? 'bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                    <div className="relative flex-shrink-0">
                    {otherUser?.profilePicture ? (
                        <img
                        src={otherUser.profilePicture}
                        alt={otherUser?.name}
                        className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                        <span className="text-white font-semibold">
                            {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                        </div>
                    )}
                    {otherUser?.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                    <p className={`text-sm truncate ${
                        hasUnread 
                        ? 'font-bold text-gray-900 dark:text-white' 
                        : 'font-medium text-gray-900 dark:text-white'
                    }`}>
                        {conv.nickname || otherUser?.name || 'Unknown'}
                    </p>
                    {conv.isFavorite && (
                        <p className="text-xs text-purple-500">⭐ Favorite</p>
                    )}
                    </div>
                    {hasUnread && (
                    <div className="flex-shrink-0">
                        <div className="bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </div>
                    </div>
                    )}
                </button>
                );
            }).filter(Boolean)}
            </div>
        </div>
        )}

        {/* Available Users */}
        {users.length > 0 && (
          <div className="px-4 pb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-4">
              Start a conversation
            </h3>
            <div className="space-y-1">
              {users.filter(u => !conversations.some(c => 
                c.participants.some(p => p._id === u._id)
              )).map((otherUser) => (
                <button
                  key={otherUser._id}
                  onClick={() => startConversation(otherUser._id)}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="relative flex-shrink-0">
                    {otherUser.profilePicture ? (
                      <img
                        src={otherUser.profilePicture}
                        alt={otherUser.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {otherUser.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {otherUser.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {otherUser.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {otherUser.online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowLogout(true)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
        >
          <FiLogOut />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowLogout(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Leaving already?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to log out?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Stay
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition"
                >
                  Log out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button - Fixed position, not overlapping */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-40 p-3 bg-primary text-white rounded-xl shadow-lg hover:bg-primary/90 transition"
          aria-label="Open menu"
        >
          <FiMenu size={24} />
        </button>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 border-r border-gray-200 dark:border-gray-700">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileOpen(false)}
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] z-50 shadow-xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;