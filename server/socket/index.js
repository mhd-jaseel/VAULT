import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
  const allowedOrigins = [
    'https://vaultco.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/+$/, '')) : []),
  ];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/+$/, '');
        if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by Socket CORS`));
      },
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
