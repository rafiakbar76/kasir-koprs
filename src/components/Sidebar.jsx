import React from 'react';

const Sidebar = ({ isOpen, onToggle, onLogout, onNavigate }) => {
  return (
    <>
      <button
        className={`sidebar-toggle ${isOpen ? 'open' : 'closed'}`}
        onClick={onToggle}
        aria-label={isOpen ? 'Sembunyikan sidebar' : 'Tampilkan sidebar'}
        aria-expanded={isOpen}
      >
        {isOpen ? '←' : '☰'}
      </button>

      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`} aria-hidden={!isOpen}>
        <div className="brand">
          SISTEM INFORMASI<br />KASIR-KOPRS.CO
        </div>

        {/* Tombol kecil di sidebar: Menu dan Keluar */}
        <nav className="sidebar-nav">
          <button className="side-btn" onClick={() => onNavigate && onNavigate("menu")}>
            📋 Menu
          </button>
          <button className="side-btn" onClick={() => onNavigate && onNavigate("total-penjualan")}>
            📊 Total Penjualan
          </button>
          <button className="side-btn" onClick={() => onNavigate && onNavigate("user-profile")}>
            👤 Profil Pengguna
          </button>
          <button className="side-btn" onClick={() => onLogout && onLogout()}>
            🚪 Keluar
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;