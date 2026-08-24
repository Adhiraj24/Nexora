import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { playMessageNotification } from '../utils/sounds';

const CallContext = createContext();
export const useCall = () => useContext(CallContext);

const CALL_STATES = {
  IDLE: 'idle',
  CALLING: 'calling',
  RINGING: 'ringing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ENDED: 'ended',
  REJECTED: 'rejected',
  BUSY: 'busy',
  FAILED: 'failed'
};

export const CallProvider = ({ children }) => {
  const socket = useSocket();
  const { user } = useAuth();
  
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [callType, setCallType] = useState(null);
  const [callId, setCallId] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isCaller, setIsCaller] = useState(false);

  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const callTimerRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const currentCallIdRef = useRef(null);
  const isCallerRef = useRef(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const getIceServers = () => {
    const servers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
    
    if (import.meta.env.VITE_TURN_SERVER) {
      servers.push({
        urls: import.meta.env.VITE_TURN_SERVER,
        username: import.meta.env.VITE_TURN_USERNAME || '',
        credential: import.meta.env.VITE_TURN_CREDENTIAL || ''
      });
    }
    
    return servers;
  };

  const cleanup = useCallback(() => {
    console.log('[Call] Cleaning up call resources');
    
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        track.stop();
        console.log('[Call] Stopped track:', track.kind);
      });
      localStream.current = null;
    }
    
    if (peerConnection.current) {
      peerConnection.current.ontrack = null;
      peerConnection.current.onicecandidate = null;
      peerConnection.current.onconnectionstatechange = null;
      peerConnection.current.oniceconnectionstatechange = null;
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (remoteStream.current) {
      remoteStream.current.getTracks().forEach(track => track.stop());
      remoteStream.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    iceCandidatesQueue.current = [];
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    
    currentCallIdRef.current = null;
    isCallerRef.current = false;
    
    setCallState(CALL_STATES.IDLE);
    setCallId(null);
    setRemoteUser(null);
    setCallType(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setPermissionError(null);
    setCallDuration(0);
    setIsCaller(false);
  }, []);

  const createPeerConnection = useCallback((activeCallId) => {
    console.log('[Call] Creating peer connection for call:', activeCallId);
    
    const pc = new RTCPeerConnection({ iceServers: getIceServers() });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && activeCallId) {
        console.log('[Call] Sending ICE candidate');
        socket.emit('call:ice-candidate', { 
          callId: activeCallId, 
          candidate: event.candidate 
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[Call] Received remote track:', event.track.kind);
      
      if (!remoteStream.current) {
        remoteStream.current = new MediaStream();
      }
      
      remoteStream.current.addTrack(event.track);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream.current;
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[Call] Connection state:', pc.connectionState);
      
      switch (pc.connectionState) {
        case 'connected':
          setCallState(CALL_STATES.CONNECTED);
          if (!callTimerRef.current) {
            callTimerRef.current = setInterval(() => {
              setCallDuration(prev => prev + 1);
            }, 1000);
          }
          break;
        case 'disconnected':
        case 'failed':
          setCallState(CALL_STATES.FAILED);
          setTimeout(cleanup, 2000);
          break;
        default:
          break;
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[Call] ICE connection state:', pc.iceConnectionState);
    };

    return pc;
  }, [socket, cleanup]);

  const getMediaStream = async (type) => {
    try {
      const constraints = {
        audio: true,
        video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false
      };
      
      console.log('[Call] Requesting media:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStream.current = stream;
      
      // Attach local stream after slight delay to ensure ref is available
      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }, 100);
      
      setPermissionError(null);
      return stream;
    } catch (err) {
      console.error('[Call] getUserMedia error:', err);
      let errorMsg = 'Permission denied';
      if (err.name === 'NotFoundError') errorMsg = 'Camera/microphone not found';
      if (err.name === 'NotReadableError') errorMsg = 'Device already in use';
      if (err.name === 'NotAllowedError') errorMsg = 'Permission denied by user';
      setPermissionError(errorMsg);
      throw err;
    }
  };

  // ==================== INITIATE CALL (CALLER) ====================
  const initiateCall = useCallback(async (recipient, convId, type) => {
    if (callState !== CALL_STATES.IDLE) {
      console.warn('[Call] Cannot initiate: already in call state:', callState);
      return;
    }
    
    console.log('[Call] Initiating call to:', recipient.name, 'type:', type);
    
    try {
      const stream = await getMediaStream(type);
      const id = crypto.randomUUID();
      
      currentCallIdRef.current = id;
      isCallerRef.current = true;
      
      setCallId(id);
      setRemoteUser(recipient);
      setCallType(type);
      setCallState(CALL_STATES.CALLING);
      setIsCaller(true);

      // Just notify receiver - don't create peer connection yet
      socket.emit('call:initiate', {
        callId: id,
        conversationId: convId,
        to: recipient._id,
        callType: type
      });

      // Timeout if no answer within 30 seconds
      callTimeoutRef.current = setTimeout(() => {
        console.log('[Call] Call timeout - no answer');
        socket.emit('call:cancel', { callId: id });
        cleanup();
      }, 30000);

    } catch (err) {
      console.error('[Call] Failed to initiate call:', err);
      setCallState(CALL_STATES.FAILED);
      setTimeout(cleanup, 3000);
    }
  }, [socket, callState, cleanup]);

  // ==================== ACCEPT CALL (RECEIVER) ====================
  const acceptCall = useCallback(async () => {
    const activeCallId = currentCallIdRef.current;
    if (!activeCallId || !socket) {
      console.warn('[Call] Cannot accept: no active call ID');
      return;
    }

    console.log('[Call] Accepting call:', activeCallId);

    try {
      const stream = await getMediaStream(callType);
      const pc = createPeerConnection(activeCallId);
      peerConnection.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Notify caller that we accepted - THIS triggers caller to create offer
      socket.emit('call:accept', { callId: activeCallId });
      setCallState(CALL_STATES.CONNECTING);
      
    } catch (err) {
      console.error('[Call] Failed to accept call:', err);
      socket.emit('call:reject', { callId: activeCallId });
      cleanup();
    }
  }, [socket, callType, createPeerConnection, cleanup]);

  // ==================== REJECT CALL ====================
  const rejectCall = useCallback(() => {
    const activeCallId = currentCallIdRef.current;
    if (!activeCallId || !socket) return;
    
    console.log('[Call] Rejecting call:', activeCallId);
    socket.emit('call:reject', { callId: activeCallId });
    cleanup();
  }, [socket, cleanup]);

  // ==================== END CALL ====================
  const endCall = useCallback(() => {
    const activeCallId = currentCallIdRef.current;
    if (!activeCallId || !socket) {
      cleanup();
      return;
    }
    
    console.log('[Call] Ending call:', activeCallId);
    socket.emit('call:end', { callId: activeCallId });
    cleanup();
  }, [socket, cleanup]);

  // ==================== TOGGLES ====================
  const toggleMute = useCallback(() => {
    if (localStream.current) {
      const audioTracks = localStream.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStream.current) {
      const videoTracks = localStream.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
        setIsCameraOff(!track.enabled);
      });
    }
  }, []);

  // ==================== SOCKET LISTENERS ====================
  useEffect(() => {
    if (!socket) return;

    // Incoming call
    const handleIncoming = (data) => {
      console.log('[Call] Incoming call from:', data.callerName);
      
      if (callState !== CALL_STATES.IDLE) {
        console.log('[Call] Busy - rejecting');
        socket.emit('call:reject', { callId: data.callId });
        return;
      }
      
      playMessageNotification();
      currentCallIdRef.current = data.callId;
      isCallerRef.current = false;
      
      setCallId(data.callId);
      setRemoteUser({ 
        _id: data.from, 
        name: data.callerName,
        profilePicture: data.callerAvatar 
      });
      setCallType(data.callType);
      setCallState(CALL_STATES.RINGING);
      setIsCaller(false);
    };

    // Caller: receiver accepted - NOW create offer
    const handleAccepted = async ({ callId: acceptedCallId }) => {
      console.log('[Call] Call accepted, creating offer');
      
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      
      setCallState(CALL_STATES.CONNECTING);
      
      try {
        const activeCallId = currentCallIdRef.current;
        const pc = createPeerConnection(activeCallId);
        peerConnection.current = pc;
        
        // Add local tracks
        if (localStream.current) {
          localStream.current.getTracks().forEach(track => {
            pc.addTrack(track, localStream.current);
          });
        }
        
        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        console.log('[Call] Sending offer');
        socket.emit('call:offer', { callId: activeCallId, offer });
        
      } catch (err) {
        console.error('[Call] Failed to create offer:', err);
        cleanup();
      }
    };

    // Receiver: got offer from caller
    const handleOffer = async ({ callId: offerCallId, offer }) => {
      console.log('[Call] Received offer');
      
      if (!peerConnection.current) {
        console.error('[Call] No peer connection to handle offer');
        return;
      }
      
      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        
        // Process any queued ICE candidates
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('[Call] Failed to add queued ICE:', err);
          }
        }
        
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        
        console.log('[Call] Sending answer');
        socket.emit('call:answer', { callId: offerCallId, answer });
        
      } catch (err) {
        console.error('[Call] Failed to handle offer:', err);
        cleanup();
      }
    };

    // Caller: got answer from receiver
    const handleAnswer = async ({ answer }) => {
      console.log('[Call] Received answer');
      
      if (!peerConnection.current) {
        console.error('[Call] No peer connection to handle answer');
        return;
      }
      
      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        
        // Process any queued ICE candidates
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('[Call] Failed to add queued ICE:', err);
          }
        }
      } catch (err) {
        console.error('[Call] Failed to handle answer:', err);
      }
    };

    // ICE candidate from peer
    const handleIceCandidate = async ({ candidate }) => {
      if (!peerConnection.current) {
        console.log('[Call] Queueing ICE candidate (no PC yet)');
        iceCandidatesQueue.current.push(candidate);
        return;
      }
      
      if (!peerConnection.current.remoteDescription) {
        console.log('[Call] Queueing ICE candidate (no remote description)');
        iceCandidatesQueue.current.push(candidate);
        return;
      }
      
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[Call] Failed to add ICE candidate:', err);
      }
    };

    const handleRejected = () => {
      console.log('[Call] Call rejected');
      setCallState(CALL_STATES.REJECTED);
      setTimeout(cleanup, 2000);
    };

    const handleCancelled = () => {
      console.log('[Call] Call cancelled');
      cleanup();
    };

    const handleEnded = () => {
      console.log('[Call] Call ended by peer');
      cleanup();
    };

    const handleBusy = () => {
      console.log('[Call] User is busy');
      setCallState(CALL_STATES.BUSY);
      setTimeout(cleanup, 2000);
    };

    const handleFailed = ({ reason }) => {
      console.error('[Call] Call failed:', reason);
      setCallState(CALL_STATES.FAILED);
      setTimeout(cleanup, 2000);
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:rejected', handleRejected);
    socket.on('call:cancelled', handleCancelled);
    socket.on('call:ended', handleEnded);
    socket.on('call:busy', handleBusy);
    socket.on('call:failed', handleFailed);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:rejected', handleRejected);
      socket.off('call:cancelled', handleCancelled);
      socket.off('call:ended', handleEnded);
      socket.off('call:busy', handleBusy);
      socket.off('call:failed', handleFailed);
    };
  }, [socket, callState, createPeerConnection, cleanup]);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <CallContext.Provider value={{
      callState, callType, callId, remoteUser, isMuted, isCameraOff, 
      permissionError, callDuration, isCaller,
      localStream, remoteStream, localVideoRef, remoteVideoRef,
      initiateCall, acceptCall, rejectCall, endCall, 
      toggleMute, toggleCamera, cleanup, formatDuration,
      CALL_STATES
    }}>
      {children}
    </CallContext.Provider>
  );
};