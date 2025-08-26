from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from functools import wraps
import os, datetime, traceback, hashlib, hmac, jwt, bcrypt, psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_values
from psycopg2 import errors as pg_errors
from psycopg2.extras import RealDictCursor

import razorpay
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder="dist", static_url_path="")
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
CORS(app)

# blueprints
from product import products_bp
app.register_blueprint(products_bp, url_prefix="/api")

# Razorpay
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# -------- DB --------
def get_connection():
    # DATABASE_URL example: postgres://user:pass@host:port/dbname
    return psycopg2.connect(os.getenv("DATABASE_URL"))

# -------- Debug (dev only!) --------
@app.route('/api/debug/users', methods=['GET'])
def debug_list_users():
    with get_connection() as conn, conn.cursor() as c:
        c.execute('SELECT id, name, email FROM users ORDER BY id')
        users = c.fetchall()
    return jsonify([{'id': u[0], 'name': u[1], 'email': u[2]} for u in users])

# -------- Schema Init --------
def init_db():
    with get_connection() as conn, conn.cursor() as c:
        c.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'customer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
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
            );
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users (id),
                total NUMERIC(10,2) NOT NULL,
                status TEXT DEFAULT 'pending',
                address TEXT,
                city TEXT,
                pincode TEXT,
                phone TEXT,
                razorpay_order_id TEXT,
                razorpay_payment_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
                product_id INTEGER NOT NULL REFERENCES products (id),
                quantity INTEGER NOT NULL,
                price NUMERIC(10,2) NOT NULL
            );
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS delivery_areas (
                id SERIAL PRIMARY KEY,
                city TEXT NOT NULL,
                pincode TEXT,
                active BOOLEAN DEFAULT TRUE
            );
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                store_name TEXT NOT NULL DEFAULT 'Headphone Store',
                maintenance BOOLEAN NOT NULL DEFAULT FALSE
            );
        """)
        # seed settings
        c.execute("""
            INSERT INTO settings (id, store_name, maintenance)
            VALUES (1, 'Headphone Store', 0)
            ON CONFLICT (id) DO NOTHING;

        """)
        # seed admin
        admin_password = bcrypt.hashpw('admin123'.encode(), bcrypt.gensalt()).decode('utf-8')
        c.execute("""
            INSERT INTO users (id, name, email, password, role)
            VALUES (1, 'Admin', 'admin@sony.com', %s, 'admin')
            ON CONFLICT (id) DO NOTHING;
        """, (admin_password,))
        # seed delivery area
        c.execute("""
              INSERT INTO delivery_areas (id, city, pincode, active)
    VALUES (1, 'Haldwani', NULL, 1)
    ON CONFLICT (id) DO NOTHING;
        """)
        conn.commit()

# -------- Auth Helpers --------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
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
    with get_connection() as conn, conn.cursor() as c:
        c.execute('SELECT role FROM users WHERE id = %s', (user_id,))
        row = c.fetchone()
        return bool(row and row[0] == 'admin')

def can_deliver_to(city, pincode=None):
    with get_connection() as conn, conn.cursor() as c:
        if pincode:
            c.execute("""
                SELECT 1 FROM delivery_areas
                WHERE active = TRUE AND LOWER(city)=LOWER(%s)
                  AND (pincode IS NULL OR pincode = %s)
                LIMIT 1
            """, (city, pincode))
        else:
            c.execute("""
                SELECT 1 FROM delivery_areas
                WHERE active = TRUE AND LOWER(city)=LOWER(%s)
                LIMIT 1
            """, (city,))
        return c.fetchone() is not None

# -------- Static + Index --------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

@app.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Welcome to the Sony Headphone Store API'}), 200

# -------- Delivery Areas --------
@app.route('/api/delivery-areas', methods=['GET'])
def get_delivery_areas():
    with get_connection() as conn, conn.cursor() as c:
        c.execute('SELECT id, city, pincode, active FROM delivery_areas ORDER BY id')
        rows = c.fetchall()
    return jsonify([{'id': r[0], 'city': r[1], 'pincode': r[2], 'active': bool(r[3])} for r in rows])

@app.route('/api/admin/delivery-areas', methods=['GET'])
@token_required
def list_delivery_areas(current_user_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403
    with get_connection() as conn, conn.cursor() as c:
        c.execute('SELECT id, city, pincode, active FROM delivery_areas ORDER BY id')
        rows = c.fetchall()
    return jsonify([{'id': r[0], 'city': r[1], 'pincode': r[2], 'active': bool(r[3])} for r in rows])

@app.route('/api/admin/delivery-areas', methods=['POST'])
@token_required
def create_delivery_area(current_user_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403
    data = request.get_json() or {}
    city = (data.get('city') or '').strip()
    pincode = data.get('pincode')
    active = bool(data.get('active', True))
    if not city:
        return jsonify({'message': 'City is required'}), 400
    with get_connection() as conn, conn.cursor() as c:
        c.execute('INSERT INTO delivery_areas (city, pincode, active) VALUES (%s, %s, %s) RETURNING id',
                  (city, pincode, active))
        new_id = c.fetchone()[0]
        conn.commit()
    return jsonify({'id': new_id}), 201

@app.route('/api/admin/delivery-areas/<int:area_id>', methods=['PATCH'])
@token_required
def update_delivery_area(current_user_id, area_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403
    data = request.get_json() or {}

    allowed = {'city', 'pincode', 'active'}
    sets = []
    vals = []
    for k, v in data.items():
        if k in allowed:
            sets.append(sql.SQL("{} = %s").format(sql.Identifier(k)))
            vals.append(v)
    if not sets:
        return jsonify({'message': 'Nothing to update'}), 400

    with get_connection() as conn, conn.cursor() as c:
        query = sql.SQL("UPDATE delivery_areas SET {sets} WHERE id = %s").format(
            sets=sql.SQL(", ").join(sets)
        )
        vals.append(area_id)
        c.execute(query, vals)
        conn.commit()
    return jsonify({'message': 'Delivery area updated'})

@app.route('/api/admin/delivery-areas/<int:area_id>', methods=['DELETE'])
@token_required
def delete_delivery_area(current_user_id, area_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403
    with get_connection() as conn, conn.cursor() as c:
        c.execute('DELETE FROM delivery_areas WHERE id = %s', (area_id,))
        conn.commit()
    return jsonify({'message': 'Delivery area deleted'})

# -------- User Auth --------
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    if not all(k in data for k in ('name','email','password')):
        return jsonify({'message': 'name, email, password required'}), 400

    hashed_password = bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt()).decode('utf-8')
    role = data.get('role', 'customer')

    try:
        with get_connection() as conn, conn.cursor() as c:
            c.execute('''
                INSERT INTO users (name, email, password, role)
                VALUES (%s, %s, %s, %s)
            ''', (data['name'], data['email'], hashed_password, role))
            conn.commit()
        return jsonify({'message': 'User created successfully'}), 201
    except pg_errors.UniqueViolation:
        return jsonify({'message': 'Email already exists'}), 400
    except Exception as e:
        app.logger.exception("Registration failed")
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    with get_connection() as conn, conn.cursor() as c:
        c.execute('SELECT id, name, email, password, role FROM users WHERE email = %s', (data.get('email'),))
        user = c.fetchone()

    if user and bcrypt.checkpw((data.get('password') or '').encode(), user[3].encode()):
        token = jwt.encode({
            'user_id': user[0],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        return jsonify({'token': token, 'user': {'id': user[0], 'name': user[1], 'email': user[2], 'role': user[4]}})
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/change-password', methods=['POST'])
def change_password():
    data = request.get_json() or {}
    email = data.get('email')
    new_password = data.get('new_password')
    if not email or not new_password:
        return jsonify({'message': 'Email and new password required'}), 400

    with get_connection() as conn, conn.cursor() as c:
        c.execute('SELECT id FROM users WHERE LOWER(email) = LOWER(%s)', (email,))
        user = c.fetchone()
        if not user:
            return jsonify({'message': 'User not found'}), 404
        hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode('utf-8')
        c.execute('UPDATE users SET password = %s WHERE id = %s', (hashed, user[0]))
        conn.commit()
    return jsonify({'message': 'Password changed successfully'}), 200

# -------- Orders --------
@app.route('/api/orders/create', methods=['POST'])
@token_required
def create_order(current_user_id):
    data = request.get_json() or {}
    amount = float(data.get('amount', 0))
    items = data.get('items', [])
    city = (data.get('city') or '').strip()

    conn = None
    try:
        conn = get_connection()
        c = conn.cursor()

        # Insert order and get id
        c.execute('''
            INSERT INTO orders (user_id, total, address, city, pincode, phone, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending')
            RETURNING id
        ''', (current_user_id, amount, data.get('address'), city, data.get('pincode'), data.get('phone')))
        order_id = c.fetchone()[0]

        # Insert items
        if items:
            execute_values(
                c,
                '''INSERT INTO order_items (order_id, product_id, quantity, price) VALUES %s''',
                [(order_id, it['product_id'], it['quantity'], it['price']) for it in items]
            )

        # Create Razorpay order
        razorpay_order = razorpay_client.order.create({
            'amount': int(amount * 100),
            'currency': 'INR',
            'payment_capture': 1,
            'notes': {'local_order_id': order_id}
        })

        c.execute('UPDATE orders SET razorpay_order_id = %s WHERE id = %s', (razorpay_order['id'], order_id))
        conn.commit()
        return jsonify({'razorpay_order_id': razorpay_order['id'], 'order_id': order_id}), 201

    except Exception as e:
        if conn:
            conn.rollback()
        app.logger.error("Order creation failed: %s", e)
        app.logger.error(traceback.format_exc())
        return jsonify({'message': 'Failed to create order', 'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/orders/verify', methods=['POST'])
@token_required
def verify_payment(current_user_id):
    data = request.get_json() or {}
    try:
        signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            f"{data['razorpay_order_id']}|{data['razorpay_payment_id']}".encode(),
            hashlib.sha256
        ).hexdigest()

        if signature == data.get('razorpay_signature'):
            with get_connection() as conn, conn.cursor() as c:
                c.execute('''
                    UPDATE orders SET status = 'completed', razorpay_payment_id = %s 
                    WHERE razorpay_order_id = %s
                ''', (data['razorpay_payment_id'], data['razorpay_order_id']))
                conn.commit()
            return jsonify({'message': 'Payment verified successfully'}), 200
        return jsonify({'message': 'Invalid signature'}), 400
    except Exception as e:
        app.logger.exception("Payment verification error")
        return jsonify({'message': 'Payment verification failed', 'error': str(e)}), 500

# -------- Admin --------
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

    where = ["status IN ('completed','pending','processing')"]
    params = []
    if date_from:
        where.append("created_at::date >= %s::date")
        params.append(date_from)
    if date_to:
        where.append("created_at::date <= %s::date")
        params.append(date_to)

    with get_connection() as conn, conn.cursor() as c:
        c.execute(f"SELECT COUNT(*), COALESCE(SUM(total),0) FROM orders WHERE {' AND '.join(where)}", params)
        total_orders, total_sales = c.fetchone()

        c.execute('SELECT COUNT(*) FROM products')
        total_products = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM users WHERE role = 'customer'")
        total_users = c.fetchone()[0]

    return jsonify({'orders': total_orders, 'sales': float(total_sales), 'products': total_products, 'users': total_users})

@app.route('/api/admin/revenue-series', methods=['GET'])
@token_required
def revenue_series(current_user_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403

    date_from = request.args.get('from')
    date_to = request.args.get('to')
    granularity = request.args.get('granularity', 'day')  # 'day' | 'month'

    bucket_fmt = "YYYY-MM-DD" if granularity == 'day' else "YYYY-MM"

    where = ["status = 'completed'"]
    params = []
    if date_from:
        where.append("created_at::date >= %s::date")
        params.append(date_from)
    if date_to:
        where.append("created_at::date <= %s::date")
        params.append(date_to)

    with get_connection() as conn, conn.cursor() as c:
        c.execute(f"""
            SELECT to_char(created_at, '{bucket_fmt}') AS bucket,
                   COALESCE(SUM(total),0) AS sales,
                   COUNT(*) AS orders
            FROM orders
            WHERE {' AND '.join(where)}
            GROUP BY bucket
            ORDER BY bucket ASC
        """, params)
        rows = c.fetchall()

    return jsonify([{'bucket': r[0], 'sales': float(r[1]), 'orders': r[2]} for r in rows])

@app.route('/api/admin/orders/latest', methods=['GET'])
@token_required
def latest_orders(current_user_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403
    limit = int(request.args.get('limit', 10))
    with get_connection() as conn, conn.cursor() as c:
        c.execute("""
            SELECT id, total, status, created_at, city, pincode
            FROM orders
            ORDER BY created_at DESC
            LIMIT %s
        """, (limit,))
        rows = c.fetchall()
    return jsonify([{'id': r[0], 'total': float(r[1]), 'status': r[2], 'created_at': r[3], 'city': r[4], 'pincode': r[5]} for r in rows])

@app.route('/api/admin/orders', methods=['GET'])
@token_required
def admin_list_orders(current_user_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403

    with get_connection() as conn, conn.cursor() as c:
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
        order_ids = [r[0] for r in orders_rows]

        items_map = {oid: [] for oid in order_ids}
        if order_ids:
            # Build IN list safely
            placeholders = ','.join(['%s'] * len(order_ids))
            c.execute(f"""
                SELECT
                  oi.order_id, oi.product_id, oi.quantity, oi.price, p.name
                FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                WHERE oi.order_id IN ({placeholders})
            """, order_ids)
            for r in c.fetchall():
                items_map[r[0]].append({
                    'product_id': r[1],
                    'name': r[4],
                    'quantity': r[2],
                    'price': float(r[3]),
                })

    result = []
    for r in orders_rows:
        result.append({
            'id': r[0],
            'total': float(r[2]),
            'status': r[3],
            'address': r[4],
            'city': r[5],
            'pincode': r[6],
            'phone': r[7],
            'created_at': r[8],
            'razorpay_order_id': r[9],
            'razorpay_payment_id': r[10],
            'user': {'id': r[1], 'name': r[11], 'email': r[12]},
            'items': items_map.get(r[0], [])
        })
    return jsonify(result), 200

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
    with get_connection() as conn, conn.cursor() as c:
        c.execute("UPDATE orders SET status=%s WHERE id=%s", (new_status, order_id))
        if c.rowcount == 0:
            return jsonify({'message': 'Order not found'}), 404
        conn.commit()
    return jsonify({'message': 'Status updated'}), 200

@app.route('/api/admin/orders/<int:order_id>', methods=['GET'])
@token_required
def admin_get_order_details(current_user_id, order_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403
    with get_connection() as conn, conn.cursor() as c:
        c.execute("""
            SELECT
              o.id, o.user_id, o.total, o.status, o.address, o.city, o.pincode,
              o.phone, o.created_at, o.razorpay_order_id, o.razorpay_payment_id,
              u.name, u.email
            FROM orders o
            JOIN users u ON u.id = o.user_id
            WHERE o.id = %s
        """, (order_id,))
        row = c.fetchone()
        if not row:
            return jsonify({'message': 'Order not found'}), 404

        c.execute("""
            SELECT oi.product_id, oi.quantity, oi.price, p.name
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = %s
        """, (order_id,))
        items = [{'product_id': r[0], 'name': r[3], 'quantity': r[1], 'price': float(r[2])} for r in c.fetchall()]

    return jsonify({
        'id': row[0], 'total': float(row[2]), 'status': row[3], 'address': row[4],
        'city': row[5], 'pincode': row[6], 'phone': row[7], 'created_at': row[8],
        'razorpay_order_id': row[9], 'razorpay_payment_id': row[10],
        'user': {'id': row[1], 'name': row[11], 'email': row[12]},
        'items': items
    }), 200


# Routes
@app.route("/api/products", methods=["GET"])
def get_products():
    conn = get_connection()
    c = conn.cursor(cursor_factory=RealDictCursor)
    c.execute("SELECT * FROM products;")
    products = c.fetchall()
    c.close()
    conn.close()
    return jsonify(products)

@app.route("/api/products/<int:id>", methods=["GET"])
def get_product(id):
    conn = get_connection()
    c = conn.cursor(cursor_factory=RealDictCursor)
    c.execute("SELECT * FROM products WHERE id = %s;", (id,))
    product = c.fetchone()
    c.close()
    conn.close()
    if product:
        return jsonify(product)
    return jsonify({"error": "Product not found"}), 404
@app.route('/api/products', methods=['POST'])
def add_product():
    conn = None
    c = None
    try:
        data = request.json
        print("Received data:", data)  # debug log

        conn = get_connection()
        c = conn.cursor()
        c.execute("""
            INSERT INTO products (name, category, price, stock, image, description)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (data['name'], data['category'], data['price'], data['stock'], data.get('image'), data.get('description')))
        
        conn.commit()
        new_id = c.fetchone()[0]
        c.close()
        conn.close()
        return jsonify({"id": new_id, "message": "Product added successfully"}), 201
    except Exception as e:
        print("Error while adding product:", e)  # debug log
        if conn:
            conn.rollback()
        if c:
            c.close()
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 500


@app.route("/api/products/<int:id>", methods=["PUT"])
def update_product(id):
    data = request.json
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        UPDATE products SET name=%s, category=%s, price=%s, image=%s, rating=%s, reviews=%s, description=%s, specs=%s, stock=%s
        WHERE id=%s RETURNING id;
    """, (
        data.get("name"),
        data.get("category"),
        data.get("price"),
        data.get("image"),
        data.get("rating"),
        data.get("reviews"),
        data.get("description"),
        data.get("specs"),
        data.get("stock"),
        id
    ))
    updated = c.fetchone()
    conn.commit()
    c.close()
    conn.close()
    if updated:
        return jsonify({"message": "Product updated successfully"})
    return jsonify({"error": "Product not found"}), 404

@app.route("/api/products/<int:id>", methods=["DELETE"])
def delete_product(id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM products WHERE id = %s RETURNING id;", (id,))
    deleted = c.fetchone()
    conn.commit()
    c.close()
    conn.close()
    if deleted:
        return jsonify({"message": "Product deleted successfully"})
    return jsonify({"error": "Product not found"}), 404


# -------- Public Settings --------
@app.route('/api/admin/settings', methods=['GET'])
@token_required
def get_settings(current_user_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403
    with get_connection() as conn, conn.cursor() as c:
        c.execute('SELECT store_name, maintenance FROM settings WHERE id = 1')
        row = c.fetchone()
    if not row:
        return jsonify({'storeName': 'Headphone Store', 'maintenance': False})
    return jsonify({'storeName': row[0], 'maintenance': bool(row[1])})

@app.route('/api/admin/settings', methods=['POST'])
@token_required
def update_settings(current_user_id):
    if not is_admin(current_user_id):
        return jsonify({'message': 'Admin access required'}), 403
    data = request.get_json() or {}
    with get_connection() as conn, conn.cursor() as c:
        if 'storeName' in data:
            c.execute('UPDATE settings SET store_name = %s WHERE id = 1', (data['storeName'],))
        if 'maintenance' in data:
            c.execute('UPDATE settings SET maintenance = %s WHERE id = 1', (bool(data['maintenance']),))
        conn.commit()
    return jsonify({'message': 'Settings updated successfully'})

@app.route('/api/settings/public', methods=['GET'])
def public_settings():
    with get_connection() as conn, conn.cursor() as c:
        c.execute('SELECT store_name, maintenance FROM settings WHERE id = 1')
        row = c.fetchone()
    return jsonify({
        'storeName': row[0] if row else 'Headphone Store',
        'maintenance': bool(row[1]) if row else False
    })

# -------- User Order History + Cancel --------
@app.route('/order-history', methods=['GET'])
@token_required
def order_history(current_user_id):
    with get_connection() as conn, conn.cursor() as c:
        c.execute("""
            SELECT
                o.id, o.total, o.status, o.created_at,
                p.name, oi.quantity, oi.price
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = %s
            ORDER BY o.created_at DESC, o.id
        """, (current_user_id,))
        rows = c.fetchall()

    orders = {}
    for r in rows:
        oid = r[0]
        if oid not in orders:
            orders[oid] = {
                'id': oid,
                'total': float(r[1]),
                'status': r[2],
                'created_at': r[3],
                'items': []
            }
        orders[oid]['items'].append({'name': r[4], 'quantity': r[5], 'price': float(r[6])})
    return jsonify(list(orders.values())), 200

@app.route('/api/orders/<int:order_id>/cancel', methods=['PATCH'])
@token_required
def cancel_order(current_user_id, order_id):
    with get_connection() as conn, conn.cursor() as c:
        c.execute('SELECT status, user_id FROM orders WHERE id = %s', (order_id,))
        row = c.fetchone()
        if not row:
            return jsonify({'message': 'Order not found'}), 404
        status, user_id = row
        if user_id != current_user_id:
            return jsonify({'message': 'Unauthorized'}), 403
        if status not in ('pending', 'completed'):
            return jsonify({'message': 'Only pending or completed orders can be cancelled'}), 400
        c.execute("UPDATE orders SET status = 'cancelled' WHERE id = %s", (order_id,))
        conn.commit()
    return jsonify({'message': 'Order cancelled successfully'}), 200

# -------- Main --------
if __name__ == '__main__':
    init_db()
    app.run(debug=True)
