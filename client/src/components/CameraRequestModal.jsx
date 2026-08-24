import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { motion } from 'framer-motion';
import { FiX, FiVideo, FiVideoOff, FiCamera } from 'react-icons/fi';

const CameraRequestModal = ({ user, onClose }) => {
  const socket = useSocket();
  const [status, setStatus] = useState('requesting'); // requesting, connected, denied, recording
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const videoRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    if (socket) {
      // Send camera access request
      socket.emit('camera:request', { userId: user._id });

      // Listen for responses
      socket.on('camera:accepted', handleCameraAccepted);
      socket.on('camera:denied', handleCameraDenied);
      socket.on('camera:offer', handleOffer);
      socket.on('camera:answer', handleAnswer);
      socket.on('camera:ice', handleIceCandidate);
      socket.on('camera:ended', handleCameraEnded);

      return () => {
        socket.off('camera:accepted');
        socket.off('camera:denied');
        socket.off('camera:offer');
        socket.off('camera:answer');
        socket.off('camera:ice');
        socket.off('camera:ended');
        
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      };
    }
  }, [socket, user._id]);

  const handleCameraAccepted = async () => {
    setStatus('connected');
    setupPeerConnection();
  };

  const handleCameraDenied = () => {
    setStatus('denied');
  };

  const handleCameraEnded = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    onClose();
  };

  const setupPeerConnection = () => {
    const configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    peerConnection.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
        remoteStreamRef.current = event.streams[0];
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('camera:ice', {
          to: user._id,
          candidate: event.candidate
        });
      }
    };

    createOffer();
  };

  const createOffer = async () => {
    try {
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true
      });
      await peerConnectionRef.current.setLocalDescription(offer);
      
      socket.emit('camera:offer', {
        to: user._id,
        offer
      });
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
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

  const startRecording = () => {
    if (!remoteStreamRef.current) return;

    const mediaRecorder = new MediaRecorder(remoteStreamRef.current, {
      mimeType: 'video/webm'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `camera-capture-${user.name}-${Date.now()}.webm`;
      a.click();
      setRecordedChunks([]);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snapshot-${user.name}-${Date.now()}.png`;
      a.click();
    });
  };

  const endSession = () => {
    if (socket) {
      socket.emit('camera:end', { userId: user._id });
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={endSession}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <span className="text-white font-semibold">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {status === 'requesting' && 'Requesting camera access...'}
                {status === 'connected' && 'Camera connected'}
                {status === 'denied' && 'Access denied'}
              </p>
            </div>
          </div>
          <button
            onClick={endSession}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <FiX className="text-gray-600 dark:text-gray-300" size={24} />
          </button>
        </div>

        {/* Video Display */}
        <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
          {status === 'requesting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mb-4 mx-auto"></div>
                <p className="text-white text-lg">Waiting for {user.name} to accept...</p>
              </div>
            </div>
          )}

          {status === 'denied' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🚫</div>
                <p className="text-white text-lg">{user.name} denied camera access</p>
              </div>
            </div>
          )}

          {status === 'connected' && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              
              {recording && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center space-x-2 animate-pulse">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <span className="text-sm font-medium">Recording</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        {status === 'connected' && (
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-center space-x-4">
            <button
              onClick={captureSnapshot}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition flex items-center space-x-2"
            >
              <FiCamera size={20} />
              <span>Snapshot</span>
            </button>

            {!recording ? (
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition flex items-center space-x-2"
              >
                <FiVideo size={20} />
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition flex items-center space-x-2"
              >
                <FiVideoOff size={20} />
                <span>Stop Recording</span>
              </button>
            )}

            <button
              onClick={endSession}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition"
            >
              End Session
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CameraRequestModal;