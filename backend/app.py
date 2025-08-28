from  flask import Flask, request, jsonify , send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import razorpay
import os
from datetime import datetime, timedelta
import hmac
import hashlib

app = Flask(__name__, static_folder="dist", static_url_path="")
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    requested_path = os.path.join(app.static_folder, path)
    
    if path != "" and os.path.exists(requested_path):
        return send_from_directory(app.static_folder, path)
    else:
        # For React Router: serve index.html for all other routes
        return send_from_directory(app.static_folder, "index.html")
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:1947@localhost/ecommerce_db'
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# Razorpay Configuration
razorpay_client = razorpay.Client(auth=("rzp_test_RAe9hgfWZn0DQ5", "IUhKwWY6B846Ul6UnAVPdSin"))

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    image = db.Column(db.String(500))
    stock = db.Column(db.Integer, default=0)
    featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')
    razorpay_order_id = db.Column(db.String(100))
    razorpay_payment_id = db.Column(db.String(100))
    shipping_address = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


    def to_dict(self):
        user = User.query.get(self.user_id)
        items = OrderItem.query.filter_by(order_id=self.id).all()

        return {
            'id': self.id,
            'customer': {
                'name': user.name if user else None,
                'email': user.email if user else None
            },
            'shippingAddress': self.shipping_address,
            'items': [
                {
                    'productId': item.product_id,
                    'quantity': item.quantity,
                    'price': item.price
                } for item in items
            ],
            'totalAmount': self.total_amount,
            'status': self.status,
            'razorpayOrderId': self.razorpay_order_id,
            'razorpayPaymentId': self.razorpay_payment_id,
            'createdAt': self.created_at.isoformat()
        }
    

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

class Address(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    label = db.Column(db.String(50))
    address = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    zip_code = db.Column(db.String(20), nullable=False)
class Settings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    site_name = db.Column(db.String(100), default='ShopEase')
    site_description = db.Column(db.String(255), default='Modern eCommerce Platform')
    currency = db.Column(db.String(10), default='USD')
    tax_rate = db.Column(db.Float, default=10.0)
    shipping_rate = db.Column(db.Float, default=5.99)
    free_shipping_threshold = db.Column(db.Float, default=50.0)
    contact_email = db.Column(db.String(120), default='support@shopease.com')
    contact_phone = db.Column(db.String(50), default='+1-234-567-8900')
    address = db.Column(db.String(255), default='123 Main St, City, State 12345')
    # Add location-based delivery options
    locations = db.Column(db.JSON, default=[])  # [{"city": "CityName", "delivery_charge": 5.99}]



# Auth Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    user = User(
        name=data['name'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'])
    )
    db.session.add(user)
    db.session.commit()
    
    token = create_access_token(identity=user.id)
    return jsonify({
        'token': token,
        'user': {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role}
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        token = create_access_token(identity=str(user.id))
        return jsonify({
            'token': token,
            'user': {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role}
        })
    
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return jsonify({'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role})

# Product Routes
@app.route('/api/products', methods=['GET'])
def get_products():
    featured = request.args.get('featured') == 'true'
    limit = request.args.get('limit', type=int)
    
    query = Product.query
    if featured:
        query = query.filter_by(featured=True)
    if limit:
        query = query.limit(limit)
    
    products = query.all()
    return jsonify([{
        'id': p.id, 'name': p.name, 'description': p.description,
        'price': p.price, 'category': p.category, 'image': p.image,
        'stock': p.stock, 'featured': p.featured
    } for p in products])

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify({
        'id': product.id, 'name': product.name, 'description': product.description,
        'price': product.price, 'category': product.category, 'image': product.image,
        'stock': product.stock, 'featured': product.featured
    })
@app.route('/api/products', methods=['POST'])
@jwt_required()
def create_product():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    data = request.get_json()
    print("Received data:", data)  # LOG DATA
    
    if not data:
        return jsonify({'message': 'No input data provided'}), 400

    required_fields = ['name', 'price', 'category', 'stock']
    for field in required_fields:
        if field not in data or data[field] in [None, '']:
            return jsonify({'message': f'{field} is required'}), 422

    product = Product(
        name=data['name'],
        description=data.get('description', ''),
        price=float(data['price']),
        category=data['category'],
        image=data.get('image', ''),
        stock=int(data['stock']),
        featured=data.get('featured', False)
    )
    db.session.add(product)
    db.session.commit()
    
    return jsonify({'message': 'Product created successfully'}), 201




@app.route('/api/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    product = Product.query.get_or_404(product_id)
    data = request.get_json()
    
    product.name = data['name']
    product.description = data['description']
    product.price = float(data['price'])
    product.category = data['category']
    product.image = data.get('image')
    product.stock = int(data['stock'])
    product.featured = data.get('featured', False)
    
    db.session.commit()
    return jsonify({'message': 'Product updated successfully'})

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    
    return jsonify({'message': 'Product deleted successfully'})

# Order Routes
# ---------------- Create Order ----------------
@app.route('/api/orders', methods=['POST'])
@jwt_required()
def create_order():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        if not data or 'totalAmount' not in data or 'items' not in data:
            return jsonify({'message': 'Invalid request data'}), 400

        # Create Razorpay order
        razorpay_order = razorpay_client.order.create({
            'amount': int(float(data['totalAmount']) * 100),  # amount in paise
            'currency': 'INR',
            'payment_capture': 1
        })

        # Create order in DB
        order = Order(
            user_id=user_id,
            total_amount=float(data['totalAmount']),
            razorpay_order_id=razorpay_order['id'],
            shipping_address=data.get('shippingAddress', '')
        )
        db.session.add(order)
        db.session.flush()  # To get order.id before commit

        # Add order items
        for item in data['items']:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item['id'],
                quantity=item['quantity'],
                price=item['price']
            )
            db.session.add(order_item)

        db.session.commit()

        return jsonify({
            'orderId': order.id,
            'razorpayOrderId': razorpay_order['id']
        })

    except Exception as e:
        return jsonify({'message': 'Order creation failed', 'error': str(e)}), 500

# ---------------- Verify Payment ----------------
@app.route('/api/orders/verify-payment', methods=['POST'])
@jwt_required()
def verify_payment():
    try:
        data = request.get_json()
        required_fields = ['razorpayOrderId', 'razorpayPaymentId', 'razorpaySignature', 'orderId']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Missing required fields'}), 400

        # Compute HMAC signature
        secret = "rzp_test_YourSecret"  # Your Razorpay Secret Key
        generated_signature = hmac.new(
            secret.encode(),
            f"{data['razorpayOrderId']}|{data['razorpayPaymentId']}".encode(),
            hashlib.sha256
        ).hexdigest()

        if generated_signature != data['razorpaySignature']:
            return jsonify({'message': 'Payment verification failed'}), 400

        # Update order status
        order = Order.query.get(data['orderId'])
        if not order:
            return jsonify({'message': 'Order not found'}), 404

        order.status = 'processing'
        order.razorpay_payment_id = data['razorpayPaymentId']
        db.session.commit()

        return jsonify({'message': 'Payment verified successfully'})

    except Exception as e:
        return jsonify({'message': 'Payment verification failed', 'error': str(e)}), 500

# ---------------- Get User Orders ----------------
@app.route('/api/orders/user', methods=['GET'])
@jwt_required()
def get_user_orders():
    try:
        user_id = get_jwt_identity()
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        return jsonify([{
            'id': o.id,
            'totalAmount': o.total_amount,
            'status': o.status,
            'createdAt': o.created_at.isoformat()
        } for o in orders])
    except Exception as e:
        return jsonify({'message': 'Failed to fetch orders', 'error': str(e)}), 500


# Admin Routes
@app.route('/api/admin/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    total_products = Product.query.count()
    total_orders = Order.query.count()
    total_users = User.query.count()
    total_revenue = db.session.query(db.func.sum(Order.total_amount)).scalar() or 0
    
    return jsonify({
        'totalProducts': total_products,
        'totalOrders': total_orders,
        'totalUsers': total_users,
        'totalRevenue': total_revenue
    })

@app.route('/api/admin/recent-orders', methods=['GET'])
@jwt_required()
def get_recent_orders():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    orders = db.session.query(Order, User).join(User).order_by(Order.created_at.desc()).limit(10).all()
    
    return jsonify([{
        'id': o.Order.id,
        'customerName': o.User.name,
        'totalAmount': o.Order.total_amount,
        'status': o.Order.status,
        'createdAt': o.Order.created_at.isoformat()
    } for o in orders])

@app.route('/api/admin/orders', methods=['GET'])
@jwt_required()
def get_admin_orders():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    orders = db.session.query(Order, User).join(User).order_by(Order.created_at.desc()).all()
    
    return jsonify([{
        'id': o.Order.id,
        'customerName': o.User.name,
        'customerEmail': o.User.email,
        'totalAmount': o.Order.total_amount,
        'status': o.Order.status,
        'createdAt': o.Order.created_at.isoformat()
    } for o in orders])

@app.route("/api/admin/orders/<int:order_id>", methods=["GET"])
def get_order(order_id):
    order = Order.query.get(order_id)
    if not order:
        return {"message": "Order not found"}, 404
    return order.to_dict()  # make sure you have a method to serialize the order

@app.route('/api/admin/orders/<int:order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    order = Order.query.get_or_404(order_id)
    data = request.get_json()
    
    order.status = data['status']
    db.session.commit()
    
    return jsonify({'message': 'Order status updated successfully'})

@app.route('/api/admin/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    # Mock analytics data
    return jsonify({
        
    })

@app.route('/api/addresses', methods=['GET'])
@jwt_required()
def get_addresses():
    user_id = get_jwt_identity()
    addresses = Address.query.filter_by(user_id=user_id).all()
    
    return jsonify([{
        'id': a.id, 'label': a.label, 'address': a.address,
        'city': a.city, 'state': a.state, 'zipCode': a.zip_code
    } for a in addresses])


@app.route('/api/admin/settings', methods=['GET'])
@jwt_required()
def get_settings():
    identity = get_jwt_identity()
    user = User.query.get(identity)
    if user.role != 'admin':
        return jsonify({'msg': 'Access denied'}), 403

    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)
        db.session.commit()
    return jsonify({
        'siteName': settings.site_name,
        'siteDescription': settings.site_description,
        'currency': settings.currency,
        'taxRate': settings.tax_rate,
        'shippingRate': settings.shipping_rate,
        'freeShippingThreshold': settings.free_shipping_threshold,
        'contactEmail': settings.contact_email,
        'contactPhone': settings.contact_phone,
        'address': settings.address,
        'locations': settings.locations
    })


@app.route('/api/admin/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    identity = get_jwt_identity()
    user = User.query.get(identity)
    if user.role != 'admin':
        return jsonify({'msg': 'Access denied'}), 403

    data = request.json
    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)

    settings.site_name = data.get('siteName', settings.site_name)
    settings.site_description = data.get('siteDescription', settings.site_description)
    settings.currency = data.get('currency', settings.currency)
    settings.tax_rate = float(data.get('taxRate', settings.tax_rate))
    settings.shipping_rate = float(data.get('shippingRate', settings.shipping_rate))
    settings.free_shipping_threshold = float(data.get('freeShippingThreshold', settings.free_shipping_threshold))
    settings.contact_email = data.get('contactEmail', settings.contact_email)
    settings.contact_phone = data.get('contactPhone', settings.contact_phone)
    settings.address = data.get('address', settings.address)
    settings.locations = data.get('locations', settings.locations)

    db.session.commit()
    return jsonify({'msg': 'Settings updated successfully!'})

# Create admin user
def create_admin():
    admin = User.query.filter_by(email='admin@shopease.com').first()
    if not admin:
        admin = User(
            name='Admin',
            email='admin@shopease.com',
            password_hash=generate_password_hash('admin123'),
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()



if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        create_admin()
    
    app.run(debug=True)
 