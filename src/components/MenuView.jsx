import React from 'react';

const MenuView = ({ menuItems, activeTab, handleQuantityChange, onEditClick, onCheckoutClick }) => {
  const getTotalItems = () => {
    return menuItems[activeTab].reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const handleCheckout = () => {
    // Check selected items across ALL categories (not only the active tab)
    const totalSelectedAcross = Object.keys(menuItems).reduce((sum, cat) => {
      return sum + ((menuItems[cat] || []).reduce((s, item) => s + (item.quantity || 0), 0));
    }, 0);

    if (totalSelectedAcross === 0) {
      alert(' Pilih item terlebih dahulu sebelum melakukan checkout!');
      return;
    }
    onCheckoutClick();
  };

  return (
    <>
      <div className="menu-items">
        {menuItems[activeTab].map((item) => (
          <div key={item.id} className="menu-item">
            <div className="item-info">
              <div className="item-name">{item.name}</div>
              <div className="item-price">Rp {item.price.toLocaleString()}</div>
            </div>
            <div className="item-actions">
              <button 
                className="quantity-btn"
                onClick={() => handleQuantityChange(item.id, -1)}
              >-</button>
              <span>{item.quantity || 0}</span>
              <button 
                className="quantity-btn"
                onClick={() => handleQuantityChange(item.id, 1)}
              >+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="menu-footer">
        <button className="edit-btn" onClick={onEditClick}>Edit Menu</button>
        <button className="checkout-btn" onClick={handleCheckout}>Checkout</button>
      </div>
    </>
  );
};

export default MenuView;
