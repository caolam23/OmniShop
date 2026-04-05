import axiosClient from './axiosClient';

const productApi = {
  // params có thể chứa: { page, limit, search, sortBy, sortOrder }
  getAllProducts: (params) => axiosClient.get('/products', { params }),
  
  getProductById: (id) => axiosClient.get(`/products/${id}`),
  
  // data ở đây phải là một object FormData (vì có file ảnh)
  createProduct: (formData) => axiosClient.post('/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  updateProduct: (id, formData) => axiosClient.put(`/products/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  deleteProduct: (id) => axiosClient.delete(`/products/${id}`),

  restoreProduct: (id) => axiosClient.patch(`/products/${id}/restore`),
};

export default productApi;