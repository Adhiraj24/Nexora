import { motion, AnimatePresence } from 'framer-motion';
import { FiPhone, FiVideo, FiPhoneOff, FiMic, FiMicOff, FiCamera, FiCameraOff } from 'react-icons/fi';
import { useCall } from '../context/CallContext';

const ActiveCallView = () => {
  const { 
    callState, callType, remoteUser, isMuted, isCameraOff, callDuration, permissionError,
    localVideoRef, remoteVideoRef, endCall, toggleMute, toggleCamera, formatDuration, CALL_STATES 
  } = useCall();

  const isActive = [
    CALL_STATES.CALLING, CALL_STATES.CONNECTING, CALL_STATES.CONNECTED
  ].includes(callState);

  const statusText = () => {
    switch(callState) {
      case CALL_STATES.CALLING: return 'Ringing...';
      case CALL_STATES.CONNECTING: return 'Connecting...';
      case CALL_STATES.CONNECTED: return `Connected • ${formatDuration(callDuration)}`;
      case CALL_STATES.REJECTED: return 'Call Rejected';
      case CALL_STATES.BUSY: return 'User is Busy';
      case CALL_STATES.FAILED: return permissionError || 'Call Failed';
      default: return '';
    }
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-gray-900 flex flex-col"
        >
          {callType === 'video' ? (
            <div className="relative flex-1">
              <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
              <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-4 right-4 w-32 h-48 md:w-40 md:h-60 object-cover rounded-2xl shadow-xl border-2 border-white z-10" />
              
              {isCameraOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center">
                    <FiCameraOff className="text-gray-400" size={48} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-8 shadow-2xl"
              >
                <FiPhone className="text-white" size={64} />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">{remoteUser?.name}</h2>
              <p className="text-gray-300 text-lg">{statusText()}</p>
            </div>
          )}

          {/* Controls */}
          <div className="bg-black/50 backdrop-blur-md p-6 flex items-center justify-center space-x-6 z-20">
            <button onClick={toggleMute} className={`p-4 rounded-full transition ${isMuted ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'}`}>
              {isMuted ? <FiMicOff className="text-white" size={24} /> : <FiMic className="text-white" size={24} />}
            </button>

            {callType === 'video' && (
              <button onClick={toggleCamera} className={`p-4 rounded-full transition ${isCameraOff ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30'}`}>
                {isCameraOff ? <FiCameraOff className="text-white" size={24} /> : <FiCamera className="text-white" size={24} />}
              </button>
            )}

            <button onClick={endCall} className="p-5 bg-red-600 hover:bg-red-700 rounded-full transition shadow-lg">
              <FiPhoneOff className="text-white" size={28} />
            </button>
          </div>

          {/* Permission Error Overlay */}
          {permissionError && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white p-4 rounded-xl shadow-xl text-center">
              <p className="font-bold mb-2">Permission Error</p>
              <p className="text-sm">{permissionError}</p>
              <button onClick={endCall} className="mt-4 px-4 py-2 bg-white text-red-500 font-bold rounded-lg">End Call</button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActiveCallView;