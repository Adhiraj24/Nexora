import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    title: "Looks like you found your way here.",
    subtitle: "This isn't just another chat app."
  },
  {
    title: "A little conversation, a few surprises,",
    subtitle: "and some things worth remembering."
  },
  {
    title: "Ready?",
    subtitle: "Let's set up your profile."
  }
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('light');
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const { completeOnboarding, user } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name || user.name);
      formData.append('theme', theme);
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      await completeOnboarding(formData);
      navigate('/');
    } catch (error) {
      console.error('Onboarding failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (currentStep < 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl text-center"
          >
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {steps[currentStep].title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
              {steps[currentStep].subtitle}
            </p>
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-xl transition"
            >
              {currentStep === 2 ? "Let's go" : 'Continue'}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Set up your profile
          </h2>

          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-4xl text-gray-400">
                      {(name || user.name).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={user.name}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
            </div>

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

            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete setup'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;