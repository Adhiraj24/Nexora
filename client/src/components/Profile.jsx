import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { motion } from 'framer-motion';
import { FiCamera, FiTrash2 } from 'react-icons/fi';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [theme, setTheme] = useState(user.theme);
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(user.profilePicture || '');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDeletePicture = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('theme', theme);
      formData.append('deletePicture', 'true');

      const { data } = await userAPI.updateProfile(formData);
      updateUser(data.user);
      setPreview('');
      setProfilePicture(null);
    } catch (error) {
      console.error('Failed to delete picture:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('theme', theme);
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      const { data } = await userAPI.updateProfile(formData);
      updateUser(data.user);
      
      // Apply theme
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 lg:p-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Profile Settings
          </h1>

          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <span className="text-4xl text-white font-bold">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <label
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary text-white p-3 rounded-full cursor-pointer hover:bg-primary/90 transition shadow-lg"
                >
                  <FiCamera size={20} />
                </label>

                {preview && (
                  <button
                    onClick={handleDeletePicture}
                    className="absolute top-0 right-0 bg-red-500 text-white p-3 rounded-full cursor-pointer hover:bg-red-600 transition shadow-lg"
                    title="Delete profile picture"
                  >
                    <FiTrash2 size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            {/* Username (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-4 py-3 rounded-xl border-2 transition ${
                    theme === 'light'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  ☀️ Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-4 py-3 rounded-xl border-2 transition ${
                    theme === 'dark'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  🌙 Dark
                </button>
              </div>
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
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;