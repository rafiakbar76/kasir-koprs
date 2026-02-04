import React, { useState } from 'react';
import { apiService } from '../utils/api';

const Register = ({ onRegisterSuccess, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validasi input
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('Semua field harus diisi');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password minimal 6 karakter');
      return;
    }

    if (!email.includes('@')) {
      setErrorMessage('Email tidak valid');
      return;
    }

    setIsLoading(true);

    try {
      // Call real API untuk registrasi
      const response = await apiService.register({
        name,
        email,
        password,
        password_confirmation: confirmPassword,
      });

      // Set token dari response
      apiService.setToken(response.token);

      // Success - navigate ke main app dengan user data
      alert(`Registrasi berhasil! Selamat datang ${response.user.name}, Anda sudah login.`);
      onRegisterSuccess(response.user);
    } catch (error) {
      // Error handling untuk berbagai kasus
      if (error.message.includes('unique')) {
        setErrorMessage('Email sudah terdaftar, silahkan gunakan email lain');
      } else if (error.message.includes('password')) {
        setErrorMessage('Password tidak sesuai atau kurang dari 6 karakter');
      } else if (error.message.includes('Email')) {
        setErrorMessage('Email tidak valid');
      } else {
        setErrorMessage(error.message || 'Registrasi gagal. Silahkan coba lagi.');
      }
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>DAFTAR AKUN</h2>
          <p className="login-subtitle">Buat Akun Baru untuk Menggunakan Sistem Kasir</p>
        </div>

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nama Lengkap</label>
            <input
              type="text"
              placeholder="Masukkan nama lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
          <div className="input-group">
            <label>Konfirmasi Password</label>
            <input
              type="password"
              placeholder="Konfirmasi password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="login-submit-btn" disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Daftar'}
            </button>
            <button type="button" className="back-btn" onClick={onBack} disabled={isLoading}>
              Kembali
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
