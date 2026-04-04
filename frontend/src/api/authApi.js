import axiosClient from './axiosClient';

// Auth API functions
const authApi = {
  // Đăng ký tài khoản mới
  register: async (data) => {
    const response = await axiosClient.post('/auth/register', data);
    
    // Lưu token vào localStorage (tương tự login)
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  // Đăng nhập
  login: async (email, password) => {
    const response = await axiosClient.post('/auth/login', {
      email,
      password,
    });
    
    // Lưu token vào localStorage
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async () => {
    const response = await axiosClient.get('/auth/me');
    return response;
  },

  // Cập nhật profil user
  updateProfile: async (data) => {
    const response = await axiosClient.put('/auth/me', data);
    return response;
  },
};

export default authApi;
