#  Sony Audio E-commerce Store

A complete full-stack e-commerce website for Sony audio products with Razorpay UPI payment integration.

## Features

### Frontend (React)
- Product browsing with search and filters
- Shopping cart functionality
- User authentication (login/register)
- Secure checkout with UPI payments only
- Admin dashboard for product management
- Responsive design with Tailwind CSS

### Backend (Flask)
- RESTful API with JWT authentication
- SQLite database with normalized schema
- Razorpay payment integration
- Admin role-based access control
- Order management system

## Setup Instructions

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

3. **Initialize database and seed data:**
   ```bash
   python seed_data.py
   ```

4. **Run the Flask server:**
   ```bash
   python app.py
   ```
   Server will run on http://localhost:5000

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Update Razorpay key:**
   Replace 'rzp_test_key' in `src/pages/Checkout.jsx` with your actual Razorpay key ID.

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:5173

## Environment Variables

### Required for Backend:
- `RAZORPAY_KEY_ID`: Your Razorpay key ID
- `RAZORPAY_KEY_SECRET`: Your Razorpay key secret

### Required for Frontend:
- Update the Razorpay key in Checkout component

## Admin Access

- **Email:** admin@sony.com
- **Password:** admin123

## Payment Integration

The application uses Razorpay for UPI payments:
- Only UPI payments are allowed
- Payment verification with webhooks
- Secure order completion flow

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Add product (admin only)

### Orders
- `POST /api/orders/create` - Create Razorpay order
- `POST /api/orders/verify` - Verify payment

### Admin
- `GET /api/admin/stats` - Get dashboard statistics

## Database Schema

### Users Table
- id (Primary Key)
- name, email, password
- role (customer/admin)
- created_at

### Products Table
- id (Primary Key)
- name, category, price
- image, rating, reviews
- description, specs, stock

### Orders Table
- id (Primary Key)
- user_id (Foreign Key)
- total, status, address
- razorpay_order_id, razorpay_payment_id
- created_at

### Order Items Table
- id (Primary Key)
- order_id, product_id (Foreign Keys)
- quantity, price

## Security Features

- JWT token-based authentication
- Password hashing with SHA-256
- Razorpay signature verification
- Protected admin routes
- Input validation and sanitization

## Technology Stack

- **Frontend:** React, React Router, Tailwind CSS, Axios
- **Backend:** Flask, SQLite, Razorpay
- **Authentication:** JWT tokens
- **Payment:** Razorpay UPI integration
 