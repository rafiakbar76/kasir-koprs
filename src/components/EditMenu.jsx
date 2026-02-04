import React, { useState, useEffect } from "react";

const EditMenu = ({ initialItems = [], menuItems = {}, activeTab = "KOPI", onSave, onCancel }) => {
  const [items, setItems] = useState(initialItems);
  const [currentTab, setCurrentTab] = useState(activeTab);

  useEffect(() => {
    // Update items ketika tab berubah
    setItems((menuItems[currentTab] || []).map(i => ({ ...i })));
  }, [currentTab, menuItems]);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleChange = (id, field, value) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  const handleAdd = () => {
    const newItem = { id: Date.now(), name: "Menu baru", price: 0, quantity: 0 };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemove = (id) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleSave = () => {
    if (onSave) onSave(currentTab, items);
  };

  const tabs = ["KOPI", "NON-KOPI", "MAKANAN"];

  return (
    <div className="edit-page">
      <div className="edit-header">
        <h3>✏️ Edit Menu</h3>
      </div>

      {/* Tombol kategori */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        padding: '15px 20px', 
        background: '#f8f9fa',
        borderBottom: '1px solid #e9ecef',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            style={{
              padding: '8px 16px',
              background: currentTab === tab ? '#667eea' : '#fff',
              color: currentTab === tab ? 'white' : '#333',
              border: currentTab === tab ? 'none' : '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: currentTab === tab ? '600' : '500',
              transition: 'all 0.2s ease'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="edit-container">
        <div className="edit-list">
          {items.length === 0 ? (
            <div className="empty-edit">
              <p>Belum ada menu di kategori {currentTab}</p>
              <p className="empty-hint">Klik "Tambah Menu" untuk menambahkan item baru</p>
            </div>
          ) : (
            items.map(it => (
              <div key={it.id} className="edit-menu-item">
                <input
                  value={it.name}
                  onChange={(e) => handleChange(it.id, "name", e.target.value)}
                  className="menu-item-input"
                  placeholder="Nama menu"
                />
                <div className="price-group">
                  <span className="price-label">Rp</span>
                  <input
                    type="number"
                    value={it.price}
                    onChange={(e) => handleChange(it.id, "price", Number(e.target.value))}
                    className="price-input"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleRemove(it.id)}
                  aria-label={`Hapus ${it.name}`}
                  title="Hapus menu"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="edit-controls" role="toolbar" aria-label="Edit menu controls">
        <div className="controls-left">
          <button className="btn btn-add" onClick={handleAdd}>
            <span className="icon">+</span>
            <span className="label">Tambah Menu</span>
          </button>
          <button className="btn btn-back" onClick={() => (onCancel ? onCancel() : window.history.back())}>
            Kembali
          </button>
        </div>

        <div className="controls-right">
          <button className="btn btn-save" onClick={handleSave}>Simpan</button>
        </div>
      </div>
    </div>
  );
};

export default EditMenu;