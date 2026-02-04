import React, { useState } from "react";
import { apiService } from "../utils/api";

const CheckoutView = ({ menuItems, activeTab, getTotal, onBack, onPrintSuccess }) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleBack = () => {
    if (onBack) return onBack();
    if (window.history.length > 1) return window.history.back();
    window.location.href = "/";
  };

  // Kumpulkan semua item yang dipilih dari semua kategori (quantity > 0)
  const selectedItems = Object.keys(menuItems).flatMap(category =>
    (menuItems[category] || [])
      .filter(i => (i.quantity || 0) > 0)
      .map(i => ({...i, category}))
  );

  if (selectedItems.length > 0) {
    console.log('📦 CheckoutView - menuItems categories:', Object.keys(menuItems));
    console.log('📦 CheckoutView - menuItems structure:', {
      KOPI_count: menuItems.KOPI?.length || 0,
      'NON-KOPI_count': menuItems['NON-KOPI']?.length || 0,
      MAKANAN_count: menuItems.MAKANAN?.length || 0
    });
    console.log('📦 CheckoutView - menuItems.KOPI sample:', menuItems.KOPI?.[0]);
    console.log('📦 CheckoutView - menuItems[NON-KOPI] sample:', menuItems['NON-KOPI']?.[0]);
    console.log('📦 CheckoutView - menuItems.MAKANAN sample:', menuItems.MAKANAN?.[0]);
  }

  // Submit transaction to backend API
  const submitTransactionToBackend = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      if (selectedItems.length === 0) {
        throw new Error('Tidak ada item yang dipilih');
      }

      // Transform frontend items to backend format
      const transactionData = {
        payment_method: paymentMethod,
        notes: null,
        items: selectedItems.map(item => {
          // Validate item properties
          if (!item.id) throw new Error(`Item tanpa ID: ${item.name}`);
          if (typeof item.quantity !== 'number' || item.quantity <= 0) {
            throw new Error(`Item ${item.name} memiliki quantity invalid: ${item.quantity}`);
          }
          if (typeof item.price !== 'number' || item.price < 0) {
            throw new Error(`Item ${item.name} memiliki price invalid: ${item.price} (type: ${typeof item.price})`);
          }
          if (isNaN(item.price)) {
            throw new Error(`Item ${item.name} memiliki price yang NaN!`);
          }
          return {
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
          };
        })
      };

      console.log('📤 Sending transaction:', transactionData);
      console.log('� Transaction JSON:', JSON.stringify(transactionData, null, 2));
      console.log('�📌 Selected items detail:', selectedItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        stock: item.stock,
        category: item.category
      })));

      // Submit to backend
      const response = await apiService.createTransaction(transactionData);

      console.log('✅ Backend response:', response);

      if (response) {
        console.log('✅ Transaksi berhasil disimpan:', response);
        return {
          success: true,
          transactionId: response.id,
          invoiceCode: response.invoice_code,
          totalAmount: response.total_amount
        };
      } else {
        throw new Error('Respons server tidak valid');
      }
    } catch (error) {
      console.error('❌ Error submit transaction:', error);
      const errorMsg = error.message || 'Gagal menyimpan transaksi';
      setSubmitError(errorMsg);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = async () => {
    if (!selectedItems.length) return;
    
    try {
      // Submit transaction to backend first
      const transactionResult = await submitTransactionToBackend();
      
      if (!transactionResult.success) {
        alert('❌ Gagal menyimpan transaksi: ' + (submitError || 'Unknown error'));
        return;
      }
    
    // Buat item rows HTML
    const itemRowsHTML = selectedItems.map(item => 
      `<div class="item-row">
        <div>
          <div class="item-name">${item.name}</div>
        </div>
        <div class="item-qty">${item.quantity}x</div>
        <div class="item-total">Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</div>
      </div>`
    ).join('');
    
    // Buat customer info HTML
    const customerInfoHTML = customerName || customerPhone ? 
      `<div class="customer-info">
        <div class="customer-info-label">PELANGGAN:</div>
        ${customerName ? `<div class="customer-info-value">Nama: ${customerName}</div>` : ''}
        ${customerPhone ? `<div class="customer-info-value">Telepon: ${customerPhone}</div>` : ''}
      </div>` : '';
    
    // Buat notes HTML
    const notesHTML = notes ? 
      `<div class="notes-section">
        <div class="notes-label">CATATAN KHUSUS:</div>
        <div class="notes-text">${notes}</div>
      </div>` : '';
    
    // Tentukan metode pembayaran
    const paymentMethodText = paymentMethod === 'cash' ? '💵 TUNAI' : 
                              paymentMethod === 'qr' ? '📱 QR CODE' : 
                              paymentMethod === 'transfer' ? '🏦 TRANSFER' : paymentMethod.toUpperCase();
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Struk Pembelian</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              width: 80mm;
              margin: 0 auto;
              padding: 10px;
              background: white;
            }
            
            .receipt-container {
              border: 1px solid #333;
              padding: 15px;
              background: white;
            }
            
            .receipt-header {
              text-align: center;
              border-bottom: 2px dashed #333;
              padding-bottom: 15px;
              margin-bottom: 15px;
            }
            
            .shop-name {
              font-size: 24px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .shop-tagline {
              font-size: 11px;
              color: #7f8c8d;
              margin-bottom: 10px;
              font-style: italic;
            }
            
            .receipt-datetime {
              font-size: 10px;
              color: #555;
              border-top: 1px dashed #ddd;
              border-bottom: 1px dashed #ddd;
              padding: 8px 0;
              margin-bottom: 15px;
            }
            
            .customer-info {
              font-size: 11px;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px dashed #ddd;
            }
            
            .customer-info-label {
              color: #7f8c8d;
              font-size: 10px;
              font-weight: bold;
            }
            
            .customer-info-value {
              color: #2c3e50;
              margin-bottom: 4px;
            }
            
            .items-section {
              margin: 15px 0;
              border-bottom: 1px dashed #ddd;
              padding-bottom: 10px;
            }
            
            .section-title {
              font-size: 11px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 10px;
              text-transform: uppercase;
            }
            
            .item-row {
              display: grid;
              grid-template-columns: 1fr 40px 60px;
              gap: 8px;
              font-size: 11px;
              margin-bottom: 8px;
              align-items: center;
            }
            
            .item-name {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            
            .item-category {
              font-size: 9px;
              color: #95a5a6;
            }
            
            .item-qty {
              text-align: center;
              color: #7f8c8d;
            }
            
            .item-total {
              text-align: right;
              font-weight: bold;
              color: #27ae60;
            }
            
            .summary-section {
              margin-bottom: 15px;
              padding-bottom: 15px;
              border-bottom: 2px dashed #333;
            }
            
            .summary-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              margin-bottom: 6px;
              align-items: center;
            }
            
            .summary-label {
              color: #555;
            }
            
            .summary-value {
              text-align: right;
              min-width: 80px;
            }
            
            .total-row {
              font-size: 13px;
              font-weight: bold;
              color: #2c3e50;
              border-top: 1px dashed #333;
              padding-top: 8px;
            }
            
            .payment-section {
              font-size: 10px;
              margin-bottom: 15px;
              padding-bottom: 15px;
              border-bottom: 1px dashed #ddd;
            }
            
            .payment-label {
              color: #7f8c8d;
              font-weight: bold;
            }
            
            .payment-method {
              color: #2c3e50;
              font-weight: bold;
              margin-top: 3px;
            }
            
            .notes-section {
              font-size: 10px;
              margin-bottom: 15px;
              padding: 8px;
              background: #f8f9fa;
              border-left: 3px solid #6b8e74;
              border-radius: 4px;
            }
            
            .notes-label {
              color: #7f8c8d;
              font-weight: bold;
              margin-bottom: 4px;
            }
            
            .notes-text {
              color: #2c3e50;
              word-wrap: break-word;
            }
            
            .receipt-footer {
              text-align: center;
              font-size: 10px;
              color: #7f8c8d;
              padding-top: 10px;
              border-top: 1px dashed #ddd;
            }
            
            .thank-you {
              font-size: 12px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            
            @media print {
              body { margin: 0; padding: 5px; }
              .receipt-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <div class="shop-name">KOPRS.CO</div>
              <div class="shop-tagline">ngopi & rasan-rasan</div>
              <div style="font-size: 10px; color: #666; margin-top: 5px;">Invoice: ${transactionResult.invoiceCode || 'N/A'}</div>
            </div>
            
            <div class="receipt-datetime">
              <div>Tanggal: ${new Date().toLocaleDateString('id-ID')}</div>
              <div>Waktu: ${new Date().toLocaleTimeString('id-ID')}</div>
            </div>
            
            ${customerInfoHTML}
            
            <div class="items-section">
              <div class="section-title">DETAIL PESANAN</div>
              ${itemRowsHTML}
            </div>
            
            <div class="summary-section">
              <div class="summary-row">
                <span class="summary-label">Total Item:</span>
                <span class="summary-value">${selectedItems.reduce((sum, item) => sum + item.quantity, 0)} pcs</span>
              </div>
              <div class="summary-row total-row">
                <span>TOTAL PEMBAYARAN</span>
                <span>Rp ${(getTotal() || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
            
            <div class="payment-section">
              <div class="payment-label">METODE PEMBAYARAN:</div>
              <div class="payment-method">${paymentMethodText}</div>
            </div>
            
            ${notesHTML}
            
            <div class="receipt-footer">
              <div class="thank-you">Terima Kasih!</div>
              <div>Sudah berbelanja di KOPRS.CO</div>
              <div style="margin-top: 5px; font-size: 9px;">Selamat menikmati pesanan Anda</div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Buka print dialog
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);

    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMethod('cash');
    setNotes('');
    
    // Reset quantity semua items ke 0
    if (onPrintSuccess) {
      onPrintSuccess();
    }
    
    // Tampilkan notifikasi sukses
      setTimeout(() => {
        alert('✅ Struk berhasil dicetak dan disimpan!\\nInvoice: ' + transactionResult.invoiceCode);
      }, 500);
    } catch (error) {
      console.error('Print error:', error);
      console.error('Submit error state:', submitError);
      console.log('Selected Items at error:', selectedItems);
      const errorDetail = submitError || error.message || error.toString();
      alert('❌ Error: ' + errorDetail);
    }
  };

  return (
    <div className="checkout-view">
      <div className="checkout-header">
        <h3>🛒 Checkout</h3>
        <p className="checkout-subtitle">Tinjau pesanan Anda</p>
      </div>



      {selectedItems.length === 0 ? (
        <div className="empty-checkout">
          <p>📋 Belum ada item yang dipilih</p>
        </div>
      ) : (
        <div className="checkout-card">
          {/* Customer Information Section */}
          <div className="checkout-customer-section">
            <div className="section-title">👤 Informasi Pelanggan</div>
            <div className="customer-form">
              <div className="form-group">
                <label>Nama Pelanggan</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masukkan nama pelanggan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Nomor Telepon</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="Contoh: 0812345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Item List */}
          <div className="checkout-items-section" id="printable-checkout">
            <div className="section-title">Detail Pesanan</div>
            <table className="checkout-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="category-col">Kategori</th>
                  <th className="qty-col">Qty</th>
                  <th className="price-col">Harga</th>
                  <th className="total-col">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map(i => (
                  <tr key={i.id}>
                    <td className="item-name">{i.name}</td>
                    <td className="category-col">{i.category}</td>
                    <td className="qty-col">{i.quantity || 0}</td>
                    <td className="price-col">Rp {(i.price || 0).toLocaleString("id-ID")}</td>
                    <td className="total-col">Rp {((i.price || 0) * (i.quantity || 0)).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes Section */}
          <div className="checkout-notes-section">
            <div className="section-title">Catatan Pesanan</div>
            <textarea
              className="notes-input"
              placeholder="Tambahkan catatan khusus (misal: tanpa gula, pedas, dll)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
            />
          </div>

          {/* Payment Method Section */}
          <div className="checkout-payment-section">
            <div className="section-title">Metode Pembayaran</div>
            <div className="payment-methods">
              <label className={`payment-option ${paymentMethod === 'cash' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="payment-label">💵 Tunai</span>
              </label>
              <label className={`payment-option ${paymentMethod === 'qr' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="qr"
                  checked={paymentMethod === 'qr'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="payment-label">📱 QR Code</span>
              </label>
              <label className={`payment-option ${paymentMethod === 'transfer' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="transfer"
                  checked={paymentMethod === 'transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="payment-label">🏦 Transfer</span>
              </label>
            </div>
          </div>

          {/* Summary Section */}
          <div className="checkout-summary-section">
            <div className="summary-row">
              <span>Total Item:</span>
              <span>{selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="summary-row total">
              <span>TOTAL PEMBAYARAN</span>
              <span className="amount">Rp {(getTotal() || 0).toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Print version only - catatan */}
          {notes && (
            <div className="notes-display no-print" style={{ marginTop: "12px" }}>
              <strong>Catatan:</strong> {notes}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div style={{background: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #f5c6cb'}}>
          ❌ {submitError}
        </div>
      )}

      {/* Action Buttons */}
      <div className="checkout-actions">
        <button
          className="btn-back checkout-back-button"
          onClick={handleBack}
          disabled={isSubmitting}
          aria-label="Kembali ke menu"
          title="Kembali ke menu"
        >
          Kembali
        </button>
        <button
          className="btn-checkout print-btn"
          onClick={handlePrint}
          disabled={!selectedItems.length || isSubmitting}
          aria-disabled={selectedItems.length === 0 || isSubmitting}
          title={selectedItems.length ? "Cetak & Simpan transaksi" : "Tidak ada item untuk dicetak"}
        >
          {isSubmitting ? '⏳ Menyimpan...' : 'Cetak & Simpan'}
        </button>
      </div>
    </div>
  );
};

export default CheckoutView;