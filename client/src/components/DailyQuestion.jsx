import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { questionAPI } from '../services/api';
import { motion } from 'framer-motion';
import { FiHelpCircle, FiSend } from 'react-icons/fi';

const DailyQuestion = () => {
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [myAnswer, setMyAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuestion();
  }, []);

  const fetchQuestion = async () => {
    try {
      const { data } = await questionAPI.getToday();
      setQuestion(data.question);
      setAnswers(data.answers);
      
      const userAnswer = data.answers.find(a => a.user._id === user.id);
      if (userAnswer) {
        setMyAnswer(userAnswer.answer);
        setHasAnswered(true);
      }
    } catch (error) {
      console.error('Failed to fetch question:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!myAnswer.trim()) return;

    setLoading(true);
    try {
      await questionAPI.answer(question._id, myAnswer);
      setHasAnswered(true);
      fetchQuestion();
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <p className="text-gray-600 dark:text-gray-400">No question for today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 lg:p-10 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <FiHelpCircle className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Question of the Day</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {question.question}
          </h1>

          {/* Answer Form */}
          {!hasAnswered ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={myAnswer}
                onChange={(e) => setMyAnswer(e.target.value)}
                placeholder="Share your thoughts..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Submitting...' : 'Submit Answer'}</span>
                <FiSend size={18} />
              </button>
            </form>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <p className="text-green-700 dark:text-green-400 font-medium mb-2">
                ✓ You've answered this question
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                {myAnswer}
              </p>
            </div>
          )}
        </div>

        {/* All Answers */}
        {answers.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Answers
            </h2>
            {answers.map((answer) => (
              <motion.div
                key={answer._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center space-x-3 mb-3">
                  {answer.user.profilePicture ? (
                    <img
                      src={answer.user.profilePicture}
                      alt={answer.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {answer.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {answer.user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(answer.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {answer.answer}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DailyQuestion;