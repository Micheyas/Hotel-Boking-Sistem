const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const { sendEmail } = require('../middleware/mailer');
const socketService = require('../socket');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { roomTypeId, checkInDate, checkOutDate, totalPrice, bookingType } = req.body;
    const userId = req.user.id;

    // Find an available room of the selected type
    const availableRoom = await Room.findOne({
      where: {
        roomTypeId: roomTypeId,
        status: 'available'
      }
    });

    if (!availableRoom) {
      return res.status(400).json({ error: 'No rooms available for this type' });
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
    const { roomTypeId, checkInDate, checkOutDate, totalPrice, guestName, guestEmail, guestPhone } = req.body;

    // Find an available room of the selected type
    const availableRoom = await Room.findOne({
      where: {
        roomTypeId: roomTypeId,
        status: 'available'
      }
    });

    if (!availableRoom) {
      return res.status(400).json({ error: 'No rooms available for this type' });
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