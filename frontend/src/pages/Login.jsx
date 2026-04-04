import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../api/authApi';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call API login
      const response = await authApi.login(email, password);

      if (response.success) {
        // Check user role and redirect accordingly
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : response.user;
        const userRole = user?.role?.name || user?.role;

        if (userRole === 'Admin') {
          // Admin goes to dashboard
          navigate('/dashboard');
        } else {
          // Regular user goes to user profile
          navigate('/user');
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err?.message || 'An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      {/* Left Panel - Form */}
      <div className={styles.authLeft}>
        <div className={styles.formWrapper}>
          <div className={styles.logo}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            OmniShop
          </div>

          <h1 className={styles.title}>Đăng nhập tài khoản</h1>
          <p className={styles.subtitle}>Vui lòng điền thông tin để truy cập hệ thống quản trị.</p>

          <button className={styles.socialBtn}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Tiếp tục với Google
          </button>

          <div className={styles.divider}>
            <span className={styles.dividerText}>Hoặc đăng nhập bằng Email</span>
          </div>

          {error && <div className={`${styles.alertBox} ${styles.alertError}`}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="admin@omnishop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="password" className={styles.label}>Mật khẩu</label>
                <button type="button" className={styles.forgotLink}>Quên mật khẩu?</button>
              </div>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.checkboxGroup}>
              <input
                id="remember"
                type="checkbox"
                className={styles.checkbox}
              />
              <label htmlFor="remember" className={styles.checkboxLabel}>Ghi nhớ đăng nhập trong 30 ngày</label>
            </div>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập ngay'}
            </button>
          </form>

          <div className={styles.footerText}>
            Chưa có tài khoản?{' '}
            <Link to="/register" className={styles.footerLink}>
              Đăng ký thành viên
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Brand */}
      <div className={styles.authRight}>
        <div className={styles.glassCircle}></div>
        <div className={styles.brandPanel}>
          <h2>Quản trị hệ thống toàn diện.</h2>
          <p>OmniShop mang đến giải pháp quản lý sản phẩm, đơn hàng và khách hàng theo thời gian thực. Theo dõi doanh thu và tối ưu hóa vận hành chỉ trong vài cú click.</p>
        </div>
      </div>
    </div>
  );
}
