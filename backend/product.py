from flask import Blueprint, request, jsonify
import sqlite3

DB_PATH = "store.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# you can also omit url_prefix here and add it when registering on the app
products_bp = Blueprint('products', __name__)

def row_to_dict(row):
    return dict(row)

@products_bp.route('/products', methods=['GET'])
def get_products():
    """
    /api/products?category=headphones&q=apple&limit=12&offset=0
    """
    category = request.args.get('category')
    q = request.args.get('q')
    limit = request.args.get('limit', type=int)
    offset = request.args.get('offset', type=int, default=0)

    sql = "SELECT * FROM products WHERE 1=1"
    params = []

    if category:
        sql += " AND category = ?"
        params.append(category)

    if q:
        sql += " AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)"
        like = f"%{q.lower()}%"
        params.extend([like, like])

    if limit is not None:
        sql += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])

    try:
        conn = get_db_connection()
        products = conn.execute(sql, params).fetchall()
        conn.close()
        return jsonify([row_to_dict(row) for row in products])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@products_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        conn = get_db_connection()
        product = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
        conn.close()
        if product is None:
            return jsonify({'error': 'Product not found'}), 404
        return jsonify(row_to_dict(product))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@products_bp.route('/products', methods=['POST'])
def add_product():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid or missing JSON body'}), 400

    required = ['name', 'category', 'price', 'image', 'description', 'stock']
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('''INSERT INTO products (name, category, price, image, rating, reviews, description, specs, stock)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (data['name'], data['category'], data['price'], data['image'],
                   data.get('rating', 0), data.get('reviews', 0),
                   data['description'], data.get('specs', ''), data['stock']))
        conn.commit()
        new_id = c.lastrowid
        conn.close()
        return jsonify({'message': 'Product added successfully!', 'id': new_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@products_bp.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid or missing JSON body'}), 400

    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('''UPDATE products
                     SET name = ?, category = ?, price = ?, image = ?, rating = ?, reviews = ?, 
                         description = ?, specs = ?, stock = ?
                     WHERE id = ?''',
                  (data['name'], data['category'], data['price'], data['image'], data.get('rating', 0),
                   data.get('reviews', 0), data['description'], data.get('specs', ''), data['stock'], product_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Product updated successfully!'})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@products_bp.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM products WHERE id = ?', (product_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Product deleted successfully!'})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
