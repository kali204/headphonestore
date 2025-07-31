import sqlite3
import bcrypt

# Create (or overwrite) store.db
conn = sqlite3.connect('store.db')
cursor = conn.cursor()

# Drop old users table if it exists
cursor.execute("DROP TABLE IF EXISTS users")

# Recreate users table
cursor.execute('''
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
)
''')

# Insert admin user
admin_password = 'admin123'
hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())

cursor.execute('''
INSERT INTO users (name, email, password, role)
VALUES (?, ?, ?, ?)
''', ('Admin', 'admin@store.com', hashed_password, 'admin'))

conn.commit()
conn.close()

print("✅ Database reset with new admin user.")
