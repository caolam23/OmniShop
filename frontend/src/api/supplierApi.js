import axiosClient from './axiosClient';

const supplierApi = {
  getAllSuppliers: () => axiosClient.get('/suppliers'),
  
  getSupplierById: (id) => axiosClient.get(`/suppliers/${id}`),
  
  createSupplier: (data) => axiosClient.post('/suppliers', data),
  
  updateSupplier: (id, data) => axiosClient.put(`/suppliers/${id}`, data),
  
  deleteSupplier: (id) => axiosClient.delete(`/suppliers/${id}`),
};

export default supplierApi;