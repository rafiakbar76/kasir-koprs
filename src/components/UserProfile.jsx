import React, { useState } from 'react';

const UserProfile = ({ onBack, currentUser, users = [], onAddNewUser, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editData, setEditData] = useState(null);
  const [addUserData, setAddUserData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    address: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Inisialisasi editData ketika component mount atau currentUser berubah
  React.useEffect(() => {
    if (currentUser) {
      setEditData({ ...currentUser });
    }
  }, [currentUser]);

  const handleEditClick = () => {
    if (currentUser) {
      setEditData({ ...currentUser });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMessage('');
  };

  const handleSaveEdit = () => {
    if (onUpdateUser && editData) {
      onUpdateUser(editData);
      setIsEditing(false);
      setErrorMessage('');
    }
  };

  const handleInputChange = (field, value) => {
    if (editData) {
      setEditData({
        ...editData,
        [field]: value
      });
    }
  };

  const handleAddUserClick = () => {
    setIsAddingUser(true);
    setErrorMessage('');
  };

  const handleCancelAddUser = () => {
    setIsAddingUser(false);
    setAddUserData({
      fullName: '',
      email: '',
      username: '',
      password: '',
      phone: '',
      address: '',
    });
    setErrorMessage('');
  };

  const handleAddUserChange = (field, value) => {
    setAddUserData({
      ...addUserData,
      [field]: value
    });
  };

  const handleSaveNewUser = () => {
    setErrorMessage('');

    // Validasi
    if (!addUserData.fullName.trim() || !addUserData.email.trim() || !addUserData.username.trim() || !addUserData.password.trim()) {
      setErrorMessage('Nama, email, username, dan password harus diisi');
      return;
    }

    // Cek apakah username sudah ada
    if (users.some(u => u.username === addUserData.username)) {
      setErrorMessage('Username sudah terdaftar');
      return;
    }

    if (addUserData.password.length < 6) {
      setErrorMessage('Password minimal 6 karakter');
      return;
    }

    if (!addUserData.email.includes('@')) {
      setErrorMessage('Email tidak valid');
      return;
    }

    // Simpan user baru
    const newUser = {
      ...addUserData,
      joinDate: new Date().toISOString().split('T')[0]
    };
    
    onAddNewUser(newUser);
    setIsAddingUser(false);
    setAddUserData({
      fullName: '',
      email: '',
      username: '',
      password: '',
      phone: '',
      address: '',
    });
  };

  if (!currentUser) {
    return (
      <div className="user-profile-container">
        <div className="user-profile-header">
          <button className="back-button" onClick={onBack}>← Kembali</button>
          <h1>Data Diri Pengguna</h1>
        </div>
        <div className="user-profile-card">
          <p>Silakan login terlebih dahulu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="user-profile-header">
        <button className="back-button" onClick={onBack}>← Kembali</button>
        <h1>Data Diri Pengguna</h1>
      </div>

      <div className="user-profile-card">
        <div className="profile-avatar">
          <div className="avatar-placeholder">👤</div>
        </div>

        {!isEditing ? (
          <div className="profile-content">
            <div className="profile-info-group">
              <label>Nama Lengkap</label>
              <p>{currentUser.fullName}</p>
            </div>
            <div className="profile-info-group">
              <label>Email</label>
              <p>{currentUser.email}</p>
            </div>
            <div className="profile-info-group">
              <label>Username</label>
              <p>{currentUser.username}</p>
            </div>
            <div className="profile-info-group">
              <label>Nomor Telepon</label>
              <p>{currentUser.phone || '-'}</p>
            </div>
            <div className="profile-info-group">
              <label>Alamat</label>
              <p>{currentUser.address || '-'}</p>
            </div>
            <div className="profile-info-group">
              <label>Tanggal Bergabung</label>
              <p>{currentUser.joinDate}</p>
            </div>

            <div className="profile-buttons">
              <button className="edit-profile-btn" onClick={handleEditClick}>
                ✏️ Edit Data
              </button>
              <button className="add-user-btn" onClick={handleAddUserClick}>
                ➕ Tambah Pengguna Baru
              </button>
            </div>
          </div>
        ) : (
          <form className="profile-edit-form" onSubmit={(e) => {
            e.preventDefault();
            handleSaveEdit();
          }}>
            <div className="input-group">
              <label>Nama Lengkap</label>
              <input
                type="text"
                value={editData?.fullName || ''}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={editData?.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                value={editData?.username || ''}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Nomor Telepon</label>
              <input
                type="tel"
                value={editData?.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Alamat</label>
              <textarea
                value={editData?.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows="3"
              ></textarea>
            </div>

            <div className="edit-actions">
              <button type="submit" className="save-btn">
                ✓ Simpan
              </button>
              <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                ✕ Batal
              </button>
            </div>
          </form>
        )}
      </div>

      {isAddingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Tambah Pengguna Baru</h2>
              <button className="modal-close" onClick={handleCancelAddUser}>✕</button>
            </div>

            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <form className="add-user-form" onSubmit={(e) => {
              e.preventDefault();
              handleSaveNewUser();
            }}>
              <div className="input-group">
                <label>Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={addUserData.fullName}
                  onChange={(e) => handleAddUserChange('fullName', e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Masukkan email"
                  value={addUserData.email}
                  onChange={(e) => handleAddUserChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="Masukkan username"
                  value={addUserData.username}
                  onChange={(e) => handleAddUserChange('username', e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Masukkan password"
                  value={addUserData.password}
                  onChange={(e) => handleAddUserChange('password', e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Nomor Telepon</label>
                <input
                  type="tel"
                  placeholder="Masukkan nomor telepon (opsional)"
                  value={addUserData.phone}
                  onChange={(e) => handleAddUserChange('phone', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Alamat</label>
                <textarea
                  placeholder="Masukkan alamat (opsional)"
                  value={addUserData.address}
                  onChange={(e) => handleAddUserChange('address', e.target.value)}
                  rows="3"
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  ✓ Simpan
                </button>
                <button type="button" className="cancel-btn" onClick={handleCancelAddUser}>
                  ✕ Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
