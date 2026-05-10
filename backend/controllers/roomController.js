const { Room, RoomType } = require('../models');
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
    const rooms = await Room.findAll({ include: { model: RoomType, as: 'roomType' } });
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
      include: { model: RoomType, as: 'roomType' },
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
    const { roomNumber, roomTypeId, floor, status, amenities } = req.body;
    console.log('Creating room with data:', { roomNumber, roomTypeId, floor, status, amenities });
    console.log('Uploaded file:', req.file);
    
    // Check if room number already exists
    const existingRoom = await Room.findOne({ where: { roomNumber } });
    if (existingRoom) {
      return res.status(400).json({ error: `Room ${roomNumber} already exists` });
    }
    
    // Get image path if file uploaded
    const image = req.file ? `/uploads/rooms/${req.file.filename}` : null;
    
    const room = await Room.create({ 
      roomNumber, 
      roomTypeId, 
      floor, 
      status: status || 'available',
      image,
      amenities
    });
    
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(400).json({ error: error.message || 'Failed to create room' });
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

// Update room (admin only)
exports.updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { roomNumber, roomTypeId, floor, status, amenities } = req.body;
    
    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    // Check if new room number already exists (and it's not the current room)
    if (roomNumber && roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({ where: { roomNumber } });
      if (existingRoom) {
        return res.status(400).json({ error: `Room ${roomNumber} already exists` });
      }
    }
    
    // Get image path if file uploaded
    const image = req.file ? `/uploads/rooms/${req.file.filename}` : undefined;
    
    const updateData = {};
    if (roomNumber) updateData.roomNumber = roomNumber;
    if (roomTypeId) updateData.roomTypeId = roomTypeId;
    if (floor !== undefined) updateData.floor = floor;
    if (status) updateData.status = status;
    if (image) updateData.image = image;
    if (amenities !== undefined) updateData.amenities = amenities;
    
    await room.update(updateData);
    
    const io = socketService.getIO();
    io.emit('roomStatusChanged', { roomId: room.id, status: room.status });
    
    res.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(400).json({ error: error.message || 'Failed to update room' });
  }
};

// Delete room (admin only)
exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    await room.destroy();
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(400).json({ error: error.message || 'Failed to delete room' });
  }
};