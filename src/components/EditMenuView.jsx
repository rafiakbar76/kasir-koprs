import React from 'react';

const EditMenuView = ({ menuItems, activeTab, onDelete }) => {
  return (
    <>
      <div className="edit-menu-items">
        {menuItems[activeTab].map((item) => (
          <div key={item.id} className="edit-menu-item">
            <input 
              type="text" 
              value={item.name} 
              readOnly
              className="menu-item-input"
            />
            <input 
              type="number" 
              value={item.price} 
              readOnly
              className="price-input"
            />
            <button
              className="delete-btn"
              onClick={() => onDelete && onDelete(item.id)}
              aria-label={`Hapus ${item.name}`}
              title="Hapus menu"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default EditMenuView;