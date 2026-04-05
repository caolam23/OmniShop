import axiosClient from './axiosClient';

const categoryApi = {
  getAllCategories: () => axiosClient.get('/categories'),
  
  getCategoryById: (id) => axiosClient.get(`/categories/${id}`),
  
  createCategory: (data) => axiosClient.post('/categories', data),
  
  updateCategory: (id, data) => axiosClient.put(`/categories/${id}`, data),
  
  deleteCategory: (id) => axiosClient.delete(`/categories/${id}`),
};

export default categoryApi;