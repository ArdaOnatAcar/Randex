import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const businessService = {
  getAll: (params) => api.get('/businesses', { params }),
  getById: (id) => api.get(`/businesses/${id}`),
  create: (data) => api.post('/businesses', data),
  update: (id, data) => api.put(`/businesses/${id}`, data),
  delete: (id) => api.delete(`/businesses/${id}`),
  getMyBusinesses: () => api.get('/businesses/owner/my-businesses')
};

export const serviceService = {
  getByBusiness: (businessId) => api.get(`/services/business/${businessId}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`)
};

export const appointmentService = {
  getMyAppointments: () => api.get('/appointments/my-appointments'),
  getAvailableSlots: (businessId, date) => api.get(`/appointments/available-slots/${businessId}/${date}`),
  create: (data) => api.post('/appointments', data),
  updateStatus: (id, status) => api.put(`/appointments/${id}/status`, { status })
};

export const reviewService = {
  getByBusiness: (businessId) => api.get(`/reviews/business/${businessId}`),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`)
};
