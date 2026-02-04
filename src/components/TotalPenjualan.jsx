import React, { useState, useEffect } from 'react';
import { apiService } from '../utils/api';

const TotalPenjualan = ({ onBack }) => {
  const [salesData, setSalesData] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load data dari localStorage (simulasi database)
  useEffect(() => {
    loadSalesData();
  }, [selectedDate]);

  const loadSalesData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load from API
      const report = await apiService.getDailyReport(selectedDate);

      console.log('📊 Report API response:', report);

      if (report) {
        // API returns: { date, total_sales, transaction_count, items: [...] }
        setTotalAmount(parseFloat(report.total_sales) || 0);
        
        // Transform items to display format
        if (report.items && report.items.length > 0) {
          const formattedItems = report.items.map((item, idx) => ({
            id: item.id,
            no: idx + 1,
            product: item.product_name,
            quantity: item.quantity,
            price: parseFloat(item.unit_price) || 0,
            subtotal: parseFloat(item.subtotal) || 0,
            paymentMethod: item.payment_method,
            time: item.transaction_time
          }));
          setSalesData(formattedItems);
          console.log(`✅ Total sales untuk ${selectedDate}: ${report.total_sales}, Items: ${formattedItems.length}`);
        } else {
          setSalesData([]);
          console.log(`✅ Total sales untuk ${selectedDate}: ${report.total_sales}, No items`);
        }
      } else {
        // No data for this date
        setSalesData([]);
        setTotalAmount(0);
      }
    } catch (error) {
      console.error('❌ Error loading report from API:', error);
      
      // Show user-friendly error message
      if (error.message.includes('Connect')) {
        setError('Gagal terhubung ke server. Pastikan backend sudah berjalan.');
      } else {
        setError('Gagal memuat laporan: ' + (error.message || 'Unknown error'));
      }
      
      // Fallback: try localStorage
      try {
        console.log('⚠️  Fallback ke localStorage...');
        const STORAGE_KEY = 'aplikasi_kasir_sales';
        const allSales = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const filteredSales = allSales.filter(sale => sale.date === selectedDate);
        setSalesData(filteredSales);
        const total = filteredSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
        setTotalAmount(isNaN(total) ? 0 : total);
      } catch (e) {
        console.error('❌ Fallback juga gagal:', e);
        setSalesData([]);
        setTotalAmount(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveSalesToDatabase = (data) => {
    const STORAGE_KEY = 'aplikasi_kasir_sales';
    const allSales = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    allSales.push(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSales));
  };

  const handlePrint = () => {
    // Siapkan data untuk dicetak
    const printContent = `
      <html>
        <head>
          <title>Laporan Penjualan ${selectedDate}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h2 { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total-row { font-weight: bold; font-size: 16px; background-color: #f9f9f9; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>LAPORAN PENJUALAN HARIAN</h2>
            <p>Tanggal: ${new Date(selectedDate).toLocaleDateString('id-ID')}</p>
            <p>KOPRS.CO</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Harga Satuan</th>
                <th>Metode</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${salesData.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.product}</td>
                  <td style="text-align:center">${item.quantity}</td>
                  <td style="text-align:right">Rp ${Number(item.price || 0).toLocaleString('id-ID')}</td>
                  <td style="text-align:center">${item.paymentMethod === 'cash' ? 'Tunai' : item.paymentMethod === 'qr' ? 'QR Code' : item.paymentMethod === 'transfer' ? 'Transfer' : (item.paymentMethod || '-')}</td>
                  <td style="text-align:right">Rp ${Number(item.subtotal || 0).toLocaleString('id-ID')}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5">TOTAL PENJUALAN</td>
                <td>Rp ${totalAmount.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
          </div>
        </body>
      </html>
    `;

    // Simpan ke database sebelum cetak
    const reportData = {
      date: selectedDate,
      items: salesData,
      totalAmount: totalAmount,
      printedAt: new Date().toISOString(),
      type: 'daily_report'
    };
    saveSalesToDatabase(reportData);

    // Cetak
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="sales-page">
      <div className="sales-container">
        {/* Header */}
        <div style={{background: 'linear-gradient(135deg, rgb(90 227 89) 0%, rgb(46 104 12) 100%)', color: 'white', padding: '30px 20px', textAlign: 'center'}}>
          <h2 style={{margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold'}}>📊 TOTAL PENJUALAN</h2>
          <p style={{margin: '0', fontSize: '14px', opacity: 0.9}}>Rekap Penjualan Harian</p>
        </div>

        {/* Filters */}
        <div style={{padding: '20px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'}}>
          <label style={{fontWeight: '600', color: '#333', margin: '0'}}>Pilih Tanggal:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px'}}
          />
          <button 
            onClick={handleToday}
            style={{padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px'}}
          >
            Hari Ini
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{padding: '20px', background: '#f8d7da', color: '#721c24', borderBottom: '1px solid #f5c6cb', margin: '0'}}>
            <strong>⚠️  Error:</strong> {error}
          </div>
        )}

        {/* Content */}
        <div style={{padding: '20px', minHeight: '300px'}}>
          {isLoading ? (
            <div style={{textAlign: 'center', padding: '40px 20px', color: '#666'}}>
              <p>⏳ Loading data dari server...</p>
            </div>
          ) : salesData.length === 0 ? (
            <div style={{textAlign: 'center', padding: '40px 20px', color: '#999'}}>
              <p style={{fontSize: '16px', margin: '0 0 10px 0'}}>📋 Tidak ada data penjualan untuk tanggal ini</p>
              <p style={{fontSize: '12px', color: '#bbb', margin: '0'}}>Tanggal: {new Date(selectedDate).toLocaleDateString('id-ID')}</p>
            </div>
          ) : (
            <div>
              <div style={{overflowX: 'auto', marginBottom: '20px'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}>
                  <thead>
                    <tr>
                      <th style={{background: '#f8f9fa', padding: '12px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #ddd', color: '#333'}}>No</th>
                      <th style={{background: '#f8f9fa', padding: '12px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #ddd', color: '#333'}}>Barang</th>
                      <th style={{background: '#f8f9fa', padding: '12px', textAlign: 'center', fontWeight: '600', borderBottom: '2px solid #ddd', color: '#333'}}>Qty</th>
                      <th style={{background: '#f8f9fa', padding: '12px', textAlign: 'right', fontWeight: '600', borderBottom: '2px solid #ddd', color: '#333'}}>Harga Satuan</th>
                      <th style={{background: '#f8f9fa', padding: '12px', textAlign: 'right', fontWeight: '600', borderBottom: '2px solid #ddd', color: '#333'}}>Total</th>
                      <th style={{background: '#f8f9fa', padding: '12px', textAlign: 'center', fontWeight: '600', borderBottom: '2px solid #ddd', color: '#333'}}>Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.map((item) => (
                      <tr key={item.id} style={{borderBottom: '1px solid #eee'}}>
                        <td style={{padding: '12px', color: '#555'}}>{item.no}</td>
                        <td style={{padding: '12px', color: '#555', fontWeight: '500'}}>{item.product}</td>
                        <td style={{padding: '12px', color: '#555', textAlign: 'center'}}>{item.quantity}</td>
                        <td style={{padding: '12px', color: '#555', textAlign: 'right'}}>Rp {(item.price || 0).toLocaleString('id-ID')}</td>
                        <td style={{padding: '12px', color: '#555', textAlign: 'center'}}>{item.paymentMethod === 'cash' ? '💵 Tunai' : item.paymentMethod === 'qr' ? '📱 QR Code' : item.paymentMethod === 'transfer' ? '🏦 Transfer' : (item.paymentMethod || '-')}</td>
                        <td style={{padding: '12px', color: '#667eea', fontWeight: '600', textAlign: 'right'}}>Rp {(item.subtotal || 0).toLocaleString('id-ID')}</td>
                        <td style={{padding: '12px', color: '#999', textAlign: 'center', fontSize: '13px'}}>{item.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div style={{background: '#f8f9fa', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #667eea'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e9ecef'}}>
                  <span style={{color: '#555', fontWeight: '500'}}>Total Item Terjual:</span>
                  <span style={{color: '#333', fontWeight: '600'}}>{salesData.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e9ecef'}}>
                  <span style={{color: '#555', fontWeight: '500'}}>Jumlah Item Berbeda:</span>
                  <span style={{color: '#333', fontWeight: '600'}}>{salesData.length}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '15px 0', fontSize: '18px', fontWeight: 'bold', color: '#764ba2', borderTop: '2px solid #667eea', marginTop: '10px'}}>
                  <span>TOTAL PENJUALAN:</span>
                  <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{padding: '20px', background: '#f8f9fa', borderTop: '1px solid #e9ecef', display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
          <button 
            onClick={handlePrint}
            style={{padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px'}}
          >
            🖨️ Cetak & Simpan
          </button>
          <button 
            onClick={onBack}
            style={{padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px'}}
          >
            ← Kembali
          </button>
        </div>
      </div>
    </div>
  );
};

export default TotalPenjualan;
