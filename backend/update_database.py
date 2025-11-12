import mysql.connector

# Connect to MySQL
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='D@ffa_2005',
    database='plantvision_db'
)

cursor = conn.cursor()

# Check current table structure
cursor.execute("DESCRIBE User;")
columns = cursor.fetchall()

print("Current table structure:")
for col in columns:
    print(f"  {col}")

# Add columns if they don't exist
try:
    cursor.execute("ALTER TABLE User ADD COLUMN phone VARCHAR(20) AFTER username")
    print("\n✅ Added phone column")
except Exception as e:
    print(f"\n⚠️  phone column: {str(e)}")

try:
    cursor.execute("ALTER TABLE User ADD COLUMN status_akun VARCHAR(20) DEFAULT 'active' AFTER role")
    print("✅ Added status_akun column")
except Exception as e:
    print(f"⚠️  status_akun column: {str(e)}")

try:
    cursor.execute("ALTER TABLE User ADD COLUMN tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status_akun")
    print("✅ Added tanggal_daftar column")
except Exception as e:
    print(f"⚠️  tanggal_daftar column: {str(e)}")

# Update role default value
try:
    cursor.execute("ALTER TABLE User MODIFY role VARCHAR(20) DEFAULT 'user'")
    print("✅ Updated role default")
except Exception as e:
    print(f"⚠️  role default: {str(e)}")

conn.commit()

# Show updated structure
cursor.execute("DESCRIBE User;")
columns = cursor.fetchall()

print("\n\nUpdated table structure:")
for col in columns:
    print(f"  {col}")

cursor.close()
conn.close()
print("\n✅ Database updated successfully!")
