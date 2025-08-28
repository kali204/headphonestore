#  ShopEase - Full-Stack eCommerce Platform

A modern, production-ready eCommerce platform built with React + Vite frontend and Flask backend.

## Features

### Frontend (React + Vite)
- Responsive design with Tailwind CSS
- Product catalog with search and filtering
- Shopping cart functionality
- User authentication and account management
- Checkout process with Razorpay integration
- Admin panel for product and order management

### Backend (Flask)
- RESTful API architecture
- JWT authentication
- MySQL database with SQLAlchemy ORM
- Razorpay payment gateway integration
- Role-based access control (User/Admin)
- Comprehensive error handling

### Admin Features
- Product management (CRUD operations)
- Order management and status updates
- Sales analytics dashboard
- Site settings configuration
- User management

## Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Lucide React Icons

**Backend:**
- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- MySQL
- Razorpay

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.8+)
- MySQL Server

### Database Setup
1. Install MySQL and create database:
```sql
CREATE DATABASE ecommerce_db;
```

2. Run the setup script:
```bash
mysql -u root -p ecommerce_db < backend/setup_db.sql
```

### Backend Setup
1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Update database configuration in `app.py`:
```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://username:password@localhost/ecommerce_db'
```

5. Add your Razorpay credentials:
```python
razorpay_client = razorpay.Client(auth=("your_key", "your_secret"))
```

6. Run the Flask application:
```bash
python app.py
```

### Frontend Setup
1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

## Default Admin Credentials
- Email: admin@shopease.com
- Password: admin123

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user

### Products
- GET `/api/products` - Get all products
- GET `/api/products/:id` - Get product by ID
- POST `/api/products` - Create product (Admin)
- PUT `/api/products/:id` - Update product (Admin)
- DELETE `/api/products/:id` - Delete product (Admin)

### Orders
- POST `/api/orders` - Create order
- POST `/api/orders/verify-payment` - Verify Razorpay payment
- GET `/api/orders/user` - Get user orders

### Admin
- GET `/api/admin/stats` - Get dashboard stats
- GET `/api/admin/orders` - Get all orders
- PUT `/api/admin/orders/:id/status` - Update order status
- GET `/api/admin/analytics` - Get analytics data

## User Roles

### Customer
- Browse and search products
- Add items to cart
- Place orders with payment
- Track order status
- Manage account and addresses

### Admin
- All customer permissions
- Manage products (add, edit, delete)
- View and update order status
- Access analytics dashboard
- Configure site settings
- Manage delivery addresses

## Payment Integration

The platform integrates with Razorpay for secure payment processing:
- Test mode configuration included
- Automatic order verification
- Payment status tracking
- Refund support (backend ready)

## Security Features

- JWT-based authentication
- Password hashing with Werkzeug
- SQL injection protection via SQLAlchemy ORM
- CORS configuration
- Role-based access control
- Payment signature verification

## Production Deployment

1. Update configuration for production:
   - Change JWT secret key
   - Use production database
   - Set Razorpay live credentials
   - Configure proper CORS origins

2. Build frontend:
```bash
npm run build
```

3. Deploy backend with production WSGI server (e.g., Gunicorn)
4. Use environment variables for sensitive configuration

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

This project is licensed under the MIT License.
 