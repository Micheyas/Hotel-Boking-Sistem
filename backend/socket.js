let io = null;

module.exports = {
  init: (server) => {
    const socketio = require('socket.io');
    io = new socketio.Server(server, {
      cors: {
        origin: '*',
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