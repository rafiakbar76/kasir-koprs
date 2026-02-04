import React, { useState } from 'react';

const AddMenuForm = ({ onSave, onCancel }) => {
  const [menuItem, setMenuItem] = useState({
    name: '',
    price: '',
    category: 'KOPI'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(menuItem);
  };

  return (
    <div className="add-menu-form">
      <h2>Tambah Menu</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Nama Menu"
            value={menuItem.name}
            onChange={(e) => setMenuItem({...menuItem, name: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="number"
            placeholder="Harga"
            value={menuItem.price}
            onChange={(e) => setMenuItem({...menuItem, price: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <select
            value={menuItem.category}
            onChange={(e) => setMenuItem({...menuItem, category: e.target.value})}
          >
            <option value="KOPI">KOPI</option>
            <option value="NON-KOPI">NON-KOPI</option>
            <option value="MAKANAN">MAKANAN</option>
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="save-btn">Simpan</button>
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMenuForm;