import axiosClient from './axiosClient';

const categoryApi = {
  getAllCategories: () => axiosClient.get('/categories'),
  
  getCategoryById: (id) => axiosClient.get(`/categories/${id}`),
  
  createCategory: (formData) => axiosClient.post('/categories', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  updateCategory: (id, formData) => axiosClient.put(`/categories/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  deleteCategory: (id) => axiosClient.delete(`/categories/${id}`),
};

export default categoryApi;