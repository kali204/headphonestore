from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import hashlib
import jwt
import datetime
import razorpay
import hmac
from functools import wraps
import os
import traceback
import bcrypt
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder="dist", static_url_path="")
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")

CORS(app)

# blueprints
from product import products_bp
app.register_blueprint(products_bp, url_prefix="/api")

#flask limiter
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"]
)

# Razorpay Configuration
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "store.db")
@app.route('/api/debug/users', methods=['GET'])
def debug_list_users():
    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        c.execute('SELECT id, name, email FROM users')
        users = c.fetchall()
    return jsonify([{'id': u[0], 'name': u[1], 'email': u[2]} for u in users])


# ---------------------- DATABASE SETUP ----------------------
def init_db():
    with sqlite3.connect('store.db') as conn:
        conn.execute('PRAGMA foreign_keys = ON')
        c = conn.cursor()

        # ---------------- Users ----------------
        c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'customer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # ---------------- Products ----------------
        c.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT,
            rating REAL DEFAULT 0,
            reviews INTEGER DEFAULT 0,
            description TEXT,
            specs TEXT,
            stock INTEGER DEFAULT 0
        )
        """)

        # ---------------- Orders ----------------
        c.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            address TEXT,
            city TEXT,
            pincode TEXT,
            phone TEXT,
            razorpay_order_id TEXT,
            razorpay_payment_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        """)

        # Ensure columns exist if DB was created before you added them
        _ensure_column(c, 'orders', 'city', 'TEXT')
        _ensure_column(c, 'orders', 'pincode', 'TEXT')
        _ensure_column(c, 'orders', 'phone', 'TEXT')
        _ensure_column(c, 'orders', 'razorpay_order_id', 'TEXT')
        _ensure_column(c, 'orders', 'razorpay_payment_id', 'TEXT')

        # ---------------- Order Items ----------------
        c.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products (id)
        )
        """)

        # ---------------- Delivery Areas ----------------
        c.execute("""
        CREATE TABLE IF NOT EXISTS delivery_areas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL,
            pincode TEXT,
            active INTEGER DEFAULT 1
        )
        """)

        # ---------------- Settings (single row) ----------------
        c.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            store_name TEXT NOT NULL DEFAULT 'Headphone Store',
            maintenance INTEGER NOT NULL DEFAULT 0
        )
        """)
        c.execute('INSERT OR IGNORE INTO settings (id, store_name, maintenance) VALUES (1, "Headphone Store", 0)')

        # ---------------- Seed admin ----------------
        admin_password = bcrypt.hashpw('admin123'.encode(), bcrypt.gensalt()).decode('utf-8')
        c.execute("""
            INSERT OR IGNORE INTO users (id, name, email, password, role)
            VALUES (1, 'Admin', 'admin@sony.com', ?, 'admin')
        """, (admin_password,))

        # ---------------- Seed default delivery area ----------------
        c.execute("""
            INSERT OR IGNORE INTO delivery_areas (id, city, pincode, active)
            VALUES (1, 'Haldwani', NULL, 1)
        """)

        conn.commit()


def _ensure_column(cur, table, column, coltype):
    """Add a column if it does not exist (SQLite lightweight migration helper)."""
    cur.execute(f"PRAGMA table_info({table})")
    cols = [r[1] for r in cur.fetchall()]
    if column not in cols:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {column} {coltype}")

# ---------------------- AUTH HELPERS ----------------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({'message': 'Token missing'}), 401
        token = auth_header.split(' ')[1]
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expired'}), 401
        except Exception as e:
            print(f"Token error: {e}")
            return jsonify({'message': 'Token invalid'}), 401
        return f(current_user_id, *args, **kwargs)
    return decorated


def is_admin(user_id):
    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        c.execute('SELECT role FROM users WHERE id = ?', (user_id,))
        row = c.fetchone()
        return row and row[0] == 'admin'

def can_deliver_to(city, pincode=None):
    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        if pincode:
            c.execute('''SELECT 1 FROM delivery_areas 
                         WHERE active = 1 AND LOWER(city)=LOWER(?) 
                         AND (pincode IS NULL OR pincode = ?) 
                         LIMIT 1''', (city, pincode))
        else:
            c.execute('''SELECT 1 FROM delivery_areas 
                         WHERE active = 1 AND LOWER(city)=LOWER(?) 
                         LIMIT 1''', (city,))
        return c.fetchone() is not None
    
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

#
@app.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Welcome to the Sony Headphone Store API'}), 200
# ---------------------- DELIVERY AREAS ----------------------
@app.route('/api/delivery-areas', methods=['GET'])
def get_delivery_areas():
    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        c.execute('SELECT id, city, pincode, active FROM delivery_areas')
        rows = c.fetchall()
    return jsonify([{
        'id': r[0], 'city': r[1], 'pincode': r[2], 'active': bool(r[3])
    } for r in rows])
@app.route('/api/admin/delivery-areas', methods=['GET'])
def list_delivery_areas():
    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        c.execute('SELECT id, city, pincode, active FROM delivery_areas')
        rows = c.fetchall()
    return jsonify([{
        'id': r[0], 'city': r[1], 'pincode': r[2], 'active': bool(r[3])
    } for r in rows])

@app.route('/api/admin/delivery-areas', methods=['POST'])
@token_required
def create_delivery_area(current_user_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403
    data = request.get_json()
    city = data.get('city')
    pincode = data.get('pincode')
    active = 1 if data.get('active', True) else 0
    if not city:
        return jsonify({'message': 'City is required'}), 400
    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        c.execute('INSERT INTO delivery_areas (city, pincode, active) VALUES (?, ?, ?)',
                  (city, pincode, active))
        conn.commit()
        new_id = c.lastrowid
    return jsonify({'id': new_id}), 201

@app.route('/api/admin/delivery-areas/<int:area_id>', methods=['PATCH'])
@token_required
def update_delivery_area(current_user_id, area_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403
    data = request.get_json()
    fields, values = [], []
    for k in ('city', 'pincode', 'active'):
        if k in data:
            fields.append(f"{k} = ?")
            values.append(data[k])
    if not fields:
        return jsonify({'message': 'Nothing to update'}), 400
    values.append(area_id)
    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        c.execute(f'UPDATE delivery_areas SET {", ".join(fields)} WHERE id = ?', values)
        conn.commit()
    return jsonify({'message': 'Delivery area updated'})

@app.route('/api/admin/delivery-areas/<int:area_id>', methods=['DELETE'])
@token_required
def delete_delivery_area(current_user_id, area_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403
    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        c.execute('DELETE FROM delivery_areas WHERE id = ?', (area_id,))
        conn.commit()
    return jsonify({'message': 'Delivery area deleted'})

# ---------------------- USER AUTH ----------------------
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    # Hash the password
    hashed_password = bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt()).decode('utf-8')

    try:
        with sqlite3.connect('store.db') as conn:
            c = conn.cursor()
            c.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                      (data['name'], data['email'], hashed_password))
            conn.commit()

        return jsonify({'message': 'User created successfully'}), 201

    except sqlite3.IntegrityError as e:
        # Optional: log the actual error
        print(f"IntegrityError during registration: {e}")
        return jsonify({'message': 'Email already exists'}), 400

    except Exception as e:
        # Catch any other errors
        print(f"Unexpected error during registration: {e}")
        return jsonify({'message': 'Registration failed'}), 500


@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    data = request.get_json()

    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        c.execute('SELECT id, name, email, password, role FROM users WHERE email = ?', (data['email'],))
        user = c.fetchone()

    if user and bcrypt.checkpw(data['password'].encode(), user[3].encode()):
        token = jwt.encode({
            'user_id': user[0],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')

        if isinstance(token, bytes):
            token = token.decode('utf-8')

        return jsonify({
            'token': token,
            'user': {
                'id': user[0],
                'name': user[1],
                'email': user[2],
                'role': user[4]
            }
        })

    else:
        print(f"Login failed for email: {data['email']}")
        return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/change-password', methods=['POST'])
def change_password():
    data = request.get_json()
    email = data.get('email')
    new_password = data.get('new_password')

    if not email or not new_password:
        return jsonify({'message': 'Email and new password required'}), 400

    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        # Using LOWER() to make comparison case-insensitive
        c.execute('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', (email,))
        user = c.fetchone()

        if not user:
            return jsonify({'message': 'User not found'}), 404

        hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode('utf-8')
        c.execute('UPDATE users SET password = ? WHERE LOWER(email) = LOWER(?)', (hashed, email))
        conn.commit()

    return jsonify({'message': 'Password changed successfully'}), 200



# ---------------------- PRODUCTS ----------------------
@app.route('/api/products', methods=['GET'])
def get_products():
    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        c.execute('SELECT * FROM products')
        products = c.fetchall()
    return jsonify([{
        'id': p[0], 'name': p[1], 'category': p[2], 'price': p[3],
        'image': p[4], 'rating': p[5], 'reviews': p[6],
        'description': p[7], 'specs': p[8], 'stock': p[9]
    } for p in products])

# ---------------------- ORDERS ----------------------
@app.route('/api/orders/create', methods=['POST'])
@token_required
def create_order(current_user_id):
    try:
        data = request.get_json()
        app.logger.info("Received order data: %s", data)

        # ----- Validate payload -----
        required_fields = ['amount', 'address', 'city', 'pincode', 'phone', 'items']
        missing = [f for f in required_fields if f not in data]
        if missing:
            return jsonify({'message': f'Missing fields: {", ".join(missing)}'}), 400

        try:
            amount = float(data['amount'])
        except (TypeError, ValueError):
            return jsonify({'message': 'Invalid amount supplied'}), 400

        if amount <= 0:
            return jsonify({'message': 'Amount must be greater than 0'}), 400

        items = data.get('items', [])
        if not items:
            return jsonify({'message': 'No items in order'}), 400

        city = (data.get('city') or '').strip()
        if not city:
            return jsonify({'message': 'City is required'}), 400

        if not can_deliver_to(city, data.get('pincode')):
            return jsonify({'message': 'We currently don’t deliver to this location.'}), 400

        # ----- Create Razorpay order -----
        try:
            razorpay_order = razorpay_client.order.create({
                'amount': int(amount * 100),
                'currency': 'INR',
                'payment_capture': 1
            })
        except Exception as rp_err:
            app.logger.exception("Razorpay order creation failed")
            return jsonify({'message': 'Payment gateway error', 'error': str(rp_err)}), 502

        # ----- Save order -----
        with sqlite3.connect('store.db') as conn:
            c = conn.cursor()
            c.execute('''INSERT INTO orders (user_id, total, address, city, pincode, phone, razorpay_order_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?)''',
                      (current_user_id, amount, data['address'], city,
                       data['pincode'], data['phone'], razorpay_order['id']))
            order_id = c.lastrowid

            for item in items:
                try:
                    c.execute('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                              (order_id, item['product_id'], item['quantity'], item['price']))
                except Exception as item_err:
                    app.logger.exception("Error inserting order item: %s", item)
                    raise item_err

            conn.commit()

        return jsonify({'razorpay_order_id': razorpay_order['id'], 'order_id': order_id}), 201

    except Exception as e:
        app.logger.error("Order creation error: %s", e)
        app.logger.error(traceback.format_exc())
        return jsonify({'message': 'Failed to create order', 'error': str(e)}), 500

@app.route('/api/orders/verify', methods=['POST'])
@token_required
def verify_payment(current_user_id):
    data = request.get_json()
    try:
        signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            f"{data['razorpay_order_id']}|{data['razorpay_payment_id']}".encode(),
            hashlib.sha256
        ).hexdigest()

        if signature == data['razorpay_signature']:
            with sqlite3.connect('store.db') as conn:
                c = conn.cursor()
                c.execute('''UPDATE orders SET status = 'completed', razorpay_payment_id = ? 
                             WHERE razorpay_order_id = ?''',
                          (data['razorpay_payment_id'], data['razorpay_order_id']))
                conn.commit()
            return jsonify({'message': 'Payment verified successfully'}), 200
        else:
            return jsonify({'message': 'Invalid signature'}), 400
    except Exception as e:
        print("Payment verification error:", e)
        return jsonify({'message': 'Payment verification failed', 'error': str(e)}), 500

# ---------------------- ADMIN STATS ----------------------
@app.route('/api/admin/stats', methods=['GET'])
@token_required
def get_admin_stats(current_user_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403

    date_from = request.args.get('from')
    date_to = request.args.get('to')

    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()

        # Dynamic WHERE clause
        where = 'WHERE status = "completed"'
        params = []
        if date_from:
            where += ' AND date(created_at) >= date(?)'
            params.append(date_from)
        if date_to:
            where += ' AND date(created_at) <= date(?)'
            params.append(date_to)

        # Total Orders & Sales
        c.execute(f'SELECT COUNT(*), COALESCE(SUM(total), 0) FROM orders {where}', params)
        total_orders, total_sales = c.fetchone()

        # Products & Users (no date filter)
        c.execute('SELECT COUNT(*) FROM products')
        total_products = c.fetchone()[0]
        c.execute('SELECT COUNT(*) FROM users WHERE role = "customer"')
        total_users = c.fetchone()[0]

    return jsonify({
        'orders': total_orders,
        'sales': total_sales,
        'products': total_products,
        'users': total_users
    })
# GET /api/admin/revenue-series?from=2025-07-01&to=2025-07-24&granularity=day
# returns [{date: '2025-07-01', sales: 12345, orders: 2}, ...]
@app.route('/api/admin/revenue-series', methods=['GET'])
@token_required
def revenue_series(current_user_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403

    date_from = request.args.get('from')
    date_to = request.args.get('to')
    granularity = request.args.get('granularity', 'day')  # 'day' | 'month'

    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()

        group_expr = "strftime('%Y-%m-%d', created_at)" if granularity == 'day' else "strftime('%Y-%m', created_at)"

        where = 'WHERE status = "completed"'
        params = []

        if date_from:
            where += ' AND date(created_at) >= date(?)'
            params.append(date_from)
        if date_to:
            where += ' AND date(created_at) <= date(?)'
            params.append(date_to)

        c.execute(f'''
            SELECT {group_expr} as bucket, COALESCE(SUM(total), 0) as sales, COUNT(*) as orders
            FROM orders
            {where}
            GROUP BY bucket
            ORDER BY bucket ASC
        ''', params)
        rows = c.fetchall()

    return jsonify([
        {'bucket': r[0], 'sales': r[1], 'orders': r[2]}
        for r in rows
    ])
# GET /api/admin/orders/latest?limit=10
@app.route('/api/admin/orders/latest', methods=['GET'])
@token_required
def latest_orders(current_user_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403

    limit = int(request.args.get('limit', 10))
    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        c.execute('''
            SELECT id, total, status, created_at, city, pincode
            FROM orders
            ORDER BY created_at DESC
            LIMIT ?
        ''', (limit,))
        rows = c.fetchall()

    return jsonify([{
        'id': r[0],
        'total': r[1],
        'status': r[2],
        'created_at': r[3],
        'city': r[4],
        'pincode': r[5],
    } for r in rows])
# ---------------------- ADMIN: LIST ORDERS ----------------------
@app.route('/api/admin/orders', methods=['GET'])
@token_required
def admin_list_orders(current_user_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403

    with sqlite3.connect('store.db') as conn:
        conn.row_factory = sqlite3.Row
        c = conn.cursor()

        # Basic order + user info
        c.execute("""
            SELECT
              o.id, o.user_id, o.total, o.status, o.address, o.city, o.pincode,
              o.phone, o.created_at, o.razorpay_order_id, o.razorpay_payment_id,
              u.name AS user_name, u.email AS user_email
            FROM orders o
            JOIN users u ON u.id = o.user_id
            ORDER BY o.created_at DESC
        """)
        orders_rows = c.fetchall()

        # Preload all items for these orders
        order_ids = [row["id"] for row in orders_rows]
        items_map = {oid: [] for oid in order_ids}
        if order_ids:
            q_marks = ",".join(["?"] * len(order_ids))
            c.execute(f"""
                SELECT
                  oi.order_id, oi.product_id, oi.quantity, oi.price,
                  p.name AS product_name
                FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                WHERE oi.order_id IN ({q_marks})
            """, order_ids)
            for r in c.fetchall():
                items_map[r["order_id"]].append({
                    "product_id": r["product_id"],
                    "name": r["product_name"],
                    "quantity": r["quantity"],
                    "price": r["price"]
                })

        result = []
        for row in orders_rows:
            result.append({
                "id": row["id"],
                "total": row["total"],
                "status": row["status"],
                "address": row["address"],
                "city": row["city"],
                "pincode": row["pincode"],
                "phone": row["phone"],
                "created_at": row["created_at"],
                "razorpay_order_id": row["razorpay_order_id"],
                "razorpay_payment_id": row["razorpay_payment_id"],
                "user": {
                    "id": row["user_id"],
                    "name": row["user_name"],
                    "email": row["user_email"]
                },
                "items": items_map.get(row["id"], [])
            })

    return jsonify(result), 200
# ---------------------- ADMIN: UPDATE ORDER STATUS ----------------------
@app.route('/api/admin/orders/<int:order_id>/status', methods=['PATCH'])
@token_required
def admin_update_order_status(current_user_id, order_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403

    data = request.get_json() or {}
    new_status = data.get("status")
    allowed = {"pending", "completed", "cancelled", "refunded"}

    if new_status not in allowed:
        return jsonify({'message': f'Invalid status. Allowed: {", ".join(allowed)}'}), 400

    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        c.execute("UPDATE orders SET status=? WHERE id=?", (new_status, order_id))
        if c.rowcount == 0:
            return jsonify({'message': 'Order not found'}), 404
        conn.commit()

    return jsonify({'message': 'Status updated'}), 200
# ---------------------- ADMIN: GET ORDER DETAILS ----------------------
@app.route('/api/admin/orders/<int:order_id>', methods=['GET'])
@token_required
def admin_get_order_details(current_user_id, order_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403

    with sqlite3.connect('store.db') as conn:
        conn.row_factory = sqlite3.Row
        c = conn.cursor()

        # Get order details
        c.execute("""
            SELECT
              o.id, o.user_id, o.total, o.status, o.address, o.city, o.pincode,
              o.phone, o.created_at, o.razorpay_order_id, o.razorpay_payment_id,
              u.name AS user_name, u.email AS user_email
            FROM orders o
            JOIN users u ON u.id = o.user_id
            WHERE o.id = ?
        """, (order_id,))
        order_row = c.fetchone()

        if not order_row:
            return jsonify({'message': 'Order not found'}), 404

        # Get items for this order
        c.execute("""
            SELECT oi.product_id, oi.quantity, oi.price, p.name AS product_name
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = ?
        """, (order_id,))
        items = [{
            "product_id": r["product_id"],
            "name": r["product_name"],
            "quantity": r["quantity"],
            "price": r["price"]
        } for r in c.fetchall()]

    return jsonify({
        "id": order_row["id"],
        "total": order_row["total"],
        "status": order_row["status"],
        "address": order_row["address"],
        "city": order_row["city"],
        "pincode": order_row["pincode"],
        "phone": order_row["phone"],
        "created_at": order_row["created_at"],
        "razorpay_order_id": order_row["razorpay_order_id"],
        "razorpay_payment_id": order_row["razorpay_payment_id"],
        "user": {
            "id": order_row["user_id"],
            "name": order_row["user_name"],
            "email": order_row["user_email"]
        },
        "items": items
    }), 200
# ---------------------- ADMIN SETTINGS ----------------------
@app.route('/api/admin/settings', methods=['GET'])
@token_required
def get_settings(current_user_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403

    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        c.execute('SELECT store_name, maintenance FROM settings WHERE id = 1')
        row = c.fetchone()

    if not row:
        return jsonify({'storeName': 'Headphone Store', 'maintenance': False})

    return jsonify({
        'storeName': row[0],
        'maintenance': bool(row[1])
    })


@app.route('/api/admin/settings', methods=['POST'])
@token_required
def update_settings(current_user_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403

    data = request.get_json() or {}
    store_name = data.get('storeName')
    maintenance = data.get('maintenance')

    if store_name is None and maintenance is None:
        return jsonify({'message': 'Nothing to update'}), 400

    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        if store_name is not None:
            c.execute('UPDATE settings SET store_name = ? WHERE id = 1', (store_name,))
        if maintenance is not None:
            c.execute('UPDATE settings SET maintenance = ? WHERE id = 1', (1 if maintenance else 0,))
        conn.commit()

    return jsonify({'message': 'Settings updated successfully'})


# ---------------------- PUBLIC SETTINGS ----------------------
@app.route('/api/settings/public', methods=['GET'])
def public_settings():
    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        c.execute('SELECT store_name, maintenance FROM settings WHERE id = 1')
        row = c.fetchone()

    return jsonify({
        'storeName': row[0] if row else 'Headphone Store',
        'maintenance': bool(row[1]) if row else False
    })



# ---------------------- GET USER ORDERS ----------------------
@app.route('/api/orders', methods=['GET'])
@token_required
def get_user_orders(current_user_id):
    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        c.execute('SELECT id, total, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
                  (current_user_id,))
        orders = c.fetchall()

        result = []
        for order_id, total, status, created_at in orders:
            c.execute('''
                SELECT p.name, oi.quantity, oi.price 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            ''', (order_id,))
            items = [{'name': name, 'quantity': quantity, 'price': price} for name, quantity, price in c.fetchall()]
            result.append({
                'id': order_id,
                'total': total,
                'status': status,
                'created_at': created_at,
                'items': items
            })

    return jsonify(result)


# ---------------------- MAIN ----------------------
if __name__ == '__main__':
    init_db()
    app.run(debug=True)