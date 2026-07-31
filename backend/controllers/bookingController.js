const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const { Op } = require('sequelize');
const { sendEmail } = require('../middleware/mailer');
const socketService = require('../socket');

const getLoyaltyTier = (count) => {
  if (count >= 5) return { discountPercent: 15, discountLabel: 'VIP Guest' };
  if (count >= 2) return { discountPercent: 10, discountLabel: 'Loyal Guest' };
  if (count >= 1) return { discountPercent: 5, discountLabel: 'Welcome Back' };
  return { discountPercent: 0, discountLabel: '' };
};

const findPreviousGuestBookings = async ({ email = '', name = '', phone = '' }) => {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const normalizedName = String(name || '').trim();
  const normalizedPhone = String(phone || '').trim();

  // Important rule:
  // - If email is provided, use email ONLY.
  // - If email is missing, fall back to name + phone.
  // This avoids mixing identities when someone enters a different email
  // with the same or similar name/phone.
  if (normalizedEmail) {
    return Booking.findAll({
      where: {
        guestEmail: normalizedEmail,
        status: { [Op.notIn]: ['cancelled'] },
      },
    });
  }

  if (!(normalizedName && normalizedPhone)) return [];

  return Booking.findAll({
    where: {
      guestPhone: normalizedPhone,
      guestName: { [Op.iLike]: normalizedName },
      status: { [Op.notIn]: ['cancelled'] },
    },
  });
};

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { roomId, checkInDate, checkOutDate, totalPrice, bookingType } = req.body;
    const userId = req.user.id;

    // ── Email verification guard ──────────────────────────
    const bookingUser = await User.findByPk(userId);
    if (!bookingUser) return res.status(404).json({ error: 'User not found' });
    if (!bookingUser.emailVerified) {
      return res.status(403).json({
        error: 'Your email address is not verified. Please check your inbox and click the verification link before making a booking.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }
    if (!['submitted', 'approved'].includes(bookingUser.kycStatus)) {
      return res.status(403).json({
        error: 'Please complete your identity verification (KYC) before making a booking.',
        code: 'KYC_REQUIRED',
      });
    }
    if (bookingUser.kycStatus === 'rejected') {
      return res.status(403).json({
        error: 'Your identity verification was rejected. Please resubmit your documents.',
        code: 'KYC_REJECTED',
      });
    }
    // ─────────────────────────────────────────────────────

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
    const { roomId, checkInDate, checkOutDate, totalPrice, guestName, guestEmail, guestPhone, loyaltyDiscountPercent } = req.body;
    const normalizedEmail = String(guestEmail || '').toLowerCase().trim();
    const normalizedName = String(guestName || '').trim();
    const normalizedPhone = String(guestPhone || '').trim();

    if (!normalizedName || !normalizedPhone) {
      return res.status(400).json({ error: 'guestName and guestPhone are required' });
    }

    // ── Email verification + KYC guard ───────────────────
    if (normalizedEmail) {
      const registeredUser = await User.findOne({ where: { email: normalizedEmail } });
      if (registeredUser && !registeredUser.emailVerified) {
        return res.status(403).json({
          error: 'This email is registered but not yet verified. Please verify your email before booking.',
          code: 'EMAIL_NOT_VERIFIED',
        });
      }
      if (registeredUser && !['submitted', 'approved'].includes(registeredUser.kycStatus)) {
        return res.status(403).json({
          error: 'Please complete your identity verification (KYC) before making a booking.',
          code: 'KYC_REQUIRED',
        });
      }
      if (registeredUser && registeredUser.kycStatus === 'rejected') {
        return res.status(403).json({
          error: 'Your identity verification was rejected. Please resubmit your documents.',
          code: 'KYC_REJECTED',
        });
      }
    }
    // ─────────────────────────────────────────────────────

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

    // --- Loyalty discount validation ---
    // Repeat-customer lookup can use email when available, otherwise falls back to name + phone.
    const basePrice = Number(totalPrice) || 0;
    const previousBookings = await findPreviousGuestBookings({
      email: normalizedEmail,
      name: normalizedName,
      phone: normalizedPhone,
    });
    const { discountPercent: serverDiscount } = getLoyaltyTier(previousBookings.length);

    // Clamp client-supplied discount to the server-computed maximum
    const clientDiscount = Math.max(0, Math.min(15, parseInt(loyaltyDiscountPercent, 10) || 0));
    const validatedDiscount = Math.min(clientDiscount, serverDiscount);

    const finalPrice = Math.round(basePrice * (1 - validatedDiscount / 100));
    // --- End loyalty discount validation ---

    const booking = await Booking.create({
      roomId: availableRoom.id,
      checkInDate,
      checkOutDate,
      totalPrice: finalPrice,
      status: 'pending',
      bookingType: 'guest',
      guestName: normalizedName,
      guestEmail: normalizedEmail,
      guestPhone: normalizedPhone,
      loyaltyDiscountPercent: validatedDiscount,
    });

    await availableRoom.update({ status: 'occupied' });

    const io = socketService.getIO();
    io.emit('roomStatusChanged', { roomId: availableRoom.id, status: availableRoom.status });

    // Send confirmation email to guest (only if email was provided)
    if (normalizedEmail) {
      const discountNote = validatedDiscount > 0
        ? `\n\nLoyalty Discount Applied: ${validatedDiscount}% — your price was reduced from ${basePrice} ETB to ${finalPrice} ETB.`
        : '';
      const discountNoteHtml = validatedDiscount > 0
        ? `<p>🎉 <strong>Loyalty Discount Applied: ${validatedDiscount}%</strong> — your price was reduced from ${basePrice} ETB to <strong>${finalPrice} ETB</strong>.</p>`
        : '';

      await sendEmail({
        to: normalizedEmail,
        subject: 'Booking Confirmation - The William Vale Hotel',
        text: `Dear ${guestName},\n\nYour booking for room ${availableRoom.roomNumber} from ${checkInDate} to ${checkOutDate} has been received and is pending confirmation.\n\nTotal: ${finalPrice} ETB${discountNote}\n\nThank you for choosing The William Vale Hotel!`,
        html: `<p>Dear <strong>${guestName}</strong>,</p><p>Your booking for room <strong>${availableRoom.roomNumber}</strong> from <strong>${checkInDate}</strong> to <strong>${checkOutDate}</strong> has been received and is pending confirmation.</p>${discountNoteHtml}<p>Total: <strong>${finalPrice} ETB</strong></p><p>Thank you for choosing The William Vale Hotel!</p>`,
      });
    }

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
        { model: User, as: 'user', required: false },
        { model: User, as: 'processedByUser', foreignKey: 'processedBy', required: false }
      ],
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get repeat customers (admin only) — customers with 2+ bookings
exports.getRepeatCustomers = async (req, res) => {
  try {
    const { Op } = require('sequelize');

    // Get all VERIFIED bookings only (confirmed, checked_in, checked_out)
    // Exclude cancelled and pending bookings from repeat customer count
    const bookings = await Booking.findAll({
      where: {
        status: { [Op.in]: ['confirmed', 'checked_in', 'checked_out'] },
      },
      include: [
        { model: User, as: 'user', required: false },
        { model: Room, as: 'room' }
      ],
      order: [['checkInDate', 'DESC']]
    });

    // Group by guest email (or user ID if logged in)
    const guestMap = {};
    bookings.forEach(booking => {
      const guestKey = booking.User?.email || booking.guestEmail;
      if (!guestKey) return;

      if (!guestMap[guestKey]) {
        guestMap[guestKey] = {
          guestEmail: booking.guestEmail || booking.User?.email,
          guestName: booking.guestName || booking.User?.name,
          guestPhone: booking.guestPhone,
          userId: booking.userId,
          totalBookings: 0,
          bookingIds: [],
          firstBookingDate: booking.createdAt,
          lastBookingDate: booking.createdAt,
          totalSpent: 0,
        };
      }

      guestMap[guestKey].totalBookings += 1;
      guestMap[guestKey].bookingIds.push(booking.id);
      guestMap[guestKey].totalSpent += Number(booking.totalPrice || 0);
      guestMap[guestKey].firstBookingDate = new Date(Math.min(
        new Date(guestMap[guestKey].firstBookingDate),
        new Date(booking.createdAt)
      ));
      guestMap[guestKey].lastBookingDate = new Date(Math.max(
        new Date(guestMap[guestKey].lastBookingDate),
        new Date(booking.createdAt)
      ));
    });

    // Filter repeat customers (2+ bookings)
    const repeatCustomers = Object.values(guestMap).filter(g => g.totalBookings >= 2);

    res.json({
      total: repeatCustomers.length,
      repeatCustomers: repeatCustomers.sort((a, b) => b.totalBookings - a.totalBookings)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /bookings/history — paginated, filterable booking history for all staff roles
exports.getBookingHistory = async (req, res) => {
  try {
    const {
      search = '',
      status = '',
      bookingType = '',
      paymentStatus = '',
      dateFrom = '',
      dateTo = '',
      sortBy = 'createdAt',
      sortDir = 'DESC',
      page = '1',
      limit = '25',
    } = req.query;

    const where = {};

    // Status filter
    if (status) where.status = status;

    // Booking type filter
    if (bookingType) where.bookingType = bookingType;

    // Payment status filter
    if (paymentStatus) where.paymentStatus = paymentStatus;

    // Date range filter (based on check-in date)
    if (dateFrom || dateTo) {
      where.checkInDate = {};
      if (dateFrom) where.checkInDate[Op.gte] = new Date(dateFrom);
      if (dateTo)   where.checkInDate[Op.lte] = new Date(dateTo);
    }

    // Fetch all matching rows (search filter applied in-memory for simplicity across associations)
    const allBookings = await Booking.findAll({
      where,
      include: [
        { model: Room, as: 'room' },
        { model: User, as: 'user', required: false },
        { model: User, as: 'processedByUser', foreignKey: 'processedBy', required: false },
      ],
      order: [[sortBy, sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
    });

    // In-memory search across guest name, email, booking ID, and room number
    const q = search.trim().toLowerCase();
    const filtered = q
      ? allBookings.filter(b => {
          const name  = (b.user?.name || b.guestName || '').toLowerCase();
          const email = (b.user?.email || b.guestEmail || '').toLowerCase();
          const id    = String(b.id);
          const room  = (b.room?.roomNumber || '').toLowerCase();
          const phone = (b.guestPhone || '').toLowerCase();
          return name.includes(q) || email.includes(q) || id.includes(q) || room.includes(q) || phone.includes(q);
        })
      : allBookings;

    // Pagination
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const total    = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const paginated  = filtered.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    // Summary stats for current filtered set
    const stats = {
      total,
      totalRevenue: filtered
        .filter(b => b.status !== 'cancelled')
        .reduce((s, b) => s + Number(b.totalPrice || 0), 0),
      byStatus: {
        pending:    filtered.filter(b => b.status === 'pending').length,
        confirmed:  filtered.filter(b => b.status === 'confirmed').length,
        checked_in: filtered.filter(b => b.status === 'checked_in').length,
        checked_out:filtered.filter(b => b.status === 'checked_out').length,
        cancelled:  filtered.filter(b => b.status === 'cancelled').length,
      },
      byType: {
        online: filtered.filter(b => b.bookingType === 'online').length,
        manual: filtered.filter(b => b.bookingType === 'manual').length,
        guest:  filtered.filter(b => b.bookingType === 'guest').length,
      },
    };

    res.json({ bookings: paginated, total, page: pageNum, totalPages, pageSize, stats });
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

// Cancel booking — marks as cancelled, NEVER deletes the record (preserves full history)
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Update status to cancelled — record is PRESERVED in history
    await booking.update({
      status: 'cancelled',
      receptionNotes: (booking.receptionNotes ? booking.receptionNotes + ' | ' : '') +
        `Cancelled by ${req.user ? `user #${req.user.id} (${req.user.role})` : 'guest'} on ${new Date().toISOString()}.`,
    });

    // Free the room back to available
    const room = await Room.findByPk(booking.roomId);
    if (room && room.status === 'occupied') {
      await room.update({ status: 'available' });
      const io = socketService.getIO();
      io.emit('roomStatusChanged', { roomId: room.id, status: 'available' });
    }

    res.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET /api/bookings/check-repeat?name=xxx&phone=xxx&email=xxx  (public)
// Returns loyalty discount tier for a returning guest based on previous bookings.
// Email is optional; name + phone can also identify the guest.
exports.checkRepeatCustomer = async (req, res) => {
  try {
    const { email = '', name = '', phone = '' } = req.query;
    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedName = String(name).trim();
    const normalizedPhone = String(phone).trim();

    if (!normalizedEmail && !(normalizedName && normalizedPhone)) {
      return res.json({ isRepeat: false, bookingCount: 0, discountPercent: 0, discountLabel: '' });
    }

    const previousBookings = await findPreviousGuestBookings({
      email: normalizedEmail,
      name: normalizedName,
      phone: normalizedPhone,
    });

    const count = previousBookings.length;
    const { discountPercent, discountLabel } = getLoyaltyTier(count);

    res.json({ isRepeat: count > 0, bookingCount: count, discountPercent, discountLabel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Receptionist decision: approve or reject booking
exports.bookingDecision = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { action, notes } = req.body;
    const receptionistId = req.user.id;

    if (!action || !['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approved" or "rejected"' });
    }

    const booking = await Booking.findByPk(bookingId, { include: ['room', 'user'] });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Set new status based on action
    const newStatus = action === 'approved' ? 'confirmed' : 'cancelled';

    // If rejecting, mark room as available again if it was occupied
    if (action === 'rejected' && booking.room?.status === 'occupied') {
      await booking.room.update({ status: 'available' });
      const io = socketService.getIO();
      io.emit('roomStatusChanged', { roomId: booking.room.id, status: 'available' });
    }

    // Update booking with decision details
    await booking.update({
      status: newStatus,
      processedBy: receptionistId,
      processedAction: action,
      processedAt: new Date(),
      receptionNotes: notes || '',
    });

    // Send email to guest about the decision
    if (booking.guestEmail) {
      const subject = action === 'approved'
        ? 'Booking Approved — The William Vale Hotel'
        : 'Booking Rejected — The William Vale Hotel';

      const text = action === 'approved'
        ? `Dear ${booking.guestName},\n\nYour booking for room ${booking.room?.roomNumber} has been approved.\n\nThank you for choosing The William Vale Hotel!`
        : `Dear ${booking.guestName},\n\nUnfortunately, your booking for room ${booking.room?.roomNumber} could not be confirmed at this time.\n\nPlease contact us for more information.\n\nThank you for considering The William Vale Hotel!`;

      const html = action === 'approved'
        ? `<p>Dear <strong>${booking.guestName}</strong>,</p><p>Your booking for room <strong>${booking.room?.roomNumber}</strong> has been <span style="color:green;font-weight:700">approved</span>.</p><p>Thank you for choosing <strong>The William Vale Hotel</strong>!</p>`
        : `<p>Dear <strong>${booking.guestName}</strong>,</p><p>Unfortunately, your booking for room <strong>${booking.room?.roomNumber}</strong> could not be confirmed at this time.</p><p>Please contact us for more information.</p><p>Thank you for considering <strong>The William Vale Hotel</strong>!</p>`;

      await sendEmail({ to: booking.guestEmail, subject, text, html });
    }

    // Emit socket event for live admin updates
    const io = socketService.getIO();
    io.emit('bookingProcessed', {
      bookingId: booking.id,
      action,
      processedBy: receptionistId,
      processedAt: booking.processedAt,
    });

    res.json({ message: `Booking ${action}`, booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
