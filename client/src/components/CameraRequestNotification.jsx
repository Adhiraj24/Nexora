import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const CameraRequestNotification = () => {
  const socket = useSocket();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    if (socket) {
      socket.on('camera:request', handleCameraRequest);
      socket.on('camera:offer', handleOffer);
      socket.on('camera:answer', handleAnswer);
      socket.on('camera:ice', handleIceCandidate);
      socket.on('camera:end', handleEndSession);

      return () => {
        socket.off('camera:request');
        socket.off('camera:offer');
        socket.off('camera:answer');
        socket.off('camera:ice');
        socket.off('camera:end');
        cleanupStream();
      };
    }
  }, [socket]);

  const handleCameraRequest = ({ adminId }) => {
    setRequest({ adminId });
  };

  const handleAccept = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      setStreaming(true);
      setRequest(null);

      socket.emit('camera:accepted', { adminId: request.adminId });
      setupPeerConnection(stream);
    } catch (error) {
      console.error('Failed to get user media:', error);
      alert('Could not access camera/microphone. Please check permissions.');
      handleDeny();
    }
  };

  const handleDeny = () => {
    socket.emit('camera:denied', { adminId: request.adminId });
    setRequest(null);
  };

  const setupPeerConnection = (stream) => {
    const configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('camera:ice', {
          to: request.adminId,
          candidate: event.candidate
        });
      }
    };
  };

  const handleOffer = async ({ offer, from }) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      socket.emit('camera:answer', {
        to: from,
        answer
      });
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  };

  const handleAnswer = async ({ answer }) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  };

  const handleIceCandidate = async ({ candidate }) => {
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  };

  const handleEndSession = () => {
    cleanupStream();
    setStreaming(false);
  };

  const cleanupStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const handleStopSharing = () => {
    if (socket && request) {
      socket.emit('camera:ended', { adminId: request.adminId });
    }
    cleanupStream();
    setStreaming(false);
  };

  return (
    <>
      {/* Camera Request Popup */}
      <AnimatePresence>
        {request && !streaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center"
            >
              <div className="text-6xl mb-4">📹</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Camera Access Request
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Admin is requesting access to your camera and microphone. Do you want to allow?
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  ⚠️ Your camera and microphone will be shared with the admin. You can stop sharing at any time.
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleDeny}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition"
                >
                  Deny
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition"
                >
                  Allow
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Sharing Indicator */}
      <AnimatePresence>
        {streaming && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 bg-red-600 text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center space-x-3"
          >
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">Camera Active</span>
            </div>
            <button
              onClick={handleStopSharing}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition text-sm"
            >
              Stop
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CameraRequestNotification;