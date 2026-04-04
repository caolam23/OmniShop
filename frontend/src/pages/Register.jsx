import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../api/authApi';
import styles from './Register.module.css';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate username length
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call API register
      const response = await authApi.register({
        username,
        email,
        password,
      });

      if (response.success) {
        setSuccess('Registration successful! Logging in...');
        // Automatically redirect to dashboard since token was already saved by authApi.register
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError(err?.message || 'An error occurred. Please try again.');
      console.error('Register error:', err);
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

          <h1 className={styles.title}>Tạo tài khoản mới</h1>
          <p className={styles.subtitle}>Bắt đầu hành trình quản lý chuyên nghiệp cùng OmniShop.</p>

          <button className={styles.socialBtn}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Đăng ký với Google
          </button>

          <div className={styles.divider}>
            <span className={styles.dividerText}>Hoặc đăng ký bằng Email</span>
          </div>

          {error && <div className={`${styles.alertBox} ${styles.alertError}`}>{error}</div>}
          {success && <div className={`${styles.alertBox} ${styles.alertSuccess}`}>{success}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.label}>Tên hiển thị</label>
              <input
                id="username"
                type="text"
                className={styles.input}
                placeholder="Ví dụ: Cao Hoàng Lâm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email công việc</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formRowItem}>
                <label htmlFor="password" className={styles.label}>Mật khẩu</label>
                <input
                  id="password"
                  type="password"
                  className={styles.input}
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formRowItem}>
                <label htmlFor="confirmPassword" className={styles.label}>Xác nhận mật khẩu</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className={styles.input}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <p className={styles.terms}>
              Bằng việc tạo tài khoản, bạn đồng ý với <Link to="#" className={styles.termsLink}>Điều khoản dịch vụ</Link> và <Link to="#" className={styles.termsLink}>Chính sách bảo mật</Link> của chúng tôi.
            </p>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className={styles.footerText}>
            Đã có tài khoản?{' '}
            <Link to="/login" className={styles.footerLink}>
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Brand */}
      <div className={styles.authRight}>
        <div className={styles.glassCircle}></div>
        <div className={styles.brandPanel}>
          <h2>Bắt đầu tối ưu hóa.</h2>
          <p>Gia nhập cùng hàng ngàn nhà bán lẻ đang sử dụng OmniShop để đơn giản hóa quy trình vận hành và tăng trưởng doanh thu vượt bậc.</p>
        </div>
      </div>
    </div>
  );
}
