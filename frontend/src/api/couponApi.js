import axiosClient from './axiosClient';

const couponApi = {
  getAll: () => axiosClient.get('/coupons'),
  create: (data) => axiosClient.post('/coupons', data),
  update: (id, data) => axiosClient.put(`/coupons/${id}`, data),
  delete: (id) => axiosClient.delete(`/coupons/${id}`),
  // Kiểm tra mã giảm giá: data = { code, orderValue }
  validateCoupon: (data) => axiosClient.post('/coupons/validate', data),
};

export default couponApi;