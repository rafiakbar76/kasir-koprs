# Kasir Backend - Panduan Setup

## 📋 Persyaratan

- Node.js 16+
- PostgreSQL 12+
- npm atau yarn

## 🚀 Instalasi

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment Variables
Buat file `.env` di folder `backend/`:

```env
# Server
PORT=8000
NODE_ENV=development

# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kasir_db

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production-12345
```

### 3. Buat Database PostgreSQL
```bash
createdb kasir_db
```

Atau melalui pgAdmin:
1. Buat database baru dengan nama `kasir_db`
2. Sesuaikan username dan password di `.env`

### 4. Run Server
```bash
# Development dengan auto-reload
npm run dev

# Production
npm start
```

Server akan berjalan di `http://localhost:8000`

---

## 🏗️ Struktur Project

```
backend/
├── server.js              # Main server file (current)
├── server-v2.js           # Improved server (recommended)
├── database.js            # Database connection (current)
├── database-v2.js         # Improved database (recommended)
├── middleware/
│   ├── errorHandler.js    # Error handling & custom errors
│   ├── rateLimiter.js     # Rate limiting configuration
│   └── validation.js      # Input validation schemas
├── init_db.sql            # Initial SQL commands
├── package.json
├── .env
└── API_DOCUMENTATION.md
```

---

## 🔄 Cara Upgrade ke Versi Baru

### Opsi 1: Langsung (Recommended)
```bash
# Backup file lama
mv server.js server-old.js
mv database.js database-old.js

# Gunakan file baru
mv server-v2.js server.js
mv database-v2.js database.js

# Install new dependencies
npm install
```

### Opsi 2: Gradual
Edit `server.js` dan tambahkan middleware secara bertahap dari `server-v2.js`

---

## 📚 Fitur Baru di V2

### ✨ Improvements

1. **Better Error Handling**
   - Custom `AppError` class
   - Consistent error response format
   - Async wrapper untuk error catching

2. **Rate Limiting**
   - General: 100 req/15 min
   - Auth: 5 req/15 min
   - API: 30 req/min

3. **Database Improvements**
   - Better connection pooling
   - Transaction support
   - Indexes untuk performance
   - Soft delete untuk products

4. **New Endpoints**
   - `GET /auth/me` - Get current user
   - `GET /reports/daily` - Daily sales report
   - `GET /reports/monthly` - Monthly sales report

5. **Better Response Format**
   ```json
   {
     "success": true,
     "data": {...},
     "message": "Success message",
     "timestamp": "2024-01-27T10:30:00.000Z"
   }
   ```

6. **Logging**
   - Request logging
   - Error logging dengan detail
   - Transaction logging

7. **Database Schema Updates**
   - New `transaction_items` table
   - New `reports` table
   - Added `is_active` column untuk products
   - Added indexes untuk performance

---

## 🧪 Testing Endpoints

### Using cURL

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"test123","password_confirmation":"test123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"test123"}'

# Get Products (ganti TOKEN dengan token dari login)
curl -X GET http://localhost:8000/api/products \
  -H "Authorization: Bearer TOKEN"

# Create Product
curl -X POST http://localhost:8000/api/products \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Kopi","price":15000,"quantity":50}'
```

### Using Postman/Insomnia
- Import API documentation dari `API_DOCUMENTATION.md`
- Set environment variable `{{BASE_URL}}` = `http://localhost:8000/api`
- Set environment variable `{{TOKEN}}` = token dari login

---

## 🔐 Production Deployment

### Vercel Deployment

1. **Setup Environment Variables di Vercel:**
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `JWT_SECRET` (generate baru)
   - `NODE_ENV=production`

2. **Pastikan PostgreSQL Database Accessible**
   - Database harus bisa diakses dari internet (atau gunakan managed database service)
   - Atau deploy dengan database service terpisah (AWS RDS, Railway, etc)

3. **vercel.json Configuration**
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "server.js", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/(.*)", "dest": "/server.js" }
     ]
   }
   ```

4. **Deploy**
   ```bash
   git push
   ```

---

## 🐛 Troubleshooting

### Error: `connect ECONNREFUSED 127.0.0.1:5432`
- PostgreSQL tidak running
- Check `.env` configuration
- Pastikan DB_HOST, DB_PORT, DB_NAME sesuai

### Error: `password authentication failed`
- Check DB_USER dan DB_PASSWORD di `.env`
- Verify user PostgreSQL credentials

### Error: `EADDRINUSE: address already in use :::8000`
- Port 8000 sudah digunakan
- Ubah PORT di `.env` atau kill process:
  ```bash
  lsof -i :8000
  kill -9 <PID>
  ```

### Rate limit error
- Reset menggunakan VPN/proxy beda IP
- Atau tunggu 15 menit

---

## 📖 Dokumentasi API

Lihat [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) untuk lengkap endpoint reference.

---

## 🤝 Contributing

Issues dan improvements welcome!

---

## 📄 License

MIT
