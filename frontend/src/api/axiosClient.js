import axios from 'axios';

// Tạo axios instance với cấu hình mặc định
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Thêm token vào mỗi request
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Thêm token vào Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Xử lý response và lỗi
axiosClient.interceptors.response.use(
  (response) => {
    // Nếu response thành công, trả về data
    return response.data;
  },
  (error) => {
    // Kiểm tra lỗi
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect về login page
      window.location.href = '/login';
    }
    
    // Trả về error response từ server
    return Promise.reject(error.response?.data || error.message);
  }
);

export default axiosClient;
