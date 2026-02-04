# API Dokumentasi - Aplikasi Kasir

## BASE URL
```
http://localhost:8000/api
https://aplikasi-kasir-backend.vercel.app/api
```

## Autentikasi
Semua endpoint (kecuali `/auth/register` dan `/auth/login`) memerlukan token JWT di header:
```
Authorization: Bearer <token>
```

## Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2024-01-27T10:30:00.000Z"
}
```

---

## Auth Endpoints

### POST /auth/register
Registrasi user baru

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "message": "Registration successful"
}
```

### POST /auth/login
Login user

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "message": "Login successful"
}
```

### GET /auth/me
Get current user info

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## Product Endpoints

### GET /products
Get all products

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "name": "Kopi Arabika",
      "price": "15000.00",
      "quantity": 50,
      "description": "Kopi pilihan berkualitas tinggi",
      "is_active": true,
      "created_at": "2024-01-27T10:00:00.000Z",
      "updated_at": "2024-01-27T10:00:00.000Z"
    }
  ]
}
```

### GET /products/:id
Get single product

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "name": "Kopi Arabika",
    "price": "15000.00",
    "quantity": 50,
    "description": "Kopi pilihan berkualitas tinggi",
    "is_active": true,
    "created_at": "2024-01-27T10:00:00.000Z",
    "updated_at": "2024-01-27T10:00:00.000Z"
  }
}
```

### POST /products
Create product

**Request:**
```json
{
  "name": "Kopi Arabika",
  "price": 15000,
  "quantity": 50,
  "description": "Kopi pilihan berkualitas tinggi"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "name": "Kopi Arabika",
    "price": "15000.00",
    "quantity": 50,
    "description": "Kopi pilihan berkualitas tinggi",
    "is_active": true,
    "created_at": "2024-01-27T10:00:00.000Z",
    "updated_at": "2024-01-27T10:00:00.000Z"
  },
  "message": "Product created successfully"
}
```

### PUT /products/:id
Update product

**Request:**
```json
{
  "name": "Kopi Arabika Premium",
  "price": 18000,
  "quantity": 45
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "name": "Kopi Arabika Premium",
    "price": "18000.00",
    "quantity": 45,
    "description": "Kopi pilihan berkualitas tinggi",
    "is_active": true,
    "created_at": "2024-01-27T10:00:00.000Z",
    "updated_at": "2024-01-27T10:30:00.000Z"
  },
  "message": "Product updated successfully"
}
```

### DELETE /products/:id
Delete product (soft delete)

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Product deleted successfully"
}
```

---

## Transaction Endpoints

### GET /transactions
Get all transactions

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "total_amount": "45000.00",
      "payment_method": "cash",
      "notes": null,
      "items": [
        {
          "product_id": 1,
          "quantity": 3,
          "price": "15000.00"
        }
      ],
      "created_at": "2024-01-27T10:00:00.000Z",
      "updated_at": "2024-01-27T10:00:00.000Z"
    }
  ]
}
```

### POST /transactions
Create transaction

**Request:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 3,
      "price": 15000
    },
    {
      "product_id": 2,
      "quantity": 2,
      "price": 20000
    }
  ],
  "payment_method": "cash",
  "notes": "Penjualan di cafe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "total_amount": "85000.00"
  },
  "message": "Transaction created successfully"
}
```

---

## Report Endpoints

### GET /reports/daily
Get today's sales report

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_transactions": 5,
    "total_revenue": "250000.00"
  }
}
```

### GET /reports/monthly
Get monthly sales report (last 12 months)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "total_transactions": 42,
      "total_revenue": "1500000.00"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "code": "VALIDATION_ERROR",
    "timestamp": "2024-01-27T10:30:00.000Z"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired token",
    "code": "INVALID_TOKEN",
    "timestamp": "2024-01-27T10:30:00.000Z"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Product not found",
    "code": "PRODUCT_NOT_FOUND",
    "timestamp": "2024-01-27T10:30:00.000Z"
  }
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "message": "Terlalu banyak request dari IP ini, silahkan coba lagi nanti",
    "code": "RATE_LIMIT",
    "timestamp": "2024-01-27T10:30:00.000Z"
  }
}
```

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Auth Endpoints**: 5 requests per 15 minutes
- **Product Endpoints**: 30 requests per minute

## Security Features

- ✅ Rate limiting on all endpoints
- ✅ Password hashing with bcryptjs
- ✅ JWT token authentication
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ Soft delete for products
- ✅ Database transactions for data consistency
- ✅ Comprehensive error handling
- ✅ Request logging
