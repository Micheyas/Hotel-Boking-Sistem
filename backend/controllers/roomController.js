const RoomType = require('../models/RoomType');
const Room = require('../models/Room');
const socketService = require('../socket');

// Get all room types
exports.getAllRoomTypes = async (req, res) => {
  try {
    const roomTypes = await RoomType.findAll();
    res.json(roomTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all rooms
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({ include: RoomType });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get available rooms for date range
exports.getAvailableRooms = async (req, res) => {
  try {
    const { checkInDate, checkOutDate } = req.query;
    const rooms = await Room.findAll({
      where: { status: 'available' },
      include: RoomType,
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create room type (admin only)
exports.createRoomType = async (req, res) => {
  try {
    const { name, description, basePrice, amenities } = req.body;
    const roomType = await RoomType.create({ name, description, basePrice, amenities });
    res.status(201).json(roomType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Create room (admin only)
exports.createRoom = async (req, res) => {
  try {
    const { roomNumber, roomTypeId, floor } = req.body;
    const room = await Room.create({ roomNumber, roomTypeId, floor, status: 'available' });
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update room status
exports.updateRoomStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status } = req.body;
    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    await room.update({ status });

    const io = socketService.getIO();
    io.emit('roomStatusChanged', { roomId: room.id, status: room.status });

    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};