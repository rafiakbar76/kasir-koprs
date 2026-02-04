import React, { useState } from 'react';
import { apiService } from '../utils/api';

const Login = ({ onLoginSuccess, onBack, onRegisterClick, users = [] }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        setErrorMessage('Email dan password harus diisi');
        setIsLoading(false);
        return;
      }

      // Real authentication via backend API
      const response = await apiService.login(email, password);

      if (response && response.token && response.user) {
        // Set token di apiService
        apiService.setToken(response.token);

        // Success - pass user data ke parent component
        onLoginSuccess(response.user);
      } else {
        setErrorMessage('Respons server tidak valid');
      }
    } catch (error) {
      // Handle different error scenarios
      if (error.message.includes('401')) {
        setErrorMessage('Email atau password salah, silahkan coba lagi');
      } else if (error.message.includes('Connect')) {
        setErrorMessage('Gagal terhubung ke server. Pastikan backend sudah berjalan.');
      } else {
        setErrorMessage(error.message || 'Login gagal. Silahkan coba lagi.');
      }
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
        <div className="login-card-wrapper"></div>
      <div className="login-box">
        <div className="login-header">
          <h2>FORM LOGIN</h2>
          <p className="login-subtitle">Isi Data Diri Untuk Masuk ke Sistem Kasir</p>
        </div>

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="login-submit-btn" disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Login'}
            </button>
            <button type="button" className="back-btn" onClick={onBack} disabled={isLoading}>
              Kembali
            </button>
          </div>
          <div className="registration-link">
            <p>Belum punya akun? <button type="button" className="register-link-btn" onClick={onRegisterClick}>Daftar di sini</button></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;