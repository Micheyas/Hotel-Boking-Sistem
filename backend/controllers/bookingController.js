const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const { sendEmail } = require('../middleware/mailer');
const socketService = require('../socket');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { roomId, checkInDate, checkOutDate, totalPrice, bookingType } = req.body;
    const userId = req.user.id;

    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const booking = await Booking.create({
      userId,
      roomId,
      checkInDate,
      checkOutDate,
      totalPrice,
      status: 'pending',
      bookingType: bookingType || 'online',
    });

    await room.update({ status: 'occupied' });

    const io = socketService.getIO();
    io.emit('roomStatusChanged', { roomId: room.id, status: room.status });

    const user = await User.findByPk(userId);
    await sendEmail({
      to: user.email,
      subject: 'Booking Confirmation',
      text: `Your booking for room ${room.roomNumber} is pending confirmation.`,
      html: `<p>Hi ${user.name},</p><p>Your booking for room <strong>${room.roomNumber}</strong> from <strong>${checkInDate}</strong> to <strong>${checkOutDate}</strong> is pending confirmation.</p>`,
    });

    res.status(201).json(booking);
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
      include: [Room, User],
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
      include: [Room, User],
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