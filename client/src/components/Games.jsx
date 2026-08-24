import { useState, useEffect } from 'react';
import { gameAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiArrowRight } from 'react-icons/fi';

const Games = () => {
  const [selectedGame, setSelectedGame] = useState(null);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4 lg:p-8">
      {!selectedGame ? (
        <GameSelector onSelect={setSelectedGame} />
      ) : selectedGame === 'would-you-rather' ? (
        <WouldYouRather onBack={() => setSelectedGame(null)} />
      ) : (
        <HowWell onBack={() => setSelectedGame(null)} />
      )}
    </div>
  );
};

const GameSelector = ({ onSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🎮</div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Games
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get to know each other better
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GameCard
          title="Would You Rather"
          description="Make impossible choices together"
          emoji="🤔"
          color="from-purple-400 to-pink-400"
          onClick={() => onSelect('would-you-rather')}
        />
        <GameCard
          title="How Well Do You Know Me?"
          description="Test your knowledge about each other"
          emoji="🧠"
          color="from-blue-400 to-purple-400"
          onClick={() => onSelect('how-well')}
        />
      </div>
    </motion.div>
  );
};

const GameCard = ({ title, description, emoji, color, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 cursor-pointer group"
    >
      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition`}>
        {emoji}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {description}
      </p>
      <div className="flex items-center text-primary font-medium group-hover:translate-x-2 transition">
        <span>Play Now</span>
        <FiArrowRight className="ml-2" />
      </div>
    </motion.div>
  );
};

const WouldYouRather = ({ onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data } = await gameAPI.getQuestions('would-you-rather');
      setQuestions(data.questions);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelected(null);
    } else {
      onBack();
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const question = questions[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <button
        onClick={onBack}
        className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
      >
        ← Back to Games
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 lg:p-12">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Would You Rather...
          </h2>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={() => setSelected('A')}
            className={`w-full p-6 rounded-2xl border-2 transition text-left ${
              selected === 'A'
                ? 'border-primary bg-primary/10 shadow-lg scale-105'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary'
            }`}
          >
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {question.optionA}
            </p>
          </button>

          <button
            onClick={() => setSelected('B')}
            className={`w-full p-6 rounded-2xl border-2 transition text-left ${
              selected === 'B'
                ? 'border-primary bg-primary/10 shadow-lg scale-105'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary'
            }`}
          >
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {question.optionB}
            </p>
          </button>
        </div>

        {selected && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleNext}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-4 rounded-xl transition"
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

const HowWell = ({ onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data } = await gameAPI.getQuestions('how-well');
      setQuestions(data.questions);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const handleAnswer = (answer) => {
    setSelected(answer);
    if (answer === questions[currentIndex].correctAnswer) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelected(null);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-12">
          <div className="text-6xl mb-6">
            {score === questions.length ? '🏆' : score >= questions.length / 2 ? '👏' : '😅'}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Your Score
          </h2>
          <p className="text-5xl font-bold text-primary mb-6">
            {score} / {questions.length}
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {score === questions.length
              ? 'Perfect! You know each other so well! 💕'
              : score >= questions.length / 2
              ? 'Not bad! Keep learning about each other! 😊'
              : 'Time to spend more quality time together! 💬'}
          </p>
          <button
            onClick={onBack}
            className="bg-primary hover:bg-primary/90 text-white font-medium px-8 py-3 rounded-xl transition"
          >
            Back to Games
          </button>
        </div>
      </motion.div>
    );
  }

  const question = questions[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <button
        onClick={onBack}
        className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
      >
        ← Back to Games
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 lg:p-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <p className="text-sm font-medium text-primary">
            Score: {score}
          </p>
        </div>

        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          {question.question}
        </h2>

        <div className="space-y-4">
          {[question.optionA, question.optionB].map((option, idx) => {
            const isCorrect = option === question.correctAnswer;
            const isSelected = selected === option;
            const letter = idx === 0 ? 'A' : 'B';

            return (
              <button
                key={idx}
                onClick={() => !selected && handleAnswer(option)}
                disabled={selected !== null}
                className={`w-full p-6 rounded-2xl border-2 transition text-left ${
                  selected
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : isSelected
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                }`}
              >
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {option}
                  {selected && isCorrect && ' ✓'}
                  {selected && isSelected && !isCorrect && ' ✗'}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default Games;