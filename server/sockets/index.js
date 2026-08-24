import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

const users = new Map(); // userId -> socketId

export const setupSocketHandlers = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);
    users.set(socket.userId, socket.id);

    // Update user online status
    User.findByIdAndUpdate(socket.userId, { online: true }).exec();
    
    // Broadcast online status
    socket.broadcast.emit('presence:update', {
      userId: socket.userId,
      online: true
    });

    // Join personal room
    socket.join(socket.userId);

    // Message typing
    socket.on('message:typing', (data) => {
      const { conversationId, recipientId, typing } = data;
      io.to(recipientId).emit('message:typing', {
        conversationId,
        userId: socket.userId,
        typing
      });
    });

    socket.on('message:read', async (data) => {
      try {
        const { messageId, recipientId } = data;
        
        await Message.findByIdAndUpdate(messageId, {
          read: true,
          readAt: new Date()
        });

        io.to(recipientId).emit('message:read', { messageId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Call signaling
    socket.on('call:initiate', (data) => {
      const { to, type, callerName } = data;
      io.to(to).emit('call:incoming', {
        from: socket.userId,
        type,
        callerName
      });
    });

    socket.on('call:offer', (data) => {
      io.to(data.to).emit('call:offer', {
        offer: data.offer,
        from: socket.userId
      });
    });

    socket.on('call:answer', (data) => {
      io.to(data.to).emit('call:answer', {
        answer: data.answer,
        from: socket.userId
      });
    });

    socket.on('call:ice', (data) => {
      io.to(data.to).emit('call:ice', {
        candidate: data.candidate,
        from: socket.userId
      });
    });

    socket.on('call:end', (data) => {
      io.to(data.to).emit('call:end', {
        from: socket.userId
      });
    });

    socket.on('call:reject', (data) => {
      io.to(data.to).emit('call:rejected', {
        from: socket.userId
      });
    });

    // Camera access events
    socket.on('camera:request', (data) => {
      const { userId } = data;
      io.to(userId).emit('camera:request', {
        adminId: socket.userId
      });
    });

    socket.on('camera:accepted', (data) => {
      const { adminId } = data;
      io.to(adminId).emit('camera:accepted', {
        userId: socket.userId
      });
    });

    socket.on('camera:denied', (data) => {
      const { adminId } = data;
      io.to(adminId).emit('camera:denied', {
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
      const { userId } = data;
      io.to(userId).emit('camera:end');
    });

    socket.on('camera:ended', (data) => {
      const { adminId } = data;
      io.to(adminId).emit('camera:ended');
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
      users.delete(socket.userId);
      
      // Update user offline status
      User.findByIdAndUpdate(socket.userId, {
        online: false,
        lastSeen: new Date()
      }).exec();

      // Broadcast offline status
      socket.broadcast.emit('presence:update', {
        userId: socket.userId,
        online: false,
        lastSeen: new Date()
      });

      // Add this with other socket events
    socket.on('message:react', async (data) => {
    try {
        const { messageId, emoji, recipientId } = data;
        
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingReaction = message.reactions.find(
        r => r.user.toString() === socket.userId.toString()
        );

        if (existingReaction) {
        existingReaction.emoji = emoji;
        } else {
        message.reactions.push({ user: socket.userId, emoji });
        }

        await message.save();

        // Broadcast to both users
        io.to(recipientId).emit('message:reaction', {
        messageId: message._id,
        reactions: message.reactions
        });

        io.to(socket.userId).emit('message:reaction', {
        messageId: message._id,
        reactions: message.reactions
        });
    } catch (error) {
        socket.emit('error', { message: error.message });
    }
    });

    socket.on('message:delete', async (data) => {
    try {
        const { messageId, conversationId } = data;
        
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== socket.userId.toString()) {
        return socket.emit('error', { message: 'Unauthorized' });
        }

        message.deleted = true;
        await message.save();

        const conversation = await Conversation.findById(conversationId);
        const recipientId = conversation.participants.find(
        p => p.toString() !== socket.userId.toString()
        );

        // Broadcast deletion
        io.to(recipientId.toString()).emit('message:deleted', { messageId, conversationId });
    } catch (error) {
        socket.emit('error', { message: error.message });
    }
    });

    });
  });
};