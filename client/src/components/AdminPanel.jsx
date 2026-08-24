import { useState, useEffect } from 'react';
import {
  adminAPI,
  surpriseAPI,
  openWhenAPI,
  complimentAPI,
  questionAPI,
  gameAPI,
  specialUserAPI
} from '../services/api';

import { motion } from 'framer-motion';

import {
  FiUsers,
  FiGift,
  FiMessageCircle,
  FiHelpCircle,
  FiCpu,
  FiMail,
  FiPlus,
  FiTrash2,
  FiStar,
  FiPlay
} from 'react-icons/fi';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'special-users', label: 'Special Users', icon: FiStar },
    { id: 'surprises', label: 'Surprises', icon: FiGift },
    { id: 'compliments', label: 'Compliments', icon: FiMessageCircle },
    { id: 'questions', label: 'Questions', icon: FiHelpCircle },
    { id: 'games', label: 'Games', icon: FiPlay },
    { id: 'openwhen', label: 'Open When', icon: FiMail },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 lg:px-6 lg:py-5">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          Admin Panel
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your application
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'surprises' && <SurprisesTab />}
        {activeTab === 'compliments' && <ComplimentsTab />}
        {activeTab === 'questions' && <QuestionsTab />}
        {activeTab === 'games' && <GamesTab />}
        {activeTab === 'openwhen' && <OpenWhenTab />}
        {activeTab === 'special-users' && <SpecialUsersTab />}
      </div>
    </div>
  );
};

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [cameraUser, setCameraUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await adminAPI.getUsers();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeleting(userId);
    try {
      await adminAPI.deleteUser(userId);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const handleRequestCamera = (user) => {
    setCameraUser(user);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                    @{user.username}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isAdmin
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.online
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {user.online ? 'Online' : 'Offline'}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {!user.isAdmin && user.online && (
                        <button
                          onClick={() => handleRequestCamera(user)}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition flex items-center space-x-1"
                          title="Request camera access"
                        >
                          <span>📹</span>
                          <span>Camera</span>
                        </button>
                      )}

                      {!user.isAdmin && (
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          disabled={deleting === user._id}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition disabled:opacity-50"
                        >
                          {deleting === user._id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-800 dark:text-blue-400">
          <strong>Camera Access:</strong> When you request camera access, the user will receive a notification asking for their consent. They must explicitly allow access for you to view their camera feed. This ensures privacy and security.
        </p>
      </div>

      {/* Camera Request Modal */}
      {cameraUser && (
        <CameraRequestModal
          user={cameraUser}
          onClose={() => setCameraUser(null)}
        />
      )}
    </div>
  );
};

const SurprisesTab = () => {
  const [surprises, setSurprises] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const [formData, setFormData] = useState({
    recipientId: '',
    type: 'text',
    content: '',
    unlockAt: ''
  });

  const [image, setImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [surprisesRes, usersRes] = await Promise.all([
        adminAPI.getSurprises(),
        adminAPI.getUsers()
      ]);

      setSurprises(surprisesRes.data.surprises);
      setUsers(usersRes.data.users.filter(u => !u.isAdmin));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      data.append('recipientId', formData.recipientId);
      data.append('type', formData.type);
      data.append('content', formData.content);
      data.append('unlockAt', formData.unlockAt);

      if (image) data.append('image', image);

      await surpriseAPI.createSurprise(data);

      setShowCreate(false);
      setFormData({
        recipientId: '',
        type: 'text',
        content: '',
        unlockAt: ''
      });

      setImage(null);
      fetchData();
    } catch (error) {
      console.error('Failed to create surprise:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Manage Surprises
        </h2>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition"
        >
          <FiPlus size={20} />
          <span>Create Surprise</span>
        </button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Create New Surprise
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient
                </label>

                <select
                  value={formData.recipientId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recipientId: e.target.value
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                  required
                >
                  <option value="">Select user</option>

                  {users.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>

                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="compliment">Compliment</option>
                  <option value="question">Question</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content
              </label>

              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    content: e.target.value
                  })
                }
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none resize-none"
                required
              />
            </div>

            {formData.type === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unlock At
              </label>

              <input
                type="datetime-local"
                value={formData.unlockAt}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unlockAt: e.target.value
                  })
                }
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition"
            >
              Create Surprise
            </button>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {surprises.map((surprise) => (
          <div
            key={surprise._id}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase">
                {surprise.type}
              </span>

              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  surprise.unlocked
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {surprise.unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>

            <p className="text-sm text-gray-900 dark:text-white mb-2">
              {surprise.content}
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              For: {surprise.recipient?.name} | Unlocks:{' '}
              {new Date(surprise.unlockAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const SpecialUsersTab = () => {
  const [specialUsers, setSpecialUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [specialRes, usersRes] = await Promise.all([
        specialUserAPI.getAll(),
        adminAPI.getUsers()
      ]);

      setSpecialUsers(specialRes.data.specialUsers);
      setAllUsers(usersRes.data.users.filter(u => !u.isAdmin));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleAdd = async () => {
    if (!selectedUser) return;

    setLoading(true);

    try {
      await specialUserAPI.add(selectedUser, {
        goodNight: true,
        goodMorning: true,
        hiHello: true
      });

      setShowAdd(false);
      setSelectedUser('');
      fetchData();
    } catch (error) {
      console.error('Failed to add special user:', error);
      alert(error.response?.data?.error || 'Failed to add special user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (
    specialUserId,
    experience,
    currentValue
  ) => {
    try {
      const updates = {
        experiences: {
          goodNight:
            experience === 'goodNight'
              ? !currentValue
              : specialUsers.find(
                  su => su._id === specialUserId
                ).experiences.goodNight,

          goodMorning:
            experience === 'goodMorning'
              ? !currentValue
              : specialUsers.find(
                  su => su._id === specialUserId
                ).experiences.goodMorning,

          hiHello:
            experience === 'hiHello'
              ? !currentValue
              : specialUsers.find(
                  su => su._id === specialUserId
                ).experiences.hiHello
        }
      };

      await specialUserAPI.update(
        specialUserId,
        updates
      );

      fetchData();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this user from Special Users?')) return;

    try {
      await specialUserAPI.remove(id);
      fetchData();
    } catch (error) {
      console.error('Failed to remove:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Special Users
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure users who can receive special message experiences
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition"
        >
          <FiPlus size={20} />
          <span>Add Special User</span>
        </button>
      </div>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Add Special User
          </h3>

          <div className="flex space-x-4">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">Select a user</option>

              {allUsers
                .filter(
                  u =>
                    !specialUsers.some(
                      su => su.user._id === u._id
                    )
                )
                .map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name} (@{u.username})
                  </option>
                ))}
            </select>

            <button
              onClick={handleAdd}
              disabled={!selectedUser || loading}
              className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </motion.div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                User
              </th>

              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Good Night 🌙
              </th>

              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Good Morning ☀️
              </th>

              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Hi/Hello 👋
              </th>

              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {specialUsers.map((su) => (
              <tr
                key={su._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    {su.user.profilePicture ? (
                      <img
                        src={su.user.profilePicture}
                        alt={su.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {su.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {su.user.name}
                      </p>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{su.user.username}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() =>
                      handleToggle(
                        su._id,
                        'goodNight',
                        su.experiences.goodNight
                      )
                    }
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      su.experiences.goodNight
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {su.experiences.goodNight ? 'ON' : 'OFF'}
                  </button>
                </td>

                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() =>
                      handleToggle(
                        su._id,
                        'goodMorning',
                        su.experiences.goodMorning
                      )
                    }
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      su.experiences.goodMorning
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {su.experiences.goodMorning ? 'ON' : 'OFF'}
                  </button>
                </td>

                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() =>
                      handleToggle(
                        su._id,
                        'hiHello',
                        su.experiences.hiHello
                      )
                    }
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      su.experiences.hiHello
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {su.experiences.hiHello ? 'ON' : 'OFF'}
                  </button>
                </td>

                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleRemove(su._id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {specialUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No special users configured yet
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-800 dark:text-blue-400">
          <strong>How it works:</strong> When someone sends "good night", "good morning", or "hi/hello" to a Special User,
          they'll see a beautiful animated experience (if enabled). Regular users never see these effects.
        </p>
      </div>
    </div>
  );
};

const ComplimentsTab = () => {
  const [compliments, setCompliments] = useState([]);
  const [newCompliment, setNewCompliment] = useState('');

  useEffect(() => {
    fetchCompliments();
  }, []);

  const fetchCompliments = async () => {
    try {
      const { data } = await adminAPI.getCompliments();
      setCompliments(data.compliments);
    } catch (error) {
      console.error('Failed to fetch compliments:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await complimentAPI.create(newCompliment);
      setNewCompliment('');
      fetchCompliments();
    } catch (error) {
      console.error('Failed to create compliment:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await complimentAPI.delete(id);
      fetchCompliments();
    } catch (error) {
      console.error('Failed to delete compliment:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Add Compliment
        </h3>

        <form onSubmit={handleCreate} className="flex space-x-2">
          <input
            type="text"
            value={newCompliment}
            onChange={(e) => setNewCompliment(e.target.value)}
            placeholder="You're surprisingly easy to talk to..."
            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            required
          />

          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition"
          >
            Add
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {compliments.map((c) => (
          <motion.div
            key={c._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow flex items-center justify-between group"
          >
            <p className="text-gray-900 dark:text-white">
              {c.text}
            </p>

            <button
              onClick={() => handleDelete(c._id)}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition"
            >
              <FiTrash2 size={18} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const QuestionsTab = () => {
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({
    question: '',
    date: ''
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data } = await adminAPI.getQuestions();
      setQuestions(data.questions);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await questionAPI.create(formData);

      setFormData({
        question: '',
        date: ''
      });

      fetchQuestions();
    } catch (error) {
      console.error('Failed to create question:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Add Daily Question
        </h3>

        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            value={formData.question}
            onChange={(e) =>
              setFormData({
                ...formData,
                question: e.target.value
              })
            }
            placeholder="What's your favorite memory from this year?"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            required
          />

          <div className="flex space-x-2">
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  date: e.target.value
                })
              }
              className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            />

            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition"
            >
              Add
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {questions.map((q) => (
          <div
            key={q._id}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow"
          >
            <p className="text-gray-900 dark:text-white mb-1">
              {q.question}
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(q.date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const GamesTab = () => {
  const [gameType, setGameType] = useState('would-you-rather');
  const [questions, setQuestions] = useState([]);

  const [formData, setFormData] = useState({
    question: '',
    optionA: '',
    optionB: '',
    correctAnswer: ''
  });

  useEffect(() => {
    fetchQuestions();
  }, [gameType]);

  const fetchQuestions = async () => {
    try {
      const { data } = await adminAPI.getGameQuestions();

      setQuestions(
        data.questions.filter(
          q => q.gameType === gameType
        )
      );
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await gameAPI.createQuestion({
        ...formData,
        gameType
      });

      setFormData({
        question: '',
        optionA: '',
        optionB: '',
        correctAnswer: ''
      });

      fetchQuestions();
    } catch (error) {
      console.error('Failed to create question:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setGameType('would-you-rather')}
          className={`px-4 py-2 rounded-xl transition ${
            gameType === 'would-you-rather'
              ? 'bg-primary text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Would You Rather
        </button>

        <button
          onClick={() => setGameType('how-well')}
          className={`px-4 py-2 rounded-xl transition ${
            gameType === 'how-well'
              ? 'bg-primary text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          How Well Do You Know Me
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Add Question
        </h3>

        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            value={formData.question}
            onChange={(e) =>
              setFormData({
                ...formData,
                question: e.target.value
              })
            }
            placeholder="Question"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={formData.optionA}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  optionA: e.target.value
                })
              }
              placeholder="Option A"
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              required
            />

            <input
              type="text"
              value={formData.optionB}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  optionB: e.target.value
                })
              }
              placeholder="Option B"
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>

          {gameType === 'how-well' && (
            <input
              type="text"
              value={formData.correctAnswer}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  correctAnswer: e.target.value
                })
              }
              placeholder="Correct Answer (Option A or Option B)"
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
            />
          )}

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition"
          >
            Add Question
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {questions.map((q) => (
          <div
            key={q._id}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow"
          >
            <p className="text-gray-900 dark:text-white mb-2">
              {q.question}
            </p>

            <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>A: {q.optionA}</span>
              <span>B: {q.optionB}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OpenWhenTab = () => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const [formData, setFormData] = useState({
    recipientId: '',
    title: '',
    content: '',
    unlockAt: ''
  });

  const [image, setImage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [messagesRes, usersRes] = await Promise.all([
        adminAPI.getOpenWhen(),
        adminAPI.getUsers()
      ]);

      setMessages(messagesRes.data.messages);
      setUsers(usersRes.data.users.filter(u => !u.isAdmin));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      data.append('recipientId', formData.recipientId);
      data.append('title', formData.title);
      data.append('content', formData.content);

      if (formData.unlockAt) {
        data.append('unlockAt', formData.unlockAt);
      }

      if (image) {
        data.append('image', image);
      }

      await openWhenAPI.create(data);

      setShowCreate(false);

      setFormData({
        recipientId: '',
        title: '',
        content: '',
        unlockAt: ''
      });

      setImage(null);

      fetchData();
    } catch (error) {
      console.error('Failed to create message:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Manage Open When Messages
        </h2>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition"
        >
          <FiPlus size={20} />
          <span>Create Message</span>
        </button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Create New Message
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient
                </label>

                <select
                  value={formData.recipientId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recipientId: e.target.value
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                  required
                >
                  <option value="">Select user</option>

                  {users.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>

                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: e.target.value
                    })
                  }
                  placeholder="Open when you're feeling sad..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content
              </label>

              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    content: e.target.value
                  })
                }
                rows={4}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image (Optional)
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unlock At (Optional - leave empty for immediate)
              </label>

              <input
                type="datetime-local"
                value={formData.unlockAt}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unlockAt: e.target.value
                  })
                }
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition"
            >
              Create Message
            </button>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {msg.title}
              </h3>

              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  msg.opened
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {msg.opened ? 'Opened' : 'Sealed'}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {msg.content}
            </p>

            <p className="text-xs text-gray-500 dark:text-gray-500">
              For: {msg.recipient?.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;