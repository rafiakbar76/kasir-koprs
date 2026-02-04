// API Service untuk komunikasi dengan backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  // Set token setelah login
  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Hapus token saat logout
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Tambahkan token ke header jika ada
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      console.log(`📤 ${options.method || 'GET'} ${url}`);
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Jika response tidak OK, cek apakah token expired
      if (!response.ok) {
        console.error(`❌ HTTP ${response.status} ${response.statusText} - ${url}`);
        if (response.status === 401) {
          this.clearToken();
          window.location.href = '/'; // Redirect ke login
        }
        try {
          const error = await response.json();
          console.error('API Response Error:', error);
          console.error('API Error details:', JSON.stringify(error, null, 2));
          throw new Error(error.message || error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        } catch (parseError) {
          console.error('API Response Parse Error:', parseError);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      console.log(`✅ ${response.status} OK`);
      return await response.json();
    } catch (error) {
      console.error('API Error Detail:', error.message);
      throw error;
    }
  }

  // === AUTHENTICATION ===
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.data?.token) {
      this.setToken(data.data.token);
    }
    return data.data;
  }

  async register(userData) {
    // Jika backend memiliki endpoint register
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.data?.token) {
      this.setToken(data.data.token);
    }
    return data.data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // === PRODUCTS ===
  async getProducts() {
    const response = await this.request('/products');
    return response.data || response;
  }

  async getProduct(id) {
    const response = await this.request(`/products/${id}`);
    return response.data || response;
  }

  async createProduct(productData) {
    const response = await this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    return response.data || response;
  }

  async updateProduct(id, productData) {
    const response = await this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    return response.data || response;
  }

  async deleteProduct(id) {
    const response = await this.request(`/products/${id}`, {
      method: 'DELETE',
    });
    return response.data || response;
  }

  // === TRANSACTIONS ===
  async getTransactions() {
    const response = await this.request('/transactions');
    return response.data || response;
  }

  async getTransaction(id) {
    const response = await this.request(`/transaction/${id}`);
    return response.data || response;
  }

  async createTransaction(transactionData) {
    const response = await this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
    return response.data || response;
  }

  async deleteTransaction(id) {
    const response = await this.request(`/transaction/${id}`, {
      method: 'DELETE',
    });
    return response.data || response;
  }

  // === TRANSACTION DETAILS ===
  async getTransactionDetails(transactionId) {
    const response = await this.request(`/transaction/${transactionId}/details`);
    return response.data || response;
  }

  async addTransactionDetail(transactionId, detailData) {
    const response = await this.request(`/transaction/${transactionId}/details`, {
      method: 'POST',
      body: JSON.stringify(detailData),
    });
    return response.data || response;
  }

  async updateTransactionDetail(id, detailData) {
    const response = await this.request(`/transaction-detail/${id}`, {
      method: 'PUT',
      body: JSON.stringify(detailData),
    });
    return response.data || response;
  }

  async deleteTransactionDetail(id) {
    const response = await this.request(`/transaction-detail/${id}`, {
      method: 'DELETE',
    });
    return response.data || response;
  }

  // === REPORTS ===
  async getDailyReport(date) {
    const today = date || new Date().toISOString().split('T')[0];
    const response = await this.request(`/reports/daily?date=${today}`);
    return response.data || response;
  }

  async getMonthlyReport() {
    const response = await this.request('/reports/monthly');
    return response.data || response;
  }

  async getSalesReport(date) {
    const response = await this.request(`/reports/sales?date=${date}`);
    return response.data || response;
  }

  async exportDailyReport() {
    const response = await this.request('/reports/daily/export');
    return response.data || response;
  }

  async exportMonthlyReport() {
    const response = await this.request('/reports/monthly/export');
    return response.data || response;
  }
}

// Export singleton instance
export const apiService = new ApiService();
