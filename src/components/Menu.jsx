import React, { useState, useEffect } from "react";
import MenuView from "./MenuView";
import EditMenu from "./EditMenu";
import EditMenuView from "./EditMenuView";
import CheckoutView from "./CheckoutView";
import { apiService } from "../utils/api";
import "../styles/style.css";

const STORAGE_KEY = "aplikasi_kasir_menu";

const Menu = ({ onLogout, onFallbackBack }) => {
  const [activeTab, setActiveTab] = useState("KOPI");
  const [view, setView] = useState("menu"); // "menu" | "edit" | "checkout"
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [menuItems, setMenuItems] = useState({
    KOPI: [],
    "NON-KOPI": [],
    MAKANAN: [],
  });

  // buffer untuk edit (perubahan sementara, hanya commit di Save)
  const [editBuffer, setEditBuffer] = useState(null);

  // Fetch products dari API saat component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const products = await apiService.getProducts();
        
        // Kelompokkan products berdasarkan category
        const grouped = {
          KOPI: [],
          "NON-KOPI": [],
          MAKANAN: [],
        };
        
        function normalizeCategory(desc) {
          if (!desc) return 'MAKANAN';
          const s = String(desc).toUpperCase().replace(/\s+/g, ' ').trim();
          if (s.includes('NON') && s.includes('KOPI')) return 'NON-KOPI';
          if (s.includes('KOPI')) return 'KOPI';
          if (s.includes('MAKAN')) return 'MAKANAN';
          // fallback to raw uppercased value if it matches our keys
          if (['KOPI','NON-KOPI','MAKANAN'].includes(s)) return s;
          return 'MAKANAN';
        }

        if (Array.isArray(products) || Array.isArray(products.data)) {
          const productList = Array.isArray(products) ? products : products.data;
          productList.forEach(product => {
            const category = normalizeCategory(product.description || '');
            if (grouped[category]) {
              // `stock` represents inventory stored in DB; `quantity` is user's selected quantity (cart)
              grouped[category].push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                stock: product.quantity || 0,
                quantity: 0,
                description: category
              });
            }
          });
        }
        
        setMenuItems(grouped);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Gagal memuat menu dari server. Menggunakan data lokal.');
        
        // Fallback ke localStorage jika ada
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            setMenuItems(JSON.parse(raw));
          }
        } catch (e) {
          console.warn("Gagal load menu dari localStorage", e);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // helper save ke state + localStorage
  const saveMenuToStorage = (newMenu) => {
    setMenuItems(newMenu);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMenu));
    } catch (e) {
      console.warn("Gagal simpan ke localStorage", e);
    }
  };

  const handleQuantityChange = (id, delta) => {
    const updated = { 
      ...menuItems,
      [activeTab]: [...menuItems[activeTab]]  // Create new array for active category
    };
    const item = updated[activeTab].find((i) => i.id === id);
    if (item) item.quantity = Math.max(0, (item.quantity || 0) + delta);
    saveMenuToStorage(updated);  // This will also call setMenuItems
  };

  const handleDelete = async (id) => {
    try {
      // Hapus dari API
      await apiService.deleteProduct(id);
      
      // Hapus dari state - proper immutable update
      const updated = { 
        ...menuItems,
        [activeTab]: menuItems[activeTab].filter((i) => i.id !== id)
      };
      saveMenuToStorage(updated);  // This will also call setMenuItems
      alert('Produk berhasil dihapus');
    } catch (err) {
      alert('Gagal menghapus produk: ' + err.message);
    }
  };

  const handlePrintSuccess = () => {
    // Reset semua quantity ke 0 untuk semua items di semua kategori
    const resetMenu = Object.keys(menuItems).reduce((acc, category) => {
      acc[category] = menuItems[category].map(item => ({
        ...item,
        quantity: 0
      }));
      return acc;
    }, {});
    saveMenuToStorage(resetMenu);  // This will also call setMenuItems
  };

  const getTotal = () => {
    // Sum total across all categories so checkout reflects every selected item
    return Object.keys(menuItems).reduce((grandTotal, cat) => {
      const catTotal = (menuItems[cat] || []).reduce(
        (sub, i) => sub + (i.price || 0) * (i.quantity || 0),
        0
      );
      return grandTotal + catTotal;
    }, 0);
  };

  // buka mode edit tanpa menyimpan perubahan ke menu utama
  const startEdit = (withNewItem = false) => {
    const base = (menuItems[activeTab] || []).map(i => ({ ...i })); // copy
    if (withNewItem) {
      base.push({ id: -(base.length + 1), name: "Menu baru", price: 0, quantity: 0 });
    }
    setEditBuffer(base);
    setEditing(true);
    setView("edit");
  };

  // handle save dari EditMenu (commit ke menu utama dan storage)
  const handleSave = async (tab, updatedItems) => {
    try {
      const savedItems = [];

      // Detect deleted items: items that existed in the current menu but are not present in updatedItems
      const originalItems = menuItems[tab] || [];
      const originalIds = new Set(originalItems.map(i => i.id).filter(id => id > 0));
      const updatedIds = new Set((updatedItems || []).map(i => i.id).filter(id => id > 0));
      const toDelete = [...originalIds].filter(id => !updatedIds.has(id));

      // Perform deletions first so DB state matches the updated list
      for (const id of toDelete) {
        try {
          await apiService.deleteProduct(id);
          console.log(`✅ Deleted product during save: ID ${id}`);
        } catch (err) {
          console.warn(`Failed to delete product ${id} during save:`, err.message || err);
        }
      }
      
      // Basic client-side validation before API calls
      for (const item of updatedItems) {
        if (!item.name || String(item.name).trim() === '') {
          throw new Error('Semua item harus memiliki nama sebelum disimpan.');
        }
        const priceVal = Number(item.price);
        if (isNaN(priceVal) || priceVal <= 0) {
          throw new Error('Semua item harus memiliki harga yang valid (> 0).');
        }
      }

      // Update each item ke API
      for (const item of updatedItems) {
          if (item.id > 0 && item.id < 1000000000000) {
          // Item existing dengan real database ID (bukan timestamp), update
          console.log(`Updating product ${item.id}:`, item);
          try {
            const response = await apiService.updateProduct(item.id, {
              name: item.name,
              price: item.price,
              quantity: (item.stock !== undefined) ? item.stock : (item.quantity || 0),
              description: tab || '',
            });
            const updatedProduct = response?.data || response;
            savedItems.push(updatedProduct || item);
          } catch (err) {
            console.error(`Update failed for product ${item.id}:`, err);
            throw err;
          }
        } else if (item.id < 0 || item.id >= 1000000000000) {
          // Item baru (negative ID atau timestamp), create
          console.log(`Creating new product:`, item);
          try {
            const response = await apiService.createProduct({
              name: item.name,
              price: item.price,
              quantity: (item.stock !== undefined) ? item.stock : (item.quantity || 0),
              description: tab || '',
            });
            const createdProduct = response?.data || response;
            if (!createdProduct?.id) {
              throw new Error('Failed to create product: no ID returned');
            }
            console.log(`Product created with ID: ${createdProduct.id}`);
            savedItems.push(createdProduct);
          } catch (err) {
            console.error('Create product failed:', err);
            throw err;
          }
        } else {
          // Skip items with id=0
          console.warn('Skipping item with id=0:', item);
        }
      }
      
      // When saving products we want to preserve server-side stock separately
      const updated = { ...menuItems, [tab]: savedItems.map(it => ({ 
        id: it.id,
        name: it.name,
        price: parseFloat(it.price),
        stock: (it.stock !== undefined) ? it.stock : (it.quantity || 0),
        quantity: 0,
        description: it.description
      })) };
      saveMenuToStorage(updated);
      setEditing(false);
      setView("menu");
      setEditBuffer(null);
      setActiveTab(tab);
      alert("Perubahan berhasil disimpan!");
    } catch (err) {
      // Enhanced error reporting: show message, stack, and any response body
      console.error('Save error:', err);
      let details = '';
      try {
        if (err && err.message) details += err.message;
        if (err && err.stack) details += '\n' + err.stack;
        if (err && err.response) {
          try {
            const body = JSON.stringify(err.response);
            details += '\nResponse: ' + body;
          } catch (e) {
            details += '\nResponse present';
          }
        }
      } catch (e) {
        details = String(err);
      }
      alert("Gagal menyimpan perubahan: " + (details || 'Unknown error'));
    }
  };

  const handleBack = () => {
    if (onFallbackBack) onFallbackBack();
    else window.history.back();
  };

  if (loading) {
    return (
      <div className="menu-container">
        <div className="menu-content">
          <div className="menu-card">
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>Memuat menu...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-container">
      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#fff3cd', 
          color: '#856404', 
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          {error}
        </div>
      )}
      <div className="menu-content">
        <div className="menu-card">
          {view === "menu" && (
            <header className="menu-header">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>Daftar Menu</h2>
              </div>

              <ul className="menu-tabs">
                {["KOPI", "NON-KOPI", "MAKANAN"].map((tab) => (
                  <li
                    key={tab}
                    className={activeTab === tab ? "active" : ""}
                    onClick={() => {
                      if (editing) {
                        setEditing(false);
                        setEditBuffer(null);
                        setView("menu");
                      }
                      setActiveTab(tab);
                    }}
                  >
                    {tab}
                  </li>
                ))}
              </ul>
            </header>
          )}

          <div className="menu-body">
            {view === "menu" && (
              <MenuView
                menuItems={menuItems}
                activeTab={activeTab}
                handleQuantityChange={handleQuantityChange}
                onEditClick={() => startEdit(false)}
                onCheckoutClick={() => setView("checkout")}
              />
            )}

            {view === "edit" && editing ? (
              <EditMenu
                initialItems={editBuffer || menuItems[activeTab]}
                menuItems={menuItems}
                activeTab={activeTab}
                onSave={handleSave}
                onCancel={() => { setEditing(false); setView("menu"); setEditBuffer(null); }}
              />
            ) : null}

            {view === "checkout" && (
              <CheckoutView
                menuItems={menuItems}
                activeTab={activeTab}
                getTotal={getTotal}
                onBack={() => setView("menu")}
                onPrintSuccess={handlePrintSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
