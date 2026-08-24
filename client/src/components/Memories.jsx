import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { memoryAPI, conversationAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { FiPlus, FiImage, FiMessageSquare, FiFileText, FiTrash2, FiX } from 'react-icons/fi';

const Memories = () => {
  const { user } = useAuth();
  const [memories, setMemories] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMemory, setViewMemory] = useState(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMemories();
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const { data } = await conversationAPI.getAll();
      setConversations(data.conversations);
      if (data.conversations.length > 0) {
        setSelectedConversation(data.conversations[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchMemories = async () => {
    if (!selectedConversation) return;
    try {
      const { data } = await memoryAPI.getMemories(selectedConversation);
      setMemories(data.memories);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 lg:px-6 lg:py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Memories
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Save your special moments
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="p-3 rounded-full bg-primary text-white hover:bg-primary/90 transition shadow-lg"
          >
            <FiPlus size={24} />
          </button>
        </div>

        {/* Conversation Selector */}
        {conversations.length > 0 && (
        <div className="mt-4 flex space-x-2 overflow-x-auto scrollbar-hide">
            {conversations.map((conv) => {
            const otherUser = conv.participants?.find(
                p => p?._id !== user?._id && p?._id !== user?.id
            );

            return (
                <button
                key={conv._id}
                onClick={() => setSelectedConversation(conv._id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full transition ${
                    selectedConversation === conv._id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                >
                {conv.nickname || otherUser?.name || 'Unknown User'}
                </button>
            );
            })}
        </div>
        )}
      </div>

      {/* Memories Timeline */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No memories yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start creating memories with your special person
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition"
            >
              Create Memory
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <AnimatePresence>
              {memories.map((memory) => (
                <MemoryCard
                  key={memory._id}
                  memory={memory}
                  onClick={() => setViewMemory(memory)}
                  onDelete={() => {
                    memoryAPI.deleteMemory(memory._id);
                    fetchMemories();
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Memory Modal */}
      {showCreate && (
        <CreateMemoryModal
          conversationId={selectedConversation}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchMemories();
          }}
        />
      )}

      {/* View Memory Modal */}
      {viewMemory && (
        <ViewMemoryModal
          memory={viewMemory}
          onClose={() => setViewMemory(null)}
        />
      )}
    </div>
  );
};

const MemoryCard = ({ memory, onClick, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition group"
      onClick={onClick}
    >
      <div className="flex flex-col lg:flex-row">
        {memory.imageUrl && (
          <div className="lg:w-1/3">
            <img
              src={memory.imageUrl}
              alt={memory.title}
              className="w-full h-48 lg:h-full object-cover"
            />
          </div>
        )}
        <div className={`flex-1 p-6 ${!memory.imageUrl ? 'lg:p-8' : ''}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-primary font-medium mb-2">
                {format(new Date(memory.date), 'MMMM dd, yyyy')}
              </p>
              {memory.title && (
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {memory.title}
                </h3>
              )}
              <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                {memory.content}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="ml-4 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 opacity-0 group-hover:opacity-100 transition"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CreateMemoryModal = ({ conversationId, onClose, onCreated }) => {
  const [type, setType] = useState('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('conversationId', conversationId);
      formData.append('type', type);
      formData.append('title', title);
      formData.append('content', content);
      formData.append('date', date);
      if (image) {
        formData.append('image', image);
      }

      await memoryAPI.createMemory(formData);
      onCreated();
    } catch (error) {
      console.error('Failed to create memory:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Memory
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <FiX className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setType('note')}
              className={`p-4 rounded-xl border-2 transition ${
                type === 'note' ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <FiFileText className="mx-auto mb-2 text-primary" size={24} />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Note</p>
            </button>
            <button
              type="button"
              onClick={() => setType('message')}
              className={`p-4 rounded-xl border-2 transition ${
                type === 'message' ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <FiMessageSquare className="mx-auto mb-2 text-primary" size={24} />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Message</p>
            </button>
            <button
              type="button"
              onClick={() => setType('image')}
              className={`p-4 rounded-xl border-2 transition ${
                type === 'image' ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <FiImage className="mx-auto mb-2 text-primary" size={24} />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Image</p>
            </button>
          </div>

          {/* Image Upload */}
          {type === 'image' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Image
              </label>
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setPreview('');
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <FiImage size={48} className="text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload</p>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this memory a title..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe this memory..."
              rows={4}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl transition disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Memory'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const ViewMemoryModal = ({ memory, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {memory.imageUrl && (
          <img src={memory.imageUrl} alt={memory.title} className="w-full h-64 lg:h-96 object-cover" />
        )}
        <div className="p-6 lg:p-8">
          <p className="text-sm text-primary font-medium mb-2">
            {format(new Date(memory.date), 'MMMM dd, yyyy')}
          </p>
          {memory.title && (
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {memory.title}
            </h2>
          )}
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {memory.content}
          </p>
          <button
            onClick={onClose}
            className="mt-6 w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Memories;