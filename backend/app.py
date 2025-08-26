from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import hashlib
import jwt
import datetime
import razorpay
import hmac
from functools import wraps
import psycopg2
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



# Razorpay Configuration
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "store.db")
def get_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

@app.route('/api/debug/users', methods=['GET'])
def debug_list_users():
    with get_connection() as conn:
        with conn.cursor() as c:
            c.execute('SELECT id, name, email FROM users')
            users = c.fetchall()
    return jsonify([{'id': u[0], 'name': u[1], 'email': u[2]} for u in users])




# ---------------------- DATABASE SETUP ----------------------
def init_db():
    with get_connection() as conn:
        with conn.cursor() as c:
            # ---------------- Users ----------------
            c.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
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
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            price NUMERIC(10, 2) NOT NULL,
            image TEXT,
            rating NUMERIC(3, 1),
            reviews INT,
            description TEXT,
            specs TEXT,
            stock INT NOT NULL
            )
            """)

            # ---------------- Orders ----------------
            c.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users (id),
                total DECIMAL NOT NULL,
                status TEXT DEFAULT 'pending',
                address TEXT,
                city TEXT,
                pincode TEXT,
                phone TEXT,
                razorpay_order_id TEXT,
                razorpay_payment_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            # ---------------- Order Items ----------------
            c.execute("""
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
                product_id INTEGER NOT NULL REFERENCES products (id),
                quantity INTEGER NOT NULL,
                price DECIMAL NOT NULL
            )
            """)

            # ---------------- Delivery Areas ----------------
            c.execute("""
            CREATE TABLE IF NOT EXISTS delivery_areas (
                id SERIAL PRIMARY KEY,
                city TEXT NOT NULL,
                pincode TEXT,
                active INTEGER DEFAULT 1
            )
            """)

            # ---------------- Settings ----------------
            c.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                store_name TEXT NOT NULL DEFAULT 'Headphone Store',
                maintenance INTEGER NOT NULL DEFAULT 0
            )
            """)
            c.execute("""
                INSERT INTO settings (id, store_name, maintenance)
                VALUES (1, 'Headphone Store', 0)
                ON CONFLICT (id) DO NOTHING
            """)

            # ---------------- Seed admin ----------------
            admin_password = bcrypt.hashpw('admin123'.encode(), bcrypt.gensalt()).decode('utf-8')
            c.execute("""
                INSERT INTO users (id, name, email, password, role)
                VALUES (1, 'Admin', 'admin@sony.com', %s, 'admin')
                ON CONFLICT (id) DO NOTHING
            """, (admin_password,))

            # ---------------- Seed delivery area ----------------
            c.execute("""
                INSERT INTO delivery_areas (id, city, pincode, active)
                VALUES (1, 'Haldwani', NULL, 1)
                ON CONFLICT (id) DO NOTHING
            """)

        conn.commit()


# ---------------------- AUTH HELPERS ----------------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split(" ")
            if len(parts) == 2 and parts[0] == "Bearer":
                token = parts[1]
        if not token:
            return jsonify({'message': 'Token missing'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
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
    role = data.get('role', 'customer')  # Default to customer if not provided
    created_at = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

    try:
        with sqlite3.connect('store.db') as conn:
            c = conn.cursor()
            c.execute('''
                INSERT INTO users (name, email, password, role, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (data['name'], data['email'], hashed_password, role, created_at))
            conn.commit()

        return jsonify({'message': 'User created successfully'}), 201

    except sqlite3.IntegrityError as e:
        print(f"IntegrityError during registration: {e}")
        return jsonify({'message': 'Email already exists'}), 400

    except Exception as e:
        print(f"Unexpected error during registration: {e}")
        return jsonify({'message': 'Registration failed'}), 500


@app.route('/api/login', methods=['POST'])
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




# ---------------------- ORDERS (REVISED) ----------------------
@app.route('/api/orders/create', methods=['POST'])
@token_required
def create_order(current_user_id):
    data = request.get_json()
    # ----- All your payload validation logic remains the same and is excellent -----
    # (Checking for missing fields, amount, items, delivery area, etc.)
    # ...
    
    # For clarity, let's assume validation passed and we have these variables:
    amount = float(data['amount'])
    items = data['items']
    city = (data.get('city') or '').strip()

    conn = None # Initialize connection to None
    try:
        # ----- Save order to DB within a transaction FIRST -----
        conn = sqlite3.connect('store.db')
        c = conn.cursor()
        
        # 1. Insert the main order record
        c.execute('''INSERT INTO orders (user_id, total, address, city, pincode, phone, status)
                       VALUES (?, ?, ?, ?, ?, ?, 'pending')''',
                  (current_user_id, amount, data['address'], city,
                   data['pincode'], data['phone']))
        order_id = c.lastrowid

        # 2. Insert all order items
        for item in items:
            c.execute('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                      (order_id, item['product_id'], item['quantity'], item['price']))

        # 3. If DB writes are successful, NOW create the Razorpay order
        try:
            razorpay_order = razorpay_client.order.create({
                'amount': int(amount * 100),
                'currency': 'INR',
                'payment_capture': 1,
                'notes': {'local_order_id': order_id} # Good practice to link them
            })
        except Exception as rp_err:
            # IMPORTANT: If Razorpay fails, raise an exception to trigger the rollback
            app.logger.exception("Razorpay order creation failed, rolling back DB transaction.")
            raise Exception(f"Payment gateway error: {rp_err}")

        # 4. If Razorpay call succeeds, update our order with the Razorpay ID
        c.execute('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', (razorpay_order['id'], order_id))

        # 5. Finally, commit the transaction
        conn.commit()

        return jsonify({'razorpay_order_id': razorpay_order['id'], 'order_id': order_id}), 201

    except Exception as e:
        # If any step in the try block fails, roll back the transaction
        if conn:
            conn.rollback()
        
        app.logger.error("Order creation failed and transaction was rolled back: %s", e)
        app.logger.error(traceback.format_exc())
        return jsonify({'message': 'Failed to create order', 'error': str(e)}), 500

    finally:
        # Ensure the connection is always closed
        if conn:
            conn.close()
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
@app.route('/admin')
def admin():
    return send_from_directory(app.static_folder, 'index.html')

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
        where = 'WHERE status IN ("completed", "pending", "processing")'
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
@app.route('/order-history', methods=['GET'])
@token_required
def order_history(current_user_id):
    with sqlite3.connect('store.db') as conn:
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('''
            SELECT
                o.id, o.total, o.status, o.created_at,
                p.name, oi.quantity, oi.price
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC, o.id
        ''', (current_user_id,))
        rows = c.fetchall()

        orders_dict = {}
        for row in rows:
            order_id = row['id']
            if order_id not in orders_dict:
                orders_dict[order_id] = {
                    'id': order_id,
                    'total': row['total'],
                    'status': row['status'],
                    'created_at': row['created_at'],
                    'items': []
                }
            orders_dict[order_id]['items'].append({
                'name': row['name'],
                'quantity': row['quantity'],
                'price': row['price']
            })
        # Return list of orders with their nested items
        return jsonify(list(orders_dict.values())), 200
@app.route('/api/orders/<int:order_id>/cancel', methods=['PATCH'])
@token_required
def cancel_order(current_user_id, order_id):
    with sqlite3.connect('store.db') as conn:
        c = conn.cursor()
        # Fetch order status and user id
        c.execute('SELECT status, user_id FROM orders WHERE id = ?', (order_id,))
        order = c.fetchone()

        if not order:
            return jsonify({'message': 'Order not found'}), 404

        status, user_id = order

        # Check if current user owns the order
        if user_id != current_user_id:
            return jsonify({'message': 'Unauthorized'}), 403

        # Allow cancellation only if status is pending or completed
        if status not in ('pending', 'completed'):
            return jsonify({'message': 'Only pending or completed orders can be cancelled'}), 400

        # Update status to cancelled
        c.execute('UPDATE orders SET status = ? WHERE id = ?', ('cancelled', order_id))
        conn.commit()

    return jsonify({'message': 'Order cancelled successfully'}), 200


# ---------------------- MAIN ----------------------
if __name__ == '__main__':
    init_db()
    app.run(debug=True)