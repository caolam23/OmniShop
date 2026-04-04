import axiosClient from './axiosClient';

// Role API - CRUD operations
const roleApi = {
  // Get all roles
  getAllRoles: async (params = {}) => {
    const response = await axiosClient.get('/roles', { params });
    return response;
  },

  // Get single role by ID
  getRoleById: async (roleId) => {
    const response = await axiosClient.get(`/roles/${roleId}`);
    return response;
  },

  // Create new role (Admin only)
  createRole: async (roleData) => {
    const response = await axiosClient.post('/roles', roleData);
    return response;
  },

  // Update role (Admin only)
  updateRole: async (roleId, roleData) => {
    const response = await axiosClient.put(`/roles/${roleId}`, roleData);
    return response;
  },

  // Soft delete role (Admin only)
  deleteRole: async (roleId) => {
    const response = await axiosClient.delete(`/roles/${roleId}`);
    return response;
  },

  // Hard delete role (Admin only - permanently remove)
  forceDeleteRole: async (roleId) => {
    const response = await axiosClient.delete(`/roles/${roleId}/force`);
    return response;
  },

  // Restore soft-deleted role (Admin only)
  restoreRole: async (roleId) => {
    const response = await axiosClient.patch(`/roles/${roleId}/restore`);
    return response;
  },
};

export default roleApi;
