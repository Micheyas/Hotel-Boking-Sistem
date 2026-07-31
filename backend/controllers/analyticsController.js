const { Booking, Room } = require('../models');

exports.getAnalytics = async (req, res) => {
  try {
    const totalBookings = await Booking.count();
    const totalRevenue = await Booking.sum('totalPrice');
    const statusCounts = await Booking.findAll({
      attributes: ['status', [require('sequelize').fn('COUNT', require('sequelize').col('status')), 'count']],
      group: ['status'],
    });
    const occupiedRooms = await Room.count({ where: { status: 'occupied' } });
    const totalRooms = await Room.count();
    const occupancyRate = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    res.json({
      totalBookings,
      totalRevenue: Number(totalRevenue || 0),
      occupancyRate,
      statusBreakdown: statusCounts.map((item) => ({ status: item.status, count: item.get('count') })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};