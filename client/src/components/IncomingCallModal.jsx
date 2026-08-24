import { motion, AnimatePresence } from 'framer-motion';
import { FiPhone, FiVideo, FiPhoneOff } from 'react-icons/fi';
import { useCall } from '../context/CallContext';

const IncomingCallModal = () => {
  const { callState, callType, remoteUser, acceptCall, rejectCall, CALL_STATES } = useCall();

  const isRinging = callState === CALL_STATES.RINGING;

  return (
    <AnimatePresence>
      {isRinging && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mb-6"
            >
              {callType === 'audio' ? <FiPhone className="text-white" size={40} /> : <FiVideo className="text-white" size={40} />}
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Incoming {callType} call
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {remoteUser?.name || 'Someone'} is calling you...
            </p>

            <div className="flex justify-center space-x-6">
              <button
                onClick={rejectCall}
                className="p-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition shadow-lg"
              >
                <FiPhoneOff size={28} />
              </button>
              <button
                onClick={acceptCall}
                className="p-5 bg-green-500 hover:bg-green-600 text-white rounded-full transition shadow-lg"
              >
                {callType === 'audio' ? <FiPhone size={28} /> : <FiVideo size={28} />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IncomingCallModal;