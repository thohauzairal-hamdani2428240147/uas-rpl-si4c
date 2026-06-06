import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const apiService = {
  // Authentication services
  async login(loginIdentifier, password) {
    const response = await apiClient.post('/auth/login', { loginIdentifier, password });
    return response.data;
  },

  async register(data) {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  async updateProfile(data) {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  async seedDatabase() {
    const response = await apiClient.get('/auth/seed');
    return response.data;
  },

  async getBookedSlots(lapanganId, tanggal) {
    const response = await apiClient.get('/bookings/slots', {
      params: { lapanganId, tanggal }
    });
    return response.data;
  },

  // Get all sports fields
  async getFields() {
    try {
      const response = await apiClient.get('/bookings/fields');
      return response.data;
    } catch (error) {
      console.error('Error fetching fields:', error);
      // Fallback data matching seeder
      return [
        { id: 1, namaLapangan: 'JSC Futsal Arena A', kategori: 'Futsal', hargaPerJam: 150000, status: 'Available' },
        { id: 2, namaLapangan: 'JSC Basketball Hall B', kategori: 'Basket', hargaPerJam: 200000, status: 'Available' },
        { id: 3, namaLapangan: 'JSC Badminton Court 1', kategori: 'Badminton', hargaPerJam: 80000, status: 'Available' }
      ];
    }
  },

  // Check court availability
  async checkAvailability(lapanganId, tanggal, waktuMulai, waktuSelesai) {
    const response = await apiClient.get('/bookings/check', {
      params: { lapanganId, tanggal, waktuMulai, waktuSelesai }
    });
    return response.data;
  },

  // Create booking (Locks the slot temporarily)
  async createBooking(bookingData) {
    const response = await apiClient.post('/bookings', bookingData);
    return response.data;
  },

  // Process / Initiate Payment record
  async processPayment(paymentData) {
    const response = await apiClient.post('/payments/process', paymentData);
    return response.data;
  },

  // Verify Payment (Simulate Payment Gateway Webhook Callback)
  async verifyPayment(verifyData) {
    const response = await apiClient.post('/payments/verify', verifyData);
    return response.data;
  },

  // Get Admin revenue and utilization reports
  async getAdminReport() {
    const response = await apiClient.get('/admin/laporan');
    return response.data;
  }
};
