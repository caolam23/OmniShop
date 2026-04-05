import axiosClient from './axiosClient';

const cartApi = {
  // Lấy giỏ hàng của người dùng hiện tại
  getCart: () => axiosClient.get('/carts'),

  // Thêm sản phẩm vào giỏ: data = { productId, quantity }
  addToCart: (data) => axiosClient.post('/carts/add', data),

  // Cập nhật số lượng: data = { productId, quantity }
  updateQuantity: (data) => axiosClient.put('/carts/update', data),

  // Xóa sản phẩm khỏi giỏ
  removeFromCart: (productId) => axiosClient.delete(`/carts/remove/${productId}`),

  // Làm trống giỏ hàng
  clearCart: () => axiosClient.delete('/carts/clear'),
};

export default cartApi;