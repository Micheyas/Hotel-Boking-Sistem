const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const { Op } = require('sequelize');
const { sendEmail } = require('../middleware/mailer');
const socketService = require('../socket');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { roomId, checkInDate, checkOutDate, totalPrice, bookingType } = req.body;
    const userId = req.user.id;

    // Verify room is available for the dates
    const overlapping = await Booking.findAll({
      where: {
        roomId,
        status: { [Op.notIn]: ['cancelled', 'checked_out'] },
        checkInDate:  { [Op.lt]: new Date(checkOutDate) },
        checkOutDate: { [Op.gt]: new Date(checkInDate) },
      }
    });

    if (overlapping.length > 0) {
      return res.status(400).json({ error: 'Room is already booked for these dates' });
    }

    const availableRoom = await Room.findByPk(roomId);
    if (!availableRoom || availableRoom.status !== 'available') {
      return res.status(400).json({ error: 'Room is not available' });
    }

    const booking = await Booking.create({
      userId,
      roomId: availableRoom.id,
      checkInDate,
      checkOutDate,
      totalPrice,
      status: 'pending',
      bookingType: bookingType || 'online',
    });

    await availableRoom.update({ status: 'occupied' });

    const io = socketService.getIO();
    io.emit('roomStatusChanged', { roomId: availableRoom.id, status: availableRoom.status });

    const user = await User.findByPk(userId);
    await sendEmail({
      to: user.email,
      subject: 'Booking Confirmation',
      text: `Your booking for room ${availableRoom.roomNumber} is pending confirmation.`,
      html: `<p>Hi ${user.name},</p><p>Your booking for room <strong>${availableRoom.roomNumber}</strong> from <strong>${checkInDate}</strong> to <strong>${checkOutDate}</strong> is pending confirmation.</p>`,
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Create guest booking (no login required)
exports.createGuestBooking = async (req, res) => {
  try {
    const { roomId, checkInDate, checkOutDate, totalPrice, guestName, guestEmail, guestPhone } = req.body;

    // Verify room is available for the dates
    const overlapping = await Booking.findAll({
      where: {
        roomId,
        status: { [Op.notIn]: ['cancelled', 'checked_out'] },
        checkInDate:  { [Op.lt]: new Date(checkOutDate) },
        checkOutDate: { [Op.gt]: new Date(checkInDate) },
      }
    });

    if (overlapping.length > 0) {
      return res.status(400).json({ error: 'Room is already booked for these dates' });
    }

    const availableRoom = await Room.findByPk(roomId);
    if (!availableRoom || availableRoom.status !== 'available') {
      return res.status(400).json({ error: 'Room is not available' });
    }

    const booking = await Booking.create({
      roomId: availableRoom.id,
      checkInDate,
      checkOutDate,
      totalPrice,
      status: 'pending',
      bookingType: 'guest',
      guestName,
      guestEmail,
      guestPhone,
    });

    await availableRoom.update({ status: 'occupied' });

    const io = socketService.getIO();
    io.emit('roomStatusChanged', { roomId: availableRoom.id, status: availableRoom.status });

    // Send confirmation email to guest
    await sendEmail({
      to: guestEmail,
      subject: 'Booking Confirmation - The William Vale Hotel',
      text: `Dear ${guestName},\n\nYour booking for room ${availableRoom.roomNumber} from ${checkInDate} to ${checkOutDate} has been received and is pending confirmation.\n\nTotal: ${totalPrice} ETB\n\nThank you for choosing The William Vale Hotel!`,
      html: `<p>Dear <strong>${guestName}</strong>,</p><p>Your booking for room <strong>${availableRoom.roomNumber}</strong> from <strong>${checkInDate}</strong> to <strong>${checkOutDate}</strong> has been received and is pending confirmation.</p><p>Total: <strong>${totalPrice} ETB</strong></p><p>Thank you for choosing The William Vale Hotel!</p>`,
    });

    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get user bookings
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Booking.findAll({
      where: { userId },
      include: [
        { model: Room, as: 'room' },
        { model: User, as: 'user' }
      ],
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all bookings (admin/manager)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: Room, as: 'room' },
        { model: User, as: 'user', required: false }
      ],
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    await booking.update({ status });
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Create manual booking (receptionist only — walk-in / phone booking by room ID)
exports.createManualBooking = async (req, res) => {
  try {
    const { roomId, checkInDate, checkOutDate, guestName, guestEmail, guestPhone, notes } = req.body;

    if (!roomId || !checkInDate || !checkOutDate || !guestName || !guestEmail) {
      return res.status(400).json({ error: 'roomId, checkInDate, checkOutDate, guestName, and guestEmail are required.' });
    }

    const room = await Room.findByPk(roomId, { include: ['roomType'] });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status !== 'available') {
      return res.status(400).json({ error: `Room ${room.roomNumber} is not available (current status: ${room.status})` });
    }

    // Calculate total price from room type base price × nights
    const nights = Math.max(
      1,
      Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24))
    );
    const totalPrice = (room.roomType?.basePrice || 0) * nights;

    const booking = await Booking.create({
      roomId: room.id,
      checkInDate,
      checkOutDate,
      totalPrice,
      status: 'confirmed',         // receptionist confirms immediately
      bookingType: 'manual',
      guestName,
      guestEmail,
      guestPhone: guestPhone || '',
      notes: notes || '',
    });

    await room.update({ status: 'occupied' });

    const io = socketService.getIO();
    io.emit('roomStatusChanged', { roomId: room.id, status: 'occupied' });

    // Send confirmation email to the guest
    await sendEmail({
      to: guestEmail,
      subject: 'Booking Confirmed — The William Vale Hotel',
      text: `Dear ${guestName},\n\nYour manual booking for Room ${room.roomNumber} from ${checkInDate} to ${checkOutDate} (${nights} night${nights > 1 ? 's' : ''}) has been confirmed by our reception team.\n\nTotal: ${totalPrice} ETB\n\nThank you for choosing The William Vale Hotel!`,
      html: `<p>Dear <strong>${guestName}</strong>,</p><p>Your booking for room <strong>${room.roomNumber}</strong> from <strong>${checkInDate}</strong> to <strong>${checkOutDate}</strong> (${nights} night${nights > 1 ? 's' : ''}) has been <span style="color:green;font-weight:700">confirmed</span> by our reception team.</p><p>Total: <strong>${totalPrice} ETB</strong></p><p>Thank you for choosing <strong>The William Vale Hotel</strong>!</p>`,
    });

    res.status(201).json({ message: 'Manual booking created and confirmed', booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    await booking.update({ status: 'cancelled' });
    const room = await Room.findByPk(booking.roomId);
    await room.update({ status: 'available' });

    const io = socketService.getIO();
    io.emit('roomStatusChanged', { roomId: room.id, status: room.status });

    res.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};