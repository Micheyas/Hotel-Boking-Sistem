const { Room, RoomType, Booking } = require('../models');
const { Op } = require('sequelize');
const socketService = require('../socket');

// Get all room types (optionally only those with physical rooms)
exports.getAllRoomTypes = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    let roomTypes;
    if (activeOnly === 'true') {
      roomTypes = await RoomType.findAll({
        include: [{ model: Room, as: 'rooms', required: true }],
      });
    } else {
      roomTypes = await RoomType.findAll();
    }
    res.json(roomTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check availability: return room types with at least one room free for the date range
exports.checkAvailability = async (req, res) => {
  try {
    const { checkIn, checkOut, adults, children } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'checkIn and checkOut dates are required' });
    }

    const checkInDate  = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ error: 'Check-out must be after check-in' });
    }

    // Find room IDs already booked (overlapping) for the date range
    const overlappingBookings = await Booking.findAll({
      where: {
        status: { [Op.notIn]: ['cancelled', 'checked_out'] },
        checkInDate:  { [Op.lt]: checkOutDate },
        checkOutDate: { [Op.gt]: checkInDate },
      },
      attributes: ['roomId'],
    });

    const bookedRoomIds = overlappingBookings.map(b => b.roomId);

    // Find rooms that are available and not booked in this period
    const availableRooms = await Room.findAll({
      where: {
        status: 'available',
        ...(bookedRoomIds.length > 0 ? { id: { [Op.notIn]: bookedRoomIds } } : {}),
      },
      include: [{ model: RoomType, as: 'roomType' }],
    });

    const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
    const result = availableRooms.map(room => {
      const rt = room.roomType;
      return {
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        name: `Room ${room.roomNumber} - ${rt ? rt.name : 'Standard'}`,
        description: rt ? rt.description : '',
        basePrice: rt ? rt.basePrice : 0,
        amenities: room.amenities || (rt ? rt.amenities : []),
        totalPrice: (rt ? rt.basePrice : 0) * nights,
        image: room.image,
        nights
      };
    });

    res.json({
      available: result,
      checkIn,
      checkOut,
      adults: adults || 1,
      children: children || 0,
      nights,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all rooms (public — all statuses, for the rooms page)
exports.getAllRoomsPublic = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      include: { model: RoomType, as: 'roomType' },
      order: [['floor', 'ASC'], ['roomNumber', 'ASC']],
    });
    res.json(rooms);
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
// Legacy: kept for backward compat, use /available for date-aware check
exports.getAvailableRooms = async (req, res) => {
  try {
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
    const { roomNumber, roomTypeId, floor, status, amenities, maxGuests, roomSize, bedType, description } = req.body;
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
      amenities,
      maxGuests: maxGuests || 2,
      roomSize: roomSize || '',
      bedType: bedType || '',
      description: description || '',
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
    const { roomNumber, roomTypeId, floor, status, amenities, maxGuests, roomSize, bedType, description } = req.body;
    
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
    if (maxGuests !== undefined) updateData.maxGuests = maxGuests;
    if (roomSize !== undefined) updateData.roomSize = roomSize;
    if (bedType !== undefined) updateData.bedType = bedType;
    if (description !== undefined) updateData.description = description;
    
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