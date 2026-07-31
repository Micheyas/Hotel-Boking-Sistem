import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import '../styles/AdminPanel.css';
import { useCurrency, convertPrice } from '../CurrencyContext';

const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:5000';

// Returns the correct image URL — Cloudinary URLs are used as-is, local paths get the API base prepended
function imgUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path; // already a full URL (Cloudinary)
  return API_BASE + path;
}

const commonAmenities = [
  'Free WiFi', 'Air Conditioning', 'Flat-screen TV', 'Smart TV',
  'Mini-bar', 'Premium Mini-bar', 'Room Service', '24/7 Room Service',
  'Private Balcony', 'City View', 'Ocean View', 'Butler Service',
  'Jacuzzi', 'King Bed', 'Work Desk', 'Safe Box',
  'Coffee Maker', 'Hair Dryer', 'Bathtub', 'Walk-in Closet',
];

const AdminPanel = () => {
  const [allBookings, setAllBookings] = useState([]);
  const [offers, setOffers]           = useState([]);
  const [kycUsers, setKycUsers]       = useState([]);
  const [kycLoading, setKycLoading]   = useState(false);
  const [rooms, setRooms]             = useState([]);
  const [roomTypes, setRoomTypes]     = useState([]);
  const [repeatCustomers, setRepeatCustomers] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const { currency, rates } = useCurrency();

  // View: 'list' | 'room-management' | 'repeat-customers' | 'booking-history' | 'kyc' | 'it-management' | 'it-approvals'
  const [view, setView]               = useState('list');

  // IT Management state (for IT role)
  const [itForm, setItForm] = useState({ type: 'create', email: '', name: '', role: 'receptionist', password: '' });
  const [itSubmitting, setItSubmitting] = useState(false);
  const [itMyRequests, setItMyRequests] = useState([]);
  const [itRequestsLoading, setItRequestsLoading] = useState(false);

  // IT Approvals state (for Admin role)
  const [itPendingRequests, setItPendingRequests] = useState([]);
  const [itAllRequests, setItAllRequests] = useState([]);
  const [itApprovalsLoading, setItApprovalsLoading] = useState(false);
  const [itApprovalFilter, setItApprovalFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'

  // Booking filters
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [receptionFilter, setReceptionFilter] = useState(''); // 'approved', 'rejected', 'pending'
  const [repeatCustomerFilters, setRepeatCustomerFilters] = useState({ name: '', email: '', phone: '' });

  // Booking history state
  const [historyBookings, setHistoryBookings]   = useState([]);
  const [historyStats, setHistoryStats]         = useState(null);
  const [historyLoading, setHistoryLoading]     = useState(false);
  const [historyPage, setHistoryPage]           = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal]         = useState(0);
  const [historyFilters, setHistoryFilters]     = useState({
    search: '', status: '', bookingType: '', paymentStatus: '',
    dateFrom: '', dateTo: '', sortBy: 'createdAt', sortDir: 'DESC',
  });
  const [expandedHistoryRow, setExpandedHistoryRow] = useState(null);

  // Services state
  const [services, setServices]           = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesCatFilter, setServicesCatFilter] = useState('All');
  const [showServiceModal, setShowServiceModal]   = useState(false);
  const [editingService, setEditingService]       = useState(null);
  const BLANK_SERVICE = {
    name: '', description: '', category: 'Food & Beverage', icon: '🍽️',
    price: '', priceLabel: '', availableFrom: '', availableTo: '',
    location: '', status: 'active', sortOrder: 0,
  };
  const [serviceForm, setServiceForm] = useState(BLANK_SERVICE);

  // Decision modal
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedBookingForDecision, setSelectedBookingForDecision] = useState(null);
  const [decisionAction, setDecisionAction] = useState(''); // 'approved' or 'rejected'
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decidingLoading, setDecidingLoading] = useState(false);

  // Room form
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomName: '', roomNumber: '', roomTypeId: '', pricePerNight: '', floor: '', maxGuests: 2, roomSize: '', bedType: '', description: '', status: 'available', images: [], amenities: [] });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [editingRoom, setEditingRoom]   = useState(null);

  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser]             = useState(null);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Set default view to IT Management for IT role after login
  useEffect(() => {
    if (isLoggedIn && user?.role === 'it') {
      setView('it-management');
    }
  }, [isLoggedIn, user?.role]);

  const location = useLocation();

  // Clear session on page unload
  useEffect(() => {
    const clear = () => { sessionStorage.removeItem('staffToken'); sessionStorage.removeItem('staffUser'); };
    window.addEventListener('beforeunload', clear);
    return () => window.removeEventListener('beforeunload', clear);
  }, []);

  // Restore session
  useEffect(() => {
    const t = sessionStorage.getItem('staffToken');
    const u = sessionStorage.getItem('staffUser');
    if (t && u) { setIsLoggedIn(true); setUser(JSON.parse(u)); }
  }, []);

  // Auto-logout when leaving /admin
  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) {
      sessionStorage.removeItem('staffToken');
      sessionStorage.removeItem('staffUser');
      setIsLoggedIn(false); setUser(null);
      setAllBookings([]); setOffers([]);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isLoggedIn) fetchAdminData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      if (!['admin', 'manager', 'receptionist', 'it'].includes(user.role)) {
        setError('Access denied. Staff only.'); setLoginLoading(false); return;
      }
      sessionStorage.setItem('staffToken', token);
      sessionStorage.setItem('staffUser', JSON.stringify(user));
      // Remove any stale localStorage token to avoid conflicts
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(true); setUser(user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoginLoading(false); }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('staffToken'); sessionStorage.removeItem('staffUser');
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setIsLoggedIn(false); setUser(null);
    setAllBookings([]); setOffers([]); setRooms([]);
  };

  // Helper: check if current user has viewed repeat customers
  const hasViewedRepeatCustomers = () => {
    if (!user?.email) return false;
    const key = `repeatCustomersViewed_${user.email}`;
    return localStorage.getItem(key) === 'true';
  };

  // Helper: mark repeat customers as viewed for current user
  const markRepeatCustomersViewed = () => {
    if (!user?.email) return;
    const key = `repeatCustomersViewed_${user.email}`;
    localStorage.setItem(key, 'true');
  };

  const fetchAdminData = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('staffToken');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };
    const role = JSON.parse(sessionStorage.getItem('staffUser') || '{}').role;

    // IT role only needs to load their own requests, not all booking/room data
    if (role === 'it') {
      setLoading(false);
      return;
    }

    try {
      const [bookingsRes, offersRes] = await Promise.all([
        api.get('/bookings', authHeader),
        api.get('/offers', authHeader),
      ]);
      setAllBookings(bookingsRes.data);
      setOffers(offersRes.data);

      // Load repeat customers for admins, managers and receptionists
      if (role === 'admin' || role === 'manager' || role === 'receptionist') {
        try {
          const repeatRes = await api.get('/bookings/repeat-customers', authHeader);
          setRepeatCustomers(repeatRes.data.repeatCustomers || []);
        } catch (err) {
          console.warn('Could not load repeat customers:', err.message);
        }
      }

      if (role !== 'receptionist') {
        const [roomsRes, typesRes] = await Promise.all([
          api.get('/rooms', authHeader),
          api.get('/rooms/types', authHeader),
        ]);
        setRooms(roomsRes.data);
        setRoomTypes(typesRes.data);
      } else {
        const roomsRes = await api.get('/rooms/available', authHeader);
        setRooms(roomsRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
      if (err.response?.status === 401) handleLogout();
    } finally { setLoading(false); }
  };

  const fetchKycUsers = async () => {
    setKycLoading(true);
    const token = sessionStorage.getItem('staffToken');
    try {
      const res = await api.get('/auth/admin/kyc', { headers: { Authorization: `Bearer ${token}` } });
      setKycUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load KYC users');
    } finally { setKycLoading(false); }
  };

  // Auto-refresh KYC list every 30 seconds when on KYC tab
  useEffect(() => {
    if (view !== 'kyc') return;
    const interval = setInterval(() => { fetchKycUsers(); }, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const handleKycDecision = async (userId, action, reason = '') => {
    const token = sessionStorage.getItem('staffToken');
    try {
      await api.post(`/auth/admin/kyc/${userId}`, { action, reason }, { headers: { Authorization: `Bearer ${token}` } });
      fetchKycUsers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update KYC status');
    }
  };

  const handleVerifyPayment = async (bookingId, action) => {
    try {
      const token = sessionStorage.getItem('staffToken');
      await api.put(
        `/payments/${bookingId}/verify-proof`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAdminData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to verify payment';
      setError(`Payment verification failed: ${msg}`);
      console.error('Verify payment error:', err.response?.status, err.response?.data);
    }
  };

  const handleBookingDecision = async () => {
    if (!decisionAction || !selectedBookingForDecision) return;
    try {
      setDecidingLoading(true);
      const token = sessionStorage.getItem('staffToken');
      await api.post(
        `/bookings/${selectedBookingForDecision.id}/decision`,
        { action: decisionAction, notes: decisionNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowDecisionModal(false);
      setDecisionAction('');
      setDecisionNotes('');
      setSelectedBookingForDecision(null);
      setError('');
      fetchAdminData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit decision';
      setError(`Decision failed: ${msg}`);
      console.error('Decision error:', err.response?.status, err.response?.data);
    } finally {
      setDecidingLoading(false);
    }
  };

  // ── Booking History helpers ──
  const fetchHistory = async (filters = historyFilters, page = historyPage) => {
    setHistoryLoading(true);
    const token = sessionStorage.getItem('staffToken');
    try {
      const params = new URLSearchParams({
        ...filters,
        page,
        limit: 20,
      });
      const res = await api.get(`/bookings/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistoryBookings(res.data.bookings || []);
      setHistoryStats(res.data.stats || null);
      setHistoryPage(res.data.page || 1);
      setHistoryTotalPages(res.data.totalPages || 1);
      setHistoryTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load booking history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleHistoryFilterChange = (key, value) => {
    const updated = { ...historyFilters, [key]: value };
    setHistoryFilters(updated);
    setHistoryPage(1);
    fetchHistory(updated, 1);
  };

  const handleHistorySort = (col) => {
    const newDir = historyFilters.sortBy === col && historyFilters.sortDir === 'DESC' ? 'ASC' : 'DESC';
    const updated = { ...historyFilters, sortBy: col, sortDir: newDir };
    setHistoryFilters(updated);
    setHistoryPage(1);
    fetchHistory(updated, 1);
  };

  const handleHistoryPage = (p) => {
    setHistoryPage(p);
    fetchHistory(historyFilters, p);
  };

  const exportHistoryCSV = () => {
    const headers = ['ID', 'Guest', 'Email', 'Phone', 'Room', 'Check-in', 'Check-out', 'Amount', 'Status', 'Payment', 'Type', 'Reception', 'Processed By', 'Processed At', 'Notes'];
    const rows = historyBookings.map(b => [
      b.id,
      b.user?.name || b.guestName || 'Guest',
      b.user?.email || b.guestEmail || '',
      b.guestPhone || '',
      b.room?.roomNumber || '',
      new Date(b.checkInDate).toLocaleDateString(),
      new Date(b.checkOutDate).toLocaleDateString(),
      Number(b.totalPrice || 0).toFixed(2),
      b.status,
      b.paymentStatus,
      b.bookingType,
      b.processedAction || 'none',
      b.processedByUser?.name || '',
      b.processedAt ? new Date(b.processedAt).toLocaleString() : '',
      (b.receptionNotes || '').replace(/,/g, ';'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `booking-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Services helpers ──
  const fetchServices = async () => {
    setServicesLoading(true);
    const token = sessionStorage.getItem('staffToken');
    try {
      const res = await api.get('/services/all', { headers: { Authorization: `Bearer ${token}` } });
      setServices(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load services');
    } finally {
      setServicesLoading(false);
    }
  };

  const openCreateService = () => {
    setEditingService(null);
    setServiceForm(BLANK_SERVICE);
    setShowServiceModal(true);
  };

  const openEditService = (svc) => {
    setEditingService(svc);
    setServiceForm({
      name:          svc.name         || '',
      description:   svc.description  || '',
      category:      svc.category     || 'Other',
      icon:          svc.icon         || '🏨',
      price:         svc.price != null ? String(svc.price) : '',
      priceLabel:    svc.priceLabel   || '',
      availableFrom: svc.availableFrom || '',
      availableTo:   svc.availableTo  || '',
      location:      svc.location     || '',
      status:        svc.status       || 'active',
      sortOrder:     svc.sortOrder    != null ? String(svc.sortOrder) : '0',
    });
    setShowServiceModal(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('staffToken');
    const payload = { ...serviceForm, sortOrder: Number(serviceForm.sortOrder) || 0 };
    try {
      if (editingService) {
        await api.put(`/services/${editingService.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await api.post('/services', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowServiceModal(false);
      fetchServices();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save service');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Delete this service permanently?')) return;
    const token = sessionStorage.getItem('staffToken');
    try {
      await api.delete(`/services/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete service');
    }
  };

  const handleToggleServiceStatus = async (svc) => {
    const token = sessionStorage.getItem('staffToken');
    try {
      await api.put(`/services/${svc.id}`, { status: svc.status === 'active' ? 'inactive' : 'active' }, { headers: { Authorization: `Bearer ${token}` } });
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update service status');
    }
  };

  const handleImagesChange = (files) => {
    const fileArr = Array.from(files);
    const combined = [...newRoom.images, ...fileArr].slice(0, 3); // max 3
    setNewRoom(prev => ({ ...prev, images: combined }));
    const previews = combined.map(f => typeof f === 'string' ? f : URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const handleRemoveImage = (index) => {
    const updated = newRoom.images.filter((_, i) => i !== index);
    setNewRoom(prev => ({ ...prev, images: updated }));
    const previews = updated.map(f => typeof f === 'string' ? f : URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const handleAmenityToggle = (name) => {
    setNewRoom(prev => ({
      ...prev,
      amenities: prev.amenities.includes(name) ? prev.amenities.filter(a => a !== name) : [...prev.amenities, name],
    }));
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('roomNumber', newRoom.roomNumber || newRoom.roomName);
      fd.append('roomTypeId', parseInt(newRoom.roomTypeId));
      fd.append('floor', parseInt(newRoom.floor) || 1);
      fd.append('status', newRoom.status);
      fd.append('amenities', JSON.stringify(newRoom.amenities));
      fd.append('maxGuests', newRoom.maxGuests);
      fd.append('roomSize', newRoom.roomSize);
      fd.append('bedType', newRoom.bedType);
      fd.append('description', newRoom.description);

      // Send existing image paths (strings) and new images (File objects)
      const existingImagePaths = newRoom.images.filter(img => typeof img === 'string');
      const newImageFiles = newRoom.images.filter(img => img instanceof File).slice(0, 3 - existingImagePaths.length);

      // Append existing image paths
      if (existingImagePaths.length > 0) {
        fd.append('existingImages', JSON.stringify(existingImagePaths));
      }

      // Append new image files
      newImageFiles.forEach(img => fd.append('images', img));

      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setEditingRoom(null);
      } else {
        await api.post('/rooms', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      const emptyRoom = { roomName: '', roomNumber: '', roomTypeId: '', pricePerNight: '', floor: '', maxGuests: 2, roomSize: '', bedType: '', description: '', status: 'available', images: [], amenities: [] };
      setNewRoom(emptyRoom);
      setImagePreviews([]);
      setShowRoomModal(false);
      fetchAdminData(); setError('');
    } catch (err) { setError(err.response?.data?.error || 'Failed to save room'); }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    let amenitiesArr = [];
    if (room.amenities) {
      try { amenitiesArr = JSON.parse(room.amenities); } catch { amenitiesArr = room.amenities.split(', ').filter(Boolean); }
    }
    // Load existing images
    let existingImgs = [];
    try { existingImgs = JSON.parse(room.images || '[]'); } catch { existingImgs = []; }
    if (existingImgs.length === 0 && room.image) existingImgs = [room.image];

    setNewRoom({ roomName: room.roomNumber, roomNumber: room.roomNumber, roomTypeId: room.roomTypeId, pricePerNight: room.roomType?.basePrice || '', floor: room.floor, maxGuests: room.maxGuests || 2, roomSize: room.roomSize || '', bedType: room.bedType || '', description: room.description || '', status: room.status, images: existingImgs, amenities: amenitiesArr });
    // Set image previews with full URLs
    setImagePreviews(existingImgs.map(p => imgUrl(p)));
    setShowRoomModal(true);
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Delete this room?')) return;
    try { await api.delete(`/rooms/${roomId}`); fetchAdminData(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to delete room'); }
  };

  // ── IT Management helpers (IT role) ──
  const fetchItMyRequests = async () => {
    setItRequestsLoading(true);
    const token = sessionStorage.getItem('staffToken');
    try {
      const res = await api.get('/auth/it/my-requests', { headers: { Authorization: `Bearer ${token}` } });
      setItMyRequests(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load your requests');
    } finally {
      setItRequestsLoading(false);
    }
  };

  const handleItSubmit = async (e) => {
    e.preventDefault();
    setItSubmitting(true);
    setError('');
    const token = sessionStorage.getItem('staffToken');
    
    try {
      let endpoint = '';
      let payload = {};

      if (itForm.type === 'create') {
        endpoint = '/auth/it/request-create';
        payload = {
          email: itForm.email.trim(),
          name: itForm.name.trim(),
          role: itForm.role,
          password: itForm.password,
        };
      } else if (itForm.type === 'reset') {
        endpoint = '/auth/it/request-reset';
        payload = {
          email: itForm.email.trim(),
          newPassword: itForm.password,
        };
      } else if (itForm.type === 'delete') {
        endpoint = '/auth/it/request-delete';
        payload = {
          email: itForm.email.trim(),
        };
      }

      await api.post(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });
      
      setItForm({ type: 'create', email: '', name: '', role: 'receptionist', password: '' });
      fetchItMyRequests();
      alert('Request submitted successfully. Awaiting admin approval.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setItSubmitting(false);
    }
  };

  // ── IT Approvals helpers (Admin role) ──
  const fetchItRequests = async (filterStatus = 'pending') => {
    setItApprovalsLoading(true);
    const token = sessionStorage.getItem('staffToken');
    try {
      const url = filterStatus === 'all' 
        ? '/auth/admin/it-requests' 
        : `/auth/admin/it-requests?status=${filterStatus}`;
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } });
      
      if (filterStatus === 'pending') {
        setItPendingRequests(res.data);
      } else {
        setItAllRequests(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load IT requests');
    } finally {
      setItApprovalsLoading(false);
    }
  };

  const handleItApprove = async (requestId) => {
    if (!window.confirm('Approve this IT request? The action will be executed immediately.')) return;
    const token = sessionStorage.getItem('staffToken');
    try {
      await api.post(`/auth/admin/it-requests/${requestId}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchItRequests(itApprovalFilter);
      alert('Request approved and executed successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve request');
    }
  };

  const handleItReject = async (requestId) => {
    const reason = prompt('Enter rejection reason (optional):');
    const token = sessionStorage.getItem('staffToken');
    try {
      await api.post(`/auth/admin/it-requests/${requestId}/reject`, { reason }, { headers: { Authorization: `Bearer ${token}` } });
      fetchItRequests(itApprovalFilter);
      alert('Request rejected.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject request');
    }
  };

  // Stats
  const totalBookings   = allBookings.length;
  const pendingBookings = allBookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = allBookings.filter(b => b.status === 'confirmed').length;
  const revenue = allBookings.filter(b => !['cancelled'].includes(b.status)).reduce((s, b) => s + Number(b.totalPrice || 0), 0);

  // Filtered bookings
  const filteredBookings = allBookings.filter(b => {
    const matchSearch = !search ||
      (b.User?.name || b.guestName || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.guestEmail || b.User?.email || '').toLowerCase().includes(search.toLowerCase()) ||
      String(b.id).includes(search);
    const matchStatus = !statusFilter || b.status === statusFilter;
    const matchReception = !receptionFilter ||
      (receptionFilter === 'pending' && (!b.processedAction || b.processedAction === 'none')) ||
      (receptionFilter === 'approved' && b.processedAction === 'approved') ||
      (receptionFilter === 'rejected' && b.processedAction === 'rejected');
    return matchSearch && matchStatus && matchReception;
  });

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  // ── Login screen ──
  if (!isLoggedIn) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-box">
          <h2>🔑 Staff Portal</h2>
          <p className="login-subtitle">Authorized personnel only</p>
          {error && <div className="login-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@hotel.com" required />
            </div>
            <div className="login-field">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loginLoading} className="login-btn">
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="login-help">
            <p><strong>Demo accounts:</strong></p>
            <p>admin@hotel.com / admin123</p>
            <p>manager@hotel.com / manager123</p>
            <p>receptionist@hotel.com / receptionist123</p>
            <p>it@hotel.com / it123</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="admin-loading">Loading...</div>;

  // ── Dashboard ──
  return (
    <div className="admin-dashboard">

      {/* Top bar */}
      <div className="admin-topbar">
        <div>
          <h2 className="admin-title">2RN Solomon - {user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Receptionist'} Dashboard</h2>
          <p className="admin-subtitle">Booking Management System</p>
        </div>
        <button onClick={handleLogout} className="admin-logout-btn">↪ Logout</button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {/* Stats cards — admin & manager only */}
      {isAdminOrManager && user?.role !== 'it' && (
      <div className="admin-stats">
        <div className="stat-card-new">
          <div><p className="stat-label">Total Bookings</p><p className="stat-value">{totalBookings}</p></div>
          <span className="stat-icon">🛏</span>
        </div>
        <div className="stat-card-new">
          <div><p className="stat-label">Pending</p><p className="stat-value pending">{pendingBookings}</p></div>
          <span className="stat-icon">🕐</span>
        </div>
        <div className="stat-card-new">
          <div><p className="stat-label">Confirmed</p><p className="stat-value confirmed">{confirmedBookings}</p></div>
          <span className="stat-icon">✅</span>
        </div>
        <div className="stat-card-new">
          <div><p className="stat-label">Revenue</p><p className="stat-value revenue">{convertPrice(revenue, currency, rates)}</p></div>
          <span className="stat-icon">💰</span>
        </div>
      </div>
      )}

      {/* View tabs + search + filter */}
      <div className="admin-toolbar">
        <div className="admin-view-tabs">
          {user?.role !== 'it' && (
            <button className={`view-tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
              ☰ List View
            </button>
          )}
          {isAdminOrManager && (
            <button className={`view-tab ${view === 'room-management' ? 'active' : ''}`} onClick={() => setView('room-management')}>
              🏨 Room Management
            </button>
          )}
          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'receptionist') && (
            <button
              className={`view-tab ${view === 'repeat-customers' ? 'active' : ''}`}
              onClick={() => {
                setView('repeat-customers');
                markRepeatCustomersViewed();
              }}
            >
              🔄 Repeat Customers
              {repeatCustomers.length > 0 && !hasViewedRepeatCustomers() && (
                <span className="tab-badge">{repeatCustomers.length}</span>
              )}
            </button>
          )}
          {user?.role !== 'it' && (
            <button className={`view-tab ${view === 'payments' ? 'active' : ''}`} onClick={() => setView('payments')}>
              💳 Payment Verification
              {allBookings.filter(b => b.paymentStatus === 'proof_submitted').length > 0 && (
                <span className="tab-badge">{allBookings.filter(b => b.paymentStatus === 'proof_submitted').length}</span>
              )}
            </button>
          )}
          {user?.role !== 'it' && (
            <button className={`view-tab ${view === 'offers' ? 'active' : ''}`} onClick={() => setView('offers')}>
              🎁 Offers
            </button>
          )}
          {user?.role !== 'it' && (
            <button
              className={`view-tab ${view === 'booking-history' ? 'active' : ''}`}
              onClick={() => {
                setView('booking-history');
                fetchHistory(historyFilters, 1);
              }}
            >
              📋 Booking History
            </button>
          )}
          {isAdminOrManager && (
            <button
              className={`view-tab ${view === 'services' ? 'active' : ''}`}
              onClick={() => { setView('services'); fetchServices(); }}
            >
              🛎️ Services
            </button>
          )}
          {user?.role !== 'it' && (
            <button
              className={`view-tab ${view === 'kyc' ? 'active' : ''}`}
              onClick={() => { setView('kyc'); fetchKycUsers(); }}
            >
              🪪 KYC Verification
              {kycUsers.filter(u => u.kycStatus === 'submitted').length > 0 && (
                <span className="tab-badge">{kycUsers.filter(u => u.kycStatus === 'submitted').length}</span>
              )}
            </button>
          )}
          {user?.role === 'it' && (
            <button
              className={`view-tab ${view === 'it-management' ? 'active' : ''}`}
              onClick={() => { setView('it-management'); fetchItMyRequests(); }}
            >
              🔧 IT Management
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              className={`view-tab ${view === 'it-approvals' ? 'active' : ''}`}
              onClick={() => { setView('it-approvals'); fetchItRequests('pending'); }}
            >
              ✅ IT Approvals
              {itPendingRequests.length > 0 && (
                <span className="tab-badge">{itPendingRequests.length}</span>
              )}
            </button>
          )}
        </div>
        {view === 'list' && user?.role !== 'it' && (
          <div className="admin-filters">
            <div className="admin-search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search by name, email, or booking ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-status-filter">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {(isAdminOrManager || user?.role === 'receptionist') && (
              <select value={receptionFilter} onChange={e => setReceptionFilter(e.target.value)} className="admin-status-filter">
                <option value="">All Reception</option>
                <option value="pending">Pending Decision</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
          </div>
        )}
      </div>

      {/* ── List View ── */}
      {view === 'list' && (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>BOOKING ID</th>
                <th>GUEST</th>
                <th>ROOM</th>
                <th>DATES</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>PAYMENT</th>
                {(isAdminOrManager || user?.role === 'receptionist') && (
                  <>
                    <th>RECEPTION</th>
                    {isAdminOrManager && <th>VERIFIED BY</th>}
                    <th>ACTION</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr><td colSpan={isAdminOrManager || user?.role === 'receptionist' ? "10" : "7"} className="no-results">No bookings found matching your criteria.</td></tr>
              ) : filteredBookings.map(b => (
                <tr key={b.id}>
                  <td>#{b.id}</td>
                  <td>
                    <div className="guest-cell">
                      <span className="guest-name">{b.User?.name || b.guestName || 'Guest'}</span>
                      <span className="guest-email">{b.User?.email || b.guestEmail || ''}</span>
                    </div>
                  </td>
                  <td>{b.room?.roomNumber ? `Room ${b.room.roomNumber}` : '—'}</td>
                  <td>
                    <span className="dates-cell">
                      {new Date(b.checkInDate).toLocaleDateString()} →<br/>
                      {new Date(b.checkOutDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {convertPrice(Number(b.totalPrice), currency, rates)}
                      {b.loyaltyDiscountPercent > 0 && (
                        <span className="loyalty-discount-badge" title={`${b.loyaltyDiscountPercent}% loyalty discount was applied`}>
                          🎁 -{b.loyaltyDiscountPercent}% loyalty
                        </span>
                      )}
                    </div>
                  </td>
                  <td><span className={`status-pill ${b.status}`}>{b.status}</span></td>
                  <td className="payment-proof-cell">
                    {b.paymentProof ? (
                      <div className="proof-actions">
                        <a href={imgUrl(b.paymentProof)} target="_blank" rel="noopener noreferrer">
                          <img src={imgUrl(b.paymentProof)} alt="proof" className="proof-thumb" />
                        </a>
                        <span className={`payment-badge ${b.paymentStatus}`}>
                          {b.paymentStatus === 'proof_submitted' && '⏳ Pending'}
                          {b.paymentStatus === 'verified' && '✅ Verified'}
                          {b.paymentStatus === 'unpaid' && '❌ Rejected'}
                        </span>
                      </div>
                    ) : <span className="no-proof">—</span>}
                  </td>
                  {(isAdminOrManager || user?.role === 'receptionist') && (
                    <>
                      <td>
                        <span className={`reception-badge ${b.processedAction || 'none'}`}>
                          {b.processedAction === 'approved' && '✅ Approved'}
                          {b.processedAction === 'rejected' && '❌ Rejected'}
                          {(!b.processedAction || b.processedAction === 'none') && '⏳ Pending'}
                        </span>
                      </td>
                      {isAdminOrManager && (
                        <td>
                          {b.processedByUser ? (
                            <div className="processed-by-cell">
                              <span className="processed-by-name">{b.processedByUser.name}</span>
                              <span className={`role-badge role-badge--${b.processedByUser.role}`}>
                                {b.processedByUser.role}
                              </span>
                              {b.processedAt && (
                                <div className="processed-at">
                                  {new Date(b.processedAt).toLocaleDateString()}{' '}
                                  {new Date(b.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                              {b.receptionNotes && (
                                <div className="processed-notes" title={b.receptionNotes}>
                                  📝 {b.receptionNotes.length > 28 ? b.receptionNotes.slice(0, 28) + '…' : b.receptionNotes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="processed-by-empty">—</span>
                          )}
                        </td>
                      )}
                      <td>
                        {(!b.processedAction || b.processedAction === 'none') && (
                          <button
                            className="decision-btn"
                            onClick={() => {
                              setSelectedBookingForDecision(b);
                              setShowDecisionModal(true);
                            }}
                          >
                            ⚖️ Decide
                          </button>
                        )}
                        {(b.processedAction && b.processedAction !== 'none') && isAdminOrManager && (
                          <button
                            className="decision-btn decision-btn--override"
                            onClick={() => {
                              setSelectedBookingForDecision(b);
                              setShowDecisionModal(true);
                            }}
                          >
                            ✏️ Override
                          </button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Room Management (Admin & Manager only) ── */}
      {view === 'room-management' && !isAdminOrManager && (
        <div className="access-denied">
          <span>🚫</span>
          <h3>Access Denied</h3>
          <p>Room Management is only available to <strong>Admin</strong> and <strong>Manager</strong>.</p>
        </div>
      )}

      {view === 'room-management' && isAdminOrManager && (
        <div className="room-mgmt-container">

          {/* Header bar */}
          <div className="room-mgmt-header">
            <h3>Room Management</h3>
            <button className="add-room-btn" onClick={() => { setEditingRoom(null); setNewRoom({ roomName:'', roomNumber:'', roomTypeId:'', pricePerNight:'', floor:'', maxGuests:2, roomSize:'', bedType:'', description:'', status:'available', images:[], amenities:[] }); setImagePreviews([]); setShowRoomModal(true); }}>
              + Add New Room
            </button>
          </div>

          {/* Room list table */}
          <div className="admin-table-card">
            <table className="admin-table">
              <thead>
                <tr><th>IMAGE</th><th>ROOM #</th><th>TYPE</th><th>FLOOR</th><th>BED</th><th>MAX GUESTS</th><th>SIZE</th><th>STATUS</th><th>ACTIONS</th></tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.id}>
                    <td>{room.image ? <img src={imgUrl(room.image)} alt="" className="room-thumbnail" /> : <span className="no-image">—</span>}</td>
                    <td>{room.roomNumber}</td>
                    <td>{room.roomType?.name || '—'}</td>
                    <td>{room.floor}</td>
                    <td>{room.bedType || '—'}</td>
                    <td>{room.maxGuests || '—'}</td>
                    <td>{room.roomSize || '—'}</td>
                    <td><span className={`status-pill ${room.status}`}>{room.status}</span></td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEditRoom(room)}>✏️</button>
                      <button className="delete-btn" onClick={() => handleDeleteRoom(room.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal overlay */}
          {showRoomModal && (
            <div className="room-modal-overlay" onClick={() => setShowRoomModal(false)}>
              <div className="room-modal" onClick={e => e.stopPropagation()}>
                <div className="room-modal-header">
                  <h3>{editingRoom ? `Edit Room ${editingRoom.roomNumber}` : 'Create New Room'}</h3>
                  <button className="modal-close-btn" onClick={() => setShowRoomModal(false)}>✕</button>
                </div>

                <form onSubmit={handleCreateRoom} className="room-modal-body">
                  {/* Left column */}
                  <div className="room-modal-left">

                    <div className="rm-field">
                      <label>Room Name <span className="req">*</span></label>
                      <input type="text" placeholder="e.g. Deluxe Ocean Suite" value={newRoom.roomName}
                        onChange={e => setNewRoom({...newRoom, roomName: e.target.value, roomNumber: e.target.value})} required />
                    </div>

                    <div className="rm-row">
                      <div className="rm-field">
                        <label>Room Type</label>
                        <select value={newRoom.roomTypeId} onChange={e => setNewRoom({...newRoom, roomTypeId: e.target.value})} required>
                          <option value="">Select type</option>
                          {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div className="rm-field">
                        <label>Price/Night (Birr) <span className="req">*</span></label>
                        <input type="number" placeholder="e.g. 2500" value={newRoom.pricePerNight}
                          onChange={e => setNewRoom({...newRoom, pricePerNight: e.target.value})} />
                      </div>
                    </div>

                    <div className="rm-row">
                      <div className="rm-field">
                        <label>👤 Max Guests</label>
                        <input type="number" min="1" max="10" value={newRoom.maxGuests}
                          onChange={e => setNewRoom({...newRoom, maxGuests: e.target.value})} />
                      </div>
                      <div className="rm-field">
                        <label>Room Size</label>
                        <input type="text" placeholder="42 sqm" value={newRoom.roomSize}
                          onChange={e => setNewRoom({...newRoom, roomSize: e.target.value})} />
                      </div>
                    </div>

                    <div className="rm-field">
                      <label>🛏 Bed Type</label>
                      <input type="text" placeholder="King, Queen, Twin..." value={newRoom.bedType}
                        onChange={e => setNewRoom({...newRoom, bedType: e.target.value})} />
                    </div>

                    <div className="rm-field">
                      <label>Description</label>
                      <textarea rows={4} placeholder="Describe the room..." value={newRoom.description}
                        onChange={e => setNewRoom({...newRoom, description: e.target.value})} />
                    </div>

                    <div className="rm-row">
                      <div className="rm-field">
                        <label>Floor</label>
                        <input type="number" placeholder="1" value={newRoom.floor}
                          onChange={e => setNewRoom({...newRoom, floor: e.target.value})} />
                      </div>
                      <div className="rm-field">
                        <label>Status</label>
                        <select value={newRoom.status} onChange={e => setNewRoom({...newRoom, status: e.target.value})}>
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="room-modal-right">
                    <div className="rm-field">
                      <label>Amenities</label>
                      <div className="amenities-grid">
                        {commonAmenities.map(name => (
                          <label key={name} className="amenity-check-item">
                            <input type="checkbox" checked={newRoom.amenities.includes(name)}
                              onChange={() => handleAmenityToggle(name)} />
                            {name}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rm-field" style={{marginTop:'20px'}}>
                      <label>Room Images <span style={{color:'#9ca3af',fontWeight:400}}>(up to 3)</span></label>
                      {imagePreviews.length === 0 && (
                        <p className="no-images-text">No images uploaded yet</p>
                      )}
                      <div className="image-previews-row">
                        {imagePreviews.map((src, i) => (
                          <div key={i} className="img-preview-wrap">
                            <img src={src} alt="preview" className="img-preview-thumb" />
                            <button type="button" className="img-remove-btn" onClick={() => handleRemoveImage(i)}>✕</button>
                          </div>
                        ))}
                      </div>
                      {imagePreviews.length < 3 && (
                        <label className="image-drop-zone">
                          <input type="file" accept="image/*" multiple style={{display:'none'}}
                            onChange={e => handleImagesChange(e.target.files)} />
                          <div className="drop-zone-inner">
                            <span className="drop-icon">⬆</span>
                            <p>Drop images here or click to upload</p>
                            <small>{3 - imagePreviews.length} slot{3 - imagePreviews.length !== 1 ? 's' : ''} remaining · JPG, PNG, WebP up to 5MB</small>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Footer buttons */}
                  <div className="room-modal-footer">
                    <button type="button" className="cancel-btn" onClick={() => setShowRoomModal(false)}>Cancel</button>
                    <button type="submit" className="create-room-btn">🏠 {editingRoom ? 'Update Room' : 'Create Room'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Payment Verification ── */}
      {view === 'payments' && (
        <div className="admin-table-card">
          <div className="payment-verify-header">
            <h3>💳 Payment Verification</h3>
            <p className="payment-verify-sub">Review and approve guest payment screenshots</p>
          </div>

          {/* Pending proofs first */}
          {(() => {
            const pending  = allBookings.filter(b => b.paymentStatus === 'proof_submitted');
            const verified = allBookings.filter(b => b.paymentStatus === 'verified');

            return (
              <>
                {/* Pending */}
                <div className="pv-section">
                  <h4 className="pv-section-title pv-pending">
                    ⏳ Awaiting Verification ({pending.length})
                  </h4>
                  {pending.length === 0 ? (
                    <p className="pv-empty">No pending payment proofs.</p>
                  ) : (
                    <div className="pv-cards">
                      {pending.map(b => (
                        <div key={b.id} className="pv-card pv-card--pending">
                          <div className="pv-card-top">
                            <div className="pv-info">
                              <span className="pv-booking-id">Booking #{b.id}</span>
                              <span className="pv-guest">{b.User?.name || b.guestName || 'Guest'}</span>
                              <span className="pv-email">{b.User?.email || b.guestEmail || ''}</span>
                              <span className="pv-amount">{convertPrice(Number(b.totalPrice), currency, rates)}</span>
                              <span className="pv-dates">
                                {new Date(b.checkInDate).toLocaleDateString()} → {new Date(b.checkOutDate).toLocaleDateString()}
                              </span>
                            </div>
                            <a href={imgUrl(b.paymentProof)} target="_blank" rel="noopener noreferrer" className="pv-proof-link">
                              <img src={imgUrl(b.paymentProof)} alt="Payment proof" className="pv-proof-img" />
                              <span className="pv-view-text">View full image</span>
                            </a>
                          </div>
                          <div className="pv-actions">
                            <button className="pv-approve-btn" onClick={() => handleVerifyPayment(b.id, 'approve')}>
                              ✅ Approve Payment
                            </button>
                            <button className="pv-reject-btn" onClick={() => handleVerifyPayment(b.id, 'reject')}>
                              ❌ Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Verified */}
                {verified.length > 0 && (
                  <div className="pv-section">
                    <h4 className="pv-section-title pv-verified">✅ Verified ({verified.length})</h4>
                    <div className="pv-cards">
                      {verified.map(b => (
                        <div key={b.id} className="pv-card pv-card--verified">
                          <div className="pv-info">
                            <span className="pv-booking-id">Booking #{b.id}</span>
                            <span className="pv-guest">{b.User?.name || b.guestName || 'Guest'}</span>
                            <span className="pv-amount">{convertPrice(Number(b.totalPrice), currency, rates)}</span>
                          </div>
                          <span className="pv-badge pv-badge--verified">✅ Verified</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* ── Offers ── */}
      {view === 'offers' && (
        <div className="admin-table-card">
          <h3>Active Offers</h3>
          <table className="admin-table">
            <thead>
              <tr><th>NAME</th><th>DISCOUNT</th><th>VALID FROM</th><th>VALID TO</th><th>STATUS</th></tr>
            </thead>
            <tbody>
              {offers.map(o => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>{o.discountType === 'percentage' ? `${o.discountValue}%` : `ETB ${o.discountValue}`}</td>
                  <td>{new Date(o.startDate).toLocaleDateString()}</td>
                  <td>{new Date(o.endDate).toLocaleDateString()}</td>
                  <td><span className={`status-pill ${o.status}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Repeat Customers (Admin & Receptionist) ── */}
      {view === 'repeat-customers' && (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'receptionist') && (
        <div className="admin-table-card">
          <div style={{ marginBottom: '20px' }}>
            <h3>🔄 Repeat Customers</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Customers with 2 or more bookings</p>
          </div>

          {/* Filter Inputs */}
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Filter by Name</label>
              <input
                type="text"
                value={repeatCustomerFilters.name}
                onChange={(e) => setRepeatCustomerFilters({...repeatCustomerFilters, name: e.target.value})}
                placeholder="Enter customer name..."
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Filter by Email</label>
              <input
                type="text"
                value={repeatCustomerFilters.email}
                onChange={(e) => setRepeatCustomerFilters({...repeatCustomerFilters, email: e.target.value})}
                placeholder="Enter email address..."
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Filter by Phone</label>
              <input
                type="text"
                value={repeatCustomerFilters.phone}
                onChange={(e) => setRepeatCustomerFilters({...repeatCustomerFilters, phone: e.target.value})}
                placeholder="Enter phone number..."
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => setRepeatCustomerFilters({ name: '', email: '', phone: '' })}
                style={{ width: '100%', padding: '8px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>CUSTOMER NAME</th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>TOTAL BOOKINGS</th>
                <th>TOTAL SPENT</th>
                <th>FIRST BOOKING</th>
                <th>LAST BOOKING</th>
              </tr>
            </thead>
            <tbody>
              {repeatCustomers.filter(customer => {
                const matchName = customer.guestName?.toLowerCase().includes(repeatCustomerFilters.name.toLowerCase());
                const matchEmail = customer.guestEmail?.toLowerCase().includes(repeatCustomerFilters.email.toLowerCase());
                const matchPhone = customer.guestPhone?.includes(repeatCustomerFilters.phone);
                return matchName && matchEmail && matchPhone;
              }).length === 0 ? (
                <tr><td colSpan="7" className="no-results">No repeat customers found.</td></tr>
              ) : repeatCustomers.filter(customer => {
                const matchName = customer.guestName?.toLowerCase().includes(repeatCustomerFilters.name.toLowerCase());
                const matchEmail = customer.guestEmail?.toLowerCase().includes(repeatCustomerFilters.email.toLowerCase());
                const matchPhone = customer.guestPhone?.includes(repeatCustomerFilters.phone);
                return matchName && matchEmail && matchPhone;
              }).map((customer, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{customer.guestName || 'Unknown'}</strong>
                  </td>
                  <td>{customer.guestEmail}</td>
                  <td>{customer.guestPhone || 'N/A'}</td>
                  <td>
                    <span style={{ background: '#e8f5e9', padding: '6px 12px', borderRadius: '4px', fontWeight: '600', color: '#2e7d32' }}>
                      {customer.totalBookings}
                    </span>
                  </td>
                  <td><strong>{convertPrice(Number(customer.totalSpent), currency, rates)}</strong></td>
                  <td>{new Date(customer.firstBookingDate).toLocaleDateString()}</td>
                  <td>{new Date(customer.lastBookingDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Access Denied for non-admin/non-receptionist on Repeat Customers */}
      {view === 'repeat-customers' && user?.role !== 'admin' && user?.role !== 'manager' && user?.role !== 'receptionist' && (
        <div className="access-denied">
          <span>🚫</span>
          <h3>Access Denied</h3>
          <p>Repeat Customers view is only available to Admin, Manager and Receptionist.</p>
        </div>
      )}

      {/* Decision Modal */}
      {showDecisionModal && selectedBookingForDecision && (
        <div className="decision-modal-overlay" onClick={() => setShowDecisionModal(false)}>
          <div className="decision-modal" onClick={e => e.stopPropagation()}>
            <div className="decision-modal-header">
              <h3>
                {selectedBookingForDecision.processedAction !== 'none'
                  ? `Override Decision — #${selectedBookingForDecision.id}`
                  : `Booking Decision — #${selectedBookingForDecision.id}`}
              </h3>
              <button className="modal-close-btn" onClick={() => setShowDecisionModal(false)}>✕</button>
            </div>
            <div className="decision-modal-body">
              <div className="booking-summary">
                <p><strong>Guest:</strong> {selectedBookingForDecision.guestName || selectedBookingForDecision.User?.name}</p>
                <p><strong>Room:</strong> {selectedBookingForDecision.room?.roomNumber}</p>
                <p><strong>Dates:</strong> {new Date(selectedBookingForDecision.checkInDate).toLocaleDateString()} → {new Date(selectedBookingForDecision.checkOutDate).toLocaleDateString()}</p>
                <p><strong>Amount:</strong> {convertPrice(Number(selectedBookingForDecision.totalPrice), currency, rates)}</p>
              </div>
              {selectedBookingForDecision.processedAction !== 'none' && selectedBookingForDecision.processedByUser && (
                <div className="override-notice">
                  <span className="override-icon">⚠️</span>
                  <div>
                    <strong>Previously {selectedBookingForDecision.processedAction} by </strong>
                    <span className={`role-badge role-badge--${selectedBookingForDecision.processedByUser.role}`}>
                      {selectedBookingForDecision.processedByUser.role}
                    </span>
                    {' '}<strong>{selectedBookingForDecision.processedByUser.name}</strong>
                    {selectedBookingForDecision.processedAt && (
                      <span> on {new Date(selectedBookingForDecision.processedAt).toLocaleDateString()}</span>
                    )}
                    {selectedBookingForDecision.receptionNotes && (
                      <div className="override-prev-notes">Notes: "{selectedBookingForDecision.receptionNotes}"</div>
                    )}
                  </div>
                </div>
              )}
              <div className="decision-actions">
                <label>Decision:</label>
                <div className="decision-buttons">
                  <button
                    className={`decision-btn-approved ${decisionAction === 'approved' ? 'active' : ''}`}
                    onClick={() => setDecisionAction('approved')}
                  >
                    ✅ Approve
                  </button>
                  <button
                    className={`decision-btn-rejected ${decisionAction === 'rejected' ? 'active' : ''}`}
                    onClick={() => setDecisionAction('rejected')}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
              <div className="decision-notes-field">
                <label>Notes (Optional):</label>
                <textarea
                  value={decisionNotes}
                  onChange={e => setDecisionNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows="3"
                />
              </div>
            </div>
            <div className="decision-modal-footer">
              <button className="cancel-btn" onClick={() => setShowDecisionModal(false)}>Cancel</button>
              <button
                className="submit-btn"
                onClick={handleBookingDecision}
                disabled={!decisionAction || decidingLoading}
              >
                {decidingLoading ? 'Submitting...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Booking History (all staff roles) ── */}
      {view === 'booking-history' && (
        <div className="bh-container">

          {/* Header */}
          <div className="bh-header">
            <div>
              <h3 className="bh-title">📋 Booking History</h3>
              <p className="bh-subtitle">Complete record of all bookings — searchable, filterable, exportable</p>
            </div>
            <button className="bh-export-btn" onClick={exportHistoryCSV} disabled={historyBookings.length === 0}>
              ⬇ Export CSV
            </button>
          </div>

          {/* Stats strip */}
          {historyStats && (
            <div className="bh-stats-strip">
              <div className="bh-stat">
                <span className="bh-stat-num">{historyStats.total}</span>
                <span className="bh-stat-label">Total</span>
              </div>
              <div className="bh-stat">
                <span className="bh-stat-num bh-stat--pending">{historyStats.byStatus.pending}</span>
                <span className="bh-stat-label">Pending</span>
              </div>
              <div className="bh-stat">
                <span className="bh-stat-num bh-stat--confirmed">{historyStats.byStatus.confirmed}</span>
                <span className="bh-stat-label">Confirmed</span>
              </div>
              <div className="bh-stat">
                <span className="bh-stat-num bh-stat--checkedin">{historyStats.byStatus.checked_in}</span>
                <span className="bh-stat-label">Checked In</span>
              </div>
              <div className="bh-stat">
                <span className="bh-stat-num bh-stat--checkedout">{historyStats.byStatus.checked_out}</span>
                <span className="bh-stat-label">Checked Out</span>
              </div>
              <div className="bh-stat">
                <span className="bh-stat-num bh-stat--cancelled">{historyStats.byStatus.cancelled}</span>
                <span className="bh-stat-label">Cancelled</span>
              </div>
              <div className="bh-stat bh-stat--revenue">
                <span className="bh-stat-num">{convertPrice(historyStats.totalRevenue, currency, rates)}</span>
                <span className="bh-stat-label">Revenue</span>
              </div>
              <div className="bh-stat">
                <span className="bh-stat-num">{historyStats.byType.online}</span>
                <span className="bh-stat-label">Online</span>
              </div>
              <div className="bh-stat">
                <span className="bh-stat-num">{historyStats.byType.manual}</span>
                <span className="bh-stat-label">Manual</span>
              </div>
              <div className="bh-stat">
                <span className="bh-stat-num">{historyStats.byType.guest}</span>
                <span className="bh-stat-label">Guest</span>
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div className="bh-filters">
            <div className="bh-search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search name, email, phone, room, ID..."
                value={historyFilters.search}
                onChange={e => handleHistoryFilterChange('search', e.target.value)}
              />
              {historyFilters.search && (
                <button className="bh-clear-search" onClick={() => handleHistoryFilterChange('search', '')}>✕</button>
              )}
            </div>

            <select
              value={historyFilters.status}
              onChange={e => handleHistoryFilterChange('status', e.target.value)}
              className="bh-select"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={historyFilters.bookingType}
              onChange={e => handleHistoryFilterChange('bookingType', e.target.value)}
              className="bh-select"
            >
              <option value="">All Types</option>
              <option value="online">Online</option>
              <option value="manual">Manual</option>
              <option value="guest">Guest</option>
            </select>

            <select
              value={historyFilters.paymentStatus}
              onChange={e => handleHistoryFilterChange('paymentStatus', e.target.value)}
              className="bh-select"
            >
              <option value="">All Payments</option>
              <option value="unpaid">Unpaid</option>
              <option value="proof_submitted">Proof Submitted</option>
              <option value="verified">Verified</option>
            </select>

            <div className="bh-date-range">
              <label>From</label>
              <input
                type="date"
                value={historyFilters.dateFrom}
                onChange={e => handleHistoryFilterChange('dateFrom', e.target.value)}
                className="bh-date-input"
              />
              <label>To</label>
              <input
                type="date"
                value={historyFilters.dateTo}
                onChange={e => handleHistoryFilterChange('dateTo', e.target.value)}
                className="bh-date-input"
              />
            </div>

            <button
              className="bh-reset-btn"
              onClick={() => {
                const reset = { search: '', status: '', bookingType: '', paymentStatus: '', dateFrom: '', dateTo: '', sortBy: 'createdAt', sortDir: 'DESC' };
                setHistoryFilters(reset);
                setHistoryPage(1);
                fetchHistory(reset, 1);
              }}
            >
              ↺ Reset
            </button>
          </div>

          {/* Results count */}
          <div className="bh-results-meta">
            {historyLoading ? (
              <span className="bh-loading-text">Loading...</span>
            ) : (
              <span>
                Showing <strong>{historyBookings.length}</strong> of <strong>{historyTotal}</strong> bookings
                {' '}· Page <strong>{historyPage}</strong> of <strong>{historyTotalPages}</strong>
              </span>
            )}
          </div>

          {/* Table */}
          <div className="admin-table-card bh-table-wrap">
            {historyLoading ? (
              <div className="bh-table-loading">
                <div className="bh-spinner" />
                <p>Loading booking history...</p>
              </div>
            ) : historyBookings.length === 0 ? (
              <div className="bh-empty">
                <span className="bh-empty-icon">📭</span>
                <p>No bookings found for the selected filters.</p>
              </div>
            ) : (
              <table className="admin-table bh-table">
                <thead>
                  <tr>
                    <th
                      className="bh-sortable"
                      onClick={() => handleHistorySort('id')}
                    >
                      ID {historyFilters.sortBy === 'id' ? (historyFilters.sortDir === 'DESC' ? '▼' : '▲') : '↕'}
                    </th>
                    <th>GUEST</th>
                    <th>ROOM</th>
                    <th
                      className="bh-sortable"
                      onClick={() => handleHistorySort('checkInDate')}
                    >
                      CHECK-IN {historyFilters.sortBy === 'checkInDate' ? (historyFilters.sortDir === 'DESC' ? '▼' : '▲') : '↕'}
                    </th>
                    <th
                      className="bh-sortable"
                      onClick={() => handleHistorySort('checkOutDate')}
                    >
                      CHECK-OUT {historyFilters.sortBy === 'checkOutDate' ? (historyFilters.sortDir === 'DESC' ? '▼' : '▲') : '↕'}
                    </th>
                    <th
                      className="bh-sortable"
                      onClick={() => handleHistorySort('totalPrice')}
                    >
                      AMOUNT {historyFilters.sortBy === 'totalPrice' ? (historyFilters.sortDir === 'DESC' ? '▼' : '▲') : '↕'}
                    </th>
                    <th>STATUS</th>
                    <th>PAYMENT</th>
                    <th>TYPE</th>
                    <th>RECEPTION</th>
                    {isAdminOrManager && <th>PROCESSED BY</th>}
                    <th
                      className="bh-sortable"
                      onClick={() => handleHistorySort('createdAt')}
                    >
                      BOOKED ON {historyFilters.sortBy === 'createdAt' ? (historyFilters.sortDir === 'DESC' ? '▼' : '▲') : '↕'}
                    </th>
                    <th>DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  {historyBookings.map(b => (
                    <React.Fragment key={b.id}>
                      <tr className={expandedHistoryRow === b.id ? 'bh-row-expanded' : ''}>
                        <td className="bh-id-cell">#{b.id}</td>
                        <td>
                          <div className="guest-cell">
                            <span className="guest-name">{b.user?.name || b.guestName || 'Guest'}</span>
                            <span className="guest-email">{b.user?.email || b.guestEmail || ''}</span>
                          </div>
                        </td>
                        <td>{b.room?.roomNumber ? `Room ${b.room.roomNumber}` : '—'}</td>
                        <td>{new Date(b.checkInDate).toLocaleDateString()}</td>
                        <td>{new Date(b.checkOutDate).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {convertPrice(Number(b.totalPrice), currency, rates)}
                            {b.loyaltyDiscountPercent > 0 && (
                              <span className="loyalty-discount-badge">🎁 -{b.loyaltyDiscountPercent}%</span>
                            )}
                          </div>
                        </td>
                        <td><span className={`status-pill ${b.status}`}>{b.status}</span></td>
                        <td>
                          <span className={`payment-badge ${b.paymentStatus}`}>
                            {b.paymentStatus === 'proof_submitted' && '⏳ Pending'}
                            {b.paymentStatus === 'verified'        && '✅ Verified'}
                            {b.paymentStatus === 'unpaid'          && '❌ Unpaid'}
                          </span>
                        </td>
                        <td>
                          <span className={`bh-type-badge bh-type--${b.bookingType}`}>
                            {b.bookingType === 'online' && '🌐 Online'}
                            {b.bookingType === 'manual' && '🖊 Manual'}
                            {b.bookingType === 'guest'  && '🚶 Guest'}
                          </span>
                        </td>
                        <td>
                          <span className={`reception-badge ${b.processedAction || 'none'}`}>
                            {b.processedAction === 'approved' && '✅ Approved'}
                            {b.processedAction === 'rejected' && '❌ Rejected'}
                            {b.processedAction === 'none'     && '⏳ Pending'}
                          </span>
                        </td>
                        {isAdminOrManager && (
                          <td>
                            {b.processedByUser ? (
                              <div className="processed-by-cell">
                                <span className="processed-by-name">{b.processedByUser.name}</span>
                                <span className={`role-badge role-badge--${b.processedByUser.role}`}>
                                  {b.processedByUser.role}
                                </span>
                              </div>
                            ) : <span className="processed-by-empty">—</span>}
                          </td>
                        )}
                        <td className="bh-created-cell">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            className="bh-expand-btn"
                            onClick={() => setExpandedHistoryRow(expandedHistoryRow === b.id ? null : b.id)}
                            title="Toggle details"
                          >
                            {expandedHistoryRow === b.id ? '▲' : '▼'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {expandedHistoryRow === b.id && (
                        <tr className="bh-detail-row">
                          <td colSpan={isAdminOrManager ? 13 : 12}>
                            <div className="bh-detail-grid">
                              <div className="bh-detail-block">
                                <span className="bh-detail-label">Phone</span>
                                <span>{b.guestPhone || '—'}</span>
                              </div>
                              <div className="bh-detail-block">
                                <span className="bh-detail-label">Booking ID</span>
                                <span>#{b.id}</span>
                              </div>
                              <div className="bh-detail-block">
                                <span className="bh-detail-label">Nights</span>
                                <span>
                                  {Math.ceil((new Date(b.checkOutDate) - new Date(b.checkInDate)) / (1000 * 60 * 60 * 24))} night(s)
                                </span>
                              </div>
                              <div className="bh-detail-block">
                                <span className="bh-detail-label">Booked On</span>
                                <span>{new Date(b.createdAt).toLocaleString()}</span>
                              </div>
                              {b.processedAt && (
                                <div className="bh-detail-block">
                                  <span className="bh-detail-label">Processed At</span>
                                  <span>{new Date(b.processedAt).toLocaleString()}</span>
                                </div>
                              )}
                              {b.receptionNotes && (
                                <div className="bh-detail-block bh-detail-block--wide">
                                  <span className="bh-detail-label">Reception Notes</span>
                                  <span>{b.receptionNotes}</span>
                                </div>
                              )}
                              {b.paymentProof && (
                                <div className="bh-detail-block">
                                  <span className="bh-detail-label">Payment Proof</span>
                                  <a href={imgUrl(b.paymentProof)} target="_blank" rel="noopener noreferrer">
                                    <img src={imgUrl(b.paymentProof)} alt="proof" className="proof-thumb" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {historyTotalPages > 1 && (
            <div className="bh-pagination">
              <button
                className="bh-page-btn"
                onClick={() => handleHistoryPage(1)}
                disabled={historyPage === 1}
              >«</button>
              <button
                className="bh-page-btn"
                onClick={() => handleHistoryPage(historyPage - 1)}
                disabled={historyPage === 1}
              >‹</button>

              {Array.from({ length: Math.min(7, historyTotalPages) }, (_, i) => {
                // Show pages centered around current page
                let start = Math.max(1, historyPage - 3);
                const end   = Math.min(historyTotalPages, start + 6);
                start = Math.max(1, end - 6);
                return start + i;
              }).filter(p => p <= historyTotalPages).map(p => (
                <button
                  key={p}
                  className={`bh-page-btn ${p === historyPage ? 'bh-page-btn--active' : ''}`}
                  onClick={() => handleHistoryPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                className="bh-page-btn"
                onClick={() => handleHistoryPage(historyPage + 1)}
                disabled={historyPage === historyTotalPages}
              >›</button>
              <button
                className="bh-page-btn"
                onClick={() => handleHistoryPage(historyTotalPages)}
                disabled={historyPage === historyTotalPages}
              >»</button>
            </div>
          )}

        </div>
      )}

      {/* ── Services Management (Admin & Manager only) ── */}
      {view === 'services' && isAdminOrManager && (() => {
        const SERVICE_CATEGORIES = ['All', 'Food & Beverage', 'Wellness & Spa', 'Fitness', 'Transport', 'Facilities', 'Recreation', 'Other'];
        const displayedServices = servicesCatFilter === 'All'
          ? services
          : services.filter(s => s.category === servicesCatFilter);

        return (
          <div className="sm-container">

            {/* Header */}
            <div className="sm-header">
              <div>
                <h3 className="sm-title">🛎️ Hotel Services Management</h3>
                <p className="sm-subtitle">Manage the services menu shown to guests on the public Services page.</p>
              </div>
              <button className="sm-add-btn" onClick={openCreateService}>+ Add Service</button>
            </div>

            {/* Category filter */}
            <div className="sm-cat-strip">
              {SERVICE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`sm-cat-btn ${servicesCatFilter === cat ? 'sm-cat-btn--active' : ''}`}
                  onClick={() => setServicesCatFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="admin-table-card sm-table-wrap">
              {servicesLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading services...</div>
              ) : displayedServices.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
                  No services found. Click "+ Add Service" to create one.
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ICON</th>
                      <th>NAME</th>
                      <th>CATEGORY</th>
                      <th>PRICE</th>
                      <th>HOURS</th>
                      <th>LOCATION</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedServices.map(svc => (
                      <tr key={svc.id}>
                        <td style={{ fontSize: '22px', textAlign: 'center' }}>{svc.icon || '🏨'}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{svc.name}</div>
                          {svc.description && (
                            <div style={{ fontSize: '11px', color: '#999', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {svc.description}
                            </div>
                          )}
                        </td>
                        <td>{svc.category}</td>
                        <td>
                          {svc.priceLabel
                            ? svc.priceLabel
                            : svc.price != null
                              ? `${convertPrice(Number(svc.price), currency, rates)}`
                              : <span style={{ color: '#2e7d32', fontWeight: 600 }}>Free</span>
                          }
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: '#666' }}>
                          {svc.availableFrom && svc.availableTo
                            ? (svc.availableFrom === '00:00' && svc.availableTo === '23:59'
                                ? '24 hrs'
                                : `${svc.availableFrom} – ${svc.availableTo}`)
                            : '—'}
                        </td>
                        <td style={{ fontSize: '12px', color: '#888' }}>{svc.location || '—'}</td>
                        <td>
                          <span className={`status-pill ${svc.status}`}>{svc.status}</span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button className="sm-toggle-btn" onClick={() => handleToggleServiceStatus(svc)}>
                            {svc.status === 'active' ? '⏸ Hide' : '▶ Show'}
                          </button>
                          <button className="sm-edit-btn" onClick={() => openEditService(svc)}>✏️ Edit</button>
                          {user?.role === 'admin' && (
                            <button className="sm-del-btn" onClick={() => handleDeleteService(svc.id)}>🗑️</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Create / Edit Modal */}
            {showServiceModal && (
              <div className="sm-modal-overlay" onClick={() => setShowServiceModal(false)}>
                <div className="sm-modal" onClick={e => e.stopPropagation()}>
                  <div className="sm-modal-header">
                    <h3>{editingService ? `Edit — ${editingService.name}` : 'Add New Service'}</h3>
                    <button className="modal-close-btn" onClick={() => setShowServiceModal(false)}>✕</button>
                  </div>

                  <form onSubmit={handleSaveService} className="sm-modal-body">

                    <div className="sm-row">
                      <div className="sm-field">
                        <label>Service Name *</label>
                        <input
                          type="text" required
                          placeholder="e.g. Rooftop Bar"
                          value={serviceForm.name}
                          onChange={e => setServiceForm(p => ({ ...p, name: e.target.value }))}
                        />
                      </div>
                      <div className="sm-field">
                        <label>
                          Icon (emoji)
                          <span className="sm-icon-preview">{serviceForm.icon || '🏨'}</span>
                        </label>
                        <input
                          type="text"
                          placeholder="🍽️"
                          value={serviceForm.icon}
                          onChange={e => setServiceForm(p => ({ ...p, icon: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="sm-field">
                      <label>Description</label>
                      <textarea
                        placeholder="Brief description shown to guests..."
                        value={serviceForm.description}
                        onChange={e => setServiceForm(p => ({ ...p, description: e.target.value }))}
                      />
                    </div>

                    <div className="sm-row">
                      <div className="sm-field">
                        <label>Category *</label>
                        <select
                          value={serviceForm.category}
                          onChange={e => setServiceForm(p => ({ ...p, category: e.target.value }))}
                        >
                          {['Food & Beverage', 'Wellness & Spa', 'Fitness', 'Transport', 'Facilities', 'Recreation', 'Other'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm-field">
                        <label>Status</label>
                        <select
                          value={serviceForm.status}
                          onChange={e => setServiceForm(p => ({ ...p, status: e.target.value }))}
                        >
                          <option value="active">Active (visible to guests)</option>
                          <option value="inactive">Inactive (hidden)</option>
                        </select>
                      </div>
                    </div>

                    <div className="sm-row">
                      <div className="sm-field">
                        <label>Price (ETB) — leave blank if free</label>
                        <input
                          type="number" min="0"
                          placeholder="e.g. 1200"
                          value={serviceForm.price}
                          onChange={e => setServiceForm(p => ({ ...p, price: e.target.value }))}
                        />
                      </div>
                      <div className="sm-field">
                        <label>Price Label (overrides price display)</label>
                        <input
                          type="text"
                          placeholder='e.g. "from 500 ETB / person"'
                          value={serviceForm.priceLabel}
                          onChange={e => setServiceForm(p => ({ ...p, priceLabel: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="sm-row">
                      <div className="sm-field">
                        <label>Available From (HH:MM)</label>
                        <input
                          type="time"
                          value={serviceForm.availableFrom}
                          onChange={e => setServiceForm(p => ({ ...p, availableFrom: e.target.value }))}
                        />
                      </div>
                      <div className="sm-field">
                        <label>Available To (HH:MM)</label>
                        <input
                          type="time"
                          value={serviceForm.availableTo}
                          onChange={e => setServiceForm(p => ({ ...p, availableTo: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="sm-row">
                      <div className="sm-field">
                        <label>Location</label>
                        <input
                          type="text"
                          placeholder="e.g. Floor 3 — Pool Deck"
                          value={serviceForm.location}
                          onChange={e => setServiceForm(p => ({ ...p, location: e.target.value }))}
                        />
                      </div>
                      <div className="sm-field">
                        <label>Sort Order</label>
                        <input
                          type="number" min="0"
                          value={serviceForm.sortOrder}
                          onChange={e => setServiceForm(p => ({ ...p, sortOrder: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="sm-modal-footer">
                      <button type="button" className="cancel-btn" onClick={() => setShowServiceModal(false)}>Cancel</button>
                      <button type="submit" className="submit-btn">
                        {editingService ? '💾 Save Changes' : '➕ Create Service'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        );
      })()}

      {/* ── KYC Verification ── */}
      {view === 'kyc' && (
        <div className="admin-table-card">
          <div style={{ marginBottom: '20px' }}>
            <h3>🪪 KYC Verification</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Review and approve customer identity documents</p>
          </div>

          {kycLoading ? (
            <p style={{ color: '#888', padding: '20px' }}>Loading...</p>
          ) : kycUsers.length === 0 ? (
            <p style={{ color: '#aaa', padding: '20px', textAlign: 'center' }}>No customer KYC submissions yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>CUSTOMER</th>
                  <th>PHONE</th>
                  <th>NATIONALITY</th>
                  <th>ID TYPE</th>
                  <th>SUBMITTED</th>
                  <th>DOCUMENTS</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {kycUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="guest-cell">
                        <span className="guest-name">{u.name}</span>
                        <span className="guest-email">{u.email}</span>
                      </div>
                    </td>
                    <td>{u.phone || '—'}</td>
                    <td>{u.nationality || '—'}</td>
                    <td>
                      {u.idType === 'national_id' ? '🪪 National ID' : u.idType === 'passport' ? '📘 Passport' : '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#666' }}>
                      {u.kycSubmittedAt
                        ? new Date(u.kycSubmittedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {u.idFront && (
                          <a href={imgUrl(u.idFront)} target="_blank" rel="noopener noreferrer">
                            <img src={imgUrl(u.idFront)} alt="ID Front" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                            <div style={{ fontSize: '10px', color: '#888', textAlign: 'center' }}>Front</div>
                          </a>
                        )}
                        {u.idBack && (
                          <a href={imgUrl(u.idBack)} target="_blank" rel="noopener noreferrer">
                            <img src={imgUrl(u.idBack)} alt="ID Back" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                            <div style={{ fontSize: '10px', color: '#888', textAlign: 'center' }}>Back</div>
                          </a>
                        )}
                        {!u.idFront && '—'}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${
                        u.kycStatus === 'approved' ? 'confirmed' :
                        u.kycStatus === 'submitted' ? 'pending' :
                        u.kycStatus === 'rejected' ? 'cancelled' : ''
                      }`}>
                        {u.kycStatus === 'approved'  && '✅ Approved'}
                        {u.kycStatus === 'submitted' && '⏳ Submitted'}
                        {u.kycStatus === 'rejected'  && '❌ Rejected'}
                        {u.kycStatus === 'pending'   && '⬜ Pending'}
                      </span>
                    </td>
                    <td>
                      {u.kycStatus === 'submitted' && (
                        <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                          <button
                            className="pv-approve-btn"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => handleKycDecision(u.id, 'approved')}
                          >
                            ✅ Approve
                          </button>
                          <button
                            className="pv-reject-btn"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => {
                              const reason = window.prompt('Rejection reason (shown to customer):');
                              if (reason !== null) handleKycDecision(u.id, 'rejected', reason);
                            }}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      )}
                      {u.kycStatus === 'approved' && (
                        <button
                          className="decision-btn decision-btn--override"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={() => {
                            const reason = window.prompt('Rejection reason:');
                            if (reason !== null) handleKycDecision(u.id, 'rejected', reason);
                          }}
                        >
                          ↩ Revoke
                        </button>
                      )}
                      {(u.kycStatus === 'pending' || u.kycStatus === 'rejected') && (
                        <span style={{ color: '#aaa', fontSize: '12px' }}>Awaiting submission</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── IT Management (IT role only) ── */}
      {view === 'it-management' && user?.role === 'it' && (
        <div className="admin-table-card">
          <h3>🔧 IT Management — Staff Account Operations</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>Submit requests to create, reset passwords, or delete staff accounts. All actions require admin approval before taking effect.</p>

          <form onSubmit={handleItSubmit} style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Action Type</label>
                <select value={itForm.type} onChange={e => setItForm({ ...itForm, type: e.target.value, email: '', name: '', password: '' })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}>
                  <option value="create">➕ Create New Staff Account</option>
                  <option value="reset">🔑 Reset Password</option>
                  <option value="delete">🗑️ Delete Staff Account</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Staff Email</label>
                <input type="email" required value={itForm.email} onChange={e => setItForm({ ...itForm, email: e.target.value })} placeholder="staff@hotel.com" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              {itForm.type === 'create' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Full Name</label>
                    <input type="text" required value={itForm.name} onChange={e => setItForm({ ...itForm, name: e.target.value })} placeholder="John Doe" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Role</label>
                    <select value={itForm.role} onChange={e => setItForm({ ...itForm, role: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}>
                      <option value="receptionist">Receptionist</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="it">IT</option>
                    </select>
                  </div>
                </>
              )}
              {(itForm.type === 'create' || itForm.type === 'reset') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>{itForm.type === 'create' ? 'Password' : 'New Password'}</label>
                  <input type="password" required minLength="6" value={itForm.password} onChange={e => setItForm({ ...itForm, password: e.target.value })} placeholder="Min. 6 characters" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              )}
            </div>
            <button type="submit" disabled={itSubmitting} style={{ marginTop: '15px', padding: '10px 24px', background: itSubmitting ? '#aaa' : '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: itSubmitting ? 'not-allowed' : 'pointer' }}>
              {itSubmitting ? '⏳ Submitting...' : '📤 Submit Request for Admin Approval'}
            </button>
          </form>

          <h4 style={{ marginBottom: '12px' }}>Your Submitted Requests</h4>
          {itRequestsLoading ? (
            <p style={{ color: '#888' }}>Loading...</p>
          ) : (
            <div className="admin-table-card" style={{ padding: 0 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>TYPE</th>
                    <th>TARGET EMAIL</th>
                    <th>TARGET NAME</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>SUBMITTED</th>
                    <th>APPROVED BY</th>
                    <th>REJECTION REASON</th>
                  </tr>
                </thead>
                <tbody>
                  {itMyRequests.length === 0 ? (
                    <tr><td colSpan="9" className="no-results">No requests submitted yet.</td></tr>
                  ) : itMyRequests.map(req => (
                    <tr key={req.id}>
                      <td>#{req.id}</td>
                      <td><span className={`status-pill ${req.type}`}>{req.type}</span></td>
                      <td>{req.targetEmail}</td>
                      <td>{req.targetName || '—'}</td>
                      <td>{req.targetRole || '—'}</td>
                      <td><span className={`status-pill ${req.status}`}>{req.status}</span></td>
                      <td style={{ fontSize: '12px' }}>{new Date(req.createdAt).toLocaleString()}</td>
                      <td>{req.approver?.name || '—'}</td>
                      <td style={{ color: '#c53030', fontSize: '12px' }}>{req.rejectionReason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── IT Approvals (Admin only) ── */}
      {view === 'it-approvals' && user?.role === 'admin' && (
        <div className="admin-table-card">
          <h3>✅ IT Approvals — Review Staff Account Requests</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>Approve or reject IT requests for staff account management. Approved actions execute immediately.</p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ marginRight: '10px', fontWeight: '600', fontSize: '14px' }}>Filter by status:</label>
            <select value={itApprovalFilter} onChange={e => { setItApprovalFilter(e.target.value); fetchItRequests(e.target.value); }} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}>
              <option value="pending">⏳ Pending Only</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
              <option value="all">All Requests</option>
            </select>
          </div>

          {itApprovalsLoading ? (
            <p style={{ color: '#888' }}>Loading...</p>
          ) : (
            <div className="admin-table-card" style={{ padding: 0 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>TYPE</th>
                    <th>REQUESTED BY</th>
                    <th>TARGET EMAIL</th>
                    <th>NAME</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>SUBMITTED</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {(itApprovalFilter === 'pending' ? itPendingRequests : itAllRequests).length === 0 ? (
                    <tr><td colSpan="9" className="no-results">No requests found.</td></tr>
                  ) : (itApprovalFilter === 'pending' ? itPendingRequests : itAllRequests).map(req => (
                    <tr key={req.id}>
                      <td>#{req.id}</td>
                      <td><span className={`status-pill ${req.type}`}>{req.type}</span></td>
                      <td>{req.requester?.name || '—'}<br /><span style={{ fontSize: '11px', color: '#888' }}>{req.requester?.role}</span></td>
                      <td>{req.targetEmail}</td>
                      <td>{req.targetName || '—'}</td>
                      <td>{req.targetRole || '—'}</td>
                      <td><span className={`status-pill ${req.status}`}>{req.status}</span></td>
                      <td style={{ fontSize: '12px' }}>{new Date(req.createdAt).toLocaleString()}</td>
                      <td>
                        {req.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button onClick={() => handleItApprove(req.id)} style={{ padding: '5px 12px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>✅ Approve</button>
                            <button onClick={() => handleItReject(req.id)} style={{ padding: '5px 12px', background: '#c53030', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>❌ Reject</button>
                          </div>
                        ) : req.status === 'approved' ? (
                          <span style={{ color: '#2e7d32', fontWeight: '600', fontSize: '13px' }}>✅ Approved by {req.approver?.name}</span>
                        ) : (
                          <span style={{ color: '#c53030', fontSize: '12px' }}>❌ {req.rejectionReason || 'Rejected'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
