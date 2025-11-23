import mysql.connector, os

# Connect to MySQL
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'D@ffa_2005')
DB_NAME = os.getenv('DB_NAME', 'plantvision_db')
DB_PORT = int(os.getenv('DB_PORT', '3306'))

print(f"[update_database] Using DB='{DB_NAME}' on {DB_HOST}:{DB_PORT} as {DB_USER}")

conn = mysql.connector.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME,
    port=DB_PORT,
)

cursor = conn.cursor()

# Check current table structure
cursor.execute("DESCRIBE User;")
columns = cursor.fetchall()

print("Current table structure:")
for col in columns:
    print(f"  {col}")

def column_exists(name: str) -> bool:
    # columns adalah list of tuples, col[0] adalah nama kolom
    return any(col[0] == name for col in columns)  # type: ignore

print("\nApplying migrations...")

if not column_exists('phone'):
    try:
        cursor.execute("ALTER TABLE User ADD COLUMN phone VARCHAR(20) AFTER username")
        print("✅ Added phone column")
    except Exception as e:
        print(f"⚠️  Failed adding phone: {e}")
else:
    print("ℹ️  phone column already exists")

# Ensure status_akun uses enum('aktif','nonaktif') and default 'aktif'
try:
    cursor.execute("ALTER TABLE User MODIFY status_akun ENUM('aktif','nonaktif') DEFAULT 'aktif'")
    print("✅ Ensured status_akun enum + default")
except Exception as e:
    print(f"⚠️  status_akun modification: {e}")

if not column_exists('tanggal_daftar'):
    try:
        cursor.execute("ALTER TABLE User ADD COLUMN tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status_akun")
        print("✅ Added tanggal_daftar column")
    except Exception as e:
        print(f"⚠️  tanggal_daftar column: {e}")
else:
    print("ℹ️  tanggal_daftar column already exists")

# Add accept_terms column (0/1) if missing
if not column_exists('accept_terms'):
    try:
        cursor.execute("ALTER TABLE User ADD COLUMN accept_terms TINYINT(1) DEFAULT 0 AFTER status_akun")
        print("✅ Added accept_terms column")
    except Exception as e:
        print(f"⚠️  accept_terms column: {e}")
else:
    print("ℹ️  accept_terms column already exists")

# Update role default value to 'user'
try:
    cursor.execute("ALTER TABLE User MODIFY role VARCHAR(20) DEFAULT 'user'")
    print("✅ Ensured role default 'user'")
except Exception as e:
    print(f"⚠️  role default modification: {e}")

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

