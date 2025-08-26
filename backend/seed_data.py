import os
import psycopg2
from dotenv import load_dotenv
load_dotenv()

def seed_products():
    # ✅ Use your DATABASE_URL from Render (.env file)
    DATABASE_URL = os.getenv("DATABASE_URL")

    conn = psycopg2.connect(DATABASE_URL)
    c = conn.cursor()

    products = [
        {
            'name': 'Sony WH-1000XM4',
            'category': 'headphones',
            'price': 29990,
            'image': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
            'rating': 4.5,
            'reviews': 1250,
            'description': 'Industry-leading noise canceling with Dual Noise Sensor technology',
            'specs': 'Battery Life: 30 hours\nNoise Canceling: Yes\nBluetooth: 5.0\nWeight: 254g',
            'stock': 50
        },
        {
            'name': 'Sony WF-1000XM4',
            'category': 'earphones',
            'price': 19990,
            'image': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
            'rating': 4.3,
            'reviews': 892,
            'description': 'Truly wireless earbuds with industry-leading noise canceling',
            'specs': 'Battery Life: 8 hours + 16 hours case\nNoise Canceling: Yes\nBluetooth: 5.2\nWeight: 7.3g per bud',
            'stock': 75
        },
        {
            'name': 'Sony WH-CH720N',
            'category': 'headphones',
            'price': 14990,
            'image': 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop',
            'rating': 4.2,
            'reviews': 634,
            'description': 'Wireless noise canceling headphones with long battery life',
            'specs': 'Battery Life: 35 hours\nNoise Canceling: Yes\nBluetooth: 5.2\nWeight: 192g',
            'stock': 30
        },
        {
            'name': 'Sony WF-C500',
            'category': 'earphones',
            'price': 5990,
            'image': 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop',
            'rating': 4.0,
            'reviews': 456,
            'description': 'Truly wireless earbuds with long battery life and quick charge',
            'specs': 'Battery Life: 10 hours + 10 hours case\nBluetooth: 5.0\nWeight: 5.4g per bud\nWater Resistance: IPX4',
            'stock': 100
        },
        {
            'name': 'Sony MDR-ZX110',
            'category': 'headphones',
            'price': 1490,
            'image': 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=400&h=400&fit=crop',
            'rating': 3.8,
            'reviews': 234,
            'description': 'Lightweight foldable headphones with powerful sound',
            'specs': 'Driver: 30mm\nFrequency Response: 12Hz-22kHz\nWeight: 120g\nCable Length: 1.2m',
            'stock': 80
        },
        {
            'name': 'Sony WI-C100',
            'category': 'earphones',
            'price': 2490,
            'image': 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=400&h=400&fit=crop',
            'rating': 3.9,
            'reviews': 321,
            'description': 'Wireless in-ear headphones with long battery life',
            'specs': 'Battery Life: 25 hours\nBluetooth: 5.0\nWeight: 21g\nMagnetic Earbuds: Yes',
            'stock': 60
        }
    ]

    for product in products:
     c.execute('''
    INSERT INTO products (name, category, price, image, rating, reviews, description, specs, stock)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (name) DO UPDATE SET
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        image = EXCLUDED.image,
        rating = EXCLUDED.rating,
        reviews = EXCLUDED.reviews,
        description = EXCLUDED.description,
        specs = EXCLUDED.specs,
        stock = EXCLUDED.stock
''', (
    product['name'], product['category'], product['price'], product['image'],
    product['rating'], product['reviews'], product['description'],
    product['specs'], product['stock']
))

    conn.commit()
    conn.close()
    print("✅ Sample products seeded successfully!")

if __name__ == '__main__':
    seed_products()
