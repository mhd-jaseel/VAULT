import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room based on user ID or Admin status
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    socket.on('join_admins', () => {
      socket.join('admins');
      console.log(`Admin joined admins room`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Emit real-time notification
export const sendNotification = (userId, notification) => {
  try {
    const activeIo = getIO();
    if (userId) {
      // Send to specific user
      activeIo.to(userId.toString()).emit('new_notification', notification);
    } else {
      // Send to admins
      activeIo.to('admins').emit('new_notification', notification);
    }
  } catch (error) {
    console.error('Error sending socket notification:', error.message);
  }
};
