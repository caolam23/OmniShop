import axiosClient from './axiosClient';

// User API - CRUD operations
const userApi = {
  // Get all users
  getAllUsers: async (params = {}) => {
    const response = await axiosClient.get('/users', { params });
    return response;
  },

  // Get single user by ID
  getUserById: async (userId) => {
    const response = await axiosClient.get(`/users/${userId}`);
    return response;
  },

  // Create new user (Admin only)
  createUser: async (userData) => {
    const response = await axiosClient.post('/users', userData);
    return response;
  },

  // Update user (Admin only)
  updateUser: async (userId, userData) => {
    const response = await axiosClient.put(`/users/${userId}`, userData);
    return response;
  },

  // Soft delete user (Admin only)
  deleteUser: async (userId) => {
    const response = await axiosClient.delete(`/users/${userId}`);
    return response;
  },

  // Hard delete user (Admin only - permanently remove)
  forceDeleteUser: async (userId) => {
    const response = await axiosClient.delete(`/users/${userId}/force`);
    return response;
  },

  // Restore soft-deleted user (Admin only)
  restoreUser: async (userId) => {
    const response = await axiosClient.patch(`/users/${userId}/restore`);
    return response;
  },
};

export default userApi;
