import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { motion } from 'framer-motion';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from 'react-icons/fi';

const VoiceCall = ({ type, otherUser, conversationId, onEnd }) => {
  const socket = useSocket();
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(type === 'voice');
  const [callState, setCallState] = useState('calling'); // calling, connected, ended
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    initializeCall();

    return () => {
      endCall();
    };
  }, []);

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setupPeerConnection(stream);
    } catch (error) {
      console.error('Failed to get user media:', error);
      alert('Could not access camera/microphone. Please check permissions.');
      onEnd();
    }
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

    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallState('connected');
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice', {
          to: otherUser._id,
          candidate: event.candidate
        });
      }
    };

    if (socket) {
      socket.on('call:offer', handleOffer);
      socket.on('call:answer', handleAnswer);
      socket.on('call:ice', handleIceCandidate);
      socket.on('call:end', handleRemoteEnd);

      createOffer();
    }
  };

  const createOffer = async () => {
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      socket.emit('call:offer', {
        to: otherUser._id,
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
      
      socket.emit('call:answer', {
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

  const handleRemoteEnd = () => {
    setCallState('ended');
    setTimeout(onEnd, 1000);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoOff(!videoTrack.enabled);
      }
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    if (socket) {
      socket.emit('call:end', { to: otherUser._id });
      socket.off('call:offer');
      socket.off('call:answer');
      socket.off('call:ice');
      socket.off('call:end');
    }

    onEnd();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900 z-50 flex flex-col"
    >
      {/* Remote Video */}
      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local Video (Picture-in-Picture) */}
        {type === 'video' && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-4 right-4 w-32 h-32 lg:w-48 lg:h-48 rounded-xl object-cover border-2 border-white shadow-lg"
          />
        )}

        {/* Call State */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
          <p className="text-white text-sm font-medium">
            {callState === 'calling' && '📞 Calling...'}
            {callState === 'connected' && '✅ Connected'}
            {callState === 'ended' && '❌ Call Ended'}
          </p>
        </div>

        {/* Other User Info */}
        <div className="absolute bottom-24 left-0 right-0 text-center">
          <h2 className="text-white text-2xl font-bold mb-2">{otherUser.name}</h2>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6">
        <div className="flex items-center justify-center space-x-4 lg:space-x-6">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition ${
              muted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {muted ? <FiMicOff className="text-white" size={24} /> : <FiMic className="text-white" size={24} />}
          </button>

          {type === 'video' && (
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition ${
                videoOff ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {videoOff ? <FiVideoOff className="text-white" size={24} /> : <FiVideo className="text-white" size={24} />}
            </button>
          )}

          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition"
          >
            <FiPhoneOff className="text-white" size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default VoiceCall;