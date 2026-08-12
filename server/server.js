import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './socket/index.js';
import { seedDefaultAdminAndSettings } from './services/adminService.js';

// Connect to Database
connectDB()
  .then(async () => {
    // Seed default admin and settings configuration
    await seedDefaultAdminAndSettings();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize socket connections
    initSocket(server);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });
