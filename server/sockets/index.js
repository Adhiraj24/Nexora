import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

const users = new Map(); // userId -> socketId
const activeCalls = new Map(); // callId -> { caller, receiver, conversationId, status }

export const setupSocketHandlers = (io) => {
  // ==================== SOCKET AUTHENTICATION ====================
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.userId;

      // Fetch and attach user data
      const user = await User.findById(decoded.userId)
        .select('name profilePicture');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;

      next();
    } catch (err) {
      console.error('Socket authentication error:', err);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    users.set(socket.userId, socket.id);

    User.findByIdAndUpdate(socket.userId, {
      online: true
    }).exec();

    socket.broadcast.emit('presence:update', {
      userId: socket.userId,
      online: true
    });

    socket.join(socket.userId);

    // ==================== MESSAGE EVENTS ====================

    socket.on('message:typing', (data) => {
      io.to(data.recipientId).emit('message:typing', {
        conversationId: data.conversationId,
        userId: socket.userId,
        typing: data.typing
      });
    });

    socket.on('message:read', async (data) => {
      try {
        await Message.findByIdAndUpdate(data.messageId, {
          read: true,
          readAt: new Date()
        });

        io.to(data.recipientId).emit('message:read', {
          messageId: data.messageId
        });
      } catch (error) {
        socket.emit('error', {
          message: error.message
        });
      }
    });

    // ==================== SPECIAL MESSAGES ====================

    socket.on('special:trigger', (data) => {
      io.to(data.to).emit('special:trigger', data);
    });

    // ==================== CAMERA ACCESS ====================

    socket.on('camera:request', (data) => {
      io.to(data.userId).emit('camera:request', {
        adminId: socket.userId
      });
    });

    socket.on('camera:accepted', (data) => {
      io.to(data.adminId).emit('camera:accepted', {
        userId: socket.userId
      });
    });

    socket.on('camera:denied', (data) => {
      io.to(data.adminId).emit('camera:denied', {
        userId: socket.userId
      });
    });

    socket.on('camera:offer', (data) => {
      io.to(data.to).emit('camera:offer', {
        offer: data.offer,
        from: socket.userId
      });
    });

    socket.on('camera:answer', (data) => {
      io.to(data.to).emit('camera:answer', {
        answer: data.answer,
        from: socket.userId
      });
    });

    socket.on('camera:ice', (data) => {
      io.to(data.to).emit('camera:ice', {
        candidate: data.candidate,
        from: socket.userId
      });
    });

    socket.on('camera:end', (data) => {
      io.to(data.userId).emit('camera:end');
    });

    socket.on('camera:ended', (data) => {
      io.to(data.adminId).emit('camera:ended');
    });

    // ==================== SECURE CALL SIGNALING ====================

    const validateCallMembership = async (
      conversationId,
      participantId
    ) => {
      if (!conversationId || !participantId) {
        return false;
      }

      const conv = await Conversation.findById(conversationId);

      if (!conv) {
        return false;
      }

      return (
        conv.participants.includes(socket.userId) &&
        conv.participants.includes(participantId)
      );
    };

    // ==================== CALL INITIATE ====================

    socket.on('call:initiate', async (data) => {
      try {
        const {
          callId,
          conversationId,
          to,
          callType
        } = data;

        // Validate membership
        const isValid = await validateCallMembership(
          conversationId,
          to
        );

        if (!isValid) {
          return socket.emit('call:failed', {
            callId,
            reason: 'Unauthorized'
          });
        }

        // Check if receiver is busy
        const receiverBusy = [...activeCalls.values()].some(
          (call) =>
            (call.receiver === to || call.caller === to) &&
            call.status === 'active'
        );

        if (receiverBusy) {
          return io.to(socket.userId).emit('call:busy', {
            callId
          });
        }

        // Track call
        activeCalls.set(callId, {
          caller: socket.userId,
          receiver: to,
          conversationId,
          status: 'ringing',
          callType
        });

        // Notify receiver
        io.to(to).emit('call:incoming', {
          callId,
          conversationId,
          from: socket.userId,
          callType,
          callerName: socket.user?.name || 'User',
          callerAvatar: socket.user?.profilePicture || ''
        });

        console.log(
          `Call initiated: ${socket.userId} -> ${to} (${callType})`
        );
      } catch (error) {
        console.error('call:initiate error:', error);

        socket.emit('call:failed', {
          callId: data.callId,
          reason: 'Server error'
        });
      }
    });

    // ==================== CALL ACCEPT ====================

    socket.on('call:accept', async (data) => {
      try {
        const { callId } = data;

        const call = activeCalls.get(callId);

        if (!call || call.receiver !== socket.userId) {
          return socket.emit('call:failed', {
            callId,
            reason: 'Unauthorized'
          });
        }

        call.status = 'active';

        activeCalls.set(callId, call);

        io.to(call.caller).emit('call:accepted', {
          callId
        });
      } catch (error) {
        socket.emit('call:failed', {
          callId: data.callId,
          reason: 'Server error'
        });
      }
    });

    // ==================== CALL REJECT ====================

    socket.on('call:reject', (data) => {
      const { callId } = data;

      const call = activeCalls.get(callId);

      if (call && call.receiver === socket.userId) {
        io.to(call.caller).emit('call:rejected', {
          callId
        });

        activeCalls.delete(callId);
      }
    });

    // ==================== CALL CANCEL ====================

    socket.on('call:cancel', (data) => {
      const { callId } = data;

      const call = activeCalls.get(callId);

      if (call && call.caller === socket.userId) {
        io.to(call.receiver).emit('call:cancelled', {
          callId
        });

        activeCalls.delete(callId);
      }
    });

    // ==================== CALL END ====================

    socket.on('call:end', (data) => {
      const { callId } = data;

      const call = activeCalls.get(callId);

      if (
        call &&
        (call.caller === socket.userId ||
          call.receiver === socket.userId)
      ) {
        const otherUser =
          call.caller === socket.userId
            ? call.receiver
            : call.caller;

        io.to(otherUser).emit('call:ended', {
          callId
        });

        activeCalls.delete(callId);
      }
    });

    // ==================== CALL OFFER ====================

    socket.on('call:offer', (data) => {
      const { callId, offer } = data;

      const call = activeCalls.get(callId);

      if (call && call.caller === socket.userId) {
        io.to(call.receiver).emit('call:offer', {
          callId,
          offer
        });
      }
    });

    // ==================== CALL ANSWER ====================

    socket.on('call:answer', (data) => {
      const { callId, answer } = data;

      const call = activeCalls.get(callId);

      if (call && call.receiver === socket.userId) {
        io.to(call.caller).emit('call:answer', {
          callId,
          answer
        });
      }
    });

    // ==================== CALL ICE CANDIDATE ====================

    socket.on('call:ice-candidate', (data) => {
      const { callId, candidate } = data;

      const call = activeCalls.get(callId);

      if (call) {
        const target =
          call.caller === socket.userId
            ? call.receiver
            : call.caller;

        io.to(target).emit('call:ice-candidate', {
          callId,
          candidate
        });
      }
    });

    // ==================== DISCONNECT ====================

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);

      users.delete(socket.userId);

      User.findByIdAndUpdate(socket.userId, {
        online: false,
        lastSeen: new Date()
      }).exec();

      socket.broadcast.emit('presence:update', {
        userId: socket.userId,
        online: false,
        lastSeen: new Date()
      });

      // Cleanup active calls for this user
      for (const [callId, call] of activeCalls.entries()) {
        if (
          call.caller === socket.userId ||
          call.receiver === socket.userId
        ) {
          const otherUser =
            call.caller === socket.userId
              ? call.receiver
              : call.caller;

          io.to(otherUser).emit('call:ended', {
            callId,
            reason: 'peer-disconnected'
          });

          activeCalls.delete(callId);
        }
      }
    });
  });
};