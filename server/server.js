import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import conversationRoutes from './routes/conversations.js';
import messageRoutes from './routes/messages.js';
import memoryRoutes from './routes/memories.js';
import surpriseRoutes from './routes/surprises.js';
import complimentRoutes from './routes/compliments.js';
import questionRoutes from './routes/questions.js';
import gameRoutes from './routes/games.js';
import openWhenRoutes from './routes/openWhen.js';
import adminRoutes from './routes/admin.js';
// Add this import at the top with other route imports
import specialUserRoutes from './routes/specialUsers.js';

// Socket handlers
import { setupSocketHandlers } from './sockets/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
});

// Make io available in routes
app.set('io', io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/surprises', surpriseRoutes);
app.use('/api/compliments', complimentRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/open-when', openWhenRoutes);
app.use('/api/admin', adminRoutes);

// Add this route with other app.use() calls
app.use('/api/special-users', specialUserRoutes);

// Socket.IO
setupSocketHandlers(io);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});