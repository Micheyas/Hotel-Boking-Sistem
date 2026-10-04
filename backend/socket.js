let io = null;

module.exports = {
  init: (server) => {
    const socketio = require('socket.io');
    // init() runs after dotenv.config() in server.js, so env-based origins are loaded
    const allowedOrigins = require('./config/allowedOrigins');
    io = new socketio.Server(server, {
      cors: {
        origin: allowedOrigins,
      },
    });
    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);
      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
      });
    });
    return io;
  },
  getIO: () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
  },
};